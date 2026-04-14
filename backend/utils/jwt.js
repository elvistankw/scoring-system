// backend/utils/jwt.js
// JWT token generation and validation utilities
// Requirements: 1.1, 1.3

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @param {number} payload.id - User ID
 * @param {string} payload.role - User role (admin, judge)
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate token and set expiration time
 * @param {Object} user - User object
 * @returns {Object} Token and expiration info
 */
const createTokenResponse = (user) => {
  const token = generateToken({
    id: user.id,
    role: user.role
  });

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return {
    token,
    expiresIn,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  };
};

module.exports = {
  generateToken,
  verifyToken,
  createTokenResponse
};
