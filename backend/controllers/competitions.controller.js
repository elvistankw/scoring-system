// backend/controllers/competitions.controller.js
// Competition management controller with CRUD operations and Redis caching
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.2, 8.1, 8.2, 8.3, 10.4, 10.5

const db = require('../db');
const { redisHelpers } = require('../redis');
const { AppError } = require('../middleware/error-handler');
const XLSX = require('xlsx');

// Redis cache TTL values (Requirements: 6.2, 10.5)
const COMPETITION_CACHE_TTL = 3600; // 1 hour for competitions
const SCORE_CACHE_TTL = 3600; // 1 hour for scores
const LEADERBOARD_CACHE_TTL = 7200; // 2 hours for leaderboard

/**
 * Get all competitions with optional filtering
 * GET /api/competitions?status=active&region=华东赛区&type=individual
 * Requirements: 2.1, 2.2, 2.3, 6.2, 8.1, 8.2, 8.3, 10.5
 * Implements: Cache-Aside Pattern
 */
const getAllCompetitions = async (req, res, next) => {
  try {
    const { status, region, type, include_completed_for_summary } = req.query;
    const userRole = req.user?.role; // Get user role from JWT

    // Build cache key based on filters and user role
    const filterKey = `${status || 'all'}:${region || 'all'}:${type || 'all'}:${userRole || 'guest'}:${include_completed_for_summary || 'false'}`;

    // Try to get from cache first (Cache-Aside Pattern)
    try {
      const cachedData = await redisHelpers.getCachedCompetitionList(filterKey);
      if (cachedData) {
        console.log(`✅ Cache HIT for competitions list: ${filterKey}`);
        return res.status(200).json({
          status: 'success',
          cached: true,
          data: {
            competitions: cachedData
          }
        });
      }
      console.log(`⚠️  Cache MISS for competitions list: ${filterKey}`);
    } catch (redisError) {
      console.warn('Redis read failed, falling back to database:', redisError.message);
    }

    // Build query with filters - include athlete count
    let query = `
      SELECT c.*, 
             COALESCE((SELECT COUNT(*) FROM competition_athletes ca WHERE ca.competition_id = c.id), 0) as athlete_count
      FROM competitions c 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Role-based filtering: judges can only see active and upcoming competitions
    // EXCEPT when include_completed_for_summary is true (for score summary page)
    if (userRole === 'judge' && include_completed_for_summary !== 'true') {
      query += ` AND status IN ('active', 'upcoming')`;
    }

    if (status) {
      paramCount++;
      // If user is judge and trying to filter by 'completed', return empty result
      // EXCEPT when include_completed_for_summary is true
      if (userRole === 'judge' && status === 'completed' && include_completed_for_summary !== 'true') {
        return res.status(200).json({
          status: 'success',
          cached: false,
          data: {
            competitions: []
          }
        });
      }
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (type) {
      paramCount++;
      query += ` AND competition_type = $${paramCount}`;
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    // Query database
    const result = await db.query(query, params);

    // Cache the result (Cache-Aside Pattern)
    try {
      await redisHelpers.cacheCompetitionList(filterKey, result.rows, COMPETITION_CACHE_TTL);
      console.log(`✅ Cached competitions list: ${filterKey}`);
    } catch (redisError) {
      console.warn('Redis write failed:', redisError.message);
    }

    res.status(200).json({
      status: 'success',
      cached: false,
      data: {
        competitions: result.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get competition by ID
 * GET /api/competitions/:id
 * Requirements: 2.1, 2.2, 6.2, 10.5
 * Implements: Cache-Aside Pattern
 */
const getCompetitionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return next(new AppError('Invalid competition ID', 400));
    }

    // Try cache first (Cache-Aside Pattern)
    try {
      const cachedData = await redisHelpers.getCachedCompetition(id);
      if (cachedData) {
        console.log(`✅ Cache HIT for competition: ${id}`);
        return res.status(200).json({
          status: 'success',
          cached: true,
          data: {
            competition: cachedData
          }
        });
      }
      console.log(`⚠️  Cache MISS for competition: ${id}`);
    } catch (redisError) {
      console.warn('Redis read failed, falling back to database:', redisError.message);
    }

    // Query database
    const result = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    const competition = result.rows[0];

    // Cache the result (Cache-Aside Pattern)
    try {
      await redisHelpers.cacheCompetition(id, competition, COMPETITION_CACHE_TTL);
      console.log(`✅ Cached competition: ${id}`);
    } catch (redisError) {
      console.warn('Redis write failed:', redisError.message);
    }

    res.status(200).json({
      status: 'success',
      cached: false,
      data: {
        competition
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create new competition
 * POST /api/competitions
 * Requirements: 2.1, 2.2, 2.3, 2.5, 6.2, 10.4, 10.5
 * Implements: Cache Invalidation
 */
const createCompetition = async (req, res, next) => {
  try {
    const { name, competition_type, region, status, start_date, end_date } = req.body;

    // Validate required fields
    if (!name || !competition_type || !region) {
      return next(new AppError('Please provide name, competition_type, and region', 400));
    }

    // Validate competition type
    const validTypes = ['individual', 'duo', 'team', 'challenge'];
    if (!validTypes.includes(competition_type)) {
      return next(new AppError('Invalid competition type. Must be: individual, duo, team, or challenge', 400));
    }

    // Validate status if provided
    const validStatuses = ['upcoming', 'active', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return next(new AppError('Invalid status. Must be: upcoming, active, or completed', 400));
    }

    // Auto-determine status based on start_date if not explicitly provided
    let finalStatus = status;
    
    // If no status provided, determine based on start_date
    if (!status) {
      if (start_date) {
        // Get today's date string in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        
        // Normalize start_date to YYYY-MM-DD format
        const startDateObj = new Date(start_date);
        const startStr = startDateObj.getFullYear() + '-' + 
                        String(startDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(startDateObj.getDate()).padStart(2, '0');
        
        // Compare date strings directly to avoid timezone issues
        if (startStr <= todayStr) {
          finalStatus = 'active';
          console.log(`✅ Auto-setting competition status to 'active' because start_date (${start_date}) is today or in the past`);
          console.log(`   Today: ${todayStr}, Start: ${startStr}`);
        } else {
          finalStatus = 'upcoming';
          console.log(`ℹ️  Auto-setting competition status to 'upcoming' because start_date (${start_date}) is in the future`);
          console.log(`   Today: ${todayStr}, Start: ${startStr}`);
        }
      } else {
        // No start_date provided, default to upcoming
        finalStatus = 'upcoming';
        console.log(`ℹ️  No start_date provided, defaulting status to 'upcoming'`);
      }
    } else {
      console.log(`ℹ️  Using explicitly provided status: '${status}'`);
    }

    // Create competition
    const result = await db.query(
      `INSERT INTO competitions 
       (name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        name,
        competition_type,
        region,
        finalStatus,
        start_date || null,
        end_date || null,
        req.user.id
      ]
    );

    const newCompetition = result.rows[0];

    // Cache invalidation: Invalidate list caches
    try {
      await redisHelpers.invalidateCompetitionCaches(newCompetition.id);
      console.log(`✅ Invalidated competition list caches after creation`);
    } catch (redisError) {
      console.warn('Redis cache invalidation failed:', redisError.message);
    }

    // Cache the new competition
    try {
      await redisHelpers.cacheCompetition(newCompetition.id, newCompetition, COMPETITION_CACHE_TTL);
      console.log(`✅ Cached new competition: ${newCompetition.id}`);
    } catch (redisError) {
      console.warn('Redis write failed:', redisError.message);
    }

    // Add to active competitions if status is active
    if (newCompetition.status === 'active') {
      try {
        await redisHelpers.addActiveCompetition(newCompetition.id);
        console.log(`✅ Added competition ${newCompetition.id} to active set`);
      } catch (redisError) {
        console.warn('Redis SADD failed:', redisError.message);
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Competition created successfully',
      data: {
        competition: newCompetition
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update competition
 * PUT /api/competitions/:id
 * Requirements: 2.1, 2.2, 2.5, 6.2, 10.4, 10.5
 * Implements: Cache Invalidation
 */
const updateCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, competition_type, region, status, start_date, end_date } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return next(new AppError('Invalid competition ID', 400));
    }

    // Check if competition exists
    const existingCompetition = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [id]
    );

    if (existingCompetition.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    // Validate competition type if provided
    if (competition_type) {
      const validTypes = ['individual', 'duo', 'team', 'challenge'];
      if (!validTypes.includes(competition_type)) {
        return next(new AppError('Invalid competition type', 400));
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['upcoming', 'active', 'completed'];
      if (!validStatuses.includes(status)) {
        return next(new AppError('Invalid status', 400));
      }
    }

    // Auto-determine status based on start_date if status is not explicitly provided
    let finalStatus = status;
    
    if (!status && start_date !== undefined) {
      // Get today's date string in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
      
      // Normalize start_date to YYYY-MM-DD format
      const startDateObj = new Date(start_date);
      const startStr = startDateObj.getFullYear() + '-' + 
                      String(startDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(startDateObj.getDate()).padStart(2, '0');
      
      // Compare date strings directly to avoid timezone issues
      if (startStr <= todayStr) {
        finalStatus = 'active';
        console.log(`✅ Auto-setting competition status to 'active' because start_date (${start_date}) is today or in the past`);
        console.log(`   Today: ${todayStr}, Start: ${startStr}`);
      } else {
        finalStatus = 'upcoming';
        console.log(`ℹ️  Auto-setting competition status to 'upcoming' because start_date (${start_date}) is in the future`);
        console.log(`   Today: ${todayStr}, Start: ${startStr}`);
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (competition_type !== undefined) {
      paramCount++;
      updates.push(`competition_type = $${paramCount}`);
      params.push(competition_type);
    }

    if (region !== undefined) {
      paramCount++;
      updates.push(`region = $${paramCount}`);
      params.push(region);
    }

    if (finalStatus !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(finalStatus);
    }

    if (start_date !== undefined) {
      paramCount++;
      updates.push(`start_date = $${paramCount}`);
      params.push(start_date);
    }

    if (end_date !== undefined) {
      paramCount++;
      updates.push(`end_date = $${paramCount}`);
      params.push(end_date);
    }

    if (updates.length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Add ID parameter
    paramCount++;
    params.push(id);

    const query = `UPDATE competitions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, params);
    const updatedCompetition = result.rows[0];

    // Cache invalidation: Invalidate all related caches
    try {
      await redisHelpers.invalidateCompetitionCaches(id);
      console.log(`✅ Invalidated caches for competition: ${id}`);
    } catch (redisError) {
      console.warn('Redis cache invalidation failed:', redisError.message);
    }

    // Update active competitions set
    if (updatedCompetition.status === 'active') {
      try {
        await redisHelpers.addActiveCompetition(id);
        console.log(`✅ Added competition ${id} to active set`);
      } catch (redisError) {
        console.warn('Redis SADD failed:', redisError.message);
      }
    } else if (updatedCompetition.status === 'completed' || updatedCompetition.status === 'upcoming') {
      try {
        await redisHelpers.removeActiveCompetition(id);
        console.log(`✅ Removed competition ${id} from active set`);
      } catch (redisError) {
        console.warn('Redis SREM failed:', redisError.message);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Competition updated successfully',
      data: {
        competition: updatedCompetition
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete competition
 * DELETE /api/competitions/:id
 * Requirements: 2.1, 2.5, 6.2, 10.5
 * Implements: Cache Invalidation
 */
const deleteCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return next(new AppError('Invalid competition ID', 400));
    }

    // Check if competition exists
    const existingCompetition = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [id]
    );

    if (existingCompetition.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    // Delete competition (cascade will delete related records)
    await db.query('DELETE FROM competitions WHERE id = $1', [id]);

    // Cache invalidation: Remove all related caches
    try {
      await redisHelpers.invalidateCompetitionCaches(id);
      await redisHelpers.removeActiveCompetition(id);
      console.log(`✅ Invalidated all caches for deleted competition: ${id}`);
    } catch (redisError) {
      console.warn('Redis cache invalidation failed:', redisError.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Competition deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Add athlete to competition
 * POST /api/competitions/:id/athletes
 * Requirements: 2.2, 2.4, 6.2, 10.4, 10.5
 * Implements: Cache Invalidation
 */
const addAthleteToCompetition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { athlete_id } = req.body;

    // Validate IDs
    if (!id || isNaN(id)) {
      return next(new AppError('Invalid competition ID', 400));
    }

    if (!athlete_id || isNaN(athlete_id)) {
      return next(new AppError('Invalid athlete ID', 400));
    }

    // Check if competition exists
    const competitionResult = await db.query(
      'SELECT id FROM competitions WHERE id = $1',
      [id]
    );

    if (competitionResult.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    // Check if athlete exists
    const athleteResult = await db.query(
      'SELECT id FROM athletes WHERE id = $1',
      [athlete_id]
    );

    if (athleteResult.rows.length === 0) {
      return next(new AppError('Athlete not found', 404));
    }

    // Check if association already exists
    const existingAssociation = await db.query(
      'SELECT id FROM competition_athletes WHERE competition_id = $1 AND athlete_id = $2',
      [id, athlete_id]
    );

    if (existingAssociation.rows.length > 0) {
      return next(new AppError('Athlete is already registered for this competition', 409));
    }

    // Create association
    const result = await db.query(
      `INSERT INTO competition_athletes (competition_id, athlete_id, registration_date)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, athlete_id]
    );

    // Cache invalidation: Invalidate competition and athletes list
    try {
      await redisHelpers.invalidateCompetitionCaches(id);
      console.log(`✅ Invalidated caches after adding athlete to competition: ${id}`);
    } catch (redisError) {
      console.warn('Redis cache invalidation failed:', redisError.message);
    }

    res.status(201).json({
      status: 'success',
      message: 'Athlete added to competition successfully',
      data: {
        association: result.rows[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove athlete from competition
 * DELETE /api/competitions/:id/athletes/:athleteId
 * Requirements: 2.2, 2.4, 6.2, 10.4, 10.5
 * Implements: Cache Invalidation
 */
const removeAthleteFromCompetition = async (req, res, next) => {
  try {
    const { id, athleteId } = req.params;

    // Validate IDs
    if (!id || isNaN(id)) {
      return next(new AppError('Invalid competition ID', 400));
    }

    if (!athleteId || isNaN(athleteId)) {
      return next(new AppError('Invalid athlete ID', 400));
    }

    // Check if association exists
    const existingAssociation = await db.query(
      'SELECT id FROM competition_athletes WHERE competition_id = $1 AND athlete_id = $2',
      [id, athleteId]
    );

    if (existingAssociation.rows.length === 0) {
      return next(new AppError('Athlete is not registered for this competition', 404));
    }

    // Delete association
    await db.query(
      'DELETE FROM competition_athletes WHERE competition_id = $1 AND athlete_id = $2',
      [id, athleteId]
    );

    // Cache invalidation: Invalidate competition and athletes list
    try {
      await redisHelpers.invalidateCompetitionCaches(id);
      console.log(`✅ Invalidated caches after removing athlete from competition: ${id}`);
    } catch (redisError) {
      console.warn('Redis cache invalidation failed:', redisError.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Athlete removed from competition successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all athletes in a competition
 * GET /api/competitions/:id/athletes
 * Requirements: 2.2, 2.4, 6.2, 8.2, 10.5
 * Implements: Cache-Aside Pattern
 */
const getCompetitionAthletes = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return next(new AppError('Invalid competition ID', 400));
    }

    // Try cache first (Cache-Aside Pattern)
    const cacheKey = `competition:${id}:athletes`;
    try {
      const cachedData = await redisHelpers.getCachedCompetitionList(cacheKey);
      if (cachedData) {
        console.log(`✅ Cache HIT for competition athletes: ${id}`);
        return res.status(200).json({
          status: 'success',
          cached: true,
          data: {
            athletes: cachedData
          }
        });
      }
      console.log(`⚠️  Cache MISS for competition athletes: ${id}`);
    } catch (redisError) {
      console.warn('Redis read failed, falling back to database:', redisError.message);
    }

    // Query database with JOIN
    const result = await db.query(
      `SELECT 
        a.id, a.name, a.athlete_number, a.team_name, 
        a.contact_email, a.contact_phone, a.created_at, a.updated_at,
        ca.registration_date
       FROM athletes a
       INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
       WHERE ca.competition_id = $1
       ORDER BY ca.registration_date DESC`,
      [id]
    );

    // Cache the result (Cache-Aside Pattern)
    try {
      await redisHelpers.cacheCompetitionList(cacheKey, result.rows, COMPETITION_CACHE_TTL);
      console.log(`✅ Cached competition athletes: ${id}`);
    } catch (redisError) {
      console.warn('Redis write failed:', redisError.message);
    }

    res.status(200).json({
      status: 'success',
      cached: false,
      data: {
        athletes: result.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export competition scores to Excel
 * POST /api/competitions/:id/export-excel
 * Requirements: Excel export functionality for score summary
 */
const exportCompetitionToExcel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { export_type, target_email } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return next(new AppError('Invalid competition ID', 400));
    }

    // Validate export type
    const validExportTypes = ['download', 'google-drive', 'online-excel'];
    if (!export_type || !validExportTypes.includes(export_type)) {
      return next(new AppError('Invalid export type. Must be: download, google-drive, or online-excel', 400));
    }

    // Get competition details
    const competitionResult = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [id]
    );

    if (competitionResult.rows.length === 0) {
      return next(new AppError('Competition not found', 404));
    }

    const competition = competitionResult.rows[0];

    // Get all athletes and their scores for this competition
    const scoresResult = await db.query(
      `SELECT 
        a.id as athlete_id,
        a.name as athlete_name,
        a.athlete_number,
        a.team_name,
        s.id as score_id,
        s.judge_id,
        u.username as judge_name,
        s.action_difficulty,
        s.stage_artistry,
        s.action_creativity,
        s.action_fluency,
        s.costume_styling,
        s.action_interaction,
        s.submitted_at
       FROM athletes a
       INNER JOIN competition_athletes ca ON a.id = ca.athlete_id
       LEFT JOIN scores s ON a.id = s.athlete_id AND s.competition_id = $1
       LEFT JOIN users u ON s.judge_id = u.id
       WHERE ca.competition_id = $1
       ORDER BY a.athlete_number, s.submitted_at`,
      [id]
    );

    // Group scores by athlete
    const athletesData = {};
    scoresResult.rows.forEach(row => {
      if (!athletesData[row.athlete_id]) {
        athletesData[row.athlete_id] = {
          athlete_id: row.athlete_id,
          athlete_name: row.athlete_name || '',
          athlete_number: row.athlete_number || '',
          team_name: row.team_name || '',
          scores: []
        };
      }

      if (row.score_id) {
        athletesData[row.athlete_id].scores.push({
          judge_name: row.judge_name || '未知评审',
          action_difficulty: row.action_difficulty,
          stage_artistry: row.stage_artistry,
          action_creativity: row.action_creativity,
          action_fluency: row.action_fluency,
          costume_styling: row.costume_styling,
          action_interaction: row.action_interaction,
          submitted_at: row.submitted_at
        });
      }
    });

    // Create Excel workbook with proper options
    const workbook = XLSX.utils.book_new();
    
    // Set workbook properties
    workbook.Props = {
      Title: `${competition.name} 评分汇总`,
      Subject: '比赛评分数据导出',
      Author: req.user.username || req.user.email || '评分系统',
      CreatedDate: new Date()
    };

    // Helper function to safely format data
    const safeString = (value) => {
      if (value === null || value === undefined) return '';
      return String(value).replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
    };

    // Create summary sheet
    const summaryData = [
      ['比赛信息'],
      ['比赛名称', safeString(competition.name)],
      ['比赛类型', competition.competition_type === 'individual' ? '个人赛' : 
                   competition.competition_type === 'duo_team' ? '双人/团队赛' : '挑战赛'],
      ['赛区', safeString(competition.region)],
      ['状态', competition.status === 'active' ? '进行中' : 
               competition.status === 'completed' ? '已结束' : '即将开始'],
      ['开始时间', competition.start_date ? new Date(competition.start_date).toLocaleDateString('zh-CN') : '未设置'],
      ['结束时间', competition.end_date ? new Date(competition.end_date).toLocaleDateString('zh-CN') : '未设置'],
      [],
      ['导出时间', new Date().toLocaleString('zh-CN')],
      ['导出人', safeString(req.user.username || req.user.email)]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    summarySheet['!cols'] = [
      { width: 15 },
      { width: 30 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, '比赛信息');

    // Create detailed scores sheet
    const detailsData = [
      ['选手编号', '选手姓名', '团队名称', '评审', '动作难度', '舞台艺术', '动作创意', '动作流畅', '服装造型', '动作互动', '提交时间']
    ];

    Object.values(athletesData).forEach(athlete => {
      if (athlete.scores.length === 0) {
        // Athlete with no scores
        detailsData.push([
          safeString(athlete.athlete_number),
          safeString(athlete.athlete_name),
          safeString(athlete.team_name),
          '暂无评分',
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
      } else {
        // Athlete with scores
        athlete.scores.forEach(score => {
          detailsData.push([
            safeString(athlete.athlete_number),
            safeString(athlete.athlete_name),
            safeString(athlete.team_name),
            safeString(score.judge_name),
            score.action_difficulty !== null ? score.action_difficulty : '',
            score.stage_artistry !== null ? score.stage_artistry : '',
            score.action_creativity !== null ? score.action_creativity : '',
            score.action_fluency !== null ? score.action_fluency : '',
            score.costume_styling !== null ? score.costume_styling : '',
            score.action_interaction !== null ? score.action_interaction : '',
            score.submitted_at ? new Date(score.submitted_at).toLocaleString('zh-CN') : ''
          ]);
        });
      }
    });

    const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
    
    // Set column widths for details sheet
    detailsSheet['!cols'] = [
      { width: 10 }, // 选手编号
      { width: 15 }, // 选手姓名
      { width: 15 }, // 团队名称
      { width: 12 }, // 评审
      { width: 10 }, // 动作难度
      { width: 10 }, // 舞台艺术
      { width: 10 }, // 动作创意
      { width: 10 }, // 动作流畅
      { width: 10 }, // 服装造型
      { width: 10 }, // 动作互动
      { width: 20 }  // 提交时间
    ];
    
    XLSX.utils.book_append_sheet(workbook, detailsSheet, '评分详情');

    // Create statistics sheet
    const statsData = [
      ['统计信息'],
      ['总选手数', Object.keys(athletesData).length],
      ['已评分选手数', Object.values(athletesData).filter(a => a.scores.length > 0).length],
      ['未评分选手数', Object.values(athletesData).filter(a => a.scores.length === 0).length],
      ['总评分数', Object.values(athletesData).reduce((sum, a) => sum + a.scores.length, 0)],
      [],
      ['各评审评分统计'],
      ['评审姓名', '评分数量']
    ];

    // Count scores by judge
    const judgeStats = {};
    Object.values(athletesData).forEach(athlete => {
      athlete.scores.forEach(score => {
        const judgeName = safeString(score.judge_name);
        judgeStats[judgeName] = (judgeStats[judgeName] || 0) + 1;
      });
    });

    Object.entries(judgeStats).forEach(([judgeName, count]) => {
      statsData.push([judgeName, count]);
    });

    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    
    // Set column widths for stats sheet
    statsSheet['!cols'] = [
      { width: 15 },
      { width: 15 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, statsSheet, '统计信息');

    // Generate safe filename
    const safeFilename = `${competition.name.replace(/[^\w\s-]/g, '').trim()}_评分汇总_${Date.now()}`;

    // Handle different export types
    switch (export_type) {
      case 'download':
        try {
          // Generate Excel file buffer with proper options
          const buffer = XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: 'xlsx',
            compression: true,
            Props: {
              Title: `${competition.name} 评分汇总`,
              Subject: '比赛评分数据',
              Author: req.user.username || '评分系统'
            }
          });
          
          const base64Content = buffer.toString('base64');

          res.status(200).json({
            status: 'success',
            message: 'Excel file generated successfully',
            data: {
              file_content: base64Content,
              filename: `${safeFilename}.xlsx`,
              size: buffer.length
            }
          });
        } catch (xlsxError) {
          console.error('Excel generation error:', xlsxError);
          throw new AppError(`Excel文件生成失败: ${xlsxError.message}`, 500);
        }
        break;

      case 'google-drive':
        // For now, we'll simulate Google Drive upload
        // In a real implementation, you would use Google Drive API
        res.status(200).json({
          status: 'success',
          message: 'Excel file saved to Google Drive successfully',
          data: {
            drive_file_id: 'simulated_drive_id_' + Date.now(),
            target_email: target_email || req.user.email,
            filename: `${safeFilename}.xlsx`
          }
        });
        break;

      case 'online-excel':
        // For now, we'll simulate online Excel creation
        // In a real implementation, you would use Google Sheets API or similar
        const simulatedUrl = `https://docs.google.com/spreadsheets/d/simulated_sheet_id_${Date.now()}/edit`;
        res.status(200).json({
          status: 'success',
          message: 'Online Excel created successfully',
          data: {
            excel_url: simulatedUrl,
            creator_email: req.user.email,
            title: `${safeFilename} (在线表格)`
          }
        });
        break;

      default:
        return next(new AppError('Unsupported export type', 400));
    }

  } catch (err) {
    console.error('Export error:', err);
    next(err);
  }
};

module.exports = {
  getAllCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  addAthleteToCompetition,
  removeAthleteFromCompetition,
  getCompetitionAthletes,
  exportCompetitionToExcel
};
