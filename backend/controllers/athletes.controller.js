// backend/controllers/athletes.controller.js
// Athlete management controller with search and relationship queries
// Requirements: 2.2, 2.4, 10.4, 10.5

const db = require('../db');
const { AppError } = require('../middleware/error-handler');

/**
 * Get all athletes with optional search and competition filter
 * GET /api/athletes?search=name&competition_id=1&judge_id=1&exclude_scored=true
 * Query Parameters:
 * - search: Search by name or athlete_number (partial match)
 * - competition_id: Filter athletes by competition
 * - judge_id: Filter by judge (used with exclude_scored)
 * - exclude_scored: Exclude athletes already scored by the judge
 */
const getAllAthletes = async (req, res, next) => {
  try {
    const { search, competition_id, judge_id, exclude_scored } = req.query;
    
    let query = 'SELECT * FROM athletes';
    const params = [];
    const conditions = [];
    let paramCount = 0;

    // Search by name or athlete_number
    if (search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR athlete_number ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    // Filter by competition
    if (competition_id) {
      paramCount++;
      conditions.push(`id IN (
        SELECT athlete_id FROM competition_athletes 
        WHERE competition_id = $${paramCount}
      )`);
      params.push(competition_id);
    }

    // Exclude athletes already scored by the judge
    if (exclude_scored === 'true' && judge_id && competition_id) {
      paramCount++;
      const judgeParam = paramCount;
      paramCount++;
      const competitionParam = paramCount;
      conditions.push(`id NOT IN (
        SELECT athlete_id FROM scores 
        WHERE judge_id = $${judgeParam} AND competition_id = $${competitionParam}
      )`);
      params.push(judge_id, competition_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: {
        athletes: result.rows,
        count: result.rows.length
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get athlete by ID
 * GET /api/athletes/:id
 */
const getAthleteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return next(new AppError('Invalid athlete ID', 400));
    }

    const result = await db.query(
      'SELECT * FROM athletes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Athlete not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        athlete: result.rows[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get athlete with their competitions
 * GET /api/athletes/:id/competitions
 */
const getAthleteCompetitions = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return next(new AppError('Invalid athlete ID', 400));
    }

    // Check if athlete exists
    const athleteResult = await db.query(
      'SELECT * FROM athletes WHERE id = $1',
      [id]
    );

    if (athleteResult.rows.length === 0) {
      return next(new AppError('Athlete not found', 404));
    }

    // Get competitions for this athlete
    const competitionsResult = await db.query(
      `SELECT c.*, ca.registration_date
       FROM competitions c
       INNER JOIN competition_athletes ca ON c.id = ca.competition_id
       WHERE ca.athlete_id = $1
       ORDER BY c.start_date DESC`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        athlete: athleteResult.rows[0],
        competitions: competitionsResult.rows,
        competition_count: competitionsResult.rows.length
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Search athletes by name or athlete_number
 * GET /api/athletes/search?q=searchTerm
 */
const searchAthletes = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return next(new AppError('Search query is required', 400));
    }

    const result = await db.query(
      `SELECT * FROM athletes 
       WHERE name ILIKE $1 OR athlete_number ILIKE $1
       ORDER BY 
         CASE 
           WHEN name ILIKE $2 THEN 1
           WHEN athlete_number ILIKE $2 THEN 2
           ELSE 3
         END,
         name ASC
       LIMIT 50`,
      [`%${q}%`, `${q}%`]
    );

    res.status(200).json({
      status: 'success',
      data: {
        athletes: result.rows,
        count: result.rows.length,
        query: q
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create new athlete
 * POST /api/athletes
 */
const createAthlete = async (req, res, next) => {
  try {
    const { name, athlete_number, team_name, contact_email, contact_phone, age, gender, school } = req.body;

    // Validate required fields
    if (!name) {
      return next(new AppError('Please provide athlete name', 400));
    }

    if (!age || age < 1 || age > 100) {
      return next(new AppError('Please provide a valid age (1-100)', 400));
    }

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return next(new AppError('Please provide a valid gender (male, female, or other)', 400));
    }

    if (!school || school.trim().length === 0) {
      return next(new AppError('Please provide school name', 400));
    }

    // Check for duplicate athlete_number if provided
    if (athlete_number) {
      const existing = await db.query(
        'SELECT id FROM athletes WHERE athlete_number = $1',
        [athlete_number]
      );

      if (existing.rows.length > 0) {
        return next(new AppError('Athlete number already exists', 409));
      }
    }

    // Create athlete
    const result = await db.query(
      `INSERT INTO athletes 
       (name, athlete_number, team_name, contact_email, contact_phone, age, gender, school, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, athlete_number || null, team_name || null, contact_email || null, contact_phone || null, age, gender, school]
    );

    res.status(201).json({
      status: 'success',
      message: 'Athlete created successfully',
      data: {
        athlete: result.rows[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update athlete
 * PUT /api/athletes/:id
 */
const updateAthlete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, athlete_number, team_name, contact_email, contact_phone, age, gender, school } = req.body;

    if (!id || isNaN(id)) {
      return next(new AppError('Invalid athlete ID', 400));
    }

    // Validate age if provided
    if (age !== undefined && (age < 1 || age > 100)) {
      return next(new AppError('Please provide a valid age (1-100)', 400));
    }

    // Validate gender if provided
    if (gender !== undefined && !['male', 'female', 'other'].includes(gender)) {
      return next(new AppError('Please provide a valid gender (male, female, or other)', 400));
    }

    // Validate school if provided
    if (school !== undefined && school.trim().length === 0) {
      return next(new AppError('School name cannot be empty', 400));
    }

    // Check if athlete exists
    const existing = await db.query(
      'SELECT * FROM athletes WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return next(new AppError('Athlete not found', 404));
    }

    // Check for duplicate athlete_number if being updated
    if (athlete_number && athlete_number !== existing.rows[0].athlete_number) {
      const duplicate = await db.query(
        'SELECT id FROM athletes WHERE athlete_number = $1 AND id != $2',
        [athlete_number, id]
      );

      if (duplicate.rows.length > 0) {
        return next(new AppError('Athlete number already exists', 409));
      }
    }

    // Build update query with parameterized values
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (athlete_number !== undefined) {
      paramCount++;
      updates.push(`athlete_number = $${paramCount}`);
      params.push(athlete_number);
    }

    if (team_name !== undefined) {
      paramCount++;
      updates.push(`team_name = $${paramCount}`);
      params.push(team_name);
    }

    if (contact_email !== undefined) {
      paramCount++;
      updates.push(`contact_email = $${paramCount}`);
      params.push(contact_email);
    }

    if (contact_phone !== undefined) {
      paramCount++;
      updates.push(`contact_phone = $${paramCount}`);
      params.push(contact_phone);
    }

    if (age !== undefined) {
      paramCount++;
      updates.push(`age = $${paramCount}`);
      params.push(age);
    }

    if (gender !== undefined) {
      paramCount++;
      updates.push(`gender = $${paramCount}`);
      params.push(gender);
    }

    if (school !== undefined) {
      paramCount++;
      updates.push(`school = $${paramCount}`);
      params.push(school);
    }

    if (updates.length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    params.push(id);

    const query = `UPDATE athletes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      message: 'Athlete updated successfully',
      data: {
        athlete: result.rows[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete athlete
 * DELETE /api/athletes/:id
 */
const deleteAthlete = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return next(new AppError('Invalid athlete ID', 400));
    }

    // Check if athlete exists
    const existing = await db.query(
      'SELECT * FROM athletes WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return next(new AppError('Athlete not found', 404));
    }

    // Delete athlete
    await db.query('DELETE FROM athletes WHERE id = $1', [id]);

    res.status(200).json({
      status: 'success',
      message: 'Athlete deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllAthletes,
  getAthleteById,
  getAthleteCompetitions,
  searchAthletes,
  createAthlete,
  updateAthlete,
  deleteAthlete
};
