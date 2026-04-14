# Backend Setup Guide

This guide will help you set up the backend infrastructure for the Realtime Scoring System.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment Variables

The `.env` file is already configured with default values. Update if needed:

```env
# PostgreSQL Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=scoring
DB_PASSWORD=etkw1234
DB_PORT=5432

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Step 3: Start Redis

### Windows
Download and install Redis from: https://github.com/microsoftarchive/redis/releases

Or use WSL:
```bash
wsl
sudo service redis-server start
```

### macOS
```bash
brew install redis
brew services start redis
```

### Linux
```bash
sudo systemctl start redis
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

## Step 4: Create Database

### Option 1: Using psql command line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE scoring;

# Exit psql
\q
```

### Option 2: Using setup script

```bash
psql -U postgres -f setup-database.sql
```

## Step 5: Run Database Migration

```bash
npm run migrate
```

Or manually:
```bash
psql -U postgres -d scoring -f migrations/001_initial_schema.sql
```

## Step 6: Verify Setup

Run the connection test script:

```bash
node test-connections.js
```

Expected output:
```
🧪 Testing database and cache connections...

1️⃣  Testing PostgreSQL connection...
✅ PostgreSQL connected successfully!
   Current time: 2024-01-15 10:30:45
   Version: PostgreSQL 14.x

2️⃣  Testing Redis connection...
✅ Redis connected successfully! Response: PONG

3️⃣  Testing Redis operations...
✅ Redis SET/GET test passed! Value: test_value

4️⃣  Testing Redis helper functions...
✅ Redis helper test passed! Retrieved score: Test Athlete

✅ All connection tests passed successfully!
```

## Step 7: Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Database Schema

The migration creates the following tables:

### users
- Stores admin and judge accounts
- Fields: id, username, email, password_hash, role, created_at, updated_at

### competitions
- Stores competition events
- Fields: id, name, competition_type, region, status, start_date, end_date, created_by, created_at, updated_at

### athletes
- Stores athlete/team information
- Fields: id, name, athlete_number, team_name, contact_email, contact_phone, created_at, updated_at

### competition_athletes
- Many-to-many relationship between competitions and athletes
- Fields: id, competition_id, athlete_id, registration_date

### scores
- Stores judge scores with multiple dimensions
- Fields: id, competition_id, athlete_id, judge_id, action_difficulty, stage_artistry, action_creativity, action_fluency, costume_styling, action_interaction, submitted_at

## Redis Data Structures

### Latest Score Cache
- Key: `latest_score:competition:{competition_id}`
- Type: String (JSON)
- TTL: 3600 seconds

### Leaderboard
- Key: `leaderboard:competition:{competition_id}`
- Type: Sorted Set (ZSET)
- TTL: 7200 seconds

### Active Competitions
- Key: `active_competitions`
- Type: Set

### WebSocket Connections
- Key: `ws_connections:competition:{competition_id}`
- Type: Set
- TTL: 3600 seconds

## Troubleshooting

### Database connection fails
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database exists: `psql -U postgres -l`

### Redis connection fails
- Verify Redis is running: `redis-cli ping`
- Check Redis host and port in `.env` file
- On Windows, ensure Redis service is started

### Migration fails
- Ensure you're connected to the correct database
- Check for syntax errors in migration file
- Verify PostgreSQL version compatibility

### Permission denied errors
- Ensure PostgreSQL user has CREATE DATABASE privileges
- Check file permissions on migration files

## Next Steps

After successful setup:
1. Create admin and judge user accounts
2. Set up authentication endpoints
3. Implement competition management APIs
4. Configure WebSocket server
5. Test score submission flow

## Requirements Satisfied

This setup satisfies the following requirements:
- **Requirement 2.1**: Competition data storage
- **Requirement 2.2**: Athlete-competition associations
- **Requirement 2.6**: Database persistence with Redis caching
- **Requirement 10.4**: Parameterized SQL queries
- **Requirement 10.5**: Backend-only database operations

## Support

For issues or questions, refer to:
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Redis documentation: https://redis.io/documentation
- Node.js pg module: https://node-postgres.com/
- ioredis documentation: https://github.com/redis/ioredis
