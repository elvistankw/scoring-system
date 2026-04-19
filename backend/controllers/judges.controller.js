// backend/controllers/judges.controller.js
// Device-based judge identity selection controller (no user authentication required)
// Requirements: Device locking, judge identity management, session tracking

const db = require('../db');
const crypto = require('crypto');
const { AppError } = require('../middleware/error-handler');

/**
 * Generate device fingerprint from request
 */
const generateDeviceFingerprint = (req) => {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  const ip = req.ip || req.connection.remoteAddress || '';
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}${acceptLanguage}${acceptEncoding}${ip}`)
    .digest('hex')
    .substring(0, 16);
    
  return fingerprint;
};

/**
 * Get available judges for identity selection
 * GET /api/judges/available
 * Public endpoint - no authentication required
 */
const getAvailableJudges = async (req, res, next) => {
  try {
    console.log('🔍 Getting available judges for device-based selection');

    // Clean up expired sessions first
    await db.query('SELECT cleanup_expired_judge_sessions()');

    // Get all judges with availability status
    const result = await db.query('SELECT * FROM get_available_judges()');

    console.log(`✅ Found ${result.rows.length} judges (${result.rows.filter(j => j.is_available).length} available)`);

    res.status(200).json({
      success: true,
      data: {
        judges: result.rows,
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Get available judges error:', error);
    next(error);
  }
};

/**
 * Select judge identity and create device session
 * POST /api/judges/select-identity
 * Body: { judgeId, deviceId, browserFingerprint? }
 * Public endpoint - no authentication required
 */
const selectJudgeIdentity = async (req, res, next) => {
  try {
    const { judgeId, deviceId, browserFingerprint } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const generatedFingerprint = generateDeviceFingerprint(req);

    console.log('🔍 Selecting judge identity:', { 
      judgeId, 
      deviceId: deviceId?.substring(0, 8) + '...', 
      hasFingerprint: !!browserFingerprint 
    });

    // Validate required fields
    if (!judgeId || !deviceId) {
      return next(new AppError('Judge ID and device ID are required', 400));
    }

    // Validate device ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deviceId)) {
      return next(new AppError('Invalid device ID format', 400));
    }

    // Clean up expired sessions
    await db.query('SELECT cleanup_expired_judge_sessions()');

    // Check if judge is available
    const availabilityResult = await db.query('SELECT is_judge_available($1) as available', [judgeId]);
    if (!availabilityResult.rows[0].available) {
      return next(new AppError('Judge is not available (inactive or already in use)', 400));
    }

    // Get judge details
    const judgeQuery = `
      SELECT id, name, display_name, code, is_active
      FROM judges 
      WHERE id = $1 AND is_active = true
    `;

    const judgeResult = await db.query(judgeQuery, [judgeId]);

    if (judgeResult.rows.length === 0) {
      return next(new AppError('Judge not found or inactive', 404));
    }

    const judge = judgeResult.rows[0];

    // End any existing session for this device
    await db.query(
      'UPDATE judge_sessions SET is_active = false, ended_at = NOW() WHERE device_id = $1 AND is_active = true',
      [deviceId]
    );

    // Create new judge session
    const sessionQuery = `
      INSERT INTO judge_sessions (
        judge_id,
        device_id,
        judge_name,
        judge_code,
        ip_address,
        user_agent,
        browser_fingerprint,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '8 hours')
      RETURNING *
    `;

    const sessionValues = [
      judge.id,
      deviceId,
      judge.display_name,
      judge.code,
      ipAddress,
      userAgent,
      browserFingerprint || generatedFingerprint
    ];

    const sessionResult = await db.query(sessionQuery, sessionValues);
    const session = sessionResult.rows[0];

    console.log(`✅ Judge identity selected: ${judge.display_name} (${judge.code}) on device ${deviceId.substring(0, 8)}...`);

    res.status(200).json({
      success: true,
      message: 'Judge identity selected successfully',
      data: {
        session: {
          id: session.id,
          judgeId: judge.id,
          judgeName: judge.display_name,
          judgeCode: judge.code,
          deviceId: deviceId,
          startedAt: session.started_at,
          expiresAt: session.expires_at
        }
      }
    });

  } catch (error) {
    console.error('❌ Select judge identity error:', error);
    
    // Handle unique constraint violation (race condition)
    if (error.code === '23505' && error.constraint === 'unique_active_judge') {
      return next(new AppError('Judge is already in use by another device', 409));
    }
    
    next(error);
  }
};

/**
 * Get current judge session for device
 * GET /api/judges/current-session?deviceId=xxx
 * Public endpoint - no authentication required
 */
const getCurrentSession = async (req, res, next) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return next(new AppError('Device ID is required', 400));
    }

    console.log('🔍 Getting current judge session for device:', deviceId.substring(0, 8) + '...');

    // Clean up expired sessions first
    await db.query('SELECT cleanup_expired_judge_sessions()');

    const query = `
      SELECT 
        js.id,
        js.judge_id,
        js.judge_name,
        js.judge_code,
        js.device_id,
        js.started_at,
        js.last_activity,
        js.expires_at,
        js.is_active,
        j.name,
        j.display_name
      FROM judge_sessions js
      JOIN judges j ON js.judge_id = j.id
      WHERE js.device_id = $1 
        AND js.is_active = true 
        AND js.expires_at > NOW()
      ORDER BY js.started_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [deviceId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active judge session found for this device'
      });
    }

    const session = result.rows[0];

    // Update last activity
    await db.query(
      'UPDATE judge_sessions SET last_activity = NOW() WHERE id = $1',
      [session.id]
    );

    console.log(`✅ Current session found: ${session.judge_name} (${session.judge_code})`);

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        judgeId: session.judge_id,
        judgeName: session.judge_name,
        judgeCode: session.judge_code,
        deviceId: session.device_id,
        startedAt: session.started_at,
        lastActivity: session.last_activity,
        expiresAt: session.expires_at,
        isActive: session.is_active
      }
    });

  } catch (error) {
    console.error('❌ Get current session error:', error);
    next(error);
  }
};

