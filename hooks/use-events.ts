// Event management hook
// For fetching active event and event list

import useSWR from 'swr';
import { Event, EventsListResponse, EventResponse } from '@/interface/event';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

// Fetcher function for public endpoints (no auth required)
const publicFetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch data');
  }

  return response.json();
};

// Fetcher function for admin endpoints (auth required)
const authFetcher = async (url: string) => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('请先登录 / Please login first');
  }

  const response = await fetch(url, {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch data');
  }

  return response.json();
};

// Hook for getting active event (public, no auth required)
export function useActiveEvent() {
  const { data, error, isLoading, mutate } = useSWR<EventResponse>(
    API_ENDPOINTS.events.active,
    publicFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  const event = data?.data || null;

  return {
    event,
    isLoading,
    error,
    mutate,
  };
}

// Hook for getting all events (admin only, auth required)
export function useEvents() {
  const { data, error, isLoading, mutate } = useSWR<EventsListResponse>(
    API_ENDPOINTS.events.list,
    authFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const events = data?.data || [];
  const count = data?.count || 0;

  return {
    events,
    count,
    isLoading,
    error,
    mutate,
  };
}
