// backend/routes/events.routes.js
// Events routes for managing competition branding and posters

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getActiveEvent,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  activateEvent
} = require('../controllers/events.controller');

/**
 * @route   GET /api/events/active
 * @desc    Get active event for judge landing page
 * @access  Public (no authentication required)
 */
router.get('/active', getActiveEvent);

/**
 * @route   GET /api/events
 * @desc    Get all events
 * @access  Private (Admin only)
 */
router.get('/', authenticate, requireRole('admin'), getAllEvents);

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireRole('admin'), createEvent);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, requireRole('admin'), updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireRole('admin'), deleteEvent);

/**
 * @route   POST /api/events/:id/activate
 * @desc    Set event as active
 * @access  Private (Admin only)
 */
router.post('/:id/activate', authenticate, requireRole('admin'), activateEvent);

module.exports = router;