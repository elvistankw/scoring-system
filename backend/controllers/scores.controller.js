// backend/controllers/scores.controller.js
// Score submission and retrieval controller with optimized queries
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 10.4, 10.5

const db = require('../db');
const { redis, redisHelpers } = require('../redis');
const { AppError } = require('../middleware/error-handler');
const { executeWithLogging, logQueryStats } = require('../utils/query-logger');

/**
 * Competition type validation rules
 * Defines required score dimensions for each competition type
 */
const COMPETITION_TYPE_RULES = {
  individual: {
    requiredFields: ['action_difficulty', 'stage_artistry', 'action_creativity', 'action_fluency', 'costume_styling'],
    fieldCount: 5
  },
  duo: {
    requiredFields: ['action_difficulty', 'stage_artistry', 'action_interaction', 'action_creativity', 'costume_styling'],
    fieldCount: 5
  },
  team: {
    requiredFields: ['action_difficulty', 'stage_artistry', 'action_interaction', 'action_creativity', 'costume_styling'],
    fieldCount: 5
  },
  challenge: {
    requiredFields: ['action_difficulty', 'action_creativity', 'action_fluency'],
    fieldCount: 3
  }
};

/**
 * Validate score values are within acceptable range
 * Requirements: 3.3, 4.3, 5.3
 * 
 * @param {object} scores - Score dimensions object
 * @returns {object} { valid: boolean, errors: array }
 */
