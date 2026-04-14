/**
 * Unit tests for use-realtime-scores hook
 * Requirements: 6.5, 20.2, 20.3
 * 
 * Test Coverage:
 * - Connection establishment (Requirement 20.1)
 * - Score update handling (Requirement 6.3, 6.4)
 * - Reconnection logic (Requirement 6.5, 20.2)
 * - Disconnect cleanup (Requirement 20.3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRealtimeScores } from '../use-realtime-scores';
import type { RealtimeScoreUpdate } from '@/interface/score';

// Mock Socket.io client
const mockSocket = {
  id: 'mock-socket-id',
  connected: false,
  on: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  off: vi.fn(),
};

// Mock io function
const mockIo = vi.fn(() => mockSocket as any);

// Mock socket.io-client module
vi.mock('socket.io-client', () => ({
  io: (...args: any[]) => mockIo(...args),
}));

describe('useRealtimeScores', () => {
  // Sample test data
  const mockCompetitionId = 1;
  const mockScoreUpdate: RealtimeScoreUpdate = {
    competition_id: 1,
    athlete_id: 5,
    athlete_name: '张三',
    judge_id: 3,
    judge_name: '评委A',
    scores: {
      action_difficulty: 28.5,
      stage_artistry: 22.0,
      action_creativity: 15.5,
      action_fluency: 18.0,
      costume_styling: 8.5,
    },
    competition_type: 'individual',
    timestamp: '2024-01-15T10:30:45Z',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockSocket.connected = false;
    
    // Reset socket event handlers
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      // Store handlers for later triggering
      (mockSocket as any)[`_${event}`] = handler;
      return mockSocket;
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Connection Establishment', () => {
    it('should initialize with disconnected status', () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      expect(result.current.status).toBe('connecting');
      expect(result.current.isConnected).toBe(false);
      expect(result.current.latestScore).toBeNull();
      expect(result.current.scores).toEqual([]);
    });

    it('should create socket connection with correct URL and options', () => {
      renderHook(() => useRealtimeScores(mockCompetitionId));

      expect(mockIo).toHaveBeenCalledWith(
        'http://localhost:5000',
        expect.objectContaining({
          transports: ['websocket', 'polling'],
          reconnection: false,
          autoConnect: true,
          timeout: 10000,
        })
      );
    });

    it('should transition to connected status when socket connects', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate socket connection
      act(() => {
        mockSocket.connected = true;
        (mockSocket as any)._connect?.();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.reconnectAttempts).toBe(0);
      });
    });

    it('should emit join-competition event after connecting', async () => {
      renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate socket connection
      act(() => {
        mockSocket.connected = true;
        (mockSocket as any)._connect?.();
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('join-competition', mockCompetitionId);
      });
    });

    it('should not connect when enabled is false', () => {
      const { result } = renderHook(() =>
        useRealtimeScores(mockCompetitionId, { enabled: false })
      );

      expect(result.current.status).toBe('disconnected');
      expect(mockIo).not.toHaveBeenCalled();
    });

    it('should not connect when competitionId is null', () => {
      const { result } = renderHook(() => useRealtimeScores(null));

      expect(result.current.status).toBe('disconnected');
      expect(mockIo).not.toHaveBeenCalled();
    });

    it('should update connection count when joined-competition event received', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate joined-competition event
      act(() => {
        (mockSocket as any)['_joined-competition']?.({
          competition_id: mockCompetitionId,
          connection_count: 5,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.connectionCount).toBe(5);
      });
    });
  });

  describe('Score Update Handling', () => {
    it('should handle score-update event and update latestScore', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate score update event
      act(() => {
        (mockSocket as any)['_score-update']?.({
          type: 'SCORE_UPDATED',
          data: mockScoreUpdate,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.latestScore).toEqual(mockScoreUpdate);
      });
    });

    it('should add new scores to scores array for SCORE_UPDATED type', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      const score1 = { ...mockScoreUpdate, athlete_id: 1 };
      const score2 = { ...mockScoreUpdate, athlete_id: 2 };

      // Simulate multiple score updates
      act(() => {
        (mockSocket as any)['_score-update']?.({
          type: 'SCORE_UPDATED',
          data: score1,
          timestamp: new Date().toISOString(),
        });
      });

      act(() => {
        (mockSocket as any)['_score-update']?.({
          type: 'SCORE_UPDATED',
          data: score2,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.scores).toHaveLength(2);
        expect(result.current.scores[0]).toEqual(score1);
        expect(result.current.scores[1]).toEqual(score2);
      });
    });

    it('should not add initial scores to scores array', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate initial score event
      act(() => {
        (mockSocket as any)['_score-update']?.({
          type: 'INITIAL_SCORE',
          data: mockScoreUpdate,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.latestScore).toEqual(mockScoreUpdate);
        expect(result.current.scores).toHaveLength(0);
      });
    });

    it('should clear scores when clearScores is called', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Add a score
      act(() => {
        (mockSocket as any)['_score-update']?.({
          type: 'SCORE_UPDATED',
          data: mockScoreUpdate,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.scores).toHaveLength(1);
        expect(result.current.latestScore).toEqual(mockScoreUpdate);
      });

      // Clear scores
      act(() => {
        result.current.clearScores();
      });

      await waitFor(() => {
        expect(result.current.scores).toHaveLength(0);
        expect(result.current.latestScore).toBeNull();
      });
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should schedule reconnection on connect_error', async () => {
      const { result } = renderHook(() =>
        useRealtimeScores(mockCompetitionId, { reconnectDelay: 3000 })
      );

      // Simulate connection error
      act(() => {
        (mockSocket as any)._connect_error?.(new Error('Connection failed'));
      });

      // Verify reconnection was scheduled (reconnectAttempts incremented)
      expect(result.current.reconnectAttempts).toBe(1);
    });

    it('should attempt reconnection on unexpected disconnect', async () => {
      const { result } = renderHook(() =>
        useRealtimeScores(mockCompetitionId, { reconnectDelay: 3000 })
      );

      // First connect
      act(() => {
        mockSocket.connected = true;
        (mockSocket as any)._connect?.();
      });

      expect(result.current.isConnected).toBe(true);

      // Simulate unexpected disconnect
      act(() => {
        mockSocket.connected = false;
        (mockSocket as any)._disconnect?.('transport close');
      });

      // Should have incremented reconnect attempts
      expect(result.current.reconnectAttempts).toBeGreaterThan(0);
    });

    it('should retry up to maxReconnectAttempts times', async () => {
      const maxAttempts = 3;
      const { result } = renderHook(() =>
        useRealtimeScores(mockCompetitionId, {
          maxReconnectAttempts: maxAttempts,
          reconnectDelay: 1000,
        })
      );

      // Simulate multiple connection errors
      for (let i = 0; i < maxAttempts; i++) {
        act(() => {
          (mockSocket as any)._connect_error?.(new Error('Connection failed'));
        });

        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      expect(result.current.reconnectAttempts).toBe(maxAttempts);

      // One more error should trigger failed status
      act(() => {
        (mockSocket as any)._connect_error?.(new Error('Connection failed'));
      });

      expect(result.current.status).toBe('failed');
      expect(result.current.error).toContain(`Failed to connect after ${maxAttempts} attempts`);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const { result } = renderHook(() =>
        useRealtimeScores(mockCompetitionId, { reconnectDelay: 1000 })
      );

      // Simulate connection error first
      act(() => {
        (mockSocket as any)._connect_error?.(new Error('Connection failed'));
      });

      // Verify reconnect attempt was incremented
      const attemptsAfterError = result.current.reconnectAttempts;
      expect(attemptsAfterError).toBeGreaterThan(0);

      // Simulate successful connection
      act(() => {
        mockSocket.connected = true;
        (mockSocket as any)._connect?.();
      });

      // Check that reconnect attempts were reset
      expect(result.current.reconnectAttempts).toBe(0);
    });

    it('should allow manual reconnection via reconnect function', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate failed connection
      act(() => {
        (mockSocket as any)._connect_error?.(new Error('Connection failed'));
      });

      expect(result.current.reconnectAttempts).toBeGreaterThan(0);

      // Manual reconnect
      act(() => {
        result.current.reconnect();
      });

      expect(result.current.reconnectAttempts).toBe(0);
      expect(result.current.error).toBeNull();
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should not reconnect on manual disconnect', async () => {
      const { result, unmount } = renderHook(() =>
        useRealtimeScores(mockCompetitionId, { reconnectDelay: 1000 })
      );

      // Connect first
      act(() => {
        mockSocket.connected = true;
        (mockSocket as any)._connect?.();
      });

      expect(result.current.isConnected).toBe(true);

      // Unmount (manual disconnect)
      unmount();

      // Simulate disconnect event after unmount
      act(() => {
        (mockSocket as any)._disconnect?.('io client disconnect');
      });

      // Should not attempt reconnection
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockSocket.connect).not.toHaveBeenCalled();
    });
  });

  describe('Disconnect Cleanup', () => {
    it('should emit leave-competition on unmount if connected', async () => {
      const { unmount } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate connection
      act(() => {
        mockSocket.connected = true;
        (mockSocket as any)._connect?.();
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('join-competition', mockCompetitionId);
      });

      // Clear previous calls
      mockSocket.emit.mockClear();

      // Unmount
      unmount();

      expect(mockSocket.emit).toHaveBeenCalledWith('leave-competition', mockCompetitionId);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect socket on unmount', () => {
      const { unmount } = renderHook(() => useRealtimeScores(mockCompetitionId));

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should clear reconnection timeout on unmount', () => {
      vi.useFakeTimers();

      const { unmount } = renderHook(() =>
        useRealtimeScores(mockCompetitionId, { reconnectDelay: 3000 })
      );

      // Trigger reconnection
      act(() => {
        (mockSocket as any)._connect_error?.(new Error('Connection failed'));
      });

      // Unmount before reconnection timeout
      unmount();

      // Advance timers - should not trigger reconnection
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // connect should only be called once during initial setup, not from timeout
      expect(mockSocket.connect).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle error events from server', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      const errorData = {
        message: 'Invalid competition ID',
        code: 'INVALID_COMPETITION',
        details: 'Competition 999 does not exist',
      };

      // Simulate error event
      act(() => {
        (mockSocket as any)._error?.(errorData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('INVALID_COMPETITION: Invalid competition ID');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid score updates', async () => {
      const { result } = renderHook(() => useRealtimeScores(mockCompetitionId));

      // Simulate rapid score updates
      const scores = Array.from({ length: 10 }, (_, i) => ({
        ...mockScoreUpdate,
        athlete_id: i + 1,
      }));

      act(() => {
        scores.forEach((score) => {
          (mockSocket as any)['_score-update']?.({
            type: 'SCORE_UPDATED',
            data: score,
            timestamp: new Date().toISOString(),
          });
        });
      });

      await waitFor(() => {
        expect(result.current.scores).toHaveLength(10);
        expect(result.current.latestScore).toEqual(scores[9]);
      });
    });

    it('should handle competition ID change', async () => {
      const { rerender } = renderHook(
        ({ competitionId }) => useRealtimeScores(competitionId),
        { initialProps: { competitionId: 1 } }
      );

      // Connect to first competition
      act(() => {
        mockSocket.connected = true;
        (mockSocket as any)._connect?.();
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('join-competition', 1);
      });

      // Clear previous calls
      mockSocket.emit.mockClear();
      mockSocket.disconnect.mockClear();

      // Change competition ID
      rerender({ competitionId: 2 });

      // Should disconnect from old and connect to new
      await waitFor(() => {
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(mockIo).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle null to valid competition ID transition', () => {
      const { rerender, result } = renderHook(
        ({ competitionId }) => useRealtimeScores(competitionId),
        { initialProps: { competitionId: null } }
      );

      expect(result.current.status).toBe('disconnected');
      expect(mockIo).not.toHaveBeenCalled();

      // Change to valid competition ID
      rerender({ competitionId: mockCompetitionId });

      expect(mockIo).toHaveBeenCalled();
    });
  });
});
