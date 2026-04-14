# Custom React Hooks

This directory contains custom React hooks for the Realtime Scoring System.

## Available Hooks

### use-user.ts

Authentication state management hook.

**Requirements**: 1.1, 1.3, 1.4, 18.1, 18.2, 18.3

**Usage**:
```typescript
import { useUser } from '@/hooks/use-user';

function MyComponent() {
  const { user, isAuthenticated, isAdmin, isJudge, logout } = useUser();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.username}!</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Return Values**:
- `user`: Current user object or null
- `isLoading`: Loading state
- `isAuthenticated`: Boolean indicating if user is logged in
- `isAdmin`: Boolean indicating if user is admin
- `isJudge`: Boolean indicating if user is judge
- `login`: Login function
- `logout`: Logout function (redirects to sign-in)
- `refresh`: Refresh user data from localStorage

**Features**:
- Automatic user state synchronization
- Multi-tab sync via storage events
- Role-based access helpers
- Automatic redirect on logout

## Hook Naming Convention

All hooks follow kebab-case naming:
- ✅ `use-user.ts`
- ✅ `use-competitions.ts`
- ✅ `use-athletes.ts`
- ❌ `useUser.ts`
- ❌ `UseUser.ts`

## Creating New Hooks

When creating new hooks:

1. **Use kebab-case** for file names
2. **Export named functions** (not default exports)
3. **Add TypeScript types** for return values
4. **Document requirements** in comments
5. **Handle loading and error states**
6. **Use SWR for data fetching** when applicable

Example template:
```typescript
// Custom hook for [feature]
// Requirements: [requirement numbers]

'use client';

import useSWR from 'swr';
import { API_ENDPOINTS } from '@/lib/api-config';

interface UseFeatureReturn {
  data: DataType | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => void;
}

export function useFeature(): UseFeatureReturn {
  const { data, error, mutate } = useSWR<DataType>(
    API_ENDPOINTS.feature.list
  );

  return {
    data,
    isLoading: !error && !data,
    error,
    mutate,
  };
}
```

## Best Practices

1. **Always use 'use client' directive** for hooks that use browser APIs
2. **Handle loading states** to prevent UI flicker
3. **Handle error states** gracefully
4. **Provide refresh/mutate functions** for data updates
5. **Use TypeScript** for type safety
6. **Document requirements** for traceability
7. **Keep hooks focused** on a single responsibility
8. **Use SWR for API calls** to leverage caching
9. **Avoid side effects** in hook initialization
10. **Clean up subscriptions** in useEffect cleanup

## Common Patterns

### Data Fetching Hook
```typescript
export function useData() {
  const { data, error, mutate } = useSWR(API_ENDPOINTS.data.list);
  
  return {
    data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}
```

### Authentication-Required Hook
```typescript
export function useProtectedData() {
  const { isAuthenticated } = useUser();
  const { data, error } = useSWR(
    isAuthenticated ? API_ENDPOINTS.protected.data : null
  );
  
  return { data, error };
}
```

### Real-time Hook with WebSocket
```typescript
export function useRealtimeData(id: number) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const socket = io(WS_BASE_URL);
    socket.on('data-update', setData);
    
    return () => {
      socket.disconnect();
    };
  }, [id]);
  
  return { data };
}
```

## Testing Hooks

Use React Testing Library for hook testing:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from './use-user';

test('useUser returns user data', async () => {
  const { result } = renderHook(() => useUser());
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  
  expect(result.current.user).toBeDefined();
});
```

## Dependencies

Hooks may depend on:
- `swr`: Data fetching and caching
- `next/navigation`: Next.js routing
- `socket.io-client`: WebSocket connections
- `@/lib/auth-client`: Authentication utilities
- `@/lib/api-config`: API endpoint configuration
- `@/interface/*`: TypeScript interfaces

### use-realtime-scores.ts

Real-time score updates via WebSocket connection.

**Requirements**: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4

**Usage**:
```typescript
import { useRealtimeScores } from '@/hooks/use-realtime-scores';

function ScoreboardComponent({ competitionId }: { competitionId: number }) {
  const {
    latestScore,
    scores,
    status,
    isConnected,
    reconnectAttempts,
    error,
    connectionCount,
    reconnect,
    clearScores
  } = useRealtimeScores(competitionId);

  if (status === 'connecting') {
    return <div>Connecting to live scores...</div>;
  }

  if (status === 'failed') {
    return (
      <div>
        <p>Connection failed: {error}</p>
        <button onClick={reconnect}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <p>Viewers: {connectionCount}</p>
      {latestScore && (
        <div>
          <h3>Latest Score</h3>
          <p>{latestScore.athlete_name}: {JSON.stringify(latestScore.scores)}</p>
        </div>
      )}
      <div>
        <h3>All Scores ({scores.length})</h3>
        {scores.map((score, idx) => (
          <div key={idx}>
            {score.athlete_name} - {score.timestamp}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Parameters**:
- `competitionId`: Competition ID to subscribe to (required)
- `options`: Optional configuration object
  - `enabled`: Enable/disable connection (default: true)
  - `maxReconnectAttempts`: Max reconnection attempts (default: 10)
  - `reconnectDelay`: Delay between reconnects in ms (default: 3000)

**Return Values**:
- `latestScore`: Latest score received via WebSocket
- `scores`: All scores received during this session
- `status`: Connection status ('disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed')
- `isConnected`: Boolean indicating if currently connected
- `reconnectAttempts`: Number of reconnection attempts
- `error`: Error message if connection failed
- `connectionCount`: Number of connected clients (from server)
- `reconnect`: Manual reconnect function
- `clearScores`: Clear all scores

**Features**:
- Automatic connection on mount
- Auto-reconnection (retry every 3s, max 10 attempts)
- Connection status tracking
- Score update handling
- Error handling
- Automatic cleanup on unmount
- Manual reconnect capability
- Connection count tracking

## Requirements Mapping

| Hook | Requirements |
|------|-------------|
| use-user | 1.1, 1.3, 1.4, 18.1, 18.2, 18.3 |
| use-realtime-scores | 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4 |

## Future Hooks

Planned hooks for upcoming tasks:
- `use-scores.ts`: Score data fetching
- `use-submit-score.ts`: Score submission logic
