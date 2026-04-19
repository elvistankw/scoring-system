// SWR configuration with authentication support and performance optimization
// Requirements: 10.3, 13.1, 13.2, 13.3, 18.1, 18.2, 18.3, 18.4

import { SWRConfiguration } from 'swr';
import { authClient } from './auth-client';
import { getJudgeSessionHeaders } from './api-config';

// Import auth debug utilities in development
let authDebug: any = null;
if (process.env.NODE_ENV === 'development') {
  import('./auth-debug').then(module => {
    authDebug = module.authDebug;
  }).catch(() => {
    // Ignore import errors in production builds
  });
}

// Default fetcher with authentication
export const fetcher = async (url: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = authClient.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  // Handle authentication errors
  if (response.status === 401) {
    authClient.clearAuth();
    throw new Error('Unauthorized - please login again');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Judge session fetcher (for device-based judge authentication)
export const judgeFetcher = (sessionId: string, deviceId: string) => async (url: string) => {
  const headers = getJudgeSessionHeaders(sessionId, deviceId);

  const response = await fetch(url, { headers });

  // Handle authentication errors
  if (response.status === 401) {
    throw new Error('Judge session expired - please select judge identity again');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Public fetcher (no authentication required)
export const publicFetcher = async (url: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Authenticated fetcher (throws if no token)
export const authenticatedFetcher = async (url: string) => {
  const token = authClient.getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    headers: authClient.getAuthHeaders(),
  });

  if (response.status === 401) {
    authClient.clearAuth();
    throw new Error('Unauthorized - please login again');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Optimized SWR configuration with performance enhancements
// Requirements: 13.2, 13.3
export const swrConfig: SWRConfiguration = {
  fetcher,
  // Cache optimization
  dedupingInterval: 2000, // Dedupe requests within 2s
  focusThrottleInterval: 5000, // Throttle revalidation on focus
  
  // Revalidation strategy
  revalidateOnFocus: false, // Disable for better performance
  revalidateOnReconnect: true, // Revalidate on network reconnect
  revalidateIfStale: true, // Only revalidate if data is stale
  
  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Performance optimization
  keepPreviousData: true, // Keep previous data while revalidating
  
  onError: (error) => {
    // Handle authentication errors with redirect
    if (error.message?.includes('Unauthorized') || error.message?.includes('please login again')) {
      console.warn('Authentication expired, redirecting to login...');
      
      // Try to fix auth issues in development
      if (process.env.NODE_ENV === 'development' && authDebug) {
        authDebug.logAuthState();
        authDebug.fixAuthIssues();
      }
      
      // Redirect to login page if we're in the browser
      if (typeof window !== 'undefined') {
        // Use a small delay to prevent multiple redirects
        setTimeout(() => {
          window.location.href = '/sign-in';
        }, 100);
      }
    } else if (error.message?.includes('Session expired')) {
      // Don't log session expired errors as they're expected when tokens expire
      console.warn('Session expired, redirecting to login...');
    } else {
      console.error('SWR Error:', error);
    }
  },
};

// Configuration for real-time data (more frequent revalidation)
// Used for scoreboard and live displays
export const realtimeSwrConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 5000, // Refresh every 5 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 1000, // More aggressive deduping for real-time
};

// Configuration for static data (less frequent revalidation)
// Used for competition lists, athlete lists
export const staticSwrConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnMount: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 5000, // Longer deduping for static data
};

// Configuration for immutable data (no revalidation)
// Used for historical data, completed competitions
export const immutableSwrConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnMount: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: Infinity, // Never dedupe
};

// Configuration for public data (no authentication required)
// Used for display components like scoreboard and rankings
export const publicSwrConfig: SWRConfiguration = {
  fetcher: publicFetcher,
  // Cache optimization
  dedupingInterval: 2000, // Dedupe requests within 2s
  focusThrottleInterval: 5000, // Throttle revalidation on focus
  
  // Revalidation strategy
  revalidateOnFocus: false, // Disable for better performance
  revalidateOnReconnect: true, // Revalidate on network reconnect
  revalidateIfStale: true, // Only revalidate if data is stale
  
  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Performance optimization
  keepPreviousData: true, // Keep previous data while revalidating
  
  onError: (error) => {
    console.error('Public API Error:', error);
  },
};
