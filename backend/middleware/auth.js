// backend/middleware/auth.js
// JWT authentication and authorization middleware
// Requirements: 1.1, 1.3, 1.4, 1.5

const jwtUtils = require('../utils/jwt-utils');
const { AppError } = require('./error-handler');
const db = require('../db');

/**
 * JWT authentication middleware
 * Validates JWT token and attaches user info to request
 * Requirements: 1.1, 1.3
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access token is required', 401));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Verify token using JWT utils
    const decoded = await jwtUtils.verifyToken(token, 'access');

    // 3. Check if user still exists
    const result = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('User not found', 401));
    }

    const user = result.rows[0];

    // 4. Attach user info to request object
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.message.includes('expired')) {
      return next(new AppError('Token has expired', 401));
    } else if (error.message.includes('invalid')) {
      return next(new AppError('Invalid token', 401));
    }
    
    return next(new AppError('Authentication failed', 401));
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 * Requirements: 1.4, 1.5
 * 
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'judge')
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/competitions', authenticate, requireRole('admin'), createCompetition);
 * router.post('/scores/submit', authenticate, requireRole('judge', 'admin'), submitScore);
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 * Useful for endpoints that behave differently for authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await jwtUtils.verifyToken(token, 'access');
      
      const result = await db.query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
        req.token = token;
        req.tokenPayload = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Optional authentication failure doesn't block the request
    console.warn('Optional authentication failed:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  requireRole,
  optionalAuth,
  jwtUtils
};
