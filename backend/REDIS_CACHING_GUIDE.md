# Redis Caching Optimization Guide

## Overview

This document describes the Redis caching implementation for the Realtime Scoring System, including caching patterns, TTL values, cache invalidation strategies, and monitoring capabilities.

**Requirements:** 6.2, 6.3, 10.5

## Caching Patterns

### 1. Cache-Aside Pattern (Read-Through)

Used for **competitions** and **rankings** data. The application checks the cache first, and if the data is not found (cache miss), it fetches from the database and stores it in the cache.

**Flow:**
1. Check Redis cache for data
2. If cache HIT: Return cached data
3. If cache MISS: Query PostgreSQL
4. Store result in Redis with TTL
5. Return data to client

**Implementation:**

```javascript
// Example: Get competition by ID
const cachedData = await redisHelpers.getCachedCompetition(id);
if (cachedData) {
  // Cache HIT
  return res.json({ cached: true, data: cachedData });
}

// Cache MISS - query database
const result = await db.query('SELECT * FROM competitions WHERE id = $1', [id]);
const competition = result.rows[0];

// Store in cache
await redisHelpers.cacheCompetition(id, competition, 3600);
return res.json({ cached: false, data: competition });
```

**Used For:**
- Competition data (`GET /api/competitions/:id`)
- Competition lists (`GET /api/competitions`)
- Competition athletes (`GET /api/competitions/:id/athletes`)
- Rankings (`GET /api/display/rankings/:competitionId`)

### 2. Write-Through Pattern

Used for **scores** data. When a score is submitted, it's written to both PostgreSQL (primary) and Redis (cache) simultaneously.

**Flow:**
1. Write to PostgreSQL (transactional)
2. Immediately write to Redis cache
3. Invalidate related caches (rankings, leaderboard)
4. Broadcast via WebSocket

**Implementation:**

```javascript
// Example: Submit score
// 1. Write to database
const result = await db.query('INSERT INTO scores (...) VALUES (...)', [...]);
const savedScore = result.rows[0];

// 2. Write to cache (Write-Through)
await redisHelpers.setLatestScore(competition_id, scoreData, 3600);

// 3. Invalidate related caches
await redisHelpers.invalidateScoreCaches(competition_id);

// 4. Broadcast via WebSocket
io.to(`competition:${competition_id}`).emit('score-update', scoreData);
```

**Used For:**
- Score submissions (`POST /api/scores/submit`)
- Latest scores (`GET /api/scores/latest/:competitionId`)

## TTL Values

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Competitions | 1 hour (3600s) | Relatively stable data, infrequent updates |
| Scores | 1 hour (3600s) | Frequently updated during active competitions |
| Rankings | 2 hours (7200s) | Calculated data, less frequently accessed |
| Leaderboard | 2 hours (7200s) | Sorted set, expensive to recalculate |
| WebSocket Connections | 1 hour (3600s) | Active connections, auto-cleanup |

**Configuration:**

```javascript
// backend/controllers/competitions.controller.js
const COMPETITION_CACHE_TTL = 3600; // 1 hour
const SCORE_CACHE_TTL = 3600; // 1 hour
const LEADERBOARD_CACHE_TTL = 7200; // 2 hours
```

## Cache Keys

### Competition Keys

```
competition:{id}                              # Single competition
competitions:list:{status}:{region}:{type}    # Competition list with filters
competition:{id}:athletes                     # Athletes in competition
```

**Examples:**
- `competition:5` - Competition with ID 5
- `competitions:list:active:华东赛区:individual` - Active individual competitions in 华东赛区
- `competitions:list:all:all:all` - All competitions (no filters)
- `competition:5:athletes` - Athletes in competition 5

### Score Keys

```
latest_score:competition:{id}     # Latest score for competition
rankings:competition:{id}         # Rankings for competition
leaderboard:competition:{id}      # Sorted set leaderboard
```

**Examples:**
- `latest_score:competition:5` - Latest score in competition 5
- `rankings:competition:5` - Rankings for competition 5
- `leaderboard:competition:5` - Leaderboard sorted set for competition 5

### System Keys

```
active_competitions               # Set of active competition IDs
ws_connections:competition:{id}   # WebSocket connections for competition
```

## Cache Invalidation

### Automatic Invalidation

Cache invalidation happens automatically when data is modified:

#### Competition Updates

**Triggers:**
- Create competition → Invalidate list caches
- Update competition → Invalidate specific competition + list caches
- Delete competition → Invalidate all related caches
- Add athlete → Invalidate competition + athletes list
- Remove athlete → Invalidate competition + athletes list

**Implementation:**

```javascript
// Invalidate all competition-related caches
await redisHelpers.invalidateCompetitionCaches(competitionId);

// This invalidates:
// - competition:{id}
// - competition:{id}:athletes
// - competitions:list:*
// - latest_score:competition:{id}
// - rankings:competition:{id}
// - leaderboard:competition:{id}
```

#### Score Updates

**Triggers:**
- Submit score → Invalidate rankings and leaderboard

**Implementation:**

```javascript
// Invalidate score-related caches
await redisHelpers.invalidateScoreCaches(competitionId);

// This invalidates:
// - latest_score:competition:{id}
// - rankings:competition:{id}
// - leaderboard:competition:{id}
```

### Manual Invalidation

Admins can manually invalidate caches via API:

```bash
# Invalidate all caches for a competition
DELETE /api/cache/invalidate/:competitionId
Authorization: Bearer <admin_token>
```

## Cache Hit Rate Monitoring

### Get Statistics

