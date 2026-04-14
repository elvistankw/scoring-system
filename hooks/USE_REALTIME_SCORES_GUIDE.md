# use-realtime-scores Hook - Implementation Guide

## Overview

The `use-realtime-scores` hook provides real-time score updates via WebSocket connection for the Realtime Scoring System. It handles connection management, auto-reconnection, and score event processing.

**Requirements**: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4

## Features

### ✅ Implemented Features

1. **Automatic WebSocket Connection** (Requirement 20.1)
   - Connects automatically when component mounts
   - Uses Socket.io-client for reliable WebSocket communication
   - Supports both WebSocket and polling transports

2. **Auto-Reconnection Logic** (Requirement 6.5, 20.2)
   - Retries every 3 seconds on connection failure
   - Maximum 10 reconnection attempts
   - Configurable retry delay and max attempts
   - Exponential backoff support

3. **Connection Status Tracking** (Requirement 20.1, 20.3)
   - Five connection states: disconnected, connecting, connected, reconnecting, failed
   - Real-time status updates
   - Connection count from server

4. **Score Update Handling** (Requirement 6.3, 6.4)
   - Receives real-time score updates via `score-update` event
   - Maintains latest score state
   - Accumulates all scores in session history
   - Distinguishes between initial scores and new updates

5. **Error Handling** (Requirement 20.4)
   - Connection error tracking
   - Server error handling
   - User-friendly error messages
   - Manual reconnect capability

6. **Automatic Cleanup**
   - Leaves competition room on unmount
   - Disconnects socket properly
   - Clears reconnection timers
   - Prevents memory leaks

## API Reference

### Hook Signature

```typescript
function useRealtimeScores(
  competitionId: number | null,
  options?: {
    enabled?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
  }
): UseRealtimeScoresReturn
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `competitionId` | `number \| null` | required | Competition ID to subscribe to |
| `options.enabled` | `boolean` | `true` | Enable/disable WebSocket connection |
| `options.maxReconnectAttempts` | `number` | `10` | Maximum reconnection attempts |
| `options.reconnectDelay` | `number` | `3000` | Delay between reconnects (ms) |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `latestScore` | `RealtimeScoreUpdate \| null` | Most recent score received |
| `scores` | `RealtimeScoreUpdate[]` | All scores received in session |
| `status` | `ConnectionStatus` | Current connection status |
| `isConnected` | `boolean` | True if connected |
| `reconnectAttempts` | `number` | Number of reconnection attempts |
| `error` | `string \| null` | Error message if any |
| `connectionCount` | `number` | Number of connected clients |
| `reconnect` | `() => void` | Manual reconnect function |
| `clearScores` | `() => void` | Clear all scores |

### Connection Status Types

```typescript
type ConnectionStatus = 
  | 'disconnected'  // Not connected
  | 'connecting'    // Initial connection attempt
  | 'connected'     // Successfully connected
  | 'reconnecting'  // Attempting to reconnect
  | 'failed';       // Max reconnection attempts reached
```

## Usage Examples

### Basic Usage

```typescript
import { useRealtimeScores } from '@/hooks/use-realtime-scores';

