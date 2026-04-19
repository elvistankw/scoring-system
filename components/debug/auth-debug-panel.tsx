'use client';

// Authentication Debug Panel - Only shown in development
// Helps users and developers debug authentication issues

import { useState, useEffect } from 'react';
import { authDebug } from '@/lib/auth-debug';

export function AuthDebugPanel() {
  const [authState, setAuthState] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      updateAuthState();
    }
  }, []);

  const updateAuthState = () => {
    const state = authDebug.checkAuthState();
    setAuthState(state);
  };

  const handleClearAuth = () => {
    authDebug.clearAuth();
    updateAuthState();
    // Reload page to reset state
    window.location.reload();
  };

  const handleFixIssues = () => {
    const fixed = authDebug.fixAuthIssues();
    updateAuthState();
    if (fixed) {
      // Reload page to reset state
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleLogState = () => {
    authDebug.logAuthState();
  };

  if (!isVisible || !authState) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-yellow-400">🔧 Auth Debug</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Token:</span>
            <span className={authState.hasToken ? 'text-green-400' : 'text-red-400'}>
              {authState.hasToken ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>User:</span>
            <span className={authState.hasUser ? 'text-green-400' : 'text-red-400'}>
              {authState.hasUser ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Expired:</span>
            <span className={authState.isExpired ? 'text-red-400' : 'text-green-400'}>
              {authState.isExpired ? '✓' : '✗'}
            </span>
          </div>
          
          {authState.tokenInfo && (
            <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
              <div>Role: {authState.tokenInfo.role}</div>
              <div>User: {authState.tokenInfo.username}</div>
              {authState.tokenInfo.expiresAt && (
                <div>Expires: {authState.tokenInfo.expiresAt.toLocaleTimeString()}</div>
              )}
            </div>
          )}
          
          {/* Show helpful message when no auth data */}
          {!authState.hasToken && !authState.hasUser && (
            <div className="mt-2 p-2 bg-blue-900 rounded text-xs text-blue-200">
              ℹ️ No authentication data found. Please sign in.
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleLogState}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Log
          </button>
          
          <button
            onClick={handleFixIssues}
            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
          >
            Fix
          </button>
          
          <button
            onClick={handleClearAuth}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            Clear
          </button>
        </div>
        
        {(authState.isExpired || (!authState.hasToken && authState.hasUser)) && (
          <div className="mt-2 p-2 bg-red-900 rounded text-xs text-red-200">
            ⚠️ Auth issues detected. Click "Fix" to resolve.
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to show debug panel when there are auth errors
export function useAuthDebugOnError() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleError = (event: ErrorEvent) => {
        if (event.error?.message?.includes('Authentication') || 
            event.error?.message?.includes('Unauthorized')) {
          console.log('🔧 Authentication error detected, showing debug info...');
          authDebug.logAuthState();
        }
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }
  }, []);
}