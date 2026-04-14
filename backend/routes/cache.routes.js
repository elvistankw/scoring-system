// backend/routes/cache.routes.js
// Cache monitoring and management routes
// Requirements: 6.2, 10.5

const express = require('express');
const router = express.Router();
const { redisHelpers } = require('../redis');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/cache/stats
 * Get cache hit/miss statistics
 * Requirements: 6.2, 10.5
 */
router.get('/stats', authenticate, requireRole('admin'), (req, res) => {
  try {
    const stats = redisHelpers.getCacheStats();
    
    res.status(200).json({
      success: true,
      data: {
        hits: stats.hits,
        misses: stats.misses,
        errors: stats.errors,
        total: stats.total,
        hitRate: `${stats.hitRate}%`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      error: err.message
    });
  }
});

/**
 * POST /api/cache/reset-stats
 * Reset cache statistics
 * Requirements: 6.2, 10.5
 */
router.post('/reset-stats', authenticate, requireRole('admin'), (req, res) => {
  try {
    redisHelpers.resetCacheStats();
    
    res.status(200).json({
      success: true,
      message: 'Cache statistics reset successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset cache statistics',
      error: err.message
    });
  }
});

/**
 * DELETE /api/cache/invalidate/:competitionId
 * Manually invalidate all caches for a competition
 * Requirements: 6.2, 10.5
 */
router.delete('/invalidate/:competitionId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    if (!competitionId || isNaN(competitionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid competition ID'
      });
    }
    
    await redisHelpers.invalidateCompetitionCaches(competitionId);
    
    res.status(200).json({
      success: true,
      message: `All caches invalidated for competition ${competitionId}`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate caches',
      error: err.message
    });
  }
});

module.exports = router;