```bash
GET /api/cache/stats
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "hits": 150,
    "misses": 30,
    "errors": 0,
    "total": 180,
    "hitRate": "83.33%",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Reset Statistics

```bash
POST /api/cache/reset-stats
Authorization: Bearer <admin_token>
```

### Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Cache Hit Rate | > 80% | > 60% |
| Redis Cache Update | < 200ms | < 500ms |
| Database Query Time | < 50ms | < 200ms |

## Graceful Degradation

The system is designed to work even when Redis is unavailable:

```javascript
try {
  const cachedData = await redisHelpers.getCachedCompetition(id);
  if (cachedData) {
    return res.json({ cached: true, data: cachedData });
  }
} catch (redisError) {
  console.warn('Redis read failed, falling back to database:', redisError.message);
  // Continue to database query
}

// Always query database as fallback
const result = await db.query('SELECT * FROM competitions WHERE id = $1', [id]);
```

**Behavior:**
- Redis errors are logged but don't fail requests
- All requests fall back to PostgreSQL
- Cache writes fail silently
- System continues to function normally

## Testing

### Run Cache Tests

```bash
cd backend
node test-redis-caching.js
```

**Tests Include:**
1. Login as admin
2. Reset cache statistics
3. Create test competition
4. First read (cache MISS)
5. Second read (cache HIT - Cache-Aside)
6. Update competition (cache invalidation)
7. Read after update (cache MISS)
8. Multiple reads (hit rate calculation)
9. Get cache statistics
10. Competition list caching
11. Manual cache invalidation
12. Cleanup

### Expected Results

```
✅ All tests passed! Redis caching optimization is working correctly.

Test Summary:
Total Tests: 12
Passed: 12
Failed: 0
Success Rate: 100.00%
```

## Monitoring in Production

### Key Metrics to Monitor

1. **Cache Hit Rate**
   - Target: > 80%
   - Check: `GET /api/cache/stats`

2. **Redis Memory Usage**
   - Monitor: `INFO memory` in Redis CLI
   - Alert: > 80% of max memory

3. **Cache Response Time**
   - Target: < 10ms for cache hits
   - Monitor: Application logs

4. **Cache Invalidation Frequency**
   - Monitor: Application logs
   - Pattern: Should correlate with write operations

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Check memory usage
INFO memory

# List all keys (development only)
KEYS *

# Get key TTL
TTL competition:5

# Check key type
TYPE leaderboard:competition:5

# Get sorted set size
ZCARD leaderboard:competition:5

# Monitor commands in real-time
MONITOR
```

## Best Practices

### 1. Always Use TTL

Never store data in Redis without a TTL to prevent memory leaks:

```javascript
// ✅ Good - with TTL
await redis.set(key, value, 'EX', 3600);

// ❌ Bad - no TTL
await redis.set(key, value);
```

### 2. Invalidate Proactively

Invalidate caches immediately after writes:

```javascript
// ✅ Good - immediate invalidation
await db.query('UPDATE competitions SET name = $1 WHERE id = $2', [name, id]);
await redisHelpers.invalidateCompetitionCaches(id);

// ❌ Bad - stale cache
await db.query('UPDATE competitions SET name = $1 WHERE id = $2', [name, id]);
// Cache not invalidated - users see old data
```

### 3. Handle Redis Failures Gracefully

Always wrap Redis operations in try-catch:

```javascript
// ✅ Good - graceful degradation
try {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
} catch (err) {
  console.warn('Redis error:', err.message);
  // Fall back to database
}

// ❌ Bad - crashes on Redis failure
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
```

### 4. Monitor Cache Hit Rates

Regularly check cache statistics:

```bash
# Check hit rate
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/cache/stats

# If hit rate < 60%, investigate:
# - Are TTLs too short?
# - Is cache being invalidated too frequently?
# - Are cache keys correct?
```

## Troubleshooting

### Low Cache Hit Rate (< 60%)

**Possible Causes:**
1. TTL too short → Increase TTL values
2. Frequent invalidation → Review invalidation logic
3. Cache keys mismatch → Check key generation
4. Redis memory full → Increase max memory or reduce TTLs

### Redis Connection Errors

**Symptoms:**
- "Redis unavailable" warnings in logs
- All requests show `cached: false`

**Solutions:**
1. Check Redis is running: `redis-cli ping`
2. Check connection settings in `.env`
3. Verify network connectivity
4. Check Redis logs: `redis-cli INFO`

### Stale Cache Data

**Symptoms:**
- Users see old data after updates
- Rankings don't update after score submission

**Solutions:**
1. Verify cache invalidation is called after writes
2. Check invalidation logic in controllers
3. Manually invalidate: `DELETE /api/cache/invalidate/:id`
4. Restart Redis to clear all caches (development only)

## API Reference

### Cache Management Endpoints

#### Get Cache Statistics

```http
GET /api/cache/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hits": 150,
    "misses": 30,
    "errors": 0,
    "total": 180,
    "hitRate": "83.33%",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Reset Cache Statistics

```http
POST /api/cache/reset-stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cache statistics reset successfully"
}
```

#### Manual Cache Invalidation

```http
DELETE /api/cache/invalidate/:competitionId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "All caches invalidated for competition 5"
}
```

## Summary

The Redis caching implementation provides:

✅ **Cache-Aside Pattern** for competitions and rankings  
✅ **Write-Through Pattern** for scores  
✅ **Automatic Cache Invalidation** on data changes  
✅ **Appropriate TTL Values** (1h for competitions/scores, 2h for rankings)  
✅ **Cache Hit Rate Monitoring** via API  
✅ **Graceful Degradation** when Redis is unavailable  
✅ **Manual Cache Management** for administrators  

This ensures optimal performance while maintaining data consistency and system reliability.
