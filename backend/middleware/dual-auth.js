// backend/middleware/dual-auth.js
// Dual authentication middleware that supports both JWT (admin) and judge sessions

const { authenticate } = require('./auth');
const { authenticateJudgeSession } = require('./judge-session');
const { AppError } = require('./error-handler');

/**
 * Dual authentication middleware
 * Supports both JWT authentication (for admin) and judge session authentication
 * Tries JWT first, then judge session if JWT fails
 */
const dualAuth = async (req, res, next) => {
  // Try JWT authentication first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      await authenticate(req, res, () => {
        // JWT authentication succeeded
        next();
      });
      return;
    } catch (error) {
      // JWT authentication failed, try judge session
      console.log('JWT auth failed, trying judge session:', error.message);
    }
  }

  // Try judge session authentication
  const sessionId = req.headers['x-judge-session-id'];
  const deviceId = req.headers['x-device-id'];
  
  if (sessionId && deviceId) {
    try {
      await authenticateJudgeSession(req, res, () => {
        // Judge session authentication succeeded
        next();
      });
      return;
    } catch (error) {
      console.log('Judge session auth failed:', error.message);
    }
  }

  // Both authentication methods failed
  return next(new AppError('Authentication required. Please login or select judge identity.', 401));
};

module.exports = {
  dualAuth
};