// backend/controllers/auth.controller.js
// Authentication controller with registration, login, and user management
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

const bcrypt = require('bcrypt');
const db = require('../db');
const { jwtUtils } = require('../middleware/auth');
const { AppError } = require('../middleware/error-handler');

const SALT_ROUNDS = 10;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: At least 8 characters, contains letter and number
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      message: 'Password must contain both letters and numbers'
    };
  }

  return { valid: true };
};

/**
 * Register new user
 * POST /api/auth/register
 * Requirements: 1.1, 1.2
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // 1. Validate required fields
    if (!username || !email || !password || !role) {
      return next(new AppError('Please provide username, email, password, and role', 400));
    }

    // 2. Validate email format
    if (!isValidEmail(email)) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    // 3. Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return next(new AppError(passwordValidation.message, 400));
    }

    // 4. Validate role - only admin can register through auth system
    if (role !== 'admin') {
      return next(new AppError('Only admin role can register through authentication system', 400));
    }

    // 5. Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return next(new AppError('User with this email or username already exists', 409));
    }

    // 6. Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 7. Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash, role]
    );

    const newUser = result.rows[0];

    // 8. Generate JWT tokens
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    };

    const accessToken = jwtUtils.generateAccessToken(tokenPayload);
    const refreshToken = jwtUtils.generateRefreshToken(tokenPayload);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at
        },
        token: accessToken,
        refreshToken: refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Requirements: 1.1, 1.2, 1.3
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 2. Check if user exists and is admin
    const result = await db.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1 AND role = $2',
      [email, 'admin']
    );

    if (result.rows.length === 0) {
      return next(new AppError('Invalid email or password, or account not authorized', 401));
    }

    const user = result.rows[0];

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // 4. Update last login timestamp
    await db.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // 5. Generate JWT tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwtUtils.generateAccessToken(tokenPayload);
    const refreshToken = jwtUtils.generateRefreshToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token: accessToken,
        refreshToken: refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 * Requirements: 1.3, 1.4
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // User is already attached to req by authenticate middleware
    if (!req.user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 * Requirements: 1.3
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Verify refresh token
    const decoded = await jwtUtils.verifyToken(refreshToken, 'refresh');

    // Get latest user information
    const result = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('User not found', 401));
    }

    const user = result.rows[0];

    // Generate new access token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const newAccessToken = jwtUtils.generateAccessToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    if (error.message.includes('expired')) {
      return next(new AppError('Refresh token has expired. Please login again.', 401));
    }
    next(error);
  }
};

/**
 * Verify token
 * GET /api/auth/verify
 * Requirements: 1.3
 */
const verifyToken = async (req, res, next) => {
  try {
    // Token is already verified by authenticate middleware
    res.status(200).json({
      status: 'success',
      message: 'Token is valid',
      data: {
        user: req.user,
        tokenPayload: req.tokenPayload
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshToken,
  verifyToken
};
