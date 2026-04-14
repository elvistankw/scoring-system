# Backend Middleware Documentation

This directory contains all middleware components for the Realtime Scoring System backend.

## Overview

The middleware layer provides:
- **Error Handling**: Global error handler and custom error class
- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Validation**: Request data validation
- **Rate Limiting**: API endpoint protection

## Middleware Components

### 1. Error Handler (`error-handler.js`)

**Requirements**: 1.5, 10.4

#### AppError Class

Custom error class for operational errors:

```javascript
const { AppError } = require('./middleware');

// Create operational error
throw new AppError('Resource not found', 404);

// Create server error
throw new AppError('Database connection failed', 500);
```

**Properties**:
- `message`: Error message
- `statusCode`: HTTP status code
- `isOperational`: Boolean indicating if error is operational (default: true)
- `status`: 'fail' for 4xx, 'error' for 5xx

#### Global Error Handler

Catches all errors and returns consistent JSON responses:

```javascript
app.use(errorHandler);
```

**Features**:
- Handles JWT errors (invalid token, expired token)
- Handles PostgreSQL errors (unique violation, foreign key violation)
- Distinguishes operational vs programming errors
- Logs errors appropriately based on environment

#### catchAsync Helper

Wraps async route handlers to catch errors:

```javascript
const { catchAsync } = require('./middleware');

router.get('/users', catchAsync(async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users.rows);
}));
```

### 2. Authentication (`auth.js`)

**Requirements**: 1.1, 1.3, 1.4, 1.5

#### authenticate Middleware

Validates JWT token and attaches user to request:

```javascript
const { authenticate } = require('./middleware');

router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

**Behavior**:
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token signature and expiration
- Checks if user still exists in database
- Attaches user object to `req.user`
- Returns 401 if token is missing, invalid, or expired

**req.user Object**:
```javascript
{
  id: 1,
  username: 'judge1',
  email: 'judge1@example.com',
  role: 'judge'
}
```

#### requireRole Middleware

Restricts access based on user role:

```javascript
const { authenticate, requireRole } = require('./middleware');

// Admin only
router.post('/competitions', authenticate, requireRole('admin'), createCompetition);

// Judge or Admin
router.post('/scores', authenticate, requireRole('judge', 'admin'), submitScore);
```

**Features**:
- Accepts multiple roles as arguments
- Returns 403 if user doesn't have required role
- Must be used after `authenticate` middleware

#### optionalAuth Middleware

Attaches user if token is present, but doesn't require it:

```javascript
const { optionalAuth } = require('./middleware');

router.get('/public-scores', optionalAuth, (req, res) => {
  // req.user will be present if token was provided
  const includeDetails = req.user?.role === 'admin';
  // ...
});
```

### 3. Validation (`validate.js`)

**Requirements**: 1.5, 3.3, 4.3, 5.3, 10.4

#### validate Middleware Factory

Generic validation middleware for request body:

```javascript
const { validate } = require('./middleware');

const registerSchema = {
  username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 8 },
  role: { required: true, oneOf: ['admin', 'judge'] }
};