/**
 * End judge session for device
 * POST /api/judges/end-session
 * Body: { sessionId, deviceId }
 * Public endpoint - no authentication required
 */
const endJudgeSession = async (req, res, next) => {
  try {
    const { sessionId, deviceId } = req.body;

    if (!sessionId || !deviceId) {
      return next(new AppError('Session ID and device ID are required', 400));
    }

    console.log('🔍 Ending judge session:', { sessionId, deviceId: deviceId.substring(0, 8) + '...' });

    const query = `
      UPDATE judge_sessions 
      SET is_active = false, ended_at = NOW()
      WHERE id = $1 AND device_id = $2 AND is_active = true
      RETURNING id, judge_name, judge_code
    `;

    const result = await db.query(query, [sessionId, deviceId]);

    if (result.rows.length === 0) {
      return next(new AppError('No active session found to end', 404));
    }

    const endedSession = result.rows[0];

    console.log(`✅ Session ended: ${endedSession.judge_name} (${endedSession.judge_code})`);

    res.status(200).json({
      success: true,
      message: 'Judge session ended successfully',
      data: {
        sessionId: endedSession.id,
        judgeName: endedSession.judge_name,
        judgeCode: endedSession.judge_code
      }
    });

  } catch (error) {
    console.error('❌ End judge session error:', error);
    next(error);
  }
};

/**
 * Extend judge session
 * POST /api/judges/extend-session
 * Body: { sessionId, deviceId }
 * Public endpoint - no authentication required
 */
const extendJudgeSession = async (req, res, next) => {
  try {
    const { sessionId, deviceId } = req.body;

    if (!sessionId || !deviceId) {
      return next(new AppError('Session ID and device ID are required', 400));
    }

    console.log('🔍 Extending judge session:', { sessionId, deviceId: deviceId.substring(0, 8) + '...' });

    const query = `
      UPDATE judge_sessions 
      SET expires_at = NOW() + INTERVAL '8 hours',
          last_activity = NOW()
      WHERE id = $1 AND device_id = $2 AND is_active = true
      RETURNING id, judge_name, judge_code, expires_at
    `;

    const result = await db.query(query, [sessionId, deviceId]);

    if (result.rows.length === 0) {
      return next(new AppError('No active session found to extend', 404));
    }

    const extendedSession = result.rows[0];

    console.log(`✅ Session extended: ${extendedSession.judge_name} (${extendedSession.judge_code})`);

    res.status(200).json({
      success: true,
      message: 'Judge session extended successfully',
      data: {
        sessionId: extendedSession.id,
        judgeName: extendedSession.judge_name,
        judgeCode: extendedSession.judge_code,
        expiresAt: extendedSession.expires_at
      }
    });

  } catch (error) {
    console.error('❌ Extend judge session error:', error);
    next(error);
  }
};

/**
 * Get all judges (Admin only)
 * GET /api/judges
 * Requires admin authentication
 * Returns judges with accurate session information
 */
