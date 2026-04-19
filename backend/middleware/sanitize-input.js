// Input sanitization middleware to prevent XSS attacks
// Removes HTML tags and dangerous characters from user input

/**
 * Sanitize string by removing HTML tags and dangerous characters
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script-related content
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Recursively sanitize object properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      // Use Object.prototype.hasOwnProperty.call() to handle objects without prototype
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  return obj;
}

/**
 * Express middleware to sanitize request body, query, and params
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject
};