router.post('/register', validate(registerSchema), registerUser);
```

**Validation Rules**:
- `required`: Field must be present
- `type`: Data type ('string', 'number', 'integer', 'email')
- `minLength`, `maxLength`: String length constraints
- `min`, `max`: Number range constraints
- `oneOf`: Enum validation
- `custom`: Custom validation function

**Custom Validation Example**:
```javascript
const schema = {
  password: {
    required: true,
    type: 'string',
    custom: (value) => {
      if (!/[A-Z]/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      return null; // No error
    }
  }
};
```

#### validateScoreSubmission Middleware

Specialized validation for score submissions:

```javascript
const { validateScoreSubmission } = require('./middleware');

router.post('/scores/submit', authenticate, validateScoreSubmission, submitScore);
```

**Validates**:
- `competition_id`: Required integer
- `athlete_id`: Required integer
- `competition_type`: Must be 'individual', 'duo_team', or 'challenge'
- `scores`: Object with required dimensions based on competition type

**Competition Type Validation**:

**Individual** (5 dimensions):
- `action_difficulty` (0-100)
- `stage_artistry` (0-100)
- `action_creativity` (0-100)
- `action_fluency` (0-100)
- `costume_styling` (0-100)

**Duo/Team** (5 dimensions):
- `action_difficulty` (0-100)
- `stage_artistry` (0-100)
- `action_interaction` (0-100)
- `action_creativity` (0-100)
- `costume_styling` (0-100)

**Challenge** (3 dimensions):
- `action_difficulty` (0-100)
- `action_creativity` (0-100)
- `action_fluency` (0-100)

#### validatePagination Middleware

Validates and normalizes pagination parameters:

```javascript
const { validatePagination } = require('./middleware');

router.get('/athletes', validatePagination, (req, res) => {
  const { page, limit } = req.query; // Already validated and parsed
  // page defaults to 1, limit defaults to 10
});
```

### 4. Rate Limiting (`rate-limit.js`)

**Requirements**: 10.4

Protects API endpoints from abuse using express-rate-limit.

#### Available Limiters

**generalLimiter** - All API routes:
- 100 requests per 15 minutes per IP

```javascript
app.use('/api/', generalLimiter);
```

**authLimiter** - Authentication endpoints:
- 5 requests per 15 minutes per IP
- Use for login, register, password reset

```javascript
router.post('/auth/login', authLimiter, login);
router.post('/auth/register', authLimiter, register);
```

**scoreLimiter** - Score submission endpoints:
- 30 requests per minute per IP

```javascript
router.post('/scores/submit', authenticate, scoreLimiter, submitScore);
```

**displayLimiter** - Public display endpoints:
- 200 requests per 15 minutes per IP

```javascript
router.get('/display/scores', displayLimiter, getDisplayScores);
```

**adminLimiter** - Admin operations:
- 50 requests per 15 minutes per IP

```javascript
router.post('/admin/competitions', authenticate, requireRole('admin'), adminLimiter, createCompetition);
```

**Response Headers**:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Time when limit resets

## Usage Examples

### Complete Route with All Middleware

```javascript
const { 
  authenticate, 
  requireRole, 
  validate, 
  scoreLimiter,
  catchAsync 
} = require('./middleware');

const scoreSchema = {
  competition_id: { required: true, type: 'integer' },
  athlete_id: { required: true, type: 'integer' },
  scores: { required: true, type: 'object' }
};

router.post(
  '/scores/submit',
  scoreLimiter,              // Rate limiting
  authenticate,              // JWT validation
  requireRole('judge'),      // Role check
  validate(scoreSchema),     // Input validation
  catchAsync(async (req, res) => {
    // Route handler
    const { competition_id, athlete_id, scores } = req.body;
    const judge_id = req.user.id;
    
    // Business logic...
    
    res.status(201).json({ success: true });
  })
);
```

### Error Handling Pattern

```javascript
const { AppError, catchAsync } = require('./middleware');

router.get('/competitions/:id', catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await db.query(
    'SELECT * FROM competitions WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return next(new AppError('Competition not found', 404));
  }
  
  res.json(result.rows[0]);
}));
```

## Testing

Run middleware tests:

```bash
node test-middleware.js
```

## Integration with Express App

In `backend/index.js`:

```javascript
const { errorHandler, generalLimiter } = require('./middleware');

// Apply rate limiter
app.use('/api/', generalLimiter);

// Routes...

// Error handler (must be last)
app.use(errorHandler);
```

## Security Best Practices

1. **Always use parameterized queries** - Prevents SQL injection
2. **Validate all inputs** - Use validation middleware
3. **Apply rate limiting** - Prevents abuse
4. **Use JWT for authentication** - Stateless and secure
5. **Implement role-based access** - Principle of least privilege
6. **Handle errors gracefully** - Don't leak sensitive information

## Environment Variables

Required in `.env`:

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

## Error Response Format

All errors return consistent JSON:

```json
{
  "status": "fail",
  "message": "Error description"
}
```

Status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
