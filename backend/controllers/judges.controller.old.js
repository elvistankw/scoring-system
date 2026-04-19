// backend/controllers/judges.controller.js
// Judge management and identity selection controller
// Requirements: Judge identity selection system with session management

const db = require('../db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError } = require('../middleware/error-handler');

/**
 * Get available judges for identity selection
 * GET /api/judges/available
 * Public endpoint for judge identity selection
 */
const getAvailableJudges = async (req, res, next) => {
  try {
    console.log('🔍 Getting available judges for identity selection');

    const query = `
      SELECT 
        id,
        name,
        display_name,
        code,
        is_active
      FROM judges 
      WHERE is_active = true
      ORDER BY code ASC
    `;

    const result = await db.query(query);

    console.log(`✅ Found ${result.rows.length} available judges`);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Get available judges error:', error);
    next(error);
  }
};

/**
 * Select judge identity and create session
 * POST /api/judges/select-identity
 * Body: { judgeId, judgeCode }
 */
const selectJudgeIdentity = async (req, res, next) => {
  try {
    const { judgeId, judgeCode } = req.body;
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    console.log('🔍 Selecting judge identity:', { judgeId, judgeCode, userId });

    // Validate required fields
    if (!judgeId || !judgeCode) {
      return next(new AppError('Judge ID and code are required', 400));
    }

    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }

    // Verify judge exists and is active
    const judgeQuery = `
      SELECT id, name, display_name, code, is_active
      FROM judges 
      WHERE id = $1 AND code = $2 AND is_active = true
    `;

    const judgeResult = await db.query(judgeQuery, [judgeId, judgeCode]);

    if (judgeResult.rows.length === 0) {
      return next(new AppError('Invalid judge selection or judge not active', 400));
    }

    const judge = judgeResult.rows[0];

    // End any existing active sessions for this user
    await db.query(
      'UPDATE judge_sessions SET is_active = false, ended_at = NOW() WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Create new judge session
    const sessionQuery = `
      INSERT INTO judge_sessions (
        user_id,
        judge_id,
        session_token,
        judge_name,
        judge_code,
        ip_address,
        user_agent,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '8 hours')
      RETURNING *
    `;

    const sessionValues = [
      userId,
      judge.id,
      sessionToken,
      judge.display_name,
      judge.code,
      ipAddress,
      userAgent
    ];

    const sessionResult = await db.query(sessionQuery, sessionValues);
    const session = sessionResult.rows[0];

    // Generate JWT token with judge session info
    const tokenPayload = {
      userId: userId,
      judgeId: judge.id,
      judgeName: judge.display_name,
      judgeCode: judge.code,
      sessionId: session.id,
      sessionToken: sessionToken,
      role: 'judge'
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });

    console.log(`✅ Judge identity selected: ${judge.display_name} (${judge.code})`);

    res.status(200).json({
      success: true,
      message: 'Judge identity selected successfully',
      data: {
        session: {
          id: session.id,
          token: sessionToken,
          judgeId: judge.id,
          judgeName: judge.display_name,
          judgeCode: judge.code,
          expiresAt: session.expires_at
        },
        jwt: token
      }
    });

  } catch (error) {
    console.error('❌ Select judge identity error:', error);
    next(error);
  }
};

/**
 * Get current judge session information
 * GET /api/judges/current-session
 * Requires authentication
 */
