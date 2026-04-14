# Backend Core Infrastructure

## Overview

This document describes the backend core infrastructure setup for the Realtime Scoring System, implementing Task 1 from the specification.

## Components Implemented

### 1. Database Schema (`migrations/001_initial_schema.sql`)

Complete PostgreSQL schema with all required tables:

#### Tables Created
- **users**: Admin and judge authentication
- **competitions**: Competition events with type, region, and status
- **athletes**: Athlete and team information
- **competition_athletes**: Many-to-many relationship
- **scores**: Judge scores with multiple dimensions

#### Indexes Created (Performance Optimization)
- `idx_users_email`, `idx_users_role`, `idx_users_username`
- `idx_competitions_type`, `idx_competitions_region`, `idx_competitions_status`, `idx_competitions_created_by`, `idx_competitions_start_date`
- `idx_athletes_number`, `idx_athletes_name`, `idx_athletes_team_name`
- `idx_comp_athletes_comp`, `idx_comp_athletes_athlete`, `idx_comp_athletes_reg_date`
- `idx_scores_competition`, `idx_scores_athlete`, `idx_scores_judge`, `idx_scores_submitted`, `idx_scores_comp_athlete`

#### Features
- Automatic timestamp updates via triggers
- Foreign key constraints for referential integrity
- Check constraints for data validation
- Unique constraints to prevent duplicate data
- Comments documenting table and column purposes

### 2. PostgreSQL Connection Pool (`db.js`)

Enhanced connection pool with:

#### Configuration
- Pool size: 5-20 connections
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds
- Statement timeout: 30 seconds
- Query timeout: 30 seconds

#### Features
- Comprehensive event handlers (connect, acquire, error, remove)
- Graceful shutdown on SIGINT/SIGTERM
- Initial connection test
- Application name for monitoring
- Transaction support via `getClient()` method

#### Security
- All queries use parameterized statements
- No string concatenation for SQL
- Environment variable configuration

### 3. Redis Connection (`redis.js`)

Redis client with retry strategy:

#### Configuration
- Configurable host, port, password, and database
- Retry strategy: exponential backoff (50ms to 2000ms)
- Max retry attempts: 20
- Connection timeout: 10 seconds
- Keep-alive: 30 seconds
- Offline queue enabled

#### Features
- Comprehensive event handlers
- Automatic reconnection on errors
- Graceful shutdown
- Initial PING test

#### Helper Functions
- `setLatestScore()`: Cache latest score with TTL
- `getLatestScore()`: Retrieve cached score
- `updateLeaderboard()`: Update sorted set leaderboard
- `getLeaderboard()`: Get top N athletes
- `addActiveCompetition()`: Track active competitions
- `removeActiveCompetition()`: Remove from active set
- `getActiveCompetitions()`: List all active competitions
- `addWebSocketConnection()`: Track WebSocket clients
- `removeWebSocketConnection()`: Remove WebSocket client
- `getWebSocketConnectionCount()`: Count connected clients

### 4. WebSocket Server (`socket.js`)

Updated WebSocket server with Redis integration:

#### Features
- Room-based broadcasting per competition
- Automatic connection tracking in Redis
- Latest score delivery on connection
- Graceful disconnection handling
- Reconnection support

#### Event Handlers
- `join-competition`: Join competition room
- `leave-competition`: Leave competition room
- `disconnect`: Clean up connections
- `reconnect`: Handle reconnection

#### Functions
- `handleScoreUpdate()`: Process and broadcast scores
- `initializeWebSocket()`: Set up WebSocket server

### 5. Package Configuration (`package.json`)

Updated dependencies:
- `pg@^8.20.0`: PostgreSQL client
- `ioredis@^5.10.1`: Redis client
- `socket.io@^4.8.3`: WebSocket server
- `bcrypt@^5.1.1`: Password hashing
- `jsonwebtoken@^9.0.2`: JWT authentication
- `express@^5.2.1`: Web framework
- `cors@^2.8.6`: CORS middleware
- `dotenv@^17.4.1`: Environment variables

Added scripts:
- `npm start`: Start server
- `npm run dev`: Development mode with nodemon
- `npm run migrate`: Run database migration

### 6. Environment Configuration (`.env`)

Complete environment variables:
- PostgreSQL connection settings
- Redis connection settings
- JWT configuration
- Server configuration

### 7. Documentation

Created comprehensive documentation:
- `migrations/README.md`: Migration guide
- `SETUP.md`: Complete setup instructions
- `INFRASTRUCTURE.md`: This document
- `setup-database.sql`: Database setup script
- `test-connections.js`: Connection test script

## Requirements Satisfied

### Requirement 2.1: Competition Management
✅ Database schema stores competition type, name, and region
✅ Parameterized SQL queries prevent injection

### Requirement 2.2: Athlete-Competition Association
✅ Many-to-many relationship via `competition_athletes` table
✅ Foreign key constraints ensure data integrity

### Requirement 2.6: Real-time Score Broadcasting
✅ PostgreSQL for persistent storage
✅ Redis for caching and real-time data
✅ WebSocket for broadcasting

### Requirement 10.4: Parameterized Queries
✅ All database operations use parameterized queries
✅ No string concatenation in SQL

### Requirement 10.5: Backend-Only Database Operations
✅ Database connection pool in backend only
✅ Redis connection in backend only
✅ Frontend must use API endpoints

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Server                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Express    │  │  Socket.io   │  │     API      │ │
│  │   Server     │  │   WebSocket  │  │   Routes     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│  ┌──────┴──────────────────┴──────────────────┴──────┐ │
│  │                                                     │ │
│  │  ┌──────────────┐         ┌──────────────┐        │ │
│  │  │  db.js       │         │  redis.js    │        │ │
│  │  │  Connection  │         │  Connection  │        │ │
│  │  │  Pool        │         │  + Helpers   │        │ │
│  │  └──────┬───────┘         └──────┬───────┘        │ │
│  │         │                        │                 │ │
│  └─────────┼────────────────────────┼─────────────────┘ │
└────────────┼────────────────────────┼───────────────────┘
             │                        │
    ┌────────┴────────┐      ┌───────┴────────┐
    │   PostgreSQL    │      │     Redis      │
    │   Database      │      │     Cache      │
    └─────────────────┘      └────────────────┘
```

## Data Flow

### Score Submission Flow
1. Judge submits score via API
2. Backend validates JWT token
3. Score saved to PostgreSQL (persistent)
4. Score cached in Redis (real-time)
5. WebSocket broadcasts to display clients
6. Display screens update in real-time

### Connection Management
1. Client connects to WebSocket
2. Client joins competition room
3. Connection tracked in Redis
4. Latest score sent to client
5. Real-time updates broadcasted
6. Disconnection cleaned up automatically

## Performance Optimizations

### Database
- Connection pooling (5-20 connections)
- Indexed columns for fast queries
- Parameterized queries for prepared statements
- Statement timeout prevents long-running queries

### Redis
- TTL on cached data (1-2 hours)
- Sorted sets for leaderboards
- Sets for tracking connections
- Retry strategy for resilience

### WebSocket
- Room-based broadcasting (not global)
- Connection tracking per competition
- Automatic cleanup on disconnect
- Reconnection support

## Security Features

### Database
- Parameterized queries prevent SQL injection
- Foreign key constraints ensure data integrity
- Check constraints validate data
- Role-based access control ready

### Redis
- Password authentication support
- Connection timeout
- Offline queue for resilience

### General
- Environment variables for sensitive data
- Graceful shutdown handlers
- Error logging without exposing internals

## Testing

Run connection tests:
```bash
node test-connections.js
```

Expected results:
- ✅ PostgreSQL connection successful
- ✅ Redis connection successful
- ✅ Redis operations working
- ✅ Helper functions working

## Next Steps

After infrastructure setup:
1. Implement authentication middleware
2. Create API routes for competitions
3. Create API routes for athletes
4. Create API routes for scores
5. Integrate WebSocket with Express server
6. Add input validation middleware
7. Implement error handling middleware

## Maintenance

### Database Migrations
- Create new migration files with sequential numbers
- Document changes in migration comments
- Test migrations on development database first
- Keep migrations idempotent (can run multiple times)

### Connection Pool Monitoring
- Monitor pool size and idle connections
- Adjust pool settings based on load
- Log slow queries for optimization
- Monitor connection errors

### Redis Monitoring
- Monitor memory usage
- Check key expiration
- Monitor connection count
- Review cache hit rates

## Troubleshooting

### High Connection Count
- Check for connection leaks
- Verify connections are released
- Review pool configuration
- Monitor long-running queries

### Redis Memory Issues
- Review TTL settings
- Check for large cached objects
- Monitor key count
- Consider Redis maxmemory policy

### Performance Issues
- Add missing indexes
- Optimize slow queries
- Review connection pool size
- Check Redis latency

## Conclusion

The backend core infrastructure is now complete with:
- ✅ Complete database schema with all tables
- ✅ PostgreSQL connection pool with proper configuration
- ✅ Redis connection with retry strategy
- ✅ Database migration script
- ✅ All required indexes for performance
- ✅ WebSocket integration with Redis
- ✅ Comprehensive documentation
- ✅ Test scripts for verification

All requirements (2.1, 2.2, 2.6, 10.4, 10.5) have been satisfied.
