# Score Broadcasting Implementation

## Overview

This document describes the real-time score broadcasting implementation for the Realtime Scoring System. The system broadcasts score updates to connected display clients via WebSocket immediately after a judge submits a score.

## Requirements Implemented

- **Requirement 6.1**: Score written to PostgreSQL within 500ms
- **Requirement 6.2**: Score published to Redis cache within 200ms
- **Requirement 6.3**: WebSocket broadcast to clients within 100ms
- **Requirement 9.1-9.4**: Display all score dimensions separately with metadata

## Architecture

### Data Flow

```
Judge Submits Score
    ↓
POST /api/scores/submit (with JWT auth)
    ↓
1. Validate competition, athlete, judge
2. Validate score fields and ranges
3. Write to PostgreSQL (transactional)
    ↓
4. Update Redis cache (latest_score:competition:{id})
    ↓
5. Broadcast via WebSocket to room "competition:{id}"
    ↓
Display Clients Receive Update
```

### Components Modified

#### 1. `backend/controllers/scores.controller.js`

**Changes Made:**
- Added WebSocket broadcasting logic after Redis cache update
- Broadcasts to competition-specific room: `competition:{competition_id}`
- Includes all score dimensions and metadata in broadcast
- Graceful degradation if WebSocket server unavailable

**Code Added (lines ~180-200):**
```javascript
// 11. Broadcast score update via WebSocket (Requirements 6.3, 9.1, 9.2, 9.3, 9.4)
try {
  const io = req.app.get('io');
  if (io) {
    const roomName = `competition:${competition_id}`;
    
    io.to(roomName).emit('score-update', {
      type: 'SCORE_UPDATED',
      data: realtimeData,
      timestamp: realtimeData.timestamp
    });
    
    console.log(`📡 Score broadcasted to room ${roomName} for athlete ${athlete.name}`);
  }
} catch (broadcastError) {
  console.error('⚠️  Score broadcast failed:', broadcastError.message);
}
```

#### 2. `backend/socket.js`

**Existing Implementation:**
- WebSocket server initialization with Socket.io
- Room management (join-competition, leave-competition)
- Connection tracking in Redis
- Disconnect cleanup logic
- Error handling

**Key Features:**
- Clients join competition-specific rooms
- Only clients in the same room receive broadcasts
- Automatic cleanup on disconnect
- Connection count tracking

#### 3. `backend/index.js`

**Existing Setup:**
- WebSocket server initialized with HTTP server
- `io` instance made available to routes via `app.set('io', io)`
- Score controller can access WebSocket server via `req.app.get('io')`

## Broadcast Data Structure

### Event Name
`score-update`

