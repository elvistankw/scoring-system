// backend/middleware/judge-session.js
// Judge session authentication middleware for device-based judge system
// Requirements: Device-based judge authentication, session validation

const db = require('../db');
const { AppError } = require('./error-handler');

/**
 * Judge session authentication middleware
 * Validates judge session and attaches judge info to request
 * Used instead of JWT authentication for judge endpoints
 */
const authenticateJudgeSession = async (req, res, next) => {
  try {
    // 1. Get session info from headers
    const sessionId = req.headers['x-judge-session-id'];
    const deviceId = req.headers['x-device-id'];
    
    if (!sessionId || !deviceId) {
      return next(new AppError('Judge session ID and device ID are required', 401));
    }

    // 2. Verify session exists and is active
    const sessionResult = await db.query(`
      SELECT 
        js.id as session_id,
        js.judge_id,
        js.device_id,
        js.expires_at,
        js.is_active,
        j.id,
        j.name as judge_name,
        j.display_name,
        j.code as judge_code,
        j.is_active as judge_is_active
      FROM judge_sessions js
      JOIN judges j ON js.judge_id = j.id
      WHERE js.id = $1 AND js.device_id = $2 AND js.is_active = true
    `, [sessionId, deviceId]);

    if (sessionResult.rows.length === 0) {
      return next(new AppError('Invalid or expired judge session', 401));
    }

    const session = sessionResult.rows[0];

    // 3. Check if session has expired
    if (new Date() > new Date(session.expires_at)) {
      // Mark session as inactive
      await db.query(
        'UPDATE judge_sessions SET is_active = false WHERE id = $1',
        [sessionId]
      );
      return next(new AppError('Judge session has expired', 401));
    }

    // 4. Check if judge is still active
    if (!session.judge_is_active) {
      return next(new AppError('Judge account has been deactivated', 401));
    }

    // 5. Extend session expiration (optional - extend by 1 hour on each request)
    const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    await db.query(
      'UPDATE judge_sessions SET expires_at = $1 WHERE id = $2',
      [newExpiresAt, sessionId]
    );

    // 6. Attach judge info to request object (similar to JWT auth)
    req.judge = {
      id: session.judge_id,
      name: session.judge_name,
      display_name: session.display_name,
      code: session.judge_code,
      session_id: session.session_id,
      device_id: session.device_id
    };

    // For compatibility with existing code that expects req.user
    req.user = {
      id: session.judge_id,
      role: 'judge',
      name: session.judge_name
    };

    next();
  } catch (error) {
    console.error('Judge session authentication error:', error.message);
    return next(new AppError('Judge session authentication failed', 401));
  }
};

/**
 * Optional judge session authentication middleware
 * Attaches judge info if session is present, but doesn't require it
 * Useful for endpoints that behave differently for authenticated judges
 */
const optionalJudgeAuth = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-judge-session-id'];
    const deviceId = req.headers['x-device-id'];
    
    if (sessionId && deviceId) {
      const sessionResult = await db.query(`
        SELECT 
          js.id as session_id,
          js.judge_id,
          js.device_id,
          js.expires_at,
          js.is_active,
          j.id,
          j.name as judge_name,
          j.display_name,
          j.code as judge_code,
          j.is_active as judge_is_active
        FROM judge_sessions js
        JOIN judges j ON js.judge_id = j.id
        WHERE js.id = $1 AND js.device_id = $2 AND js.is_active = true
      `, [sessionId, deviceId]);

      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        
        // Check if session is still valid
        if (new Date() <= new Date(session.expires_at) && session.judge_is_active) {
          req.judge = {
            id: session.judge_id,
            name: session.judge_name,
            display_name: session.display_name,
            code: session.judge_code,
            session_id: session.session_id,
            device_id: session.device_id
          };

          req.user = {
            id: session.judge_id,
            role: 'judge',
            name: session.judge_name
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Optional authentication failure doesn't block the request
    console.warn('Optional judge authentication failed:', error.message);
    next();
  }
};

module.exports = {
  authenticateJudgeSession,
  optionalJudgeAuth
};