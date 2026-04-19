// Custom hook for athlete data fetching with SWR and performance optimization
// Requirements: 2.2, 2.4, 13.2, 13.3, 18.1, 18.2, 18.3

'use client';

import useSWR from 'swr';
import { API_ENDPOINTS } from '@/lib/api-config';
import { staticSwrConfig, judgeFetcher } from '@/lib/swr-config';
import { measureApiCall } from '@/lib/performance-monitor';
import { handleApiError } from '@/lib/auth-error-handler';
import { deviceManager } from '@/lib/device-manager';
import type { 
  Athlete, 
  AthleteListResponse, 
  AthleteDetailResponse,
  CreateAthleteRequest,
  UpdateAthleteRequest 
} from '@/interface/athlete';

// Fetcher function with auth token and performance monitoring
const fetcher = async (url: string) => {
  return measureApiCall(`athletes:${url}`, async () => {
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        handleApiError(response, error, 'Failed to fetch athletes');
      }

      return response.json();
    } catch (error) {
      // Handle network errors (backend down, connection issues, etc.)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('无法连接到服务器，请检查网络连接或稍后重试');
      }
      
      // Re-throw other errors as-is
      throw error;
    }
  });
};

// Hook to fetch all athletes with optimized caching
// Supports both JWT authentication (admin) and judge session authentication (judge)
export function useAthletes(
  competitionId?: number, 
  judgeId?: number, 
  excludeScored?: boolean,
  judgeSessionId?: string // Optional judge session ID for device-based auth
) {
  // Check authentication - either JWT token or judge session
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');
  const hasJudgeSession = judgeSessionId && typeof window !== 'undefined';
  
  let url = API_ENDPOINTS.athletes.list;
  const params = new URLSearchParams();
  
  if (competitionId) {
    params.append('competition_id', competitionId.toString());
  }
  
  if (excludeScored && judgeId && competitionId) {
    params.append('judge_id', judgeId.toString());
    params.append('exclude_scored', 'true');
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  // Determine which fetcher to use based on authentication type
  let swrKey: string | null = null;
  let swrFetcher = fetcher;
  
  if (hasJudgeSession && judgeSessionId) {
    // Use judge session authentication
    swrKey = url;
    swrFetcher = judgeFetcher(judgeSessionId, deviceManager.getDeviceId());
  } else if (hasToken) {
    // Use JWT authentication
    swrKey = url;
    swrFetcher = fetcher;
  }
  // If neither authentication method is available, swrKey remains null and no request is made

  const { data, error, mutate, isLoading } = useSWR<any>(
    swrKey,
    swrFetcher,
    staticSwrConfig // Use static config for better performance
  );

  return {
    athletes: data?.data?.athletes || [],
    total: data?.data?.count || 0,
    isLoading,
    isError: error,
    error,
    refresh: mutate,
  };
}

// Hook to fetch single athlete with competitions
export function useAthlete(athleteId: number | null) {
  // 检查认证状态
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');
  const swrKey = (hasToken && athleteId) ? API_ENDPOINTS.athletes.detail(athleteId) : null;
  
  const { data, error, mutate, isLoading } = useSWR<any>(
    swrKey,
    fetcher,
    staticSwrConfig
  );

  return {
    athlete: data?.data?.athlete || null,
    isLoading,
    isError: error,
    error,
    refresh: mutate,
  };
}

// Hook to search athletes with optimized debouncing
export function useAthleteSearch(searchTerm: string) {
  // 检查认证状态
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');
  
  const url = (hasToken && searchTerm) 
    ? `${API_ENDPOINTS.athletes.list}/search?q=${encodeURIComponent(searchTerm)}`
    : null;

  const { data, error, mutate, isLoading } = useSWR<any>(
    url,
    fetcher,
    {
      ...staticSwrConfig,
      dedupingInterval: 500, // Debounce search requests
    }
  );

  return {
    athletes: data?.data?.athletes || [],
    total: data?.data?.count || 0,
    isLoading,
    isError: error,
    error,
    refresh: mutate,
  };
}

// Create athlete function with performance monitoring
export async function createAthlete(data: CreateAthleteRequest): Promise<Athlete> {
  return measureApiCall('createAthlete', async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(API_ENDPOINTS.athletes.create, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create athlete');
    }

    const result = await response.json();
    return result.data.athlete;
  });
}

// Update athlete function with performance monitoring
export async function updateAthlete(
  athleteId: number, 
  data: UpdateAthleteRequest
): Promise<Athlete> {
  return measureApiCall('updateAthlete', async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(API_ENDPOINTS.athletes.update(athleteId), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update athlete');
    }

    const result = await response.json();
    return result.data.athlete;
  });
}

// Delete athlete function with performance monitoring
export async function deleteAthlete(athleteId: number): Promise<void> {
  return measureApiCall('deleteAthlete', async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(API_ENDPOINTS.athletes.delete(athleteId), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete athlete');
    }
  });
}

// Add athlete to competition with performance monitoring
export async function addAthleteToCompetition(
  competitionId: number,
  athleteId: number
): Promise<void> {
  return measureApiCall('addAthleteToCompetition', async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(API_ENDPOINTS.competitions.addAthlete(competitionId), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ athlete_id: athleteId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add athlete to competition');
    }
  });
}

// Remove athlete from competition with performance monitoring
export async function removeAthleteFromCompetition(
  competitionId: number,
  athleteId: number
): Promise<void> {
  return measureApiCall('removeAthleteFromCompetition', async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      API_ENDPOINTS.competitions.removeAthlete(competitionId, athleteId),
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove athlete from competition');
    }
  });
}
