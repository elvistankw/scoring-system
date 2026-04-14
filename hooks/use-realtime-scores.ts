// Custom hook for WebSocket real-time score updates
// Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RealtimeScoreUpdate } from '@/interface/score';

// WebSocket connection status
export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed';

// WebSocket event types from server
interface WebSocketEvents {
  'score-update': {
    type: 'SCORE_UPDATED' | 'INITIAL_SCORE';
    data: RealtimeScoreUpdate;
    timestamp: string;
  };
  'joined-competition': {
    competition_id: number;
    connection_count: number;
    timestamp: string;
  };
  'left-competition': {
    competition_id: number;
    timestamp: string;
  };
  'error': {
    message: string;
    code: string;
    details?: string;
  };
  'pong': {
    timestamp: string;
  };
}

// Hook return type
export interface UseRealtimeScoresReturn {
  // Latest score received via WebSocket
  latestScore: RealtimeScoreUpdate | null;
  
  // All scores received during this session
  scores: RealtimeScoreUpdate[];
  
  // Connection status
  status: ConnectionStatus;
  
  // Is currently connected
  isConnected: boolean;
  
  // Number of reconnection attempts
  reconnectAttempts: number;
  
  // Error message if connection failed
  error: string | null;
  
  // Number of connected clients (from server)
  connectionCount: number;
  
  // Manual reconnect function
  reconnect: () => void;
  
  // Clear all scores
  clearScores: () => void;
}

/**
 * Custom hook for real-time score updates via WebSocket
 * 
 * Features:
 * - Automatic connection on mount
 * - Auto-reconnection (retry every 3s, max 10 attempts) - Requirement 6.5, 20.2
 * - Connection status tracking - Requirement 20.1, 20.3
 * - Score update handling - Requirement 6.3, 6.4
 * - Error handling - Requirement 20.4
 * - Automatic cleanup on unmount
 * 
 * @param competitionId - Competition ID to subscribe to
 * @param options - Optional configuration
 * @returns WebSocket connection state and score data
 */
export function useRealtimeScores(
  competitionId: number | null,
  options?: {
    enabled?: boolean; // Enable/disable connection (default: true)
    maxReconnectAttempts?: number; // Max reconnection attempts (default: 10)
    reconnectDelay?: number; // Delay between reconnects in ms (default: 3000)
  }
): UseRealtimeScoresReturn {
  const {
    enabled = true,
    maxReconnectAttempts = 10,
    reconnectDelay = 3000
  } = options || {};

  // State
  const [latestScore, setLatestScore] = useState<RealtimeScoreUpdate | null>(null);
  const [scores, setScores] = useState<RealtimeScoreUpdate[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);

  // Refs to persist across renders
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnect = useRef(false);

  // Derived state
  const isConnected = status === 'connected';

  /**
   * Clear reconnection timeout
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Attempt to reconnect with exponential backoff
   * Requirement 6.5: Retry every 3s for up to 10 attempts
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus('failed');
      setError(`Failed to connect after ${maxReconnectAttempts} attempts`);
      return;
    }

    clearReconnectTimeout();
    
    setStatus('reconnecting');
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    }, reconnectDelay);
  }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay, clearReconnectTimeout]);

  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    setError(null);
    isManualDisconnect.current = false;
    
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  /**
   * Clear all scores
   */
  const clearScores = useCallback(() => {
    setScores([]);
    setLatestScore(null);
  }, []);

  /**
   * Initialize WebSocket connection
   * Requirement 20.1: Establish connection on page load
   */
  useEffect(() => {
    // Don't connect if disabled or no competition ID
    if (!enabled || !competitionId) {
      setStatus('disconnected');
      return;
    }

    // Get WebSocket URL from environment
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

    // Create Socket.io client instance
    // Requirement 6.4, 20.1: WebSocket connection with proper configuration
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
      reconnection: false, // We handle reconnection manually
      autoConnect: true,
      timeout: 10000,
    });

    socketRef.current = socket;
    isManualDisconnect.current = false;
    setStatus('connecting');
    setError(null);

    // Connection established
    // Requirement 6.4, 20.1: Track connection status
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      setStatus('connected');
      setError(null);
      setReconnectAttempts(0);
      clearReconnectTimeout();

      // Join competition room
      // Requirement 6.4: Join competition-specific room
      socket.emit('join-competition', competitionId);
    });

    // Successfully joined competition
    socket.on('joined-competition', (data: WebSocketEvents['joined-competition']) => {
      console.log(`👥 Joined competition ${data.competition_id}, ${data.connection_count} connected`);
      setConnectionCount(data.connection_count);
    });

    // Score update received
    // Requirement 6.3: Handle score-update events
    socket.on('score-update', (event: WebSocketEvents['score-update']) => {
      console.log('📊 Score update received:', event.type, event.data);
      
      const scoreUpdate = event.data;
      
      // Update latest score
      setLatestScore(scoreUpdate);
      
      // Add to scores array (only if it's a new score, not initial)
      if (event.type === 'SCORE_UPDATED') {
        setScores(prev => [...prev, scoreUpdate]);
      }
    });

    // Connection error
    // Requirement 20.4: Connection error handling
    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err.message);
      setError(err.message);
      
      // Attempt reconnection if not manual disconnect
      // Requirement 6.5, 20.2: Auto-reconnection logic
      if (!isManualDisconnect.current) {
        attemptReconnect();
      }
    });

    // Disconnection
    // Requirement 6.5, 20.2: Handle disconnection and reconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setStatus('disconnected');

      // Attempt reconnection for unexpected disconnects
      // Requirement 6.5: Attempt to reconnect within 3 seconds
      if (!isManualDisconnect.current && reason !== 'io client disconnect') {
        attemptReconnect();
      }
    });

    // Server error
    socket.on('error', (errorData: WebSocketEvents['error']) => {
      console.error('❌ WebSocket error:', errorData);
      setError(`${errorData.code}: ${errorData.message}`);
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      isManualDisconnect.current = true;
      clearReconnectTimeout();
      
      if (socket.connected) {
        socket.emit('leave-competition', competitionId);
      }
      
      socket.disconnect();
      socketRef.current = null;
    };
  }, [competitionId, enabled, attemptReconnect, clearReconnectTimeout]);

  return {
    latestScore,
    scores,
    status,
    isConnected,
    reconnectAttempts,
    error,
    connectionCount,
    reconnect,
    clearScores
  };
}
