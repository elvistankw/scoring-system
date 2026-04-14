# Middleware Quick Reference Card

## Import

```javascript
const { 
  AppError, errorHandler, catchAsync,
  authenticate, requireRole, optionalAuth,
  validate, validateScoreSubmission, validatePagination,
  authLimiter, scoreLimiter, adminLimiter, displayLimiter
} = require('./middleware');
```

## Error Handling

```javascript
// Throw operational error
throw new AppError('Resource not found', 404);

// Wrap async route
router.get('/path', catchAsync(async (req, res) => {
  // Errors automatically caught
}));

// Global error handler (in index.js)
app.use(errorHandler);
```

## Authentication

```javascript
// Require authentication
router.get('/profile', authenticate, handler);

// Require specific role
router.post('/admin', authenticate, requireRole('admin'), handler);

// Multiple roles
router.post('/scores', authenticate, requireRole('judge', 'admin'), handler);

// Optional auth
router.get('/public', optionalAuth, handler);

// Access user in handler
const userId = req.user.id;
const userRole = req.user.role;
```

## Validation

```javascript
// Generic validation
const schema = {
  username: { required: true, type: 'string', minLength: 3 },
  email: { required: true, type: 'email' },
  age: { required: false, type: 'integer', min: 18, max: 100 },
  role: { required: true, oneOf: ['admin', 'judge'] }
};
router.post('/register', validate(schema), handler);

// Score validation
router.post('/scores', validateScoreSubmission, handler);

// Pagination
router.get('/list', validatePagination, (req, res) => {
  const { page, limit } = req.query; // Already validated
});
```

## Rate Limiting

```javascript
// Auth endpoints (5 req/15min)
router.post('/login', authLimiter, handler);

// Score submission (30 req/min)
router.post('/scores', scoreLimiter, handler);

// Admin operations (50 req/15min)
router.post('/admin', adminLimiter, handler);

// Display endpoints (200 req/15min)
router.get('/display', displayLimiter, handler);
```

## Complete Route Example

```javascript
router.post(
  '/scores/submit',
  scoreLimiter,              // 1. Rate limit
  authenticate,              // 2. Verify JWT
  requireRole('judge'),      // 3. Check role
  validateScoreSubmission,   // 4. Validate input
  catchAsync(async (req, res) => {
    // 5. Handle request
    const { competition_id, athlete_id, scores } = req.body;
    const judge_id = req.user.id;
    
    // Business logic...
    
    res.status(201).json({ success: true });
  })
);
```

## Validation Schema Options

| Rule | Type | Example |
|------|------|---------|
| `required` | boolean | `{ required: true }` |
| `type` | string | `{ type: 'string' \| 'number' \| 'integer' \| 'email' }` |
| `minLength` | number | `{ minLength: 3 }` |
| `maxLength` | number | `{ maxLength: 50 }` |
| `min` | number | `{ min: 0 }` |
| `max` | number | `{ max: 100 }` |
| `oneOf` | array | `{ oneOf: ['admin', 'judge'] }` |
| `custom` | function | `{ custom: (value) => value > 0 ? null : 'Error' }` |

## Error Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected errors |

## JWT Utilities

```javascript
const { generateToken, createTokenResponse } = require('./utils/jwt');

// Generate token
const token = generateToken({ id: user.id, role: user.role });

// Create full response
const response = createTokenResponse(user);
// Returns: { token, expiresIn, user: { id, username, email, role } }
```

## Common Patterns

### Transaction with Error Handling

```javascript
const client = await db.getClient();
try {
  await client.query('BEGIN');
  // Operations...
  await client.query('COMMIT');
  res.json({ success: true });
} catch (err) {
  await client.query('ROLLBACK');
  throw new AppError('Transaction failed', 500);
} finally {
  client.release();
}
```

### Conditional Authorization

```javascript
router.put('/scores/:id', authenticate, catchAsync(async (req, res, next) => {
  const score = await getScore(req.params.id);
  
  if (req.user.role !== 'admin' && score.judge_id !== req.user.id) {
    throw new AppError('You can only edit your own scores', 403);
  }
  
  // Update...
}));
```

### Custom Validation

```javascript
const schema = {
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    custom: (value) => {
      if (!/[A-Z]/.test(value)) return 'Must contain uppercase';
      if (!/[0-9]/.test(value)) return 'Must contain number';
      return null; // Valid
    }
  }
};
```

## Environment Variables

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
NODE_ENV=development
PORT=5000
```

## Testing

```bash
# Run middleware tests
node test-middleware.js

# Start server
npm start

# Development with auto-reload
npm run dev
```