const getAllJudges = async (req, res, next) => {
  try {
    console.log('🔍 Getting all judges (admin)');

    // Clean up expired sessions first for accurate data
    await db.query('SELECT cleanup_expired_judge_sessions()');

    const query = `
      SELECT 
        j.id,
        j.name,
        j.display_name,
        j.code,
        j.is_active,
        j.created_at,
        j.updated_at,
        -- Check if judge has an active session right now
        CASE 
          WHEN EXISTS(
            SELECT 1 FROM judge_sessions js 
            WHERE js.judge_id = j.id 
              AND js.is_active = true 
              AND js.expires_at > NOW()
          ) THEN true 
          ELSE false 
        END as is_currently_active,
        -- Get the most recent session start time (active or ended)
        (
          SELECT MAX(started_at) 
          FROM judge_sessions 
          WHERE judge_id = j.id
        ) as last_session_start,
        -- Get current active session details if exists
        active_session.device_id as current_device_id,
        active_session.started_at as current_session_started_at,
        active_session.last_activity as current_session_last_activity,
        active_session.expires_at as current_session_expires_at
      FROM judges j
      LEFT JOIN LATERAL (
        SELECT 
          device_id, 
          started_at, 
          last_activity,
          expires_at
        FROM judge_sessions 
        WHERE judge_id = j.id 
          AND is_active = true 
          AND expires_at > NOW()
        ORDER BY started_at DESC
        LIMIT 1
      ) active_session ON true
      ORDER BY j.code ASC
    `;

    const result = await db.query(query);

    console.log(`✅ Retrieved ${result.rows.length} judges with accurate session data`);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: {
        judges: result.rows,
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Get all judges error:', error);
    next(error);
  }
};

/**
 * Create new judge (Admin only)
 * POST /api/judges
 * Body: { name, display_name, code }
 * Note: Input validation is handled by validateCreateJudge middleware
 * 
 * IMPORTANT: Also creates a corresponding user account for score submission
 */
const createJudge = async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    // Data is already validated and sanitized by middleware
    const { name, display_name, code } = req.body;

    console.log('🔍 Creating new judge:', { name, display_name, code });

    // Check if code already exists in judges table
    const existingJudge = await client.query('SELECT id FROM judges WHERE code = $1', [code]);
    if (existingJudge.rows.length > 0) {
      return next(new AppError('Judge code already exists', 400));
    }

    // Check if username already exists in users table
    const existingUser = await client.query('SELECT id FROM users WHERE username = $1', [code]);
    if (existingUser.rows.length > 0) {
      return next(new AppError('Judge code conflicts with existing username', 400));
    }

    // Begin transaction
    await client.query('BEGIN');

    // 1. Create user account for the judge (required for score submission)
    const bcrypt = require('bcrypt');
    const defaultPassword = await bcrypt.hash(code, 10); // Use judge code as default password

    const userQuery = `
      INSERT INTO users (username, password_hash, email, role, is_judge_account)
      VALUES ($1, $2, $3, 'judge', true)
      RETURNING id
    `;

    const userResult = await client.query(userQuery, [
      code, // username = judge code
      defaultPassword,
      `${code}@judge.local` // dummy email
    ]);

    const userId = userResult.rows[0].id;

    // 2. Create judge record with matching ID
    const judgeQuery = `
      INSERT INTO judges (id, name, display_name, code, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;

    const judgeResult = await client.query(judgeQuery, [
      userId, // Use same ID as user
      name,
      display_name,
      code
    ]);

    const newJudge = judgeResult.rows[0];

    // Commit transaction
    await client.query('COMMIT');

    console.log(`✅ Judge created: ${newJudge.display_name} (${newJudge.code}) with user ID ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Judge created successfully',
      data: newJudge
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Create judge error:', error);
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Update judge (Admin only)
 * PUT /api/judges/:id
 * Note: Input validation is handled by validateUpdateJudge middleware
 */
const updateJudge = async (req, res, next) => {
  try {
    // ID is already validated by middleware
    const { id } = req.params;
    // Data is already validated and sanitized by middleware
    const { name, display_name, code, is_active } = req.body;

    console.log(`🔍 Updating judge ${id}:`, { name, display_name, code, is_active });

    // Check if judge exists
    const existingJudge = await db.query('SELECT id FROM judges WHERE id = $1', [id]);
    if (existingJudge.rows.length === 0) {
      return next(new AppError('Judge not found', 404));
    }

    // Check if code conflicts with another judge
    if (code) {
      const codeConflict = await db.query('SELECT id FROM judges WHERE code = $1 AND id != $2', [code, id]);
      if (codeConflict.rows.length > 0) {
        return next(new AppError('Judge code already exists', 400));
      }
    }

    const query = `
      UPDATE judges 
      SET 
        name = COALESCE($1, name),
        display_name = COALESCE($2, display_name),
        code = COALESCE($3, code),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await db.query(query, [name, display_name, code, is_active, id]);
    const updatedJudge = result.rows[0];

    // If deactivating, end all active sessions for this judge
    if (is_active === false) {
      await db.query(
        'UPDATE judge_sessions SET is_active = false, ended_at = NOW() WHERE judge_id = $1 AND is_active = true',
        [id]
      );
      console.log(`✅ Ended all active sessions for deactivated judge: ${updatedJudge.display_name}`);
    }

    console.log(`✅ Judge updated: ${updatedJudge.display_name} (${updatedJudge.code})`);

    res.status(200).json({
      success: true,
      message: 'Judge updated successfully',
      data: updatedJudge
    });

  } catch (error) {
    console.error('❌ Update judge error:', error);
    next(error);
  }
};

/**
 * Delete judge (Admin only)
 * DELETE /api/judges/:id
 */
const deleteJudge = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Deleting judge ${id}`);

    // Check if judge has active sessions
    const activeSessions = await db.query(
      'SELECT COUNT(*) as count FROM judge_sessions WHERE judge_id = $1 AND is_active = true',
      [id]
    );

    if (parseInt(activeSessions.rows[0].count) > 0) {
      return next(new AppError('Cannot delete judge with active sessions', 400));
    }

    const result = await db.query('DELETE FROM judges WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return next(new AppError('Judge not found', 404));
    }

    const deletedJudge = result.rows[0];
    console.log(`✅ Judge deleted: ${deletedJudge.display_name} (${deletedJudge.code})`);

    res.status(200).json({
      success: true,
      message: 'Judge deleted successfully',
      data: deletedJudge
    });

  } catch (error) {
    console.error('❌ Delete judge error:', error);
    next(error);
  }
};