function ScoreboardPage({ competitionId }: { competitionId: number }) {
  const { latestScore, isConnected, status } = useRealtimeScores(competitionId);

  if (status === 'connecting') {
    return <div>Connecting...</div>;
  }

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {latestScore && (
        <div>
          <h3>{latestScore.athlete_name}</h3>
          <p>Difficulty: {latestScore.scores.action_difficulty}</p>
        </div>
      )}
    </div>
  );
}
```

### With Error Handling

```typescript
function ScoreboardWithErrorHandling({ competitionId }: { competitionId: number }) {
  const {
    latestScore,
    status,
    error,
    reconnectAttempts,
    reconnect
  } = useRealtimeScores(competitionId);

  if (status === 'failed') {
    return (
      <div>
        <p>Connection failed: {error}</p>
        <button onClick={reconnect}>Retry Connection</button>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return <div>Reconnecting... (Attempt {reconnectAttempts}/10)</div>;
  }

  return <div>{/* Score display */}</div>;
}
```

### With Score History

```typescript
function ScoreHistory({ competitionId }: { competitionId: number }) {
  const { scores, clearScores } = useRealtimeScores(competitionId);

  return (
    <div>
      <h2>Score History ({scores.length})</h2>
      <button onClick={clearScores}>Clear History</button>
      {scores.map((score, idx) => (
        <div key={idx}>
          {score.athlete_name}: {JSON.stringify(score.scores)}
        </div>
      ))}
    </div>
  );
}
```

### Conditional Connection

```typescript
function ConditionalScoreboard({ competitionId, enabled }: {
  competitionId: number;
  enabled: boolean;
}) {
  const { latestScore, isConnected } = useRealtimeScores(competitionId, {
    enabled, // Only connect when enabled is true
    maxReconnectAttempts: 5,
    reconnectDelay: 5000
  });

  return (
    <div>
      {enabled ? (
        <div>
          <p>Connection: {isConnected ? 'Active' : 'Inactive'}</p>
          {latestScore && <div>{/* Display score */}</div>}
        </div>
      ) : (
        <p>Real-time updates disabled</p>
      )}
    </div>
  );
}
```

### With Connection Count

```typescript
function ScoreboardWithViewers({ competitionId }: { competitionId: number }) {
  const { latestScore, connectionCount, isConnected } = useRealtimeScores(competitionId);

  return (
    <div>
      <div className="status-bar">
        <span>{isConnected ? '🟢' : '🔴'} Live</span>
        <span>👥 {connectionCount} viewers</span>
      </div>
      {latestScore && <div>{/* Score display */}</div>}
    </div>
  );
}
```

## WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-competition` | `competitionId: number` | Join competition room |
| `leave-competition` | `competitionId: number` | Leave competition room |
| `ping` | none | Health check ping |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `score-update` | `{ type, data, timestamp }` | New score update |
| `joined-competition` | `{ competition_id, connection_count, timestamp }` | Join confirmation |
| `left-competition` | `{ competition_id, timestamp }` | Leave confirmation |
| `error` | `{ message, code, details? }` | Error notification |
| `pong` | `{ timestamp }` | Health check response |

### Score Update Event Structure

```typescript
{
  type: 'SCORE_UPDATED' | 'INITIAL_SCORE',
  data: {
    competition_id: number,
    athlete_id: number,
    athlete_name: string,
    athlete_number: string,
    judge_id: number,
    judge_name: string,
    scores: ScoreDimensions,
    competition_type: CompetitionType,
    timestamp: string
  },
  timestamp: string
}
```

## Best Practices

### 1. Always Handle Connection States

```typescript
const { status, error, reconnect } = useRealtimeScores(competitionId);

// Show appropriate UI for each state
switch (status) {
  case 'connecting':
    return <LoadingSpinner />;
  case 'connected':
    return <ScoreDisplay />;
  case 'reconnecting':
    return <ReconnectingMessage />;
  case 'failed':
    return <ErrorWithRetry error={error} onRetry={reconnect} />;
  default:
    return <DisconnectedMessage />;
}
```

### 2. Use Conditional Connection

```typescript
// Only connect when needed
const { latestScore } = useRealtimeScores(
  isDisplayPage ? competitionId : null,
  { enabled: isDisplayPage }
);
```

### 3. Clean Up Score History

```typescript
// Clear scores when switching competitions
useEffect(() => {
  clearScores();
}, [competitionId, clearScores]);
```

### 4. Show Connection Status to Users

```typescript
// Always show connection status on display screens
<div className="status-indicator">
  <span className={isConnected ? 'connected' : 'disconnected'}>
    {isConnected ? '🟢 Live' : '🔴 Offline'}
  </span>
</div>
```

### 5. Handle Errors Gracefully

```typescript
if (error) {
  toast.error(`Connection error: ${error}`);
}
```

## Environment Configuration

Ensure the WebSocket URL is configured in `.env.local`:

```env
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

For production:

```env
NEXT_PUBLIC_WS_URL=https://your-backend-domain.com
```

## Troubleshooting

### Connection Fails Immediately

**Problem**: Status goes to 'failed' without connecting

**Solutions**:
1. Check if backend WebSocket server is running
2. Verify `NEXT_PUBLIC_WS_URL` environment variable
3. Check CORS configuration on backend
4. Ensure Socket.io versions match (client and server)

### Reconnection Not Working

**Problem**: Hook doesn't attempt to reconnect

**Solutions**:
1. Check if `maxReconnectAttempts` is set too low
2. Verify `reconnectDelay` is appropriate
3. Check browser console for connection errors
4. Ensure backend is accepting connections

### Scores Not Updating

**Problem**: Connected but not receiving score updates

**Solutions**:
1. Verify `competitionId` is correct
2. Check if backend is broadcasting to correct room
3. Ensure score submission is working on backend
4. Check browser console for WebSocket events

### Memory Leaks

**Problem**: Multiple connections or memory issues

**Solutions**:
1. Ensure component properly unmounts
2. Check that cleanup function is running
3. Verify socket is disconnected on unmount
4. Use React DevTools to check for memory leaks

## Testing

### Manual Testing Checklist

- [ ] Connection establishes on mount
- [ ] Status updates correctly
- [ ] Receives score updates
- [ ] Reconnects after disconnect
- [ ] Fails after max attempts
- [ ] Manual reconnect works
- [ ] Clear scores works
- [ ] Cleanup on unmount
- [ ] Multiple competitions work
- [ ] Error messages display

### Integration Testing

See `19.1 Write unit tests for WebSocket hook` task for comprehensive test suite.

## Performance Considerations

1. **Connection Pooling**: Socket.io reuses connections efficiently
2. **Event Throttling**: Consider throttling rapid score updates if needed
3. **Memory Management**: Clear old scores periodically for long sessions
4. **Reconnection Strategy**: Exponential backoff prevents server overload

## Security Considerations

1. **No Authentication Required**: Display screens are public
2. **Read-Only**: Hook only receives data, never sends scores
3. **CORS**: Backend must allow frontend origin
4. **Rate Limiting**: Backend should rate-limit connections

## Related Files

- `hooks/use-realtime-scores.ts` - Hook implementation
- `components/display/realtime-score-display.tsx` - Example component
- `backend/socket.js` - WebSocket server
- `interface/score.ts` - TypeScript interfaces

## Requirements Traceability

| Requirement | Implementation |
|-------------|----------------|
| 6.3 | Score update event handling |
| 6.4 | WebSocket connection and room management |
| 6.5 | Auto-reconnection within 3 seconds |
| 20.1 | Connection establishment on page load |
| 20.2 | Reconnection logic (max 10 attempts) |
| 20.3 | Connection status tracking |
| 20.4 | Error handling and user feedback |

## Next Steps

1. Complete task 19.1: Write unit tests for WebSocket hook
2. Implement task 20: Display Scoreboard Interface
3. Implement task 21: Display Rankings Interface
4. Add score animations for visual feedback
5. Optimize for large displays (1080p/4K)
