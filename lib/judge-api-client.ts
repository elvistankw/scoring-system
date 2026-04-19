// Judge API client for device-based session management
// Requirements: Device-based authentication, session management

import { API_ENDPOINTS, getJudgeSessionHeaders, REQUEST_CONFIG } from './api-config';
import { deviceManager } from './device-manager';
import type { JudgeSession } from '@/interface/judge';

class JudgeApiClient {
  private currentSession: JudgeSession | null = null;

  /**
   * Set current judge session
   */
  setSession(session: JudgeSession | null) {
    this.currentSession = session;
  }

  /**
   * Get current judge session
   */
  getSession(): JudgeSession | null {
    return this.currentSession;
  }

  /**
   * Get headers for judge session API calls
   */
  private getSessionHeaders(): HeadersInit {
    if (!this.currentSession) {
      throw new Error('No active judge session');
    }

    return getJudgeSessionHeaders(
      this.currentSession.id.toString(),
      deviceManager.getDeviceId()
    );
  }

  /**
   * Make authenticated API call with judge session
   */
  private async makeSessionRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = this.getSessionHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    return response;
  }

  /**
   * Submit score for an athlete
   */
  async submitScore(scoreData: any): Promise<any> {
    const response = await this.makeSessionRequest(API_ENDPOINTS.scores.submit, {
      method: 'POST',
      body: JSON.stringify(scoreData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit score');
    }

    return response.json();
  }

  /**
   * Batch submit scores
   */
  async batchSubmitScores(scoresData: any): Promise<any> {
    const response = await this.makeSessionRequest(API_ENDPOINTS.scores.batchSubmit, {
      method: 'POST',
      body: JSON.stringify(scoresData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to batch submit scores');
    }

    return response.json();
  }

  /**
   * Partial score update
   */
  async partialScoreUpdate(updateData: any): Promise<any> {
    const response = await this.makeSessionRequest(API_ENDPOINTS.scores.partialUpdate, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update score');
    }

    return response.json();
  }

  /**
   * Get competitions (with judge session authentication)
   */
  async getCompetitions(params?: { 
    status?: string; 
    region?: string; 
    competition_type?: string;
    include_completed_for_summary?: boolean;
  }): Promise<any> {
    let url = API_ENDPOINTS.competitions.list;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    const response = await this.makeSessionRequest(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get competitions');
    }

    return response.json();
  }

  /**
   * Get scores (with judge session authentication)
   */
  async getScores(params?: { competition_id?: number; athlete_id?: number; judge_id?: number }): Promise<any> {
    let url = API_ENDPOINTS.scores.list;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    const response = await this.makeSessionRequest(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get scores');
    }

    return response.json();
  }

  /**
   * Get scores by competition
   */
  async getScoresByCompetition(competitionId: number, params?: { athlete_id?: number }): Promise<any> {
    let url = API_ENDPOINTS.display.scoreboard(competitionId);
    
    if (params?.athlete_id) {
      url += `?athlete_id=${params.athlete_id}`;
    }

    const response = await this.makeSessionRequest(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get competition scores');
    }

    return response.json();
  }

  /**
   * Check if judge has active session
   */
  hasActiveSession(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.currentSession = null;
  }
}

// Export singleton instance
export const judgeApiClient = new JudgeApiClient();