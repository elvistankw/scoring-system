// Custom hook for competition data fetching with SWR and performance optimization
// Requirements: 2.1, 2.2, 8.1, 8.2, 13.2, 13.3, 18.1, 18.2, 18.3

'use client';

import useSWR from 'swr';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import { staticSwrConfig, immutableSwrConfig } from '@/lib/swr-config';
import { measureApiCall } from '@/lib/performance-monitor';
import { handleAuthError, handleApiError } from '@/lib/auth-error-handler';
import type { 
  Competition, 
  CompetitionListResponse,
  CompetitionDetailResponse,
  CreateCompetitionRequest,
  UpdateCompetitionRequest,
  CompetitionStatus,
  CompetitionType
} from '@/interface/competition';

// Fetcher function with authentication and performance monitoring
async function fetcher(url: string): Promise<any> {
  return measureApiCall(`competitions:${url}`, async () => {
    const token = localStorage.getItem('auth_token');
    const headers = token ? getAuthHeaders(token) : { 'Content-Type': 'application/json' };
    
    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        handleApiError(response, error, 'Failed to fetch data');
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
}

// Hook to fetch all competitions with optional filters
// Uses static SWR config for better performance
export function useCompetitions(filters?: {
  status?: CompetitionStatus;
  region?: string;
  type?: CompetitionType;
  includeCompletedForSummary?: boolean;
}) {
  let url = API_ENDPOINTS.competitions.list;
  
  // Build query string for filters
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.region) params.append('region', filters.region);
  if (filters?.type) params.append('competition_type', filters.type);
  if (filters?.includeCompletedForSummary) params.append('include_completed_for_summary', 'true');
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  // Use static config for competition lists (they don't change frequently)
  const { data, error, mutate, isLoading } = useSWR<CompetitionListResponse>(
    url,
    fetcher,
    staticSwrConfig
  );
  
  return {
    competitions: data?.data?.competitions || [],
    total: data?.data?.total || data?.data?.competitions?.length || 0,
    isLoading,
    isError: error,
    error,
    refresh: mutate,
  };
}

// Hook to fetch a single competition by ID
// Uses immutable config for completed competitions
export function useCompetition(id: number | null, status?: CompetitionStatus) {
  const config = status === 'completed' ? immutableSwrConfig : staticSwrConfig;
  
  const { data, error, mutate, isLoading } = useSWR<CompetitionDetailResponse>(
    id ? API_ENDPOINTS.competitions.detail(id) : null,
    fetcher,
    config
  );
  
  return {
    competition: data?.data?.competition || null,
    isLoading,
    isError: error,
    error,
    refresh: mutate,
  };
}

// Function to create a new competition
export async function createCompetition(data: CreateCompetitionRequest): Promise<Competition> {
  return measureApiCall('createCompetition', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(API_ENDPOINTS.competitions.create, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create competition' }));
      handleApiError(response, error, 'Failed to create competition');
    }
    
    const result = await response.json();
    return result.data.competition;
  });
}

// Function to update an existing competition
export async function updateCompetition(
  id: number, 
  data: UpdateCompetitionRequest
): Promise<Competition> {
  return measureApiCall('updateCompetition', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(API_ENDPOINTS.competitions.update(id), {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update competition' }));
      handleApiError(response, error, 'Failed to update competition');
    }
    
    const result = await response.json();
    return result.data.competition;
  });
}

// Function to delete a competition
export async function deleteCompetition(id: number): Promise<void> {
  return measureApiCall('deleteCompetition', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(API_ENDPOINTS.competitions.delete(id), {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete competition' }));
      handleApiError(response, error, 'Failed to delete competition');
    }
  });
}

// Function to add an athlete to a competition
export async function addAthleteToCompetition(
  competitionId: number,
  athleteId: number
): Promise<void> {
  return measureApiCall('addAthleteToCompetition', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(API_ENDPOINTS.competitions.addAthlete(competitionId), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ athlete_id: athleteId }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to add athlete' }));
      handleApiError(response, error, 'Failed to add athlete');
    }
  });
}

// Function to remove an athlete from a competition
export async function removeAthleteFromCompetition(
  competitionId: number,
  athleteId: number
): Promise<void> {
  return measureApiCall('removeAthleteFromCompetition', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(
      API_ENDPOINTS.competitions.removeAthlete(competitionId, athleteId),
      {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to remove athlete' }));
      handleApiError(response, error, 'Failed to remove athlete');
    }
  });
}
