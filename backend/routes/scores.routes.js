// backend/routes/scores.routes.js
// Score submission and retrieval routes
// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { authenticateJudgeSession } = require('../middleware/judge-session');
const { dualAuth } = require('../middleware/dual-auth');
const { scoreLimiter } = require('../middleware/rate-limit');
const {
  submitScore,
  getScores,
  getScoresByCompetition,
  getLatestScore,
  getRankings,
  batchSubmitScores,
  partialScoreUpdate,
  updateScore,
  deleteScore
} = require('../controllers/scores.controller');

/**
 * @route   POST /api/scores/submit
 * @desc    Submit score for an athlete in a competition
 * @access  Private (Judge session required)
 * @rateLimit 30 requests per 15 minutes per judge
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1
 */
router.post('/submit', authenticateJudgeSession, scoreLimiter, submitScore);

/**
 * @route   POST /api/scores/batch-submit
 * @desc    Batch submit scores for multiple athletes in a competition
 * @access  Private (Judge session required)
 * @rateLimit 30 requests per 15 minutes per judge
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1
 */
router.post('/batch-submit', authenticateJudgeSession, scoreLimiter, batchSubmitScores);

/**
 * @route   POST /api/scores/partial-update
 * @desc    Update individual score field for partial scoring
 * @access  Private (Judge session required)
 * @rateLimit 30 requests per 15 minutes per judge
 * 
 * Requirements: Support partial scoring and individual field updates
 */
router.post('/partial-update', authenticateJudgeSession, scoreLimiter, partialScoreUpdate);

/**
 * @route   GET /api/scores
 * @desc    Get scores with flexible filtering
 * @access  Private (Admin JWT or Judge session)
 * @query   competition_id - Filter by competition (optional)
 * @query   athlete_id - Filter by athlete (optional)
 * @query   judge_id - Filter by judge (optional)
 * 
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2
 */
router.get('/', dualAuth, getScores);

/**
 * @route   GET /api/scores/competition/:competitionId
 * @desc    Get all scores for a competition
 * @access  Private (Admin JWT or Judge session)
 * @query   athlete_id - Filter by athlete (optional)
 * @query   judge_id - Filter by judge (optional)
 * 
 * Requirements: 6.1, 6.2
 */
router.get('/competition/:competitionId', dualAuth, getScoresByCompetition);

/**
 * @route   GET /api/scores/latest/:competitionId
 * @desc    Get latest score for a competition (from cache or database)
 * @access  Public (for display screens)
 * 
 * Requirements: 6.2
 */
router.get('/latest/:competitionId', getLatestScore);

/**
 * @route   GET /api/scores/rankings/:competitionId
 * @desc    Get rankings for a competition with average scores
 * @access  Public (for display screens)
 * 
 * Requirements: 8.3, 9.1, 9.2, 9.3, 9.4, 9.5
 */
router.get('/rankings/:competitionId', getRankings);

/**
 * @route   PUT /api/scores/:id
 * @desc    Update a score (Admin only)
 * @access  Private (Admin only)
 * 
 * Requirements: Admin score management
 */
router.put('/:id', authenticate, requireRole('admin'), updateScore);

/**
 * @route   DELETE /api/scores/:id
 * @desc    Delete a score (Admin only)
 * @access  Private (Admin only)
 * 
 * Requirements: Admin score management
 */
router.delete('/:id', authenticate, requireRole('admin'), deleteScore);

module.exports = router;