/**
 * Toggle judge active status (Admin only)
 * POST /api/judges/:id/toggle-active
 */
const toggleJudgeActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Toggling judge active status: ${id}`);

    const query = `
      UPDATE judges 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return next(new AppError('Judge not found', 404));
    }

    const updatedJudge = result.rows[0];

    // If deactivating, end all active sessions for this judge
    if (!updatedJudge.is_active) {
      await db.query(
        'UPDATE judge_sessions SET is_active = false, ended_at = NOW() WHERE judge_id = $1 AND is_active = true',
        [id]
      );
      console.log(`✅ Ended all active sessions for deactivated judge: ${updatedJudge.display_name}`);
    }

    console.log(`✅ Judge ${updatedJudge.is_active ? 'activated' : 'deactivated'}: ${updatedJudge.display_name}`);

    res.status(200).json({
      success: true,
      message: `Judge ${updatedJudge.is_active ? 'activated' : 'deactivated'} successfully`,
      data: updatedJudge
    });

  } catch (error) {
    console.error('❌ Toggle judge active error:', error);
    next(error);
  }
};

/**
 * Get judge statistics (Admin only)
 * GET /api/judges/stats
 */
const getJudgeStats = async (req, res, next) => {
  try {
    console.log('🔍 Getting judge statistics');

    // Clean up expired sessions first
    await db.query('SELECT cleanup_expired_judge_sessions()');

    const statsQuery = `
      SELECT 
        COUNT(*) as total_judges,
        COUNT(*) FILTER (WHERE is_active = true) as active_judges,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_judges,
        COUNT(*) FILTER (WHERE is_active = true AND EXISTS(
          SELECT 1 FROM judge_sessions js 
          WHERE js.judge_id = judges.id 
            AND js.is_active = true 
            AND js.expires_at > NOW()
        )) as judges_in_use
      FROM judges
    `;

    const sessionStatsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_active = true AND expires_at > NOW()) as active_sessions,
        COUNT(*) FILTER (WHERE ended_at IS NOT NULL) as ended_sessions,
        COUNT(*) FILTER (WHERE is_active = false AND ended_at IS NULL AND expires_at <= NOW()) as expired_sessions
      FROM judge_sessions
    `;

    const [statsResult, sessionStatsResult] = await Promise.all([
      db.query(statsQuery),
      db.query(sessionStatsQuery)
    ]);

    const stats = statsResult.rows[0];
    const sessionStats = sessionStatsResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        judges: {
          total: parseInt(stats.total_judges),
          active: parseInt(stats.active_judges),
          inactive: parseInt(stats.inactive_judges),
          in_use: parseInt(stats.judges_in_use)
        },
        sessions: {
          total: parseInt(sessionStats.total_sessions),
          active: parseInt(sessionStats.active_sessions),
          ended: parseInt(sessionStats.ended_sessions),
          expired: parseInt(sessionStats.expired_sessions)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get judge stats error:', error);
    next(error);
  }
};

module.exports = {
  // Public judge identity selection endpoints (no auth required)
  getAvailableJudges,
  selectJudgeIdentity,
  getCurrentSession,
  endJudgeSession,
  extendJudgeSession,
  
  // Judge management endpoints (Admin auth required)
  getAllJudges,
  createJudge,
  updateJudge,
  deleteJudge,
  toggleJudgeActive,
  getJudgeStats
};