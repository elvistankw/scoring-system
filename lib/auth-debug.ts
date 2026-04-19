// Authentication debugging utilities for frontend
// Helps diagnose and fix authentication issues

import { authClient } from './auth-client';

export const authDebug = {
  // Check current authentication state
  checkAuthState(): {
    hasToken: boolean;
    hasUser: boolean;
    tokenInfo: any;
    isExpired: boolean;
  } {
    const token = authClient.getToken();
    const user = authClient.getUser();
    
    let tokenInfo = null;
    let isExpired = false;
    
    if (token) {
      try {
        // Decode token without verification (client-side)
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        tokenInfo = {
          id: payload.id,
          username: payload.username,
          role: payload.role,
          type: payload.type,
          issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        };
        isExpired = payload.exp ? (payload.exp * 1000 < Date.now()) : false;
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      tokenInfo,
      isExpired
    };
  },

  // Clear all authentication data
  clearAuth(): void {
    authClient.clearAuth();
    console.log('🧹 Authentication data cleared');
  },

  // Log authentication state for debugging
  logAuthState(): void {
    const state = this.checkAuthState();
    console.log('🔍 Authentication State:', {
      hasToken: state.hasToken,
      hasUser: state.hasUser,
      isExpired: state.isExpired,
      tokenInfo: state.tokenInfo
    });
    
    if (state.isExpired) {
      console.warn('⚠️ Token is expired - user needs to login again');
    }
    
    if (state.hasToken && !state.hasUser) {
      console.warn('⚠️ Token exists but no user data - possible data corruption');
    }
  },

  // Fix common authentication issues
  fixAuthIssues(): boolean {
    const state = this.checkAuthState();
    let fixed = false;
    
    // Fix 1: Clear expired tokens
    if (state.isExpired) {
      console.log('🔧 Clearing expired token');
      this.clearAuth();
      fixed = true;
    }
    
    // Fix 2: Clear corrupted data (token without user or vice versa)
    if ((state.hasToken && !state.hasUser) || (!state.hasToken && state.hasUser)) {
      console.log('🔧 Clearing corrupted authentication data');
      this.clearAuth();
      fixed = true;
    }
    
    // Fix 3: Clear malformed tokens
    if (state.hasToken && !state.tokenInfo) {
      console.log('🔧 Clearing malformed token');
      this.clearAuth();
      fixed = true;
    }
    
    if (fixed) {
      console.log('✅ Authentication issues fixed - please login again');
    } else {
      console.log('ℹ️ No authentication issues detected');
    }
    
    return fixed;
  }
};

// Auto-fix authentication issues on import (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only run auto-fix if there are obvious issues
  const state = authDebug.checkAuthState();
  if (state.isExpired || (state.hasToken && !state.tokenInfo)) {
    console.log('🔧 Auto-fixing authentication issues...');
    authDebug.fixAuthIssues();
  }
}