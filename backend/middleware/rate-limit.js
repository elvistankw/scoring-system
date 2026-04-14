// backend/middleware/rate-limit.js
// Rate limiting middleware for API endpoints
// Requirements: 10.4

const rateLimit = require('express-rate-limit');
const { AppError } = require('./error-handler');

/**
 * Custom rate limit handler
 * Returns consistent error format
 */
const rateLimitHandler = (req, res, next) => {
  return next(
    new AppError(
      'Too many requests from this IP. Please try again later.',
      429
    )
  );
};

/**
 * General API rate limiter
 * Applies to all API routes
 * Development: 1000 requests per 15 minutes per IP
 * Production: Should be reduced to 100 requests
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (increased for development)
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler
});

/**
 * Authentication rate limiter
 * Stricter limits for login/register endpoints
 * Development: 50 requests per 15 minutes per IP
 * Production: Should be reduced to 5-10 requests
 * Requirements: 1.1, 10.4
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window (increased for development)
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  handler: rateLimitHandler
});

/**
 * Score submission rate limiter
 * Prevents spam score submissions
 * 30 requests per minute per IP
 * Requirements: 10.4
 */
const scoreLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many score submissions. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Display/public endpoints rate limiter
 * More lenient for public-facing endpoints
 * 200 requests per 15 minutes per IP
 */
const displayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Admin operations rate limiter
 * Moderate limits for admin operations
 * Development: 500 requests per 15 minutes per IP
 * Production: Should be reduced to 50 requests
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window (increased for development)
  message: 'Too many admin operations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

module.exports = {
  generalLimiter,
  authLimiter,
  scoreLimiter,
  displayLimiter,
  adminLimiter
};