### Event Data
```json
{
  "type": "SCORE_UPDATED",
  "data": {
    "competition_id": 1,
    "competition_name": "2024春季个人赛",
    "competition_type": "individual",
    "athlete_id": 5,
    "athlete_name": "张三",
    "athlete_number": "A001",
    "judge_id": 3,
    "judge_name": "评委A",
    "scores": {
      "action_difficulty": 28.5,
      "stage_artistry": 22.0,
      "action_creativity": 15.5,
      "action_fluency": 18.0,
      "costume_styling": 8.5,
      "action_interaction": null
    },
    "timestamp": "2024-01-15T10:30:45.123Z"
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Event type identifier ("SCORE_UPDATED") |
| `data.competition_id` | number | Competition identifier |
| `data.competition_name` | string | Competition name |
| `data.competition_type` | string | Competition type (individual, duo_team, challenge) |
| `data.athlete_id` | number | Athlete identifier |
| `data.athlete_name` | string | Athlete name |
| `data.athlete_number` | string | Athlete number |
| `data.judge_id` | number | Judge identifier |
| `data.judge_name` | string | Judge username |
| `data.scores` | object | Score dimensions (see below) |
| `data.timestamp` | string | Score submission timestamp (ISO 8601) |
| `timestamp` | string | Broadcast timestamp (ISO 8601) |

### Score Dimensions

**Individual Competition:**
- `action_difficulty`: 0-30
- `stage_artistry`: 0-30
- `action_creativity`: 0-30
- `action_fluency`: 0-30
- `costume_styling`: 0-30

**Duo/Team Competition:**
- `action_difficulty`: 0-30
- `stage_artistry`: 0-30
- `action_interaction`: 0-30 (duo/team specific)
- `action_creativity`: 0-30
- `costume_styling`: 0-30

**Challenge Competition:**
- `action_difficulty`: 0-30
- `action_creativity`: 0-30
- `action_fluency`: 0-30

## Testing

### Integration Tests

**File:** `backend/test-score-broadcasting.js`

**Tests Included:**

1. **Score Broadcast After Submission**
   - Verifies score is broadcasted after successful submission
   - Checks broadcast timing (should be < 100ms per Requirement 6.3)
   - Validates all required fields are present
   - Confirms score values match submission

2. **Room Isolation**
   - Creates two competitions with separate clients
   - Submits score to competition 1
   - Verifies only clients in competition 1 room receive broadcast
   - Confirms clients in competition 2 room do not receive broadcast

3. **Broadcast Data Completeness**
   - Validates all metadata fields are present
   - Checks all score dimensions are included
   - Verifies field types are correct
   - Confirms competition type is included

### Running Tests

**Prerequisites:**
1. Backend server must be running: `npm start` or `node index.js`
2. PostgreSQL database must be running and accessible
3. Redis is optional (tests will work with graceful degradation)

**Run Tests:**
```bash
cd backend
node test-score-broadcasting.js
```

**Expected Output:**
```
🚀 Starting Score Broadcasting Integration Tests
============================================================

📋 Setting up test data...
✅ Test judge created
✅ Judge logged in, token obtained
✅ Test competition created (ID: 22)
✅ Test athlete created (ID: 38)
✅ Athlete registered for competition

🧪 Test 1: Score broadcast after submission
   ✓ WebSocket client connected
   ✓ Joined competition room (1 connections)
   ✓ Score submitted successfully
   ✓ Score broadcast received (45ms)
   ✓ All required fields present in broadcast
   ✓ All score dimensions present in broadcast
   ✓ Broadcast data matches submission
✅ PASS: Score broadcast after submission works correctly

🧪 Test 2: Only clients in correct room receive updates
   ✓ Both WebSocket clients connected
   ✓ Clients joined different competition rooms
   ✓ Only client in correct room received broadcast
✅ PASS: Room isolation works correctly

🧪 Test 3: Broadcast includes all required data
   ✓ Connected and joined competition
   ✓ All metadata fields present with correct types
   ✓ All score dimensions present
   ✓ Competition type included in broadcast
✅ PASS: Broadcast includes all required data

🧹 Cleaning up test data...
✅ Test data cleaned up

============================================================
📊 Test Summary
============================================================
✅ Score Broadcast After Submission
✅ Room Isolation
✅ Broadcast Data Completeness

============================================================
Total: 3 | Passed: 3 | Failed: 0
============================================================
```

### Manual Testing

**1. Start the Backend Server:**
```bash
cd backend
npm start
```

**2. Connect WebSocket Client (Browser Console):**
```javascript
// Connect to WebSocket server
const socket = io('http://localhost:5000', {
  transports: ['websocket']
});

// Join competition room
socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('join-competition', 1); // Replace 1 with competition ID
});

// Listen for score updates
socket.on('score-update', (data) => {
  console.log('Score Update Received:', data);
});

// Listen for join confirmation
socket.on('joined-competition', (data) => {
  console.log('Joined Competition:', data);
});
```

**3. Submit a Score (via API):**
```bash
curl -X POST http://localhost:5000/api/scores/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "competition_id": 1,
    "athlete_id": 5,
    "scores": {
      "action_difficulty": 28.5,
      "stage_artistry": 22.0,
      "action_creativity": 15.5,
      "action_fluency": 18.0,
      "costume_styling": 8.5
    }
  }'
