// backend/middleware/error-handler.js
// Global error handler middleware for Express 5.x
// Requirements: 1.5, 10.4

/**
 * Custom AppError class for operational errors
 * Distinguishes between operational errors (expected) and programming errors (bugs)
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Handles both operational errors and unexpected errors
 * Express 5.x compatible (async error handling built-in)
 */
const errorHandler = (err, req, res, next) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    // Production: log only essential info
    console.error('❌ Error:', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path
    });
  }

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Token expired. Please log in again.'
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      status: 'fail',
      message: 'Duplicate entry. This record already exists.'
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid reference. Related record does not exist.'
    });
  }

  if (err.code === '22P02') { // PostgreSQL invalid input syntax
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid input format.'
    });
  }

  // Operational errors: send detailed message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or unknown errors: don't leak details
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server.'
  });
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 * Note: Express 5.x handles async errors automatically, but this is for compatibility
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync
};
