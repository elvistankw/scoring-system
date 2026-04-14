// backend/routes/competitions.routes.js
// Competition management routes with CRUD operations
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 10.4, 10.5

const express = require('express');
const router = express.Router();
const competitionsController = require('../controllers/competitions.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// All competition routes require authentication
router.use(authenticate);

// Competition CRUD endpoints
router.get('/', competitionsController.getAllCompetitions);
router.get('/:id', competitionsController.getCompetitionById);
router.post('/', requireRole('admin'), competitionsController.createCompetition);
router.put('/:id', requireRole('admin'), competitionsController.updateCompetition);
router.delete('/:id', requireRole('admin'), competitionsController.deleteCompetition);

// Competition-athlete association endpoints
router.post('/:id/athletes', requireRole('admin'), competitionsController.addAthleteToCompetition);
router.delete('/:id/athletes/:athleteId', requireRole('admin'), competitionsController.removeAthleteFromCompetition);
router.get('/:id/athletes', competitionsController.getCompetitionAthletes);

// Excel export endpoint - available to judges and admins
router.post('/:id/export-excel', competitionsController.exportCompetitionToExcel);

module.exports = router;
