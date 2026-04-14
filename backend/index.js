// backend/index.js
// Main Express application with middleware integration
// Requirements: 1.1, 1.3, 1.4, 1.5, 10.4

// Load environment variables first
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const http = require("http");

// Import middleware
const { 
  errorHandler, 
  generalLimiter,
  AppError,
  securityHeaders,
  getCorsConfig
} = require('./middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const competitionsRoutes = require('./routes/competitions.routes');
const athletesRoutes = require('./routes/athletes.routes');
const scoresRoutes = require('./routes/scores.routes');
const cacheRoutes = require('./routes/cache.routes');

// Import WebSocket setup
const { initializeWebSocket, handleScoreUpdate } = require('./socket');

const app = express();

// Disable X-Powered-By header for security
app.disable('x-powered-by');

// Create HTTP server for Socket.io integration
const httpServer = http.createServer(app);

// Initialize WebSocket server (Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.5)
const io = initializeWebSocket(httpServer);

// Make io and handleScoreUpdate available to routes
app.set('io', io);
app.set('handleScoreUpdate', handleScoreUpdate);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers middleware (Requirements: 10.4, 10.5)
app.use(securityHeaders);

// CORS configuration with security hardening
app.use(cors(getCorsConfig(process.env.FRONTEND_URL)));

// Body parser middleware with size limits for security
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/competitions', competitionsRoutes);
app.use('/api/athletes', athletesRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/cache', cacheRoutes);

// Google OAuth routes
const googleAuthRoutes = require('./routes/google-auth.routes');
app.use('/api/auth/google', googleAuthRoutes);

// Health check endpoint (no rate limit)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Use httpServer instead of app for listening (to support WebSocket)
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket server ready`);
});

module.exports = { app, httpServer, io };
