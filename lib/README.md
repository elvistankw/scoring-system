# Library Utilities

This directory contains core utility modules for the Realtime Scoring System frontend.

## Files

### api-config.ts
Centralized API endpoint configuration.

**Exports:**
- `API_ENDPOINTS`: All backend API endpoint URLs organized by resource
- `WS_BASE_URL`: WebSocket server URL
- `WS_EVENTS`: WebSocket event name constants
- `REQUEST_CONFIG`: Default HTTP request configuration
- `getAuthHeaders()`: Helper to generate auth headers
- `buildQueryString()`: Helper to build URL query strings

**Usage:**
```typescript
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

// Fetch competitions
const response = await fetch(API_ENDPOINTS.competitions.list);

// Fetch with auth
const token = authClient.getToken();
const response = await fetch(
  API_ENDPOINTS.scores.submit,
  {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  }
);
```

**Requirements:**
- 17.1: All Backend_API endpoint URLs in single configuration file
- 17.2: Located at lib/api-config.ts
- 17.3: Components import endpoint URLs from configuration
- 17.4: No hardcoded API URLs in component files
- 17.5: Export API endpoint URLs as named constants

### auth-client.ts
Authentication client with token management.

**Exports:**
- `authClient`: Object with authentication methods

**Methods:**
- `getToken()`: Get stored JWT token
- `setToken(token)`: Store JWT token
- `removeToken()`: Remove JWT token
- `getUser()`: Get stored user object
- `setUser(user)`: Store user object
- `removeUser()`: Remove user object
- `clearAuth()`: Clear all auth data
- `isAuthenticated()`: Check if user is authenticated
- `hasRole(role)`: Check if user has specific role
- `login(credentials)`: Login and store token
- `register(userData)`: Register and store token
- `logout()`: Logout and clear auth data
- `verifyToken()`: Verify token validity
- `getAuthHeaders()`: Get headers with auth token

**Usage:**
```typescript
import { authClient } from '@/lib/auth-client';

// Login
const response = await authClient.login({
  email: 'judge@example.com',
  password: 'password123',
});

// Check authentication
if (authClient.isAuthenticated()) {
  // User is logged in
}

// Check role
if (authClient.hasRole('judge')) {
  // User is a judge
}

// Logout
await authClient.logout();
```

**Requirements:**
- 1.1: JWT_Token generation and validation
- 1.3: JWT_Token validation before processing requests
- 1.4: Reject requests from unauthenticated users
- 10.1: Prevent frontend from directly accessing database
- 10.3: Frontend components call Backend_API endpoints

### swr-config.ts
SWR configuration with authentication support.

**Exports:**
- `fetcher`: Default SWR fetcher with auth
- `authenticatedFetcher`: Fetcher that requires auth token
- `swrConfig`: Default SWR configuration
- `realtimeSwrConfig`: Configuration for real-time data
- `staticSwrConfig`: Configuration for static data

**Usage:**
```typescript
import useSWR from 'swr';
import { API_ENDPOINTS } from '@/lib/api-config';
import { authenticatedFetcher, realtimeSwrConfig } from '@/lib/swr-config';

// Use in a hook
function useCompetitions() {
  const { data, error, isLoading } = useSWR(
    API_ENDPOINTS.competitions.list,
    authenticatedFetcher
  );

  return {
    competitions: data?.competitions,
    isLoading,
    error,
  };
}

// Real-time data
function useLatestScores(competitionId: number) {
  const { data } = useSWR(
    API_ENDPOINTS.scores.latest(competitionId),
    authenticatedFetcher,
    realtimeSwrConfig
  );

  return data?.scores;
}
```

**Requirements:**
- 18.1: All data fetching logic in custom React hooks
- 18.3: Components use custom hooks for Backend_API data
- 18.4: Hooks use SWR or React Query for caching

## Best Practices

1. **Always use API_ENDPOINTS** - Never hardcode URLs
2. **Use authClient for authentication** - Centralized token management
3. **Use SWR for data fetching** - Automatic caching and revalidation
4. **Check authentication before protected routes** - Use authClient.isAuthenticated()
5. **Handle errors gracefully** - SWR provides error states