const getCurrentSession = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }

    console.log('🔍 Getting current judge session for user:', userId);

    const query = `
      SELECT 
        js.id,
        js.session_token,
        js.judge_name,
        js.judge_code,
        js.started_at,
        js.expires_at,
        js.is_active,
        j.id as judge_id,
        j.name,
        j.display_name
      FROM judge_sessions js
      JOIN judges j ON js.judge_id = j.id
      WHERE js.user_id = $1 
        AND js.is_active = true 
        AND js.expires_at > NOW()
      ORDER BY js.started_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active judge session found'
      });
    }

    const session = result.rows[0];

    console.log(`✅ Current session found: ${session.judge_name} (${session.judge_code})`);

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        sessionToken: session.session_token,
        judgeId: session.judge_id,
        judgeName: session.judge_name,
        judgeCode: session.judge_code,
        startedAt: session.started_at,
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
 * End current judge session
 * POST /api/judges/end-session
 * Requires authentication
 */
const endJudgeSession = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }

    console.log('🔍 Ending judge session for user:', userId);

    const query = `
      UPDATE judge_sessions 
      SET is_active = false, ended_at = NOW()
      WHERE user_id = $1 AND is_active = true
      RETURNING id, judge_name, judge_code
    `;

    const result = await db.query(query, [userId]);

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
 * Switch judge identity (end current session and create new one)
 * POST /api/judges/switch-identity
 * Body: { judgeId, judgeCode }
 */
const switchJudgeIdentity = async (req, res, next) => {
  try {
    const { judgeId, judgeCode } = req.body;
    const userId = req.user?.id;

    console.log('🔍 Switching judge identity:', { judgeId, judgeCode, userId });

    if (!userId) {
      return next(new AppError('User authentication required', 401));
    }

    // End current session first
    await db.query(
      'UPDATE judge_sessions SET is_active = false, ended_at = NOW() WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    // Create new session using the same logic as selectJudgeIdentity
    req.body = { judgeId, judgeCode };
    return selectJudgeIdentity(req, res, next);

  } catch (error) {
    console.error('❌ Switch judge identity error:', error);
    next(error);
  }
};

/**
 * Get all judges (Admin only)
 * GET /api/judges
 */
const getAllJudges = async (req, res, next) => {
  try {
    console.log('🔍 Getting all judges (admin)');

    const query = `
      SELECT 
        id,
        name,
        display_name,
        code,
        is_active,
        created_at,
        updated_at
      FROM judges 
      ORDER BY code ASC
    `;

    const result = await db.query(query);

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
 */
const createJudge = async (req, res, next) => {
  try {
    const { name, display_name, code } = req.body;

    console.log('🔍 Creating new judge:', { name, display_name, code });

    // Validate required fields
    if (!name || !display_name || !code) {
      return next(new AppError('Name, display name, and code are required', 400));
    }

    // Check if code already exists
    const existingJudge = await db.query('SELECT id FROM judges WHERE code = $1', [code]);
    if (existingJudge.rows.length > 0) {
      return next(new AppError('Judge code already exists', 400));
    }

    const query = `
      INSERT INTO judges (name, display_name, code, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `;

    const result = await db.query(query, [name, display_name, code]);
    const newJudge = result.rows[0];

    console.log(`✅ Judge created: ${newJudge.display_name} (${newJudge.code})`);

    res.status(201).json({
      success: true,
      message: 'Judge created successfully',
      data: newJudge
    });

  } catch (error) {
    console.error('❌ Create judge error:', error);
    next(error);
  }
};

/**
 * Update judge (Admin only)
 * PUT /api/judges/:id
 */
const updateJudge = async (req, res, next) => {
  try {
    const { id } = req.params;
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

    const statsQuery = `
      SELECT 
        COUNT(*) as total_judges,
        COUNT(*) FILTER (WHERE is_active = true) as active_judges,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_judges
      FROM judges
    `;

    const sessionStatsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
        COUNT(*) FILTER (WHERE ended_at IS NOT NULL) as ended_sessions
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
          inactive: parseInt(stats.inactive_judges)
        },
        sessions: {
          total: parseInt(sessionStats.total_sessions),
          active: parseInt(sessionStats.active_sessions),
          ended: parseInt(sessionStats.ended_sessions)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get judge stats error:', error);
    next(error);
  }
};

module.exports = {
  // Judge identity selection endpoints
  getAvailableJudges,
  selectJudgeIdentity,
  getCurrentSession,
  endJudgeSession,
  switchJudgeIdentity,
  
  // Judge management endpoints (Admin)
  getAllJudges,
  createJudge,
  updateJudge,
  deleteJudge,
  toggleJudgeActive,
  getJudgeStats
};