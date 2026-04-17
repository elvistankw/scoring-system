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

// Import auto-complete utility
const { scheduleAutoComplete } = require('./utils/auto-complete-competitions');

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
app.use(cors(getCorsConfig(process.env.CORS_ORIGIN || process.env.FRONTEND_URL)));

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

// Google OAuth routes - only load if enabled
const GOOGLE_AUTH_ENABLED = process.env.NODE_ENV === 'development' || 
  (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);

if (GOOGLE_AUTH_ENABLED) {
  const googleAuthRoutes = require('./routes/google-auth.routes');
  app.use('/api/auth/google', googleAuthRoutes);

  // Google Sheets & Drive routes
  const googleSheetsRoutes = require('./routes/google-sheets.routes');
  const googleDriveRoutes = require('./routes/google-drive.routes');
  app.use('/api/google/sheets', googleSheetsRoutes);
  app.use('/api/google/drive', googleDriveRoutes);
  
  console.log('✅ Google OAuth routes enabled');
} else {
  console.log('⚠️ Google OAuth routes disabled - missing environment variables');
  
  // Add fallback routes that return 503 - using correct Express syntax
  app.all('/api/auth/google*', (req, res) => {
    res.status(503).json({
      status: 'error',
      message: 'Google OAuth is temporarily disabled'
    });
  });
  
  app.all('/api/google*', (req, res) => {
    res.status(503).json({
      status: 'error',
      message: 'Google services are temporarily disabled'
    });
  });
}

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
  
  // Start auto-complete scheduler (check every 60 minutes)
  scheduleAutoComplete(60);
  console.log(`⏰ Auto-complete scheduler started`);
});

module.exports = { app, httpServer, io };
