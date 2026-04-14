# Security Quick Reference Guide

Quick reference for security best practices in the Realtime Scoring System.

## 🔒 SQL Queries - Always Use Parameterization

### ✅ CORRECT - Parameterized Query
```javascript
const result = await db.query(
  'SELECT * FROM users WHERE email = $1 AND role = $2',
  [email, role]
);
```

### ❌ WRONG - String Concatenation
```javascript
// NEVER DO THIS - SQL Injection vulnerability!
const query = `SELECT * FROM users WHERE email = '${email}'`;
const result = await db.query(query);
```

### Dynamic Query Building (Safe)
```javascript
const params = [];
let paramCount = 0;
let query = 'SELECT * FROM athletes WHERE 1=1';

if (search) {
  paramCount++;
  query += ` AND name ILIKE $${paramCount}`;
  params.push(`%${search}%`);
}

const result = await db.query(query, params);
```

---

## 🎫 JWT Authentication

### Protecting Routes
```javascript
const { authenticate, requireRole } = require('../middleware/auth');

// Require authentication only
router.get('/profile', authenticate, getProfile);

// Require specific role
router.post('/competitions', authenticate, requireRole('admin'), createCompetition);

// Multiple roles allowed
router.post('/scores', authenticate, requireRole('judge', 'admin'), submitScore);
```

### Token Format
```
Authorization: Bearer <jwt_token>
```

### Token Expiration
- Default: 24 hours
- Configured in: `JWT_EXPIRES_IN` environment variable
- Expired tokens return 401 Unauthorized

---

## 🚦 Rate Limiting

### Available Limiters
```javascript
const { 
  generalLimiter,   // 100 req/15min - General API
  authLimiter,      // 50 req/15min - Login/Register
  scoreLimiter,     // 30 req/1min - Score submission
  displayLimiter,   // 200 req/15min - Public displays
  adminLimiter      // 50 req/15min - Admin operations
} = require('../middleware/rate-limit');
```

### Usage
```javascript
// Apply to specific route
router.post('/login', authLimiter, login);

// Apply to all routes in file
router.use(authLimiter);
```

### Rate Limit Headers
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1234567890
```

---

## 🌐 CORS Configuration

### Allowed Origins
- `http://localhost:3000` (development)
- `process.env.FRONTEND_URL` (production)

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### Credentials
- Enabled for cookie/session support

### Configuration
Located in: `middleware/security-headers.js`

---

## 🛡️ Security Headers

All responses include these headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ...
X-DNS-Prefetch-Control: off
```

Production only:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Note:** `X-Powered-By` header is removed for security.

---

## ✅ Input Validation

### Using Validation Middleware
```javascript
const { validate } = require('../middleware/validate');

const schema = {
  username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
  email: { required: true, type: 'email' },
  age: { required: false, type: 'number', min: 0, max: 150 },
  role: { required: true, oneOf: ['admin', 'judge'] }
};

router.post('/register', validate(schema), register);
```

### Validation Rules
- `required` - Field must be present
- `type` - Data type (string, number, integer, email)
- `minLength` / `maxLength` - String length
- `min` / `max` - Number range
- `oneOf` - Enum validation
- `custom` - Custom validation function

### Body Size Limits
- Maximum request body: **10KB**
- Prevents payload attacks

---

## 🔐 Role-Based Authorization

### Available Roles
- `admin` - Full system access
- `judge` - Score submission access

### Endpoint Protection

#### Admin Only
```javascript
router.post('/competitions', authenticate, requireRole('admin'), createCompetition);
router.delete('/athletes/:id', authenticate, requireRole('admin'), deleteAthlete);
```

#### Judge Only
```javascript
router.post('/scores/submit', authenticate, requireRole('judge'), submitScore);
```

#### Authenticated Users (Any Role)
```javascript
router.get('/competitions', authenticate, getAllCompetitions);
```

#### Public (No Auth)
```javascript
router.get('/scores/rankings/:id', getRankings);
```

---

## 🧪 Testing Security

### Run Security Tests
```bash
cd backend
node test-security-hardening.js
```

### Test Coverage
- SQL injection protection
- JWT token validation
- Rate limiting
- CORS configuration
- Security headers
- Input sanitization
- Role-based authorization

---

## 🚨 Common Security Mistakes to Avoid

### ❌ Don't Do This

1. **Hardcoded Secrets**
```javascript
// WRONG
const JWT_SECRET = 'my-secret-key';
```

2. **String Concatenation in SQL**
```javascript
// WRONG
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

3. **No Authentication on Protected Routes**
```javascript
// WRONG
router.delete('/users/:id', deleteUser);
```

4. **Exposing Sensitive Errors**
```javascript
// WRONG
res.status(500).json({ error: err.stack });
```

5. **No Input Validation**
```javascript
// WRONG
const { email } = req.body;
await db.query('INSERT INTO users (email) VALUES ($1)', [email]);
// Should validate email format first!
```

### ✅ Do This Instead

1. **Use Environment Variables**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
```

2. **Use Parameterized Queries**
```javascript
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);
```

3. **Protect Routes with Middleware**
```javascript
router.delete('/users/:id', authenticate, requireRole('admin'), deleteUser);
```

4. **Generic Error Messages**
```javascript
res.status(500).json({ 
  status: 'error',
  message: 'Internal server error' 
});
```

5. **Validate All Inputs**
```javascript
const schema = { email: { required: true, type: 'email' } };
router.post('/users', validate(schema), createUser);
```

---

## 📋 Security Checklist for New Endpoints

When creating a new endpoint, verify:

- [ ] SQL queries use parameterized statements
- [ ] Authentication middleware applied if needed
- [ ] Role-based authorization if needed
- [ ] Rate limiting applied
- [ ] Input validation implemented
- [ ] Error handling doesn't expose sensitive data
- [ ] No secrets hardcoded
- [ ] CORS allows the endpoint
- [ ] Tested with security test suite

---

## 🔗 Related Files

- `middleware/auth.js` - Authentication & authorization
- `middleware/rate-limit.js` - Rate limiting configuration
- `middleware/validate.js` - Input validation
- `middleware/security-headers.js` - Security headers
- `middleware/error-handler.js` - Error handling
- `utils/jwt.js` - JWT utilities
- `test-security-hardening.js` - Security tests

---

## 📞 Security Contacts

For security issues or questions:
1. Review this guide
2. Check `SECURITY_HARDENING_REPORT.md`
3. Run security tests
4. Contact security team

---

**Last Updated:** 2026-04-11  
**Task:** 26 - Security Hardening  
**Requirements:** 1.1, 1.3, 1.4, 1.5, 10.4, 10.5
