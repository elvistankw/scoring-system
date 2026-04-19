// backend/controllers/events.controller.js
// Events controller for managing competition branding and posters
// Requirements: Judge landing page with dynamic backgrounds

const db = require('../db');
const { AppError } = require('../middleware/error-handler');

/**
 * Get active event for judge landing page
 * GET /api/events/active
 * Public endpoint - no authentication required
 */
const getActiveEvent = async (req, res, next) => {
  try {
    console.log('🔍 Getting active event for judge landing page');

    const query = `
      SELECT 
        id,
        name,
        poster_url,
        background_video_url,
        description,
        start_date,
        end_date,
        created_at
      FROM events 
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      // Return default event if no active event found
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          name: '扯铃比赛 / Diabolo Competition',
          poster_url: '/default-event-poster.jpg',
          background_video_url: null,
          description: '欢迎参加扯铃比赛评分 / Welcome to Diabolo Competition Judging',
          start_date: null,
          end_date: null,
          created_at: new Date().toISOString()
        }
      });
    }

    const event = result.rows[0];

    console.log(`✅ Active event found: ${event.name}`);

    res.status(200).json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('❌ Get active event error:', error);
    next(error);
  }
};

/**
 * Get all events (Admin only)
 * GET /api/events
 */
const getAllEvents = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        poster_url,
        background_video_url,
        status,
        description,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM events 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Get all events error:', error);
    next(error);
  }
};

/**
 * Create new event (Admin only)
 * POST /api/events
 * Body: { name, poster_url, background_video_url, description, start_date, end_date }
 */
const createEvent = async (req, res, next) => {
  try {
    const { name, poster_url, background_video_url, description, start_date, end_date } = req.body;

    console.log('🔍 Creating new event:', { name, poster_url });

    // Validate required fields
    if (!name) {
      return next(new AppError('Event name is required', 400));
    }

    const query = `
      INSERT INTO events (
        name, 
        poster_url, 
        background_video_url, 
        description, 
        start_date, 
        end_date
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      name,
      poster_url || null,
      background_video_url || null,
      description || null,
      start_date || null,
      end_date || null
    ];

    const result = await db.query(query, values);
    const newEvent = result.rows[0];

    console.log(`✅ Event created: ${newEvent.name} (ID: ${newEvent.id})`);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });

  } catch (error) {
    console.error('❌ Create event error:', error);
    next(error);
  }
};

/**
 * Update event (Admin only)
 * PUT /api/events/:id
 */
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, poster_url, background_video_url, status, description, start_date, end_date } = req.body;

    console.log(`🔍 Updating event ${id}:`, { name, poster_url, status });

    // Check if event exists
    const existingEvent = await db.query('SELECT id FROM events WHERE id = $1', [id]);
    if (existingEvent.rows.length === 0) {
      return next(new AppError('Event not found', 404));
    }

    // If setting this event to active, deactivate all other events
    if (status === 'active') {
      await db.query('UPDATE events SET status = $1 WHERE id != $2', ['inactive', id]);
      console.log('✅ Deactivated all other events');
    }

    const query = `
      UPDATE events 
      SET 
        name = COALESCE($1, name),
        poster_url = COALESCE($2, poster_url),
        background_video_url = COALESCE($3, background_video_url),
        status = COALESCE($4, status),
        description = COALESCE($5, description),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const values = [name, poster_url, background_video_url, status, description, start_date, end_date, id];
    const result = await db.query(query, values);
    const updatedEvent = result.rows[0];

    console.log(`✅ Event updated: ${updatedEvent.name}`);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('❌ Update event error:', error);
    next(error);
  }
};

/**
 * Delete event (Admin only)
 * DELETE /api/events/:id
 */
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Deleting event ${id}`);

    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return next(new AppError('Event not found', 404));
    }

    const deletedEvent = result.rows[0];
    console.log(`✅ Event deleted: ${deletedEvent.name}`);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: deletedEvent
    });

  } catch (error) {
    console.error('❌ Delete event error:', error);
    next(error);
  }
};

/**
 * Set event as active (Admin only)
 * POST /api/events/:id/activate
 */
const activateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Activating event ${id}`);

    // Check if event exists
    const existingEvent = await db.query('SELECT id, name FROM events WHERE id = $1', [id]);
    if (existingEvent.rows.length === 0) {
      return next(new AppError('Event not found', 404));
    }

    // Deactivate all events first
    await db.query('UPDATE events SET status = $1', ['inactive']);

    // Activate the selected event
    const result = await db.query(
      'UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['active', id]
    );

    const activatedEvent = result.rows[0];
    console.log(`✅ Event activated: ${activatedEvent.name}`);

    res.status(200).json({
      success: true,
      message: 'Event activated successfully',
      data: activatedEvent
    });

  } catch (error) {
    console.error('❌ Activate event error:', error);
    next(error);
  }
};

module.exports = {
  getActiveEvent,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  activateEvent
};