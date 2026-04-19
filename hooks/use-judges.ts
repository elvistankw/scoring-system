// Judge management hook
// Requirements: Judge Identity System

import useSWR from 'swr';
import { useState } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import { authClient } from '@/lib/auth-client';
import { 
  Judge, 
  JudgeCreateRequest, 
  JudgeUpdateRequest, 
  JudgeListResponse, 
  JudgeDetailResponse,
  JudgeStatsResponse 
} from '@/interface/judge';

// Fetcher function with auth headers
const fetcher = async (url: string) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
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

// Check if user has admin role
const hasAdminRole = (): boolean => {
  const user = authClient.getUser();
  return user?.role === 'admin';
};

// Hook for managing judges list
export function useJudges() {
  // Check if token exists and user has admin role before making request
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const user = typeof window !== 'undefined' ? authClient.getUser() : null;
  const isAdmin = user?.role === 'admin';
  
  // Create a stable SWR key that includes admin check
  const swrKey = (token && isAdmin) ? API_ENDPOINTS.judges.list : null;
  
  const { data, error, isLoading, mutate } = useSWR<JudgeListResponse>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // Add error retry configuration
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  );

  const judges = data?.data?.judges || [];
  const total = data?.data?.total || 0;

  return {
    judges,
    total,
    isLoading: isLoading || (!token || !isAdmin), // Show loading if not authenticated
    error,
    mutate: () => mutate(), // Use mutate without parameters to revalidate
  };
}

// Hook for judge details
export function useJudge(id: number | null) {
  // Check if token exists and user has admin role before making request
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const user = typeof window !== 'undefined' ? authClient.getUser() : null;
  const isAdmin = user?.role === 'admin';
  
  const swrKey = (id && token && isAdmin) ? API_ENDPOINTS.judges.detail(id) : null;
  
  const { data, error, isLoading, mutate } = useSWR<JudgeDetailResponse>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const judge = data?.data?.judge || null;

  return {
    judge,
    isLoading: isLoading || (!token || !isAdmin),
    error,
    mutate,
  };
}

// Hook for judge statistics
export function useJudgeStats() {
  // Check if token exists and user has admin role before making request
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const user = typeof window !== 'undefined' ? authClient.getUser() : null;
  const isAdmin = user?.role === 'admin';
  
  const swrKey = (token && isAdmin) ? API_ENDPOINTS.judges.stats : null;
  
  const { data, error, isLoading, mutate } = useSWR<JudgeStatsResponse>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  const stats = data?.data || null;

  return {
    stats,
    isLoading: isLoading || (!token || !isAdmin),
    error,
    mutate,
  };
}

// Hook for judge operations
export function useJudgeOperations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJudge = async (judgeData: JudgeCreateRequest): Promise<Judge> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check admin role
      const user = authClient.getUser();
      if (user?.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }

      const response = await fetch(API_ENDPOINTS.judges.create, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(judgeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create judge');
      }

      const result = await response.json();
      // Backend returns data directly, not data.judge
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateJudge = async (id: number, judgeData: JudgeUpdateRequest): Promise<Judge> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check admin role
      const user = authClient.getUser();
      if (user?.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }

      const response = await fetch(API_ENDPOINTS.judges.update(id), {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(judgeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update judge');
      }

      const result = await response.json();
      // Backend returns data directly, not data.judge
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteJudge = async (id: number): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check admin role
      const user = authClient.getUser();
      if (user?.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }

      const response = await fetch(API_ENDPOINTS.judges.delete(id), {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete judge');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleJudgeActive = async (id: number): Promise<Judge> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check admin role
      const user = authClient.getUser();
      if (user?.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }

      const response = await fetch(API_ENDPOINTS.judges.toggleActive(id), {
        method: 'PATCH',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle judge status');
      }

      const result = await response.json();
      // Backend returns data directly, not data.judge
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createJudge,
    updateJudge,
    deleteJudge,
    toggleJudgeActive,
    isSubmitting,
    error,
  };
}