// Judge input validation middleware
// Ensures judge data meets strict requirements

const { AppError } = require('./error-handler');

/**
 * Validate judge name
 * - Required
 * - 2-50 characters
 * - Only letters, numbers, spaces, and common punctuation
 * - No HTML tags or special characters
 */
function validateJudgeName(name) {
  if (!name || typeof name !== 'string') {
    throw new AppError('Judge name is required', 400);
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    throw new AppError('Judge name must be at least 2 characters', 400);
  }

  if (trimmedName.length > 50) {
    throw new AppError('Judge name must not exceed 50 characters', 400);
  }

  // Allow letters (any language), numbers, spaces, hyphens, apostrophes, periods
  const nameRegex = /^[\p{L}\p{N}\s\-'.]+$/u;
  if (!nameRegex.test(trimmedName)) {
    throw new AppError('Judge name contains invalid characters', 400);
  }

  // Check for HTML tags
  if (/<[^>]*>/g.test(trimmedName)) {
    throw new AppError('Judge name cannot contain HTML tags', 400);
  }

  return trimmedName;
}

/**
 * Validate judge display name
 * - Optional
 * - 2-50 characters if provided
 * - Only letters, numbers, spaces, and common punctuation
 */
function validateDisplayName(displayName) {
  if (!displayName) {
    return null; // Optional field
  }

  if (typeof displayName !== 'string') {
    throw new AppError('Display name must be a string', 400);
  }

  const trimmedName = displayName.trim();

  if (trimmedName.length === 0) {
    return null; // Empty string treated as null
  }

  if (trimmedName.length < 2) {
    throw new AppError('Display name must be at least 2 characters', 400);
  }

  if (trimmedName.length > 50) {
    throw new AppError('Display name must not exceed 50 characters', 400);
  }

  // Allow letters (any language), numbers, spaces, hyphens, apostrophes, periods
  const nameRegex = /^[\p{L}\p{N}\s\-'.]+$/u;
  if (!nameRegex.test(trimmedName)) {
    throw new AppError('Display name contains invalid characters', 400);
  }

  // Check for HTML tags
  if (/<[^>]*>/g.test(trimmedName)) {
    throw new AppError('Display name cannot contain HTML tags', 400);
  }

  return trimmedName;
}

/**
 * Validate judge code
 * - Required
 * - 2-20 characters
 * - Only uppercase letters, numbers, and hyphens
 * - Must start with a letter
 * - Format: J001, JUDGE-01, etc.
 */
function validateJudgeCode(code) {
  if (!code || typeof code !== 'string') {
    throw new AppError('Judge code is required', 400);
  }

  const trimmedCode = code.trim().toUpperCase();

  if (trimmedCode.length < 2) {
    throw new AppError('Judge code must be at least 2 characters', 400);
  }

  if (trimmedCode.length > 20) {
    throw new AppError('Judge code must not exceed 20 characters', 400);
  }

  // Must start with a letter
  if (!/^[A-Z]/.test(trimmedCode)) {
    throw new AppError('Judge code must start with a letter', 400);
  }

  // Only uppercase letters, numbers, and hyphens
  const codeRegex = /^[A-Z][A-Z0-9\-]*$/;
  if (!codeRegex.test(trimmedCode)) {
    throw new AppError('Judge code can only contain uppercase letters, numbers, and hyphens', 400);
  }

  // No consecutive hyphens
  if (/--/.test(trimmedCode)) {
    throw new AppError('Judge code cannot contain consecutive hyphens', 400);
  }

  // Cannot end with hyphen
  if (trimmedCode.endsWith('-')) {
    throw new AppError('Judge code cannot end with a hyphen', 400);
  }

  return trimmedCode;
}

/**
 * Validate is_active status
 * - Must be boolean
 */
function validateIsActive(isActive) {
  if (isActive === undefined || isActive === null) {
    return true; // Default to true
  }

  if (typeof isActive !== 'boolean') {
    throw new AppError('is_active must be a boolean', 400);
  }

  return isActive;
}

/**
 * Middleware to validate judge creation request
 */
const validateCreateJudge = (req, res, next) => {
  try {
    const { name, display_name, code } = req.body;

    // Validate and sanitize inputs
    const validatedData = {
      name: validateJudgeName(name),
      display_name: validateDisplayName(display_name),
      code: validateJudgeCode(code),
      is_active: true // Always true for new judges
    };

    // Replace request body with validated data
    req.body = validatedData;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate judge update request
 */
const validateUpdateJudge = (req, res, next) => {
  try {
    const { name, display_name, code, is_active } = req.body;

    // At least one field must be provided
    if (!name && !display_name && code === undefined && is_active === undefined) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    // Validate and sanitize provided inputs
    const validatedData = {};

    if (name !== undefined) {
      validatedData.name = validateJudgeName(name);
    }

    if (display_name !== undefined) {
      validatedData.display_name = validateDisplayName(display_name);
    }

    if (code !== undefined) {
      validatedData.code = validateJudgeCode(code);
    }

    if (is_active !== undefined) {
      validatedData.is_active = validateIsActive(is_active);
    }

    // Replace request body with validated data
    req.body = validatedData;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate judge ID parameter
 */
const validateJudgeId = (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Judge ID is required', 400);
    }

    // Validate ID is a positive integer
    const judgeId = parseInt(id, 10);
    if (isNaN(judgeId) || judgeId <= 0) {
      throw new AppError('Invalid judge ID', 400);
    }

    // Replace with validated integer
    req.params.id = judgeId;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCreateJudge,
  validateUpdateJudge,
  validateJudgeId,
  // Export individual validators for reuse
  validateJudgeName,
  validateDisplayName,
  validateJudgeCode,
  validateIsActive
};
