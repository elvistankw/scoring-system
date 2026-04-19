// Custom hook for device-based judge session management
// Requirements: Device locking, judge identity selection, session tracking

'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';
import { deviceManager } from '@/lib/device-manager';
import { judgeApiClient } from '@/lib/judge-api-client';
import type { 
  AvailableJudge, 
  JudgeSession, 
  JudgeSelectionRequest,
  JudgeSelectionResponse,
  CurrentSessionResponse,
  AvailableJudgesResponse
} from '@/interface/judge';
import { toast } from 'sonner';

interface UseJudgeSessionReturn {
  // Available judges
  availableJudges: AvailableJudge[];
  loadingJudges: boolean;
  judgesError: string | null;
  
  // Current session
  currentSession: JudgeSession | null;
  loadingSession: boolean;
  sessionError: string | null;
  
  // Actions
  selectJudge: (judgeId: number) => Promise<boolean>;
  endSession: () => Promise<boolean>;
  extendSession: () => Promise<boolean>;
  refreshJudges: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Device info
  deviceId: string;
  deviceInfo: any;
}

/**
 * Hook for managing device-based judge sessions
 * No authentication required - uses device ID for session management
 */
export function useJudgeSession(): UseJudgeSessionReturn {
  const [availableJudges, setAvailableJudges] = useState<AvailableJudge[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(true);
  const [judgesError, setJudgesError] = useState<string | null>(null);
  
  const [currentSession, setCurrentSession] = useState<JudgeSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  const deviceId = deviceManager.getDeviceId();
  const deviceInfo = deviceManager.getDeviceInfo();

  /**
   * Fetch available judges
   */
  const fetchAvailableJudges = useCallback(async () => {
    try {
      setLoadingJudges(true);
      setJudgesError(null);
      
      const response = await fetch(API_ENDPOINTS.judges.available);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available judges');
      }
      
      const data: AvailableJudgesResponse = await response.json();
      
      if (data.success) {
        setAvailableJudges(data.data.judges);
      } else {
        throw new Error('Failed to load judges');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setJudgesError(errorMessage);
      console.error('❌ Fetch available judges error:', error);
    } finally {
      setLoadingJudges(false);
    }
  }, []);

  /**
   * Fetch current session for device
   */
  const fetchCurrentSession = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      setLoadingSession(true);
      setSessionError(null);
      
      const response = await fetch(API_ENDPOINTS.judges.currentSession(deviceId));
      
      if (!response.ok) {
        throw new Error('Failed to fetch current session');
      }
      
      const data: CurrentSessionResponse = await response.json();
      
      if (data.success && data.data) {
        // Update current session - map API response to JudgeSession interface
        const sessionData = data.data;
        const newSession: JudgeSession = {
          id: sessionData.sessionId,
          judge_id: sessionData.judgeId,
          device_id: sessionData.deviceId,
          judge_name: sessionData.judgeName,
          judge_code: sessionData.judgeCode,
          ip_address: undefined,
          user_agent: undefined,
          browser_fingerprint: undefined,
          started_at: sessionData.startedAt,
          last_activity: sessionData.lastActivity,
          expires_at: sessionData.expiresAt,
          ended_at: undefined,
          is_active: sessionData.isActive,
          created_at: sessionData.startedAt,
          updated_at: sessionData.lastActivity
        };
        
        setCurrentSession(newSession);
        
        // Set session in API client
        judgeApiClient.setSession(newSession);
      } else {
        setCurrentSession(null);
        judgeApiClient.clearSession();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSessionError(errorMessage);
      console.error('❌ Fetch current session error:', error);
    } finally {
      setLoadingSession(false);
    }
  }, [deviceId]);

  /**
   * Select judge identity
   */
  const selectJudge = useCallback(async (judgeId: number): Promise<boolean> => {
    if (!deviceId) {
      toast.error('设备ID未找到，请刷新页面重试');
      return false;
    }

    try {
      const requestData: JudgeSelectionRequest = {
        judgeId,
        deviceId,
        browserFingerprint: deviceManager.getBrowserFingerprint()
      };

      const response = await fetch(API_ENDPOINTS.judges.selectIdentity, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: JudgeSelectionResponse = await response.json();

      if (response.ok && data.success) {
        // Update current session - map API response to JudgeSession interface
        const sessionData = data.data.session;
        const newSession: JudgeSession = {
          id: sessionData.id,
          judge_id: sessionData.judgeId,
          device_id: deviceId,
          judge_name: sessionData.judgeName,
          judge_code: sessionData.judgeCode,
          ip_address: undefined,
          user_agent: undefined,
          browser_fingerprint: undefined,
          started_at: sessionData.startedAt,
          last_activity: sessionData.startedAt,
          expires_at: sessionData.expiresAt,
          ended_at: undefined,
          is_active: true,
          created_at: sessionData.startedAt,
          updated_at: sessionData.startedAt
        };
        
        setCurrentSession(newSession);
        
        // Set session in API client
        judgeApiClient.setSession(newSession);

        // Refresh available judges to update status
        await fetchAvailableJudges();

        toast.success(`已选择评委身份: ${data.data.session.judgeName}`);
        return true;
      } else {
        toast.error(data.message || '选择评委身份失败');
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`选择评委身份失败: ${errorMessage}`);
      console.error('❌ Select judge error:', error);
      return false;
    }
  }, [deviceId, fetchAvailableJudges]);

  /**
   * End current session
   */
  const endSession = useCallback(async (): Promise<boolean> => {
    if (!currentSession || !deviceId) {
      return false;
    }

    try {
      const response = await fetch(API_ENDPOINTS.judges.endSession, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          deviceId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentSession(null);
        judgeApiClient.clearSession();
        
        // Refresh available judges to update status
        await fetchAvailableJudges();

        toast.success('已结束评委会话');
        return true;
      } else {
        toast.error(data.message || '结束会话失败');
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`结束会话失败: ${errorMessage}`);
      console.error('❌ End session error:', error);
      return false;
    }
  }, [currentSession, deviceId, fetchAvailableJudges]);

  /**
   * Extend current session
   */
  const extendSession = useCallback(async (): Promise<boolean> => {
    if (!currentSession || !deviceId) {
      return false;
    }

    try {
      const response = await fetch(API_ENDPOINTS.judges.extendSession, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          deviceId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update session expiration time
        setCurrentSession(prev => prev ? {
          ...prev,
          expires_at: data.data.expiresAt,
          last_activity: new Date().toISOString()
        } : null);

        toast.success('会话已延长8小时');
        return true;
      } else {
        toast.error(data.message || '延长会话失败');
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`延长会话失败: ${errorMessage}`);
      console.error('❌ Extend session error:', error);
      return false;
    }
  }, [currentSession, deviceId]);

  /**
   * Refresh functions
   */
  const refreshJudges = useCallback(async () => {
    await fetchAvailableJudges();
  }, [fetchAvailableJudges]);

  const refreshSession = useCallback(async () => {
    await fetchCurrentSession();
  }, [fetchCurrentSession]);

  // Initial load
  useEffect(() => {
    fetchAvailableJudges();
    fetchCurrentSession();
  }, [fetchAvailableJudges, fetchCurrentSession]);

  // Auto-refresh session every 5 minutes to keep it active
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(async () => {
      await fetchCurrentSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentSession, fetchCurrentSession]);

  return {
    // Available judges
    availableJudges,
    loadingJudges,
    judgesError,
    
    // Current session
    currentSession,
    loadingSession,
    sessionError,
    
    // Actions
    selectJudge,
    endSession,
    extendSession,
    refreshJudges,
    refreshSession,
    
    // Device info
    deviceId,
    deviceInfo
  };
}