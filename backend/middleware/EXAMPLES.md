# Middleware Usage Examples

This document provides practical examples of using middleware in the Realtime Scoring System.

## Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [Score Submission Routes](#score-submission-routes)
3. [Admin Routes](#admin-routes)
4. [Public Display Routes](#public-display-routes)
5. [Error Handling Patterns](#error-handling-patterns)

## Authentication Routes

### User Registration

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const { 
  validate, 
  authLimiter, 
  catchAsync 
} = require('../middleware');
const { createTokenResponse } = require('../utils/jwt');
const db = require('../db');

const router = express.Router();

// Registration schema
const registerSchema = {
  username: { 
    required: true, 
    type: 'string', 
    minLength: 3, 
    maxLength: 50 
  },
  email: { 
    required: true, 
    type: 'email' 
  },
  password: { 
    required: true, 
    type: 'string', 
    minLength: 8,
    custom: (value) => {
      if (!/[A-Z]/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!/[0-9]/.test(value)) {
        return 'Password must contain at least one number';
      }
      return null;
    }
  },
  role: { 
    required: true, 
    oneOf: ['admin', 'judge'] 
  }
};

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  catchAsync(async (req, res, next) => {
    const { username, email, password, role } = req.body;

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role`,
      [username, email, password_hash, role]
    );

    const user = result.rows[0];

    // Generate token
    const tokenData = createTokenResponse(user);

    res.status(201).json({
      status: 'success',
      data: tokenData
    });
  })
);

module.exports = router;
```

### User Login

```javascript
const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string' }
};

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Get user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Invalid email or password', 401));
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate token
    const tokenData = createTokenResponse(user);

    res.json({
      status: 'success',
      data: tokenData
    });
  })
);
```

## Score Submission Routes

### Submit Score

```javascript
const { 
  authenticate, 
  requireRole, 
  validateScoreSubmission,
  scoreLimiter,
  catchAsync,
  AppError
} = require('../middleware');

router.post(
  '/scores/submit',
  scoreLimiter,
  authenticate,
  requireRole('judge', 'admin'),
  validateScoreSubmission,
  catchAsync(async (req, res, next) => {
    const { competition_id, athlete_id, competition_type, scores } = req.body;
    const judge_id = req.user.id;

    // Verify competition exists and is active
    const compResult = await db.query(
      'SELECT * FROM competitions WHERE id = $1 AND status = $2',
      [competition_id, 'active']
    );

    if (compResult.rows.length === 0) {
      return next(new AppError('Competition not found or not active', 404));
    }

    // Verify athlete is registered for competition
    const athleteResult = await db.query(
      `SELECT * FROM competition_athletes 
       WHERE competition_id = $1 AND athlete_id = $2`,
      [competition_id, athlete_id]
    );

    if (athleteResult.rows.length === 0) {
      return next(new AppError('Athlete not registered for this competition', 400));
    }

    // Insert score based on competition type
    let query, values;

    if (competition_type === 'individual') {
      query = `
        INSERT INTO scores (
          competition_id, athlete_id, judge_id,
          action_difficulty, stage_artistry, action_creativity,
          action_fluency, costume_styling, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (competition_id, athlete_id, judge_id)
        DO UPDATE SET
          action_difficulty = EXCLUDED.action_difficulty,
          stage_artistry = EXCLUDED.stage_artistry,
          action_creativity = EXCLUDED.action_creativity,
          action_fluency = EXCLUDED.action_fluency,
          costume_styling = EXCLUDED.costume_styling,
          submitted_at = NOW()
        RETURNING *
      `;
      values = [
        competition_id, athlete_id, judge_id,
        scores.action_difficulty,
        scores.stage_artistry,
        scores.action_creativity,
        scores.action_fluency,
        scores.costume_styling
      ];
    } else if (competition_type === 'duo_team') {
      query = `
        INSERT INTO scores (
          competition_id, athlete_id, judge_id,
          action_difficulty, stage_artistry, action_interaction,
          action_creativity, costume_styling, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (competition_id, athlete_id, judge_id)
        DO UPDATE SET
          action_difficulty = EXCLUDED.action_difficulty,
          stage_artistry = EXCLUDED.stage_artistry,
          action_interaction = EXCLUDED.action_interaction,
          action_creativity = EXCLUDED.action_creativity,
          costume_styling = EXCLUDED.costume_styling,
          submitted_at = NOW()
        RETURNING *
      `;
      values = [
        competition_id, athlete_id, judge_id,
        scores.action_difficulty,
        scores.stage_artistry,
        scores.action_interaction,
        scores.action_creativity,
        scores.costume_styling
      ];
    } else { // challenge
      query = `
        INSERT INTO scores (
          competition_id, athlete_id, judge_id,
          action_difficulty, action_creativity, action_fluency,
          submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (competition_id, athlete_id, judge_id)
        DO UPDATE SET
          action_difficulty = EXCLUDED.action_difficulty,
          action_creativity = EXCLUDED.action_creativity,
          action_fluency = EXCLUDED.action_fluency,
          submitted_at = NOW()
        RETURNING *
      `;
      values = [
        competition_id, athlete_id, judge_id,
        scores.action_difficulty,
        scores.action_creativity,
        scores.action_fluency
      ];
    }

    const scoreResult = await db.query(query, values);

    // Cache in Redis and broadcast via WebSocket
    // (Implementation in separate service layer)

    res.status(201).json({
      status: 'success',
      data: {
        score: scoreResult.rows[0]
      }
    });
  })
);
```

## Admin Routes

### Create Competition

```javascript
const { 
  authenticate, 
  requireRole, 
  validate,
  adminLimiter,
  catchAsync 
} = require('../middleware');

const competitionSchema = {
  name: { required: true, type: 'string', minLength: 3, maxLength: 100 },
  competition_type: { required: true, oneOf: ['individual', 'duo_team', 'challenge'] },
  region: { required: true, type: 'string', minLength: 2, maxLength: 50 },
  start_date: { required: false, type: 'string' },
  end_date: { required: false, type: 'string' }
};

router.post(
  '/competitions',
  adminLimiter,
  authenticate,
  requireRole('admin'),
  validate(competitionSchema),
  catchAsync(async (req, res) => {
    const { name, competition_type, region, start_date, end_date } = req.body;
    const created_by = req.user.id;

    const result = await db.query(
      `INSERT INTO competitions 
       (name, competition_type, region, start_date, end_date, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'upcoming')
       RETURNING *`,
      [name, competition_type, region, start_date, end_date, created_by]
    );

    res.status(201).json({
      status: 'success',
      data: {
        competition: result.rows[0]
      }
    });
  })
);
```

### Add Athlete to Competition

```javascript
const athleteCompetitionSchema = {
  competition_id: { required: true, type: 'integer' },
  athlete_id: { required: true, type: 'integer' }
};

router.post(
  '/competitions/athletes',
  adminLimiter,
  authenticate,
  requireRole('admin'),
  validate(athleteCompetitionSchema),
  catchAsync(async (req, res, next) => {
    const { competition_id, athlete_id } = req.body;

    // Verify competition exists
    const compResult = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [competition_id]
    );

    if (compResult.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    // Verify athlete exists
    const athleteResult = await db.query(
      'SELECT * FROM athletes WHERE id = $1',
      [athlete_id]
    );

    if (athleteResult.rows.length === 0) {
      return next(new AppError('Athlete not found', 404));
    }

    // Add athlete to competition
    const result = await db.query(
      `INSERT INTO competition_athletes (competition_id, athlete_id)
       VALUES ($1, $2)
       ON CONFLICT (competition_id, athlete_id) DO NOTHING
       RETURNING *`,
      [competition_id, athlete_id]
    );

    res.status(201).json({
      status: 'success',
      data: {
        registration: result.rows[0]
      }
    });
  })
);
```

## Public Display Routes

### Get Latest Scores

```javascript
const { 
  displayLimiter, 
  validatePagination,
  catchAsync 
} = require('../middleware');

router.get(
  '/display/scores/latest',
  displayLimiter,
  validatePagination,
  catchAsync(async (req, res) => {
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT 
        s.*,
        a.name as athlete_name,
        a.athlete_number,
        c.name as competition_name,
        c.competition_type,
        u.username as judge_name
       FROM scores s
       JOIN athletes a ON s.athlete_id = a.id
       JOIN competitions c ON s.competition_id = c.id
       JOIN users u ON s.judge_id = u.id
       WHERE c.status = 'active'
       ORDER BY s.submitted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      status: 'success',
      results: result.rows.length,
      data: {
        scores: result.rows
      }
    });
  })
);
```

### Get Competition Leaderboard

```javascript
router.get(
  '/display/competitions/:id/leaderboard',
  displayLimiter,
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Verify competition exists
    const compResult = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [id]
    );

    if (compResult.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    const competition = compResult.rows[0];

    // Get average scores per athlete
    const result = await db.query(
      `SELECT 
        a.id,
        a.name,
        a.athlete_number,
        AVG(s.action_difficulty) as avg_difficulty,
        AVG(s.stage_artistry) as avg_artistry,
        AVG(s.action_creativity) as avg_creativity,
        AVG(s.action_fluency) as avg_fluency,
        AVG(s.costume_styling) as avg_styling,
        AVG(s.action_interaction) as avg_interaction,
        COUNT(DISTINCT s.judge_id) as judge_count
       FROM athletes a
       JOIN scores s ON a.id = s.athlete_id
       WHERE s.competition_id = $1
       GROUP BY a.id, a.name, a.athlete_number
       ORDER BY 
         (COALESCE(AVG(s.action_difficulty), 0) +
          COALESCE(AVG(s.stage_artistry), 0) +
          COALESCE(AVG(s.action_creativity), 0) +
          COALESCE(AVG(s.action_fluency), 0) +
          COALESCE(AVG(s.costume_styling), 0) +
          COALESCE(AVG(s.action_interaction), 0)) DESC`,
      [id]
    );

    res.json({
      status: 'success',
      data: {
        competition,
        leaderboard: result.rows
      }
    });
  })
);
```

## Error Handling Patterns

### Transaction with Error Handling

```javascript
const { catchAsync, AppError } = require('../middleware');

router.post(
  '/complex-operation',
  authenticate,
  requireRole('admin'),
  catchAsync(async (req, res, next) => {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Operation 1
      const result1 = await client.query(
        'INSERT INTO table1 (field) VALUES ($1) RETURNING id',
        [value1]
      );

      // Operation 2
      const result2 = await client.query(
        'INSERT INTO table2 (field, ref_id) VALUES ($1, $2)',
        [value2, result1.rows[0].id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        status: 'success',
        data: { result: result2.rows[0] }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      return next(new AppError('Transaction failed', 500));
    } finally {
      client.release();
    }
  })
);
```

### Custom Validation with Business Logic

```javascript
const customSchema = {
  athlete_id: {
    required: true,
    type: 'integer',
    custom: async (value, data) => {
      // Check if athlete exists
      const result = await db.query(
        'SELECT * FROM athletes WHERE id = $1',
        [value]
      );
      if (result.rows.length === 0) {
        return 'Athlete does not exist';
      }
      return null;
    }
  }
};
```

### Conditional Authorization

```javascript
router.put(
  '/scores/:id',
  authenticate,
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Get score
    const result = await db.query(
      'SELECT * FROM scores WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Score not found', 404));
    }

    const score = result.rows[0];

    // Check authorization: admin can edit any, judge can only edit their own
    if (req.user.role !== 'admin' && score.judge_id !== req.user.id) {
      return next(new AppError('You can only edit your own scores', 403));
    }

    // Update score...
    
    res.json({ status: 'success', data: { score: updatedScore } });
  })
);
```

## Complete Express App Setup

```javascript
// backend/index.js
const express = require('express');
const cors = require('cors');
const { errorHandler, generalLimiter } = require('./middleware');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10kb' }));

// Rate limiting
app.use('/api/', generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/competitions', require('./routes/competitions.routes'));
app.use('/api/athletes', require('./routes/athletes.routes'));
app.use('/api/scores', require('./routes/scores.routes'));
app.use('/api/display', require('./routes/display.routes'));

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```