const validateScoreRange = (scores) => {
  const errors = [];
  const MIN_SCORE = 0;
  const MAX_SCORE = 30;

  for (const [field, value] of Object.entries(scores)) {
    if (value === null || value === undefined) {
      continue; // Skip null/undefined (will be caught by required field validation)
    }

    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      errors.push(`${field} must be a valid number`);
      continue;
    }

    if (numValue < MIN_SCORE || numValue > MAX_SCORE) {
      errors.push(`${field} must be between ${MIN_SCORE} and ${MAX_SCORE} (received: ${numValue})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate score submission based on competition type
 * Requirements: 3.3, 4.3, 5.3
 * 
 * @param {string} competitionType - Type of competition
 * @param {object} scores - Score dimensions object
 * @returns {object} { valid: boolean, errors: array }
 */
const validateScoreFields = (competitionType, scores) => {
  const rules = COMPETITION_TYPE_RULES[competitionType];
  
  if (!rules) {
    return {
      valid: false,
      errors: [`Invalid competition type: ${competitionType}`]
    };
  }

  const errors = [];
  const providedFields = Object.keys(scores).filter(key => scores[key] !== null && scores[key] !== undefined);

  // Check all required fields are present
  for (const field of rules.requiredFields) {
    if (!scores.hasOwnProperty(field) || scores[field] === null || scores[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check no extra fields are provided (optional - can be removed if you want to allow extra fields)
  const extraFields = providedFields.filter(field => !rules.requiredFields.includes(field));
  if (extraFields.length > 0) {
    errors.push(`Unexpected fields for ${competitionType} competition: ${extraFields.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Submit score for an athlete in a competition
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1
 * 
 * POST /api/scores/submit
 * Body: {
 *   competition_id: number,
 *   athlete_id: number,
 *   scores: {
 *     action_difficulty: number,
 *     stage_artistry: number (optional based on type),
 *     action_creativity: number,
 *     action_fluency: number (optional based on type),
 *     costume_styling: number (optional based on type),
 *     action_interaction: number (optional based on type)
 *   }
 * }
 */
const submitScore = async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    const { competition_id, athlete_id, scores } = req.body;
    const judge_id = req.user.id; // From JWT authentication middleware

    // 🔍 DEBUG: Log received data
    console.log('\n🔍 DEBUG - Score Submission Request:');
    console.log('Judge ID:', judge_id);
    console.log('Competition ID:', competition_id);
    console.log('Athlete ID:', athlete_id);
    console.log('Scores object:', JSON.stringify(scores, null, 2));
    console.log('Scores type:', typeof scores);
    console.log('Scores keys:', scores ? Object.keys(scores) : 'null');

    // 1. Validate request body
    if (!competition_id || !athlete_id || !scores) {
      console.log('❌ Validation failed: Missing required fields');
      return next(new AppError('Missing required fields: competition_id, athlete_id, scores', 400));
    }

    // 2. Get competition details to determine type
    const competitionResult = await client.query(
      'SELECT id, competition_type, name, status FROM competitions WHERE id = $1',
      [competition_id]
    );

    if (competitionResult.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    const competition = competitionResult.rows[0];

    // Check competition is active
    if (competition.status !== 'active') {
      return next(new AppError(`Cannot submit scores for ${competition.status} competition`, 400));
    }

    // 3. Validate athlete exists and is registered for this competition
    const athleteResult = await client.query(
      `SELECT a.id, a.name, a.athlete_number 
       FROM athletes a
       INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
       WHERE a.id = $1 AND ca.competition_id = $2`,
      [athlete_id, competition_id]
    );

    if (athleteResult.rows.length === 0) {
      return next(new AppError('Athlete not found or not registered for this competition', 404));
    }

    const athlete = athleteResult.rows[0];

    // 4. Validate score fields based on competition type
    const fieldValidation = validateScoreFields(competition.competition_type, scores);
    if (!fieldValidation.valid) {
      return next(new AppError(`Score validation failed: ${fieldValidation.errors.join(', ')}`, 400));
    }

    // 5. Validate score ranges (0-30)
    const rangeValidation = validateScoreRange(scores);
    if (!rangeValidation.valid) {
      return next(new AppError(`Score range validation failed: ${rangeValidation.errors.join(', ')}`, 400));
    }

    // 6. Check for duplicate score (same judge, athlete, competition)
    const duplicateCheck = await client.query(
      'SELECT id FROM scores WHERE competition_id = $1 AND athlete_id = $2 AND judge_id = $3',
      [competition_id, athlete_id, judge_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return next(new AppError('You have already submitted a score for this athlete in this competition', 409));
    }

    // 7. Begin transaction
    await client.query('BEGIN');

    // 8. Insert score into PostgreSQL (parameterized query)
    // Requirements: 3.4, 3.5, 4.4, 4.5, 5.4, 5.5, 10.4
    const insertQuery = `
      INSERT INTO scores (
        competition_id,
        athlete_id,
        judge_id,
        action_difficulty,
        stage_artistry,
        action_creativity,
        action_fluency,
        costume_styling,
        action_interaction,
        submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;

    const insertValues = [
      competition_id,
      athlete_id,
      judge_id,
      scores.action_difficulty !== undefined ? scores.action_difficulty : null,
      scores.stage_artistry !== undefined ? scores.stage_artistry : null,
      scores.action_creativity !== undefined ? scores.action_creativity : null,
      scores.action_fluency !== undefined ? scores.action_fluency : null,
      scores.costume_styling !== undefined ? scores.costume_styling : null,
      scores.action_interaction !== undefined ? scores.action_interaction : null
    ];

    // 🔍 DEBUG: Log insert values
    console.log('\n🔍 DEBUG - Insert Values:');
    console.log('Values array:', insertValues);
    console.log('Score fields:');
    console.log('  action_difficulty:', scores.action_difficulty, '→', insertValues[3]);
    console.log('  stage_artistry:', scores.stage_artistry, '→', insertValues[4]);
    console.log('  action_creativity:', scores.action_creativity, '→', insertValues[5]);
    console.log('  action_fluency:', scores.action_fluency, '→', insertValues[6]);
    console.log('  costume_styling:', scores.costume_styling, '→', insertValues[7]);
    console.log('  action_interaction:', scores.action_interaction, '→', insertValues[8]);

    const insertResult = await client.query(insertQuery, insertValues);
    const savedScore = insertResult.rows[0];

    // 9. Commit transaction
    await client.query('COMMIT');

    // 10. Update Redis cache (Requirement 6.2 - Write-Through Pattern)
    // Prepare real-time score update data
    const realtimeData = {
      competition_id: competition.id,
      competition_name: competition.name,
      competition_type: competition.competition_type,
      athlete_id: athlete.id,
      athlete_name: athlete.name,
      athlete_number: athlete.athlete_number,
      judge_id: req.user.id,
      judge_name: req.user.name || req.user.username || 'Unknown Judge',
      scores: {
        action_difficulty: savedScore.action_difficulty,
        stage_artistry: savedScore.stage_artistry,
        action_creativity: savedScore.action_creativity,
        action_fluency: savedScore.action_fluency,
        costume_styling: savedScore.costume_styling,
        action_interaction: savedScore.action_interaction
      },
      timestamp: savedScore.submitted_at
    };

    // Write-Through Pattern: Write to cache immediately after database write
    // Requirement 6.2: Must complete within 200ms
    try {
      // Update latest score cache (1 hour TTL)
      await redisHelpers.setLatestScore(competition_id, realtimeData, 3600);
      
      // Invalidate rankings cache since new score affects rankings
      await redisHelpers.invalidateScoreCaches(competition_id);
      
      console.log(`✅ Redis cache updated for competition ${competition_id} (Write-Through)`);
    } catch (redisError) {
      console.error('⚠️  Redis cache update failed (continuing without cache):', redisError.message);
      // Don't fail the request if Redis is unavailable
    }

    // 11. Broadcast score update via WebSocket (Requirements 6.3, 9.1, 9.2, 9.3, 9.4)
    // Must complete within 100ms per Requirement 6.3
    try {
      const io = req.app.get('io');
      if (io) {
        const roomName = `competition:${competition_id}`;
        
        // Broadcast to all clients in the competition room
        io.to(roomName).emit('score-update', {
          type: 'SCORE_UPDATED',
          data: realtimeData,
          timestamp: realtimeData.timestamp
        });
        
        console.log(`📡 Score broadcasted to room ${roomName} for athlete ${athlete.name}`);
      } else {
        console.warn('⚠️  WebSocket server not available for broadcasting');
      }
    } catch (broadcastError) {
      console.error('⚠️  Score broadcast failed (continuing without broadcast):', broadcastError.message);
      // Don't fail the request if broadcast fails
    }

    // 12. Return success response
    res.status(201).json({
      success: true,
      message: 'Score submitted successfully',
      data: {
        score_id: savedScore.id,
        competition_id: competition.id,
        competition_name: competition.name,
        athlete_id: athlete.id,
        athlete_name: athlete.name,
        judge_id: req.user.id,
        judge_name: req.user.name || req.user.username || 'Unknown Judge',
        scores: realtimeData.scores,
        submitted_at: savedScore.submitted_at
      }
    });

  } catch (err) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Score submission error:', err);
    next(err);
  } finally {
    // Release client back to pool
    client.release();
  }
};

/**
 * Get scores with flexible filtering
 * GET /api/scores
 * Query params: competition_id, athlete_id, judge_id (all optional)
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2
 */
const getScores = async (req, res, next) => {
  try {
    const { competition_id, athlete_id, judge_id } = req.query;

    // Build dynamic query based on provided filters
    // Join with both users and judge_sessions to support both admin and judge logins
    let query = `
      SELECT 
        s.*,
        a.name as athlete_name,
        a.athlete_number,
        COALESCE(u.username, js.judge_name) as judge_name,
        c.competition_type,
        c.name as competition_name,
        c.region
      FROM scores s
      INNER JOIN athletes a ON s.athlete_id = a.id
      LEFT JOIN users u ON s.judge_id = u.id
      LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id
      INNER JOIN competitions c ON s.competition_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (competition_id) {
      query += ` AND s.competition_id = $${paramIndex}`;
      params.push(competition_id);
      paramIndex++;
    }

    if (athlete_id) {
      query += ` AND s.athlete_id = $${paramIndex}`;
      params.push(athlete_id);
      paramIndex++;
    }

    if (judge_id) {
      query += ` AND s.judge_id = $${paramIndex}`;
      params.push(judge_id);
      paramIndex++;
    }

    query += ' ORDER BY s.submitted_at DESC';

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        scores: result.rows,
        count: result.rows.length
      }
    });

  } catch (err) {
    console.error('❌ Get scores error:', err);
    next(err);
  }
};

/**
 * Get scores for a competition
 * GET /api/scores/competition/:competitionId
 * Query params: athlete_id, judge_id (optional filters)
 */
const getScoresByCompetition = async (req, res, next) => {
  try {
    const { competitionId } = req.params;
    const { athlete_id, judge_id } = req.query;

    // Join with both users and judge_sessions to support both admin and judge logins
    let query = `
      SELECT 
        s.*,
        a.name as athlete_name,
        a.athlete_number,
        COALESCE(u.username, js.judge_name) as judge_name,
        c.competition_type,
        c.name as competition_name
      FROM scores s
      INNER JOIN athletes a ON s.athlete_id = a.id
      LEFT JOIN users u ON s.judge_id = u.id
      LEFT JOIN judge_sessions js ON s.judge_id = js.judge_id
      INNER JOIN competitions c ON s.competition_id = c.id
      WHERE s.competition_id = $1
    `;

    const params = [competitionId];
    let paramIndex = 2;

    if (athlete_id) {
      query += ` AND s.athlete_id = $${paramIndex}`;
      params.push(athlete_id);
      paramIndex++;
    }

    if (judge_id) {
      query += ` AND s.judge_id = $${paramIndex}`;
      params.push(judge_id);
      paramIndex++;
    }

    query += ' ORDER BY s.submitted_at DESC';

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error('❌ Get scores error:', err);
    next(err);
  }
};;

/**
 * Get latest score for a competition (from Redis cache or database)
 * GET /api/scores/latest/:competitionId
 * Requirement: 6.2, 10.5
 * Implements: Cache-Aside Pattern
 */
const getLatestScore = async (req, res, next) => {
  try {
    const { competitionId } = req.params;

    // Try to get from Redis cache first (Cache-Aside Pattern)
    try {
      const cachedScore = await redisHelpers.getLatestScore(competitionId);
      if (cachedScore) {
        console.log(`✅ Cache HIT for latest score: competition ${competitionId}`);
        return res.status(200).json({
          success: true,
          source: 'cache',
          data: cachedScore
        });
      }
      console.log(`⚠️  Cache MISS for latest score: competition ${competitionId}`);
    } catch (redisError) {
      console.error('⚠️  Redis read failed, falling back to database:', redisError.message);
    }

    // Fallback to database if cache miss
    const query = `
      SELECT 
        s.*,
        a.name as athlete_name,
        a.athlete_number,
        u.username as judge_name,
        c.competition_type,
        c.name as competition_name
      FROM scores s
      INNER JOIN athletes a ON s.athlete_id = a.id
      INNER JOIN users u ON s.judge_id = u.id
      INNER JOIN competitions c ON s.competition_id = c.id
      WHERE s.competition_id = $1
      ORDER BY s.submitted_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [competitionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No scores found for this competition'
      });
    }

    const score = result.rows[0];

    res.status(200).json({
      success: true,
      source: 'database',
      data: {
        competition_id: score.competition_id,
        competition_name: score.competition_name,
        competition_type: score.competition_type,
        athlete_id: score.athlete_id,
        athlete_name: score.athlete_name,
        athlete_number: score.athlete_number,
        judge_id: score.judge_id,
        judge_name: score.judge_name,
        scores: {
          action_difficulty: score.action_difficulty,
          stage_artistry: score.stage_artistry,
          action_creativity: score.action_creativity,
          action_fluency: score.action_fluency,
          costume_styling: score.costume_styling,
          action_interaction: score.action_interaction
        },
        timestamp: score.submitted_at
      }
    });

  } catch (err) {
    console.error('❌ Get latest score error:', err);
    next(err);
  }
};

/**
 * Get rankings for a competition with average scores by athlete
 * GET /api/display/rankings/:competitionId
 * Requirements: 6.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5, 10.5
 * Implements: Cache-Aside Pattern with 2-hour TTL
 */
const getRankings = async (req, res, next) => {
  try {
    const { competitionId } = req.params;

    // Try to get from Redis cache first (Cache-Aside Pattern)
    try {
      const cachedRankings = await redisHelpers.getCachedRankings(competitionId);
      if (cachedRankings) {
        console.log(`✅ Cache HIT for rankings: competition ${competitionId}`);
        return res.status(200).json({
          success: true,
          source: 'cache',
          data: cachedRankings
        });
      }
      console.log(`⚠️  Cache MISS for rankings: competition ${competitionId}`);
    } catch (redisError) {
      console.error('⚠️  Redis read failed, falling back to database:', redisError.message);
    }

    // Fallback to database - calculate average scores per athlete
    const query = `
      SELECT 
        a.id as athlete_id,
        a.name as athlete_name,
        a.athlete_number,
        c.competition_type,
        c.name as competition_name,
        COUNT(DISTINCT s.judge_id) as judge_count,
        AVG(s.action_difficulty) as avg_action_difficulty,
        AVG(s.stage_artistry) as avg_stage_artistry,
        AVG(s.action_creativity) as avg_action_creativity,
        AVG(s.action_fluency) as avg_action_fluency,
        AVG(s.costume_styling) as avg_costume_styling,
        AVG(s.action_interaction) as avg_action_interaction
      FROM athletes a
      INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
      INNER JOIN competitions c ON ca.competition_id = c.id
      LEFT JOIN scores s ON s.athlete_id = a.id AND s.competition_id = c.id
      WHERE c.id = $1
      GROUP BY a.id, a.name, a.athlete_number, c.competition_type, c.name
      ORDER BY 
        COALESCE(AVG(s.action_difficulty), 0) + 
        COALESCE(AVG(s.stage_artistry), 0) + 
        COALESCE(AVG(s.action_creativity), 0) + 
        COALESCE(AVG(s.action_fluency), 0) + 
        COALESCE(AVG(s.costume_styling), 0) + 
        COALESCE(AVG(s.action_interaction), 0) DESC
    `;

    const result = await db.query(query, [competitionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No athletes found for this competition'
      });
    }

    // Format the rankings data
    const rankings = result.rows.map((row, index) => ({
      rank: index + 1,
      athlete_id: row.athlete_id,
      athlete_name: row.athlete_name,
      athlete_number: row.athlete_number,
      judge_count: parseInt(row.judge_count),
      average_scores: {
        action_difficulty: row.avg_action_difficulty ? parseFloat(row.avg_action_difficulty).toFixed(2) : null,
        stage_artistry: row.avg_stage_artistry ? parseFloat(row.avg_stage_artistry).toFixed(2) : null,
        action_creativity: row.avg_action_creativity ? parseFloat(row.avg_action_creativity).toFixed(2) : null,
        action_fluency: row.avg_action_fluency ? parseFloat(row.avg_action_fluency).toFixed(2) : null,
        costume_styling: row.avg_costume_styling ? parseFloat(row.avg_costume_styling).toFixed(2) : null,
        action_interaction: row.avg_action_interaction ? parseFloat(row.avg_action_interaction).toFixed(2) : null
      },
      competition_type: row.competition_type,
      competition_name: row.competition_name
    }));

    // Cache the rankings in Redis (2 hour TTL - Requirement 6.2)
    try {
      await redisHelpers.cacheRankings(competitionId, rankings, 7200);
      console.log(`✅ Rankings cached for competition ${competitionId} (2-hour TTL)`);
    } catch (redisError) {
      console.error('⚠️  Redis cache write failed:', redisError.message);
    }

    res.status(200).json({
      success: true,
      source: 'database',
      data: rankings
    });

  } catch (err) {
    console.error('❌ Get rankings error:', err);
    next(err);
  }
};

/**
 * Partial score update - save individual score dimensions
 * Requirements: Support partial scoring and individual field updates
 * 
 * POST /api/scores/partial-update
 * Body: {
 *   competition_id: number,
 *   athlete_id: number,
 *   field: string,
 *   value: number | null
 * }
 */
const partialScoreUpdate = async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    const { competition_id, athlete_id, field, value } = req.body;
    const judge_id = req.user.id;

    console.log('\n🔍 DEBUG - Partial Score Update Request:');
    console.log('Judge ID:', judge_id);
    console.log('Competition ID:', competition_id);
    console.log('Athlete ID:', athlete_id);
    console.log('Field:', field);
    console.log('Value:', value);

    // 1. Validate request body
    if (!competition_id || !athlete_id || !field) {
      return next(new AppError('Missing required fields: competition_id, athlete_id, field', 400));
    }

    // 2. Validate field name
    const validFields = [
      'action_difficulty', 'stage_artistry', 'action_creativity', 
      'action_fluency', 'costume_styling', 'action_interaction'
    ];
    
    if (!validFields.includes(field)) {
      return next(new AppError(`Invalid field: ${field}`, 400));
    }

    // 3. Validate value range (0-30, or null)
    if (value !== null && value !== undefined) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 30) {
        return next(new AppError(`Invalid value: ${value}. Must be between 0-30 or null`, 400));
      }
    }

    // 4. Get competition details
    const competitionResult = await client.query(
      'SELECT id, competition_type, name, status FROM competitions WHERE id = $1',
      [competition_id]
    );

    if (competitionResult.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    const competition = competitionResult.rows[0];

    if (competition.status !== 'active') {
      return next(new AppError(`Cannot submit scores for ${competition.status} competition`, 400));
    }

    // 5. Validate athlete exists and is registered
    const athleteResult = await client.query(
      `SELECT a.id, a.name, a.athlete_number 
       FROM athletes a
       INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
       WHERE a.id = $1 AND ca.competition_id = $2`,
      [athlete_id, competition_id]
    );

    if (athleteResult.rows.length === 0) {
      return next(new AppError('Athlete not found or not registered for this competition', 404));
    }

    const athlete = athleteResult.rows[0];

    // 6. Begin transaction
    await client.query('BEGIN');

    // 7. Check if score record exists
    const existingScoreResult = await client.query(
      'SELECT * FROM scores WHERE competition_id = $1 AND athlete_id = $2 AND judge_id = $3',
      [competition_id, athlete_id, judge_id]
    );

    let savedScore;

    if (existingScoreResult.rows.length > 0) {
      // Update existing record - only update the specific field
      const updateQuery = `
        UPDATE scores 
        SET ${field} = $1, updated_at = NOW()
        WHERE competition_id = $2 AND athlete_id = $3 AND judge_id = $4
        RETURNING *
      `;

    console.log('🔍 Update Query:', updateQuery);
    console.log('🔍 Values:', values);
      
      const updateResult = await client.query(updateQuery, [
        value, competition_id, athlete_id, judge_id
      ]);
      
      savedScore = updateResult.rows[0];
      console.log(`✅ Updated existing score record, field: ${field} = ${value}`);
    } else {
      // Create new record with only this field
      const insertQuery = `
        INSERT INTO scores (
          competition_id,
          athlete_id,
          judge_id,
          action_difficulty,
          stage_artistry,
          action_creativity,
          action_fluency,
          costume_styling,
          action_interaction,
          submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      // Set all fields to null except the one being updated
      const fieldValues = {
        action_difficulty: null,
        stage_artistry: null,
        action_creativity: null,
        action_fluency: null,
        costume_styling: null,
        action_interaction: null
      };
      fieldValues[field] = value;

      const insertValues = [
        competition_id,
        athlete_id,
        judge_id,
        fieldValues.action_difficulty,
        fieldValues.stage_artistry,
        fieldValues.action_creativity,
        fieldValues.action_fluency,
        fieldValues.costume_styling,
        fieldValues.action_interaction
      ];

      const insertResult = await client.query(insertQuery, insertValues);
      savedScore = insertResult.rows[0];
      console.log(`✅ Created new score record, field: ${field} = ${value}`);
    }

    // 8. Commit transaction
    await client.query('COMMIT');

    // 9. Update Redis cache (partial update)
    try {
      const cacheKey = `score:${competition_id}:${athlete_id}:${judge_id}`;
      
      // Get existing cache or create new
      let cachedScore = await redis.get(cacheKey);
      if (cachedScore) {
        cachedScore = JSON.parse(cachedScore);
      } else {
        cachedScore = {
          competition_id,
          athlete_id,
          judge_id,
          competition_name: competition.name,
          athlete_name: athlete.name,
          athlete_number: athlete.athlete_number,
          scores: {}
        };
      }

      // Update only the specific field
      cachedScore.scores[field] = value;
      cachedScore.updated_at = savedScore.submitted_at;

      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(cachedScore));
      
      // Invalidate rankings cache
      await redisHelpers.invalidateScoreCaches(competition_id);
      
      console.log(`✅ Redis cache updated for field: ${field}`);
    } catch (redisError) {
      console.error('⚠️  Redis cache update failed:', redisError.message);
    }

    // 10. Broadcast partial update via WebSocket
    try {
      const io = req.app.get('io');
      if (io) {
        const roomName = `competition:${competition_id}`;
        
        io.to(roomName).emit('partial-score-update', {
          type: 'PARTIAL_SCORE_UPDATE',
          data: {
            competition_id,
            athlete_id,
            judge_id,
            field,
            value,
            athlete_name: athlete.name,
            athlete_number: athlete.athlete_number,
            judge_name: req.user.name || req.user.username || 'Unknown Judge',
            timestamp: savedScore.submitted_at
          }
        });
      }
    } catch (wsError) {
      console.error('⚠️  WebSocket broadcast failed:', wsError.message);
    }

    // 11. Return success response
    res.status(200).json({
      success: true,
      message: `Field ${field} updated successfully`,
      data: {
        field,
        value,
        score: savedScore,
        athlete: {
          id: athlete.id,
          name: athlete.name,
          athlete_number: athlete.athlete_number
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Partial score update error:', error);
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Batch submit scores for multiple athletes in a competition
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1
 * 
 * POST /api/scores/batch-submit
 * Body: {
 *   submissions: [{
 *     competition_id: number,
 *     athlete_id: number,
 *     scores: { ... }
 *   }]
 * }
 */
const batchSubmitScores = async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    const { submissions } = req.body;
    const judge_id = req.user.id;

    console.log('\n🔍 DEBUG - Batch Score Submission Request:');
    console.log('Judge ID:', judge_id);
    console.log('Number of submissions:', submissions?.length);

    // 1. Validate request body
    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
      return next(new AppError('Missing or invalid submissions array', 400));
    }

    // 2. Get all unique competition IDs
    const competitionIds = [...new Set(submissions.map(s => s.competition_id))];
    
    // 3. Validate all competitions exist and are active
    const competitionsResult = await client.query(
      'SELECT id, competition_type, name, status FROM competitions WHERE id = ANY($1)',
      [competitionIds]
    );

    if (competitionsResult.rows.length !== competitionIds.length) {
      return next(new AppError('One or more competitions not found', 404));
    }

    const competitions = new Map(competitionsResult.rows.map(c => [c.id, c]));

    // Check all competitions are active
    for (const competition of competitions.values()) {
      if (competition.status !== 'active') {
        return next(new AppError(`Cannot submit scores for ${competition.status} competition: ${competition.name}`, 400));
      }
    }

    // 4. Get all unique athlete IDs
    const athleteIds = [...new Set(submissions.map(s => s.athlete_id))];
    
    // 5. Validate all athletes exist and are registered
    const athletesResult = await client.query(
      `SELECT a.id, a.name, a.athlete_number, ca.competition_id
       FROM athletes a
       INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
       WHERE a.id = ANY($1) AND ca.competition_id = ANY($2)`,
      [athleteIds, competitionIds]
    );

    const athleteCompetitions = new Map();
    athletesResult.rows.forEach(row => {
      const key = `${row.id}_${row.competition_id}`;
      athleteCompetitions.set(key, row);
    });

    // 6. Validate each submission
    const validatedSubmissions = [];
    for (const submission of submissions) {
      const { competition_id, athlete_id, scores } = submission;

      // Check competition exists
      const competition = competitions.get(competition_id);
      if (!competition) {
        return next(new AppError(`Competition ${competition_id} not found`, 404));
      }

      // Check athlete is registered for this competition
      const athleteKey = `${athlete_id}_${competition_id}`;
      const athlete = athleteCompetitions.get(athleteKey);
      if (!athlete) {
        return next(new AppError(`Athlete ${athlete_id} not registered for competition ${competition_id}`, 404));
      }

      // Validate score fields
      const fieldValidation = validateScoreFields(competition.competition_type, scores);
      if (!fieldValidation.valid) {
        return next(new AppError(`Score validation failed for athlete ${athlete_id}: ${fieldValidation.errors.join(', ')}`, 400));
      }

      // Validate score ranges
      const rangeValidation = validateScoreRange(scores);
      if (!rangeValidation.valid) {
        return next(new AppError(`Score range validation failed for athlete ${athlete_id}: ${rangeValidation.errors.join(', ')}`, 400));
      }

      validatedSubmissions.push({
        competition_id,
        athlete_id,
        scores,
        competition,
        athlete
      });
    }

    // 7. Check for existing scores and prepare for upsert
    const existingScoresResult = await client.query(
      `SELECT competition_id, athlete_id, id
       FROM scores 
       WHERE competition_id = ANY($1) 
       AND athlete_id = ANY($2) 
       AND judge_id = $3`,
      [competitionIds, athleteIds, judge_id]
    );

    const existingScoresMap = new Map();
    existingScoresResult.rows.forEach(row => {
      const key = `${row.competition_id}_${row.athlete_id}`;
      existingScoresMap.set(key, row.id);
    });

    console.log(`📊 Found ${existingScoresResult.rows.length} existing score records`);

    // 8. Begin transaction
    await client.query('BEGIN');

    const insertedScores = [];
    const realtimeUpdates = [];

    // 9. Upsert all scores (insert or update existing)
    for (const submission of validatedSubmissions) {
      const { competition_id, athlete_id, scores, competition, athlete } = submission;

      // Check if score already exists
      const scoreKey = `${competition_id}_${athlete_id}`;
      const existingScoreId = existingScoresMap.get(scoreKey);

      let savedScore;

      if (existingScoreId) {
        // Update existing score and mark as submitted
        console.log(`🔄 Updating existing score for athlete ${athlete_id} in competition ${competition_id}`);
        
        const updateQuery = `
          UPDATE scores SET
            action_difficulty = $1,
            stage_artistry = $2,
            action_creativity = $3,
            action_fluency = $4,
            costume_styling = $5,
            action_interaction = $6,
            submitted_at = NOW(),
            updated_at = NOW()
          WHERE id = $7
          RETURNING *
        `;

    console.log('🔍 Update Query:', updateQuery);
    console.log('🔍 Values:', values);

        const updateValues = [
          scores.action_difficulty !== undefined ? scores.action_difficulty : null,
          scores.stage_artistry !== undefined ? scores.stage_artistry : null,
          scores.action_creativity !== undefined ? scores.action_creativity : null,
          scores.action_fluency !== undefined ? scores.action_fluency : null,
          scores.costume_styling !== undefined ? scores.costume_styling : null,
          scores.action_interaction !== undefined ? scores.action_interaction : null,
          existingScoreId
        ];

        const updateResult = await client.query(updateQuery, updateValues);
        savedScore = updateResult.rows[0];
      } else {
        // Insert new score
        console.log(`➕ Inserting new score for athlete ${athlete_id} in competition ${competition_id}`);
        
        const insertQuery = `
          INSERT INTO scores (
            competition_id,
            athlete_id,
            judge_id,
            action_difficulty,
            stage_artistry,
            action_creativity,
            action_fluency,
            costume_styling,
            action_interaction,
            submitted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *
        `;

        const insertValues = [
          competition_id,
          athlete_id,
          judge_id,
          scores.action_difficulty !== undefined ? scores.action_difficulty : null,
          scores.stage_artistry !== undefined ? scores.stage_artistry : null,
          scores.action_creativity !== undefined ? scores.action_creativity : null,
          scores.action_fluency !== undefined ? scores.action_fluency : null,
          scores.costume_styling !== undefined ? scores.costume_styling : null,
          scores.action_interaction !== undefined ? scores.action_interaction : null
        ];

        const insertResult = await client.query(insertQuery, insertValues);
        savedScore = insertResult.rows[0];
      }

      insertedScores.push(savedScore);

      // Prepare real-time update data
      realtimeUpdates.push({
        competition_id: competition.id,
        competition_name: competition.name,
        competition_type: competition.competition_type,
        athlete_id: athlete.id,
        athlete_name: athlete.name,
        athlete_number: athlete.athlete_number,
        judge_id: req.user.id,
        judge_name: req.user.name || req.user.username || 'Unknown Judge',
        scores: {
          action_difficulty: savedScore.action_difficulty,
          stage_artistry: savedScore.stage_artistry,
          action_creativity: savedScore.action_creativity,
          action_fluency: savedScore.action_fluency,
          costume_styling: savedScore.costume_styling,
          action_interaction: savedScore.action_interaction
        },
        timestamp: savedScore.submitted_at
      });
    }

    // 10. Commit transaction
    await client.query('COMMIT');

    // 11. Update Redis cache and broadcast WebSocket updates
    try {
      for (const update of realtimeUpdates) {
        // Update latest score cache
        await redisHelpers.setLatestScore(update.competition_id, update, 3600);
        
        // Invalidate rankings cache
        await redisHelpers.invalidateScoreCaches(update.competition_id);
        
        // Broadcast via WebSocket
        const io = req.app.get('io');
        if (io) {
          const roomName = `competition:${update.competition_id}`;
          io.to(roomName).emit('score-update', {
            type: 'SCORE_UPDATED',
            data: update,
            timestamp: update.timestamp
          });
        }
      }
      
      console.log(`✅ Batch submission: ${insertedScores.length} scores saved and broadcasted`);
    } catch (cacheError) {
      console.error('⚠️  Cache/WebSocket update failed (continuing):', cacheError.message);
    }

    // 12. Return success response
    res.status(201).json({
      success: true,
      message: `Successfully submitted ${insertedScores.length} scores`,
      data: {
        count: insertedScores.length,
        scores: insertedScores
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Batch score submission error:', error);
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Update a score (Admin only)
 * PUT /api/scores/:id
 * Requirements: Admin score management
 */
const updateScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scoreData = req.body;

    // Get the score to check competition type
    const scoreResult = await db.query(
      `SELECT s.*, c.competition_type 
       FROM scores s 
       INNER JOIN competitions c ON s.competition_id = c.id 
       WHERE s.id = $1`,
      [id]
    );

    if (scoreResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Score not found'
      });
    }

    const existingScore = scoreResult.rows[0];
    const competitionType = existingScore.competition_type;

    // Validate score range
    const rangeValidation = validateScoreRange(scoreData);
    if (!rangeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid score values',
        errors: rangeValidation.errors
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['action_difficulty', 'stage_artistry', 'action_creativity', 
                          'action_fluency', 'costume_styling', 'action_interaction'];

    for (const field of allowedFields) {
      if (scoreData.hasOwnProperty(field)) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(scoreData[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    values.push(id); // Add id as last parameter

    const updateQuery = `
      UPDATE scores
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    console.log('🔍 Update Query:', updateQuery);
    console.log('🔍 Values:', values);

    const result = await db.query(updateQuery, values);

    console.log('✅ Score updated successfully:', result.rows[0].id);

    // Clear cache for this competition
    try {
      if (redis) {
        const cacheKey = `scores:competition:${existingScore.competition_id}`;
        await redis.del(cacheKey);
        console.log('✅ Cache cleared for competition:', existingScore.competition_id);
      }
    } catch (cacheError) {
      console.error('⚠️  Failed to clear cache (continuing anyway):', cacheError.message);
      // Don't fail the request if cache clearing fails
    }

    res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      data: {
        score: result.rows[0]
      }
    });

  } catch (err) {
    console.error('❌ Update score error:', err);
    next(err);
  }
};

/**
 * Delete a score (Admin only)
 * DELETE /api/scores/:id
 * Requirements: Admin score management
 */
const deleteScore = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the score to get competition_id for cache clearing
    const scoreResult = await db.query(
      'SELECT competition_id FROM scores WHERE id = $1',
      [id]
    );

    if (scoreResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Score not found'
      });
    }

    const competitionId = scoreResult.rows[0].competition_id;

    // Delete the score
    await db.query('DELETE FROM scores WHERE id = $1', [id]);

    // Clear cache for this competition
    try {
      if (redis) {
        const cacheKey = `scores:competition:${competitionId}`;
        await redis.del(cacheKey);
        console.log('✅ Cache cleared for competition:', competitionId);
      }
    } catch (cacheError) {
      console.error('⚠️  Failed to clear cache (continuing anyway):', cacheError.message);
      // Don't fail the request if cache clearing fails
    }

    res.status(200).json({
      success: true,
      message: 'Score deleted successfully'
    });

  } catch (err) {
    console.error('❌ Delete score error:', err);
    next(err);
  }
};

module.exports = {
  submitScore,
  getScores,
  getScoresByCompetition,
  getLatestScore,
  getRankings,
  batchSubmitScores,
  partialScoreUpdate,
  updateScore,
  deleteScore,
  // Export validation functions for testing
  validateScoreRange,
  validateScoreFields,
  COMPETITION_TYPE_RULES
};



