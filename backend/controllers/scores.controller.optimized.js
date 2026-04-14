// backend/controllers/scores.controller.optimized.js
// Optimized score retrieval queries
// Requirements: 6.1, 6.2, 10.4, 10.5

const db = require('../db');
const { redis } = require('../redis');
const { executeWithLogging, logQueryStats } = require('../utils/query-logger');

/**
 * Get latest score for each athlete in a competition using DISTINCT ON
 * This is more efficient than subqueries for getting the most recent score per athlete
 * GET /api/scores/latest-by-athlete/:competitionId
 * Requirements: 6.1, 6.2, 10.5
 */
const getLatestScoresByAthlete = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const { competitionId } = req.params;

    // Try cache first
    const cacheKey = `latest_scores_by_athlete:${competitionId}`;
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          source: 'cache',
          data: JSON.parse(cachedData)
        });
      }
    } catch (redisError) {
      console.warn('⚠️  Redis read failed:', redisError.message);
    }

    // Optimized query using DISTINCT ON (PostgreSQL-specific)
    // This is much faster than using subqueries or window functions
    const query = `
      SELECT DISTINCT ON (s.athlete_id)
        s.id,
        s.competition_id,
        s.athlete_id,
        s.judge_id,
        s.action_difficulty,
        s.stage_artistry,
        s.action_creativity,
        s.action_fluency,
        s.costume_styling,
        s.action_interaction,
        s.submitted_at,
        a.name as athlete_name,
        a.athlete_number,
        u.username as judge_name,
        c.competition_type,
        c.name as competition_name
      FROM scores s
      INNER JOIN athletes a ON s.athlete_id = a.id
      INNER JOIN users u ON s.judge_id = u.id
      INNER JOIN competitions c ON s.competition_id = c.id
      WHERE s.competition_id = $1
      ORDER BY s.athlete_id, s.submitted_at DESC
    `;

    const result = await executeWithLogging(
      db.query.bind(db),
      'getLatestScoresByAthlete',
      query,
      [competitionId]
    );
    
    const duration = Date.now() - startTime;
    logQueryStats('getLatestScoresByAthlete', result.rows.length, duration);

    // Cache the result (1 hour TTL)
    try {
      await redis.set(cacheKey, JSON.stringify(result.rows), 'EX', 3600);
    } catch (redisError) {
      console.warn('⚠️  Redis cache write failed:', redisError.message);
    }

    res.status(200).json({
      success: true,
      source: 'database',
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error('❌ Get latest scores by athlete error:', err);
    next(err);
  }
};

/**
 * Get optimized rankings with aggregations
 * Uses efficient GROUP BY with proper index usage
 * GET /api/display/rankings-optimized/:competitionId
 * Requirements: 6.1, 6.2, 8.3, 9.1, 9.2, 10.5
 */
const getRankingsOptimized = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const { competitionId } = req.params;

    // Try cache first
    const cacheKey = `rankings_optimized:${competitionId}`;
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          source: 'cache',
          data: JSON.parse(cachedData)
        });
      }
    } catch (redisError) {
      console.warn('⚠️  Redis read failed:', redisError.message);
    }

    // Optimized query with efficient aggregations
    // Uses composite index on (competition_id, athlete_id) for better performance
    const query = `
      SELECT 
        a.id as athlete_id,
        a.name as athlete_name,
        a.athlete_number,
        c.competition_type,
        c.name as competition_name,
        COUNT(DISTINCT s.judge_id) as judge_count,
        ROUND(AVG(s.action_difficulty)::numeric, 2) as avg_action_difficulty,
        ROUND(AVG(s.stage_artistry)::numeric, 2) as avg_stage_artistry,
        ROUND(AVG(s.action_creativity)::numeric, 2) as avg_action_creativity,
        ROUND(AVG(s.action_fluency)::numeric, 2) as avg_action_fluency,
        ROUND(AVG(s.costume_styling)::numeric, 2) as avg_costume_styling,
        ROUND(AVG(s.action_interaction)::numeric, 2) as avg_action_interaction,
        ROUND(
          COALESCE(AVG(s.action_difficulty), 0) + 
          COALESCE(AVG(s.stage_artistry), 0) + 
          COALESCE(AVG(s.action_creativity), 0) + 
          COALESCE(AVG(s.action_fluency), 0) + 
          COALESCE(AVG(s.costume_styling), 0) + 
          COALESCE(AVG(s.action_interaction), 0)
        , 2) as total_average
      FROM athletes a
      INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
      INNER JOIN competitions c ON ca.competition_id = c.id
      LEFT JOIN scores s ON s.athlete_id = a.id AND s.competition_id = c.id
      WHERE c.id = $1
      GROUP BY a.id, a.name, a.athlete_number, c.competition_type, c.name
      ORDER BY total_average DESC
    `;

    const result = await executeWithLogging(
      db.query.bind(db),
      'getRankingsOptimized',
      query,
      [competitionId]
    );
    
    const duration = Date.now() - startTime;
    logQueryStats('getRankingsOptimized', result.rows.length, duration);

    // Format the rankings data
    const rankings = result.rows.map((row, index) => ({
      rank: index + 1,
      athlete_id: row.athlete_id,
      athlete_name: row.athlete_name,
      athlete_number: row.athlete_number,
      judge_count: parseInt(row.judge_count),
      average_scores: {
        action_difficulty: row.avg_action_difficulty,
        stage_artistry: row.avg_stage_artistry,
        action_creativity: row.avg_action_creativity,
        action_fluency: row.avg_action_fluency,
        costume_styling: row.avg_costume_styling,
        action_interaction: row.avg_action_interaction
      },
      total_average: parseFloat(row.total_average),
      competition_type: row.competition_type,
      competition_name: row.competition_name
    }));

    // Cache the result (2 hour TTL)
    try {
      await redis.set(cacheKey, JSON.stringify(rankings), 'EX', 7200);
    } catch (redisError) {
      console.warn('⚠️  Redis cache write failed:', redisError.message);
    }

    res.status(200).json({
      success: true,
      source: 'database',
      count: rankings.length,
      data: rankings,
      query_time_ms: duration
    });

  } catch (err) {
    console.error('❌ Get rankings optimized error:', err);
    next(err);
  }
};

/**
 * Get query performance statistics
 * GET /api/scores/performance-stats
 * Requirements: 10.5
 */
const getPerformanceStats = async (req, res, next) => {
  try {
    // Query to get slow query statistics from PostgreSQL
    const query = `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        min_time
      FROM pg_stat_statements
      WHERE query LIKE '%scores%'
      ORDER BY mean_time DESC
      LIMIT 10
    `;

    try {
      const result = await db.query(query);
      
      res.status(200).json({
        success: true,
        data: result.rows,
        note: 'Requires pg_stat_statements extension to be enabled'
      });
    } catch (err) {
      // pg_stat_statements might not be enabled
      res.status(200).json({
        success: false,
        message: 'pg_stat_statements extension not enabled',
        note: 'Enable with: CREATE EXTENSION pg_stat_statements;'
      });
    }

  } catch (err) {
    console.error('❌ Get performance stats error:', err);
    next(err);
  }
};

module.exports = {
  getLatestScoresByAthlete,
  getRankingsOptimized,
  getPerformanceStats
};
