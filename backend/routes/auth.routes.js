// backend/routes/auth.routes.js
// Authentication routes for user registration and login
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rate-limit');

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;