```

**4. Verify Broadcast:**
- Check browser console for `score-update` event
- Verify all fields are present
- Confirm score values match submission

## Performance Considerations

### Timing Requirements

| Operation | Requirement | Implementation |
|-----------|-------------|----------------|
| Database Write | < 500ms | Transactional INSERT with parameterized query |
| Redis Cache Update | < 200ms | Single SET operation with TTL |
| WebSocket Broadcast | < 100ms | Socket.io room-based emit |

### Optimization Strategies

1. **Database:**
   - Connection pooling (max 20 connections)
   - Indexed queries on competition_id, athlete_id, judge_id
   - Transactional writes for consistency

2. **Redis:**
   - Write-through caching pattern
   - TTL-based expiration (1 hour for scores)
   - Graceful degradation if unavailable

3. **WebSocket:**
   - Room-based broadcasting (only relevant clients)
   - No acknowledgment required (fire-and-forget)
   - Connection tracking in Redis

## Error Handling

### Graceful Degradation

The system continues to function even if components fail:

1. **Redis Unavailable:**
   - Score still written to PostgreSQL
   - Broadcast still sent via WebSocket
   - Warning logged, request succeeds

2. **WebSocket Unavailable:**
   - Score still written to PostgreSQL
   - Redis cache still updated
   - Warning logged, request succeeds

3. **Broadcast Failure:**
   - Score submission still succeeds
   - Error logged for monitoring
   - Client can fetch latest score via API

### Monitoring

**Log Messages:**
- `✅ Redis cache updated for competition {id}` - Cache update success
- `📡 Score broadcasted to room competition:{id}` - Broadcast success
- `⚠️ Redis cache update failed` - Cache failure (non-critical)
- `⚠️ Score broadcast failed` - Broadcast failure (non-critical)

## Frontend Integration

### React Hook Example

```typescript
// hooks/use-realtime-scores.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useRealtimeScores(competitionId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestScore, setLatestScore] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join-competition', competitionId);
    });

    socketInstance.on('score-update', (data) => {
      setLatestScore(data.data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [competitionId]);

  return { socket, latestScore, isConnected };
}
```

## Security Considerations

1. **Authentication:**
   - Score submission requires valid JWT token
   - Only judges can submit scores
   - Token validated by middleware

2. **Authorization:**
   - Judge must be authenticated to submit
   - Competition must be active
   - Athlete must be registered for competition

3. **WebSocket:**
   - No authentication required for display clients (read-only)
   - Room isolation prevents cross-competition data leaks
   - CORS configured for frontend origin

4. **Data Validation:**
   - Score ranges validated (0-30)
   - Required fields checked per competition type
   - Duplicate score prevention

## Troubleshooting

### Issue: Broadcasts Not Received

**Possible Causes:**
1. WebSocket server not initialized
2. Client not joined to competition room
3. Firewall blocking WebSocket connections

**Solutions:**
1. Check server logs for "WebSocket server ready"
2. Verify `join-competition` event was emitted
3. Check browser console for connection errors

### Issue: Slow Broadcasts

**Possible Causes:**
1. Database query taking too long
2. Redis connection slow
3. Network latency

**Solutions:**
1. Check database indexes
2. Monitor Redis connection
3. Use local Redis for development

### Issue: Missing Score Dimensions

**Possible Causes:**
1. Score submission missing fields
2. Competition type mismatch
3. Database schema issue

**Solutions:**
1. Validate score data before submission
2. Check competition type in database
3. Verify scores table schema

## Future Enhancements

1. **Acknowledgment System:**
   - Add client acknowledgment for critical broadcasts
   - Retry failed broadcasts

2. **Broadcast History:**
   - Store last N broadcasts in Redis
   - Allow clients to fetch missed updates

3. **Compression:**
   - Compress broadcast data for large competitions
   - Use binary protocols for efficiency

4. **Analytics:**
   - Track broadcast latency
   - Monitor connection counts
   - Alert on broadcast failures

## References

- Requirements Document: `.kiro/specs/realtime-scoring-system/requirements.md`
- Design Document: `.kiro/specs/realtime-scoring-system/design.md`
- Tasks Document: `.kiro/specs/realtime-scoring-system/tasks.md`
- Socket.io Documentation: https://socket.io/docs/v4/
- Redis Documentation: https://redis.io/docs/
