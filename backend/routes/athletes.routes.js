// backend/routes/athletes.routes.js
// Athlete management routes with search and relationship queries
// Requirements: 2.2, 2.4, 10.4, 10.5

const express = require('express');
const router = express.Router();
const athletesController = require('../controllers/athletes.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { dualAuth } = require('../middleware/dual-auth');

// All athlete routes require authentication (JWT for admin, session for judge)
router.use(dualAuth);

// Search endpoint (must be before /:id to avoid conflict)
router.get('/search', athletesController.searchAthletes);

// Athlete CRUD endpoints
router.get('/', athletesController.getAllAthletes);
router.get('/:id', athletesController.getAthleteById);
router.get('/:id/competitions', athletesController.getAthleteCompetitions);
router.post('/', requireRole('admin'), athletesController.createAthlete);
router.put('/:id', requireRole('admin'), athletesController.updateAthlete);
router.delete('/:id', requireRole('admin'), athletesController.deleteAthlete);

module.exports = router;
