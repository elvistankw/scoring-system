// backend/middleware/validate.js
// Request validation middleware
// Requirements: 1.5, 10.4

const { AppError } = require('./error-handler');

/**
 * Validation helper functions
 */
const validators = {
  /**
   * Check if value is a non-empty string
   */
  isString: (value) => typeof value === 'string' && value.trim().length > 0,

  /**
   * Check if value is a valid email
   */
  isEmail: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  },

  /**
   * Check if value is a positive integer
   */
  isPositiveInteger: (value) => {
    return Number.isInteger(value) && value > 0;
  },

  /**
   * Check if value is a number within range
   */
  isNumberInRange: (value, min, max) => {
    return typeof value === 'number' && value >= min && value <= max;
  },

  /**
   * Check if value is one of allowed values
   */
  isOneOf: (value, allowedValues) => {
    return allowedValues.includes(value);
  },

  /**
   * Check if value is a valid date string
   */
  isDate: (value) => {
    return !isNaN(Date.parse(value));
  }
};

/**
 * Generic validation middleware factory
 * Creates middleware that validates request body against schema
 * 
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 * 
 * @example
 * const schema = {
 *   username: { required: true, type: 'string', minLength: 3 },
 *   email: { required: true, type: 'email' },
 *   role: { required: true, oneOf: ['admin', 'judge'] }
 * };
 * router.post('/register', validate(schema), registerUser);
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const data = req.body;

    // Validate each field in schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rules.type === 'string' && !validators.isString(value)) {
        errors.push(`${field} must be a non-empty string`);
      }

      if (rules.type === 'email' && !validators.isEmail(value)) {
        errors.push(`${field} must be a valid email address`);
      }

      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} must be a number`);
      }

      if (rules.type === 'integer' && !Number.isInteger(value)) {
        errors.push(`${field} must be an integer`);
      }

      // String length validation
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
      }

      // Number range validation
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        errors.push(`${field} must not exceed ${rules.max}`);
      }

      // Enum validation
      if (rules.oneOf && !rules.oneOf.includes(value)) {
        errors.push(`${field} must be one of: ${rules.oneOf.join(', ')}`);
      }

      // Custom validation function
      if (rules.custom && typeof rules.custom === 'function') {
        const customError = rules.custom(value, data);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    // Return validation errors
    if (errors.length > 0) {
      return next(new AppError(`Validation failed: ${errors.join('; ')}`, 400));
    }

    next();
  };
};

/**
 * Validate score submission based on competition type
 * Requirements: 3.3, 4.3, 5.3
 */
const validateScoreSubmission = (req, res, next) => {
  const { competition_id, athlete_id, competition_type, scores } = req.body;

  const errors = [];

  // Validate required fields
  if (!competition_id || !Number.isInteger(competition_id)) {
    errors.push('competition_id must be a valid integer');
  }

  if (!athlete_id || !Number.isInteger(athlete_id)) {
    errors.push('athlete_id must be a valid integer');
  }

  if (!competition_type || !['individual', 'duo', 'team', 'challenge'].includes(competition_type)) {
    errors.push('competition_type must be one of: individual, duo, team, challenge');
  }

  if (!scores || typeof scores !== 'object') {
    errors.push('scores must be an object');
  }

  // Validate score dimensions based on competition type
  if (scores && typeof scores === 'object') {
    const validateScore = (field, min = 0, max = 100) => {
      const value = scores[field];
      if (value === undefined || value === null) {
        errors.push(`${field} is required for ${competition_type} competition`);
      } else if (typeof value !== 'number' || value < min || value > max) {
        errors.push(`${field} must be a number between ${min} and ${max}`);
      }
    };

    if (competition_type === 'individual') {
      // Individual Stage: 5 dimensions (allow full range for flexibility)
      validateScore('action_difficulty', 0, 100);
      validateScore('stage_artistry', 0, 100);
      validateScore('action_creativity', 0, 100);
      validateScore('action_fluency', 0, 100);
      validateScore('costume_styling', 0, 100);
    } else if (competition_type === 'duo' || competition_type === 'team') {
      // Duo/Team: 5 dimensions (interaction instead of fluency)
      validateScore('action_difficulty', 0, 100);
      validateScore('stage_artistry', 0, 100);
      validateScore('action_interaction', 0, 100);
      validateScore('action_creativity', 0, 100);
      validateScore('costume_styling', 0, 100);
    } else if (competition_type === 'challenge') {
      // Challenge: 3 dimensions
      validateScore('action_difficulty', 0, 100);
      validateScore('action_creativity', 0, 100);
      validateScore('action_fluency', 0, 100);
    }
  }

  if (errors.length > 0) {
    return next(new AppError(`Score validation failed: ${errors.join('; ')}`, 400));
  }

  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new AppError('page must be a positive integer', 400));
    }
    req.query.page = pageNum;
  } else {
    req.query.page = 1;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new AppError('limit must be between 1 and 100', 400));
    }
    req.query.limit = limitNum;
  } else {
    req.query.limit = 10;
  }

  next();
};

/**
 * Validate judge creation
 */
const validateJudgeCreate = (req, res, next) => {
  const { name, display_name } = req.body;

  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  } else if (name.trim().length > 100) {
    errors.push('name must not exceed 100 characters');
  }

  // Validate display_name if provided
  if (display_name !== undefined) {
    if (typeof display_name !== 'string') {
      errors.push('display_name must be a string');
    } else if (display_name.trim().length > 100) {
      errors.push('display_name must not exceed 100 characters');
    }
  }

  if (errors.length > 0) {
    return next(new AppError(`Judge validation failed: ${errors.join('; ')}`, 400));
  }

  // Clean the data
  req.body.name = name.trim();
  if (display_name) {
    req.body.display_name = display_name.trim();
  }

  next();
};

/**
 * Validate judge update
 */
const validateJudgeUpdate = (req, res, next) => {
  const { name, display_name, is_active } = req.body;

  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  } else if (name.trim().length > 100) {
    errors.push('name must not exceed 100 characters');
  }

  // Validate display_name if provided
  if (display_name !== undefined) {
    if (typeof display_name !== 'string') {
      errors.push('display_name must be a string');
    } else if (display_name.trim().length > 100) {
      errors.push('display_name must not exceed 100 characters');
    }
  }

  // Validate is_active if provided
  if (is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push('is_active must be a boolean value');
  }

  if (errors.length > 0) {
    return next(new AppError(`Judge validation failed: ${errors.join('; ')}`, 400));
  }

  // Clean the data
  req.body.name = name.trim();
  if (display_name) {
    req.body.display_name = display_name.trim();
  }

  next();
};

module.exports = {
  validate,
  validateScoreSubmission,
  validatePagination,
  validateJudgeCreate,
  validateJudgeUpdate,
  validators
};
