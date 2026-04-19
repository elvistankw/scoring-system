// backend/routes/judges.routes.js
// Device-based judge identity selection routes (no user authentication required)
// Requirements: Device locking, judge identity management, session tracking

const express = require('express');
const router = express.Router();

// Import controllers
const {
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
} = require('../controllers/judges.controller');

// Import middleware
const { authenticate, requireRole } = require('../middleware/auth');
const { 
  validateCreateJudge, 
  validateUpdateJudge, 
  validateJudgeId 
} = require('../middleware/validate-judge');

// =============================================================================
// PUBLIC JUDGE IDENTITY SELECTION ROUTES (No Authentication Required)
// =============================================================================

/**
 * @route   GET /api/judges/available
 * @desc    Get available judges for device-based identity selection
 * @access  Public (no authentication required)
 */
router.get('/available', getAvailableJudges);

/**
 * @route   POST /api/judges/select-identity
 * @desc    Select judge identity and create device session
 * @access  Public (no authentication required)
 * @body    { judgeId: number, deviceId: string, browserFingerprint?: string }
 */
router.post('/select-identity', selectJudgeIdentity);

/**
 * @route   GET /api/judges/current-session
 * @desc    Get current judge session for device
 * @access  Public (no authentication required)
 * @query   deviceId: string (required)
 */
router.get('/current-session', getCurrentSession);

/**
 * @route   POST /api/judges/end-session
 * @desc    End judge session for device
 * @access  Public (no authentication required)
 * @body    { sessionId: number, deviceId: string }
 */
router.post('/end-session', endJudgeSession);

/**
 * @route   POST /api/judges/extend-session
 * @desc    Extend judge session expiration
 * @access  Public (no authentication required)
 * @body    { sessionId: number, deviceId: string }
 */
router.post('/extend-session', extendJudgeSession);

// =============================================================================
// JUDGE MANAGEMENT ROUTES (Admin Authentication Required)
// =============================================================================

/**
 * @route   GET /api/judges/stats
 * @desc    Get judge statistics (must be before /:id routes)
 * @access  Private (Admin only)
 */
router.get('/stats', 
  authenticate,
  requireRole('admin'),
  getJudgeStats
);

/**
 * @route   GET /api/judges
 * @desc    Get all judges with usage status
 * @access  Private (Admin only)
 */
router.get('/', 
  authenticate,
  requireRole('admin'),
  getAllJudges
);

/**
 * @route   POST /api/judges
 * @desc    Create new judge
 * @access  Private (Admin only)
 * @body    { name: string, display_name: string, code: string }
 */
router.post('/', 
  authenticate,
  requireRole('admin'),
  validateCreateJudge,
  createJudge
);

/**
 * @route   PUT /api/judges/:id
 * @desc    Update judge
 * @access  Private (Admin only)
 * @body    { name?: string, display_name?: string, code?: string, is_active?: boolean }
 */
router.put('/:id', 
  authenticate,
  requireRole('admin'),
  validateJudgeId,
  validateUpdateJudge,
  updateJudge
);

/**
 * @route   DELETE /api/judges/:id
 * @desc    Delete judge (only if no active sessions)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authenticate,
  requireRole('admin'),
  validateJudgeId,
  deleteJudge
);

/**
 * @route   PATCH /api/judges/:id/toggle-active
 * @desc    Toggle judge active status (ends active sessions if deactivating)
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-active', 
  authenticate,
  requireRole('admin'),
  validateJudgeId,
  toggleJudgeActive
);

module.exports = router;