// backend/middleware/index.js
// Centralized middleware exports
// Requirements: 1.1, 1.3, 1.4, 1.5, 10.4

const { AppError, errorHandler, catchAsync } = require('./error-handler');
const { authenticate, requireRole, optionalAuth } = require('./auth');
const { validate, validateScoreSubmission, validatePagination, validators } = require('./validate');
const { 
  generalLimiter, 
  authLimiter, 
  scoreLimiter, 
  displayLimiter, 
  adminLimiter 
} = require('./rate-limit');
const { securityHeaders, getCorsConfig } = require('./security-headers');

module.exports = {
  // Error handling
  AppError,
  errorHandler,
  catchAsync,
  
  // Authentication & Authorization
  authenticate,
  requireRole,
  optionalAuth,
  
  // Validation
  validate,
  validateScoreSubmission,
  validatePagination,
  validators,
  
  // Rate limiting
  generalLimiter,
  authLimiter,
  scoreLimiter,
  displayLimiter,
  adminLimiter,
  
  // Security
  securityHeaders,
  getCorsConfig
};
