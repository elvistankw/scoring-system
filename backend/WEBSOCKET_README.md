# WebSocket Server Implementation

## Overview

The WebSocket server provides real-time score broadcasting capabilities for the Realtime Scoring System. It uses Socket.io for WebSocket communication and Redis for connection tracking.

## Requirements Implemented

- **Requirement 6.3**: Real-time score broadcasting via WebSocket
- **Requirement 6.4**: WebSocket connection maintenance throughout competition
- **Requirement 6.5**: Automatic reconnection within 3 seconds on disconnect
- **Requirement 20.1**: WebSocket connection for Display_Screen clients
- **Requirement 20.2**: Connection tracking and management
- **Requirement 20.3**: Automatic reconnection logic
- **Requirement 20.5**: Error handling for WebSocket events

## Architecture

### Components

1. **socket.js**: WebSocket server initialization and event handlers
2. **index.js**: Integration with Express HTTP server
3. **redis.js**: Connection tracking in Redis

### Event Flow

```
Client Connect → Join Competition Room → Receive Initial Score
                                      ↓
                                Track in Redis
                                      ↓
                          Receive Real-time Updates
                                      ↓
Client Disconnect → Cleanup Redis Tracking
```

## WebSocket Events

### Client → Server Events

#### `join-competition`
Join a competition room to receive score updates.

**Payload:**
```javascript
competitionId: number
```

**Response Events:**
- `joined-competition`: Success acknowledgment
- `error`: If competition ID is invalid

**Example:**
```javascript
socket.emit('join-competition', 123);
```

#### `leave-competition`
Leave a competition room.

**Payload:**
```javascript
competitionId: number
```

**Response Events:**
- `left-competition`: Success acknowledgment
- `error`: If competition ID is invalid

**Example:**
```javascript
socket.emit('leave-competition', 123);
```

#### `ping`
Health check to verify connection.

**Response Events:**
- `pong`: Server response with timestamp

**Example:**
```javascript
socket.emit('ping');
```

### Server → Client Events

#### `score-update`
Broadcasted when a new score is submitted.

**Payload:**
```javascript
{
  type: 'SCORE_UPDATED' | 'INITIAL_SCORE',
  data: {
    competition_id: number,
    athlete_id: number,
    athlete_name: string,
    judge_id: number,
    judge_name: string,
    scores: {
      action_difficulty: number,
      stage_artistry?: number,
      action_creativity: number,
      action_fluency?: number,
      costume_styling?: number,
      action_interaction?: number
    },
    competition_type: 'individual' | 'duo_team' | 'challenge',
    timestamp: string
  },
  timestamp: string
}
```

**Example:**
```javascript
socket.on('score-update', (data) => {
  console.log('New score:', data);
});
```

#### `joined-competition`
Acknowledgment of successful room join.

**Payload:**
```javascript
{
  competition_id: number,
  connection_count: number,
  timestamp: string
}
```

#### `left-competition`
Acknowledgment of successful room leave.

**Payload:**
```javascript
{
  competition_id: number,
  timestamp: string
}
```

#### `error`
Error notification.

**Payload:**
```javascript
{
  message: string,
  code: 'INVALID_COMPETITION_ID' | 'JOIN_FAILED' | 'LEAVE_FAILED',
  details?: string
}
```

#### `pong`
Response to ping health check.

**Payload:**
```javascript
{
  timestamp: string
}
```

## Redis Data Structures

### Connection Tracking

**Key Pattern:** `ws_connections:competition:{competition_id}`
**Type:** Set
**TTL:** 3600 seconds (1 hour)
**Members:** Socket IDs

**Purpose:** Track which sockets are connected to each competition room.

**Example:**
```
ws_connections:competition:123 → { "socket_abc", "socket_def", "socket_xyz" }
```

## Client Integration

### Frontend Hook Example

```typescript
// hooks/use-realtime-scores.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useRealtimeScores(competitionId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestScore, setLatestScore] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 10
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join-competition', competitionId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('score-update', (data) => {
      setLatestScore(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [competitionId]);

  return { socket, latestScore, isConnected };
}
```

## Testing

### Run Integration Tests

```bash
# Make sure the server is running first
npm run dev

# In another terminal, run tests
npm run test:websocket
```

### Test Coverage

The integration tests cover:

1. ✓ Client connection and disconnection
2. ✓ Join competition room
3. ✓ Leave competition room
4. ✓ Connection tracking cleanup on disconnect
5. ✓ Error handling for invalid competition ID
6. ✓ Multiple clients in same room
7. ✓ Ping/Pong health check

## Performance Considerations

### Timing Requirements

- **Score Write to Database**: < 500ms (Requirement 6.1)
- **Database to Redis**: < 200ms (Requirement 6.2)
- **Redis to WebSocket Broadcast**: < 100ms (Requirement 6.3)

### Connection Settings

```javascript
{
  pingTimeout: 60000,      // 60 seconds
  pingInterval: 25000,     // 25 seconds
  reconnectionDelay: 3000, // 3 seconds (Requirement 6.5)
  reconnectionAttempts: 10 // Max 10 attempts
}
```

## Error Handling

### Connection Errors

The server handles various error scenarios:

1. **Invalid Competition ID**: Returns error event with code `INVALID_COMPETITION_ID`
2. **Join/Leave Failures**: Returns error event with appropriate code
3. **Disconnect Cleanup**: Automatically removes socket from all rooms
4. **Redis Failures**: Gracefully degrades (logs error but continues)

### Client-Side Error Handling

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Handle error in UI
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show reconnection UI
});
```

## Monitoring

### Connection Tracking

Check active connections for a competition:

```javascript
const count = await redisHelpers.getWebSocketConnectionCount(competitionId);
console.log(`Active connections: ${count}`);
```

### Server Logs

The server logs important events:

- `🔗 Client connected: {socket_id}`
- `👥 Client {socket_id} joined competition {id} ({count} connected)`
- `👋 Client {socket_id} left competition {id}`
- `❌ Client disconnected: {socket_id} (reason: {reason})`
- `✅ Score broadcasted for athlete {name} in competition {id}`

## Security Considerations

1. **CORS Configuration**: Only allows connections from configured frontend URL
2. **Input Validation**: Validates competition IDs before processing
3. **Connection Limits**: Uses Redis TTL to prevent stale connections
4. **Error Messages**: Doesn't expose internal implementation details

## Troubleshooting

### Common Issues

**Issue**: Client can't connect
- **Solution**: Check CORS configuration in socket.js
- **Solution**: Verify server is running on correct port

**Issue**: Scores not broadcasting
- **Solution**: Check Redis connection
- **Solution**: Verify client joined correct competition room

**Issue**: Connection tracking not working
- **Solution**: Check Redis is running
- **Solution**: Verify Redis helper functions are working

**Issue**: Clients not reconnecting
- **Solution**: Check reconnection settings in client
- **Solution**: Verify server is accepting reconnections

## Future Enhancements

1. **Authentication**: Add JWT validation for WebSocket connections
2. **Rate Limiting**: Limit events per socket to prevent abuse
3. **Compression**: Enable WebSocket compression for large payloads
4. **Clustering**: Support multiple server instances with Redis adapter
5. **Metrics**: Add Prometheus metrics for monitoring

## References

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Redis Sets Documentation](https://redis.io/docs/data-types/sets/)
- Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.5
