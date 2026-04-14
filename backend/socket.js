// backend/socket.js
// WebSocket server setup with Redis integration
// Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.5
const { Server } = require('socket.io');
const { redisHelpers } = require('./redis');

/**
 * Handle score update and broadcast to connected clients
 * @param {object} io - Socket.io server instance
 * @param {object} scoreData - Score data to broadcast
 */
const handleScoreUpdate = async (io, scoreData) => {
    const { 
        competition_id, 
        athlete_id, 
        athlete_name, 
        judge_id,
        judge_name,
        scores,
        competition_type,
        timestamp 
    } = scoreData;

    try {
        // 1. Cache latest score in Redis (Requirement 6.2)
        await redisHelpers.setLatestScore(competition_id, scoreData, 3600);

        // 2. Update leaderboard if total score is provided
        // Note: Per requirements, we don't calculate totals, but if provided by caller
        if (scoreData.total_score) {
            await redisHelpers.updateLeaderboard(
                competition_id, 
                scoreData.total_score, 
                athlete_id
            );
        }

        // 3. Broadcast to all connected clients via WebSocket (Requirement 6.3)
        // Must complete within 100ms per Requirement 6.3
        io.to(`competition:${competition_id}`).emit('score-update', {
            type: 'SCORE_UPDATED',
            data: scoreData,
            timestamp: timestamp || new Date().toISOString()
        });

        console.log(`✅ Score broadcasted for athlete ${athlete_name} in competition ${competition_id}`);
    } catch (error) {
        console.error('❌ Error handling score update:', error.message);
        throw error;
    }
};

/**
 * Initialize WebSocket server with event handlers
 * Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.5
 * @param {object} httpServer - HTTP server instance
 * @returns {object} Socket.io server instance
 */
const initializeWebSocket = (httpServer) => {
    // Create Socket.io server with CORS configuration
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        // Connection settings for reliability (Requirement 20.2, 20.3)
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    // Connection event handler (Requirement 6.4, 20.1)
    io.on('connection', (socket) => {
        console.log(`🔗 Client connected: ${socket.id}`);

        // Join competition room (Requirement 6.4, 20.1)
        socket.on('join-competition', async (competitionId) => {
            try {
                // Validate competition ID
                if (!competitionId || isNaN(competitionId)) {
                    socket.emit('error', {
                        message: 'Invalid competition ID',
                        code: 'INVALID_COMPETITION_ID'
                    });
                    return;
                }

                const roomName = `competition:${competitionId}`;
                socket.join(roomName);
                
                let connectionCount = 1; // Default if Redis unavailable
                let latestScore = null;
                
                // Track connection in Redis (Requirement 20.2) - graceful degradation
                try {
                    await redisHelpers.addWebSocketConnection(competitionId, socket.id);
                    connectionCount = await redisHelpers.getWebSocketConnectionCount(competitionId);
                    
                    // Send latest score to newly connected client (Requirement 20.3)
                    latestScore = await redisHelpers.getLatestScore(competitionId);
                } catch (redisError) {
                    console.warn(`⚠️  Redis unavailable for competition ${competitionId}, continuing without cache`);
                }
                
                console.log(`👥 Client ${socket.id} joined competition ${competitionId} (${connectionCount} connected)`);

                // Send latest score if available
                if (latestScore) {
                    socket.emit('score-update', {
                        type: 'INITIAL_SCORE',
                        data: latestScore,
                        timestamp: new Date().toISOString()
                    });
                }

                // Acknowledge successful join (always emit this)
                socket.emit('joined-competition', {
                    competition_id: competitionId,
                    connection_count: connectionCount,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`❌ Error joining competition ${competitionId}:`, error.message);
                socket.emit('error', {
                    message: 'Failed to join competition',
                    code: 'JOIN_FAILED',
                    details: error.message
                });
            }
        });

        // Leave competition room (Requirement 6.4, 20.1)
        socket.on('leave-competition', async (competitionId) => {
            try {
                if (!competitionId || isNaN(competitionId)) {
                    socket.emit('error', {
                        message: 'Invalid competition ID',
                        code: 'INVALID_COMPETITION_ID'
                    });
                    return;
                }

                const roomName = `competition:${competitionId}`;
                socket.leave(roomName);
                
                // Remove connection tracking from Redis - graceful degradation
                try {
                    await redisHelpers.removeWebSocketConnection(competitionId, socket.id);
                } catch (redisError) {
                    console.warn(`⚠️  Redis unavailable, skipping connection cleanup`);
                }
                
                console.log(`👋 Client ${socket.id} left competition ${competitionId}`);

                // Acknowledge successful leave
                socket.emit('left-competition', {
                    competition_id: competitionId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error(`❌ Error leaving competition ${competitionId}:`, error.message);
                socket.emit('error', {
                    message: 'Failed to leave competition',
                    code: 'LEAVE_FAILED',
                    details: error.message
                });
            }
        });

        // Handle disconnection (Requirement 6.5, 20.2)
        socket.on('disconnect', async (reason) => {
            console.log(`❌ Client disconnected: ${socket.id} (reason: ${reason})`);
            
            try {
                // Clean up all competition connections for this socket - graceful degradation
                try {
                    const activeCompetitions = await redisHelpers.getActiveCompetitions();
                    
                    for (const competitionId of activeCompetitions) {
                        await redisHelpers.removeWebSocketConnection(competitionId, socket.id);
                    }
                    
                    console.log(`🧹 Cleaned up connections for socket ${socket.id}`);
                } catch (redisError) {
                    console.warn(`⚠️  Redis unavailable, skipping disconnect cleanup`);
                }
            } catch (error) {
                console.error(`❌ Error during disconnect cleanup for ${socket.id}:`, error.message);
            }
        });

        // Handle connection errors (Requirement 20.5)
        socket.on('error', (error) => {
            console.error(`❌ Socket error for ${socket.id}:`, error.message);
        });

        // Handle ping for connection health check
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });
    });

    // Server-level error handling (Requirement 20.5)
    io.engine.on('connection_error', (err) => {
        console.error('❌ WebSocket connection error:', {
            code: err.code,
            message: err.message,
            context: err.context
        });
    });

    console.log('✅ WebSocket server initialized');
    
    return io;
};

module.exports = { 
    handleScoreUpdate, 
    initializeWebSocket
};
