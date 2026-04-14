# Redis Caching Quick Reference

## Quick Start

### Import Redis Helpers
```javascript
const { redisHelpers } = require('../redis');
```

## Common Patterns

### 1. Cache-Aside Pattern (Read)

```javascript
// Try cache first
const cached = await redisHelpers.getCachedCompetition(id);
if (cached) {
  return res.json({ cached: true, data: cached });
}

// Query database on miss
const result = await db.query('SELECT * FROM competitions WHERE id = $1', [id]);

// Store in cache
await redisHelpers.cacheCompetition(id, result.rows[0], 3600);

return res.json({ cached: false, data: result.rows[0] });
```

### 2. Write-Through Pattern (Write)

```javascript
// Write to database
const result = await db.query('INSERT INTO scores (...) VALUES (...)', [...]);

// Write to cache immediately
await redisHelpers.setLatestScore(competitionId, scoreData, 3600);

// Invalidate related caches
await redisHelpers.invalidateScoreCaches(competitionId);
```

### 3. Cache Invalidation

```javascript
// Invalidate all competition caches
await redisHelpers.invalidateCompetitionCaches(competitionId);

// Invalidate only score caches
await redisHelpers.invalidateScoreCaches(competitionId);
```

## TTL Values

```javascript
const COMPETITION_CACHE_TTL = 3600;    // 1 hour
const SCORE_CACHE_TTL = 3600;          // 1 hour
const LEADERBOARD_CACHE_TTL = 7200;    // 2 hours
```

## Cache Keys

| Pattern | Example |
|---------|---------|
| `competition:{id}` | `competition:5` |
| `competitions:list:{status}:{region}:{type}` | `competitions:list:active:all:individual` |
| `latest_score:competition:{id}` | `latest_score:competition:5` |
| `rankings:competition:{id}` | `rankings:competition:5` |

## Helper Functions

### Competition Caching
```javascript
await redisHelpers.cacheCompetition(id, data, 3600);
const data = await redisHelpers.getCachedCompetition(id);
```

### List Caching
```javascript
await redisHelpers.cacheCompetitionList(filterKey, data, 3600);
const data = await redisHelpers.getCachedCompetitionList(filterKey);
```

### Score Caching
```javascript
await redisHelpers.setLatestScore(competitionId, data, 3600);
const data = await redisHelpers.getLatestScore(competitionId);
```

### Rankings Caching
```javascript
await redisHelpers.cacheRankings(competitionId, data, 7200);
const data = await redisHelpers.getCachedRankings(competitionId);
```

### Cache Invalidation
```javascript
await redisHelpers.invalidateCompetitionCaches(competitionId);
await redisHelpers.invalidateScoreCaches(competitionId);
```

### Monitoring
```javascript
const stats = redisHelpers.getCacheStats();
redisHelpers.resetCacheStats();
```

## Error Handling

Always wrap Redis operations in try-catch:

```javascript
try {
  const cached = await redisHelpers.getCachedCompetition(id);
  if (cached) return res.json({ cached: true, data: cached });
} catch (err) {
  console.warn('Redis error:', err.message);
  // Fall back to database
}
```

## Monitoring Endpoints

```bash
# Get cache statistics
GET /api/cache/stats

# Reset statistics
POST /api/cache/reset-stats

# Manual invalidation
DELETE /api/cache/invalidate/:competitionId
```

## Performance Targets

- Cache Hit Rate: > 80%
- Redis Update: < 200ms
- Database Query: < 50ms

## Testing

```bash
# Run cache tests
node test-redis-caching.js
```

## Redis CLI

```bash
# Check key
redis-cli GET competition:5

# Check TTL
redis-cli TTL competition:5

# List keys
redis-cli KEYS "competition:*"

# Delete key
redis-cli DEL competition:5
```
