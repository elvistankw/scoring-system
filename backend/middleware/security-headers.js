// backend/middleware/security-headers.js
// Security headers middleware for HTTP response hardening
// Requirements: 10.4, 10.5

/**
 * Security headers middleware
 * Adds essential security headers to all HTTP responses
 * 
 * Headers added:
 * - X-Content-Type-Options: nosniff (prevents MIME type sniffing)
 * - X-Frame-Options: DENY (prevents clickjacking)
 * - X-XSS-Protection: 1; mode=block (enables XSS filter)
 * - Strict-Transport-Security: enforces HTTPS
 * - Content-Security-Policy: restricts resource loading
 * - X-DNS-Prefetch-Control: controls DNS prefetching
 * 
 * Requirements: 10.4, 10.5
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  // Ensures browsers respect the Content-Type header
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  // Prevents the page from being embedded in iframes
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection in older browsers
  // Modern browsers have this built-in, but this provides backward compatibility
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS in production
  // Tells browsers to only access the site over HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  // Restricts sources from which content can be loaded
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' ws: wss:; " +
    "frame-ancestors 'none';"
  );

  // Control DNS prefetching
  // Prevents browsers from prefetching DNS for links
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Remove X-Powered-By header (if Express adds it)
  // Hides server technology information
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * CORS security configuration
 * More restrictive CORS settings for production
 * 
 * @param {string} allowedOrigin - Allowed origin URL
 * @returns {Object} CORS configuration object
 */
const getCorsConfig = (allowedOrigin) => {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      const allowedOrigins = [
        allowedOrigin || process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5000'
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400 // 24 hours
  };
};

module.exports = {
  securityHeaders,
  getCorsConfig
};
