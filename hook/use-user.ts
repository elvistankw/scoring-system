// Authentication state management hook
// Requirements: 1.1, 1.2, 1.3, 1.4, 18.1, 18.2, 18.3, 18.4

'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import type { User, LoginRequest, RegisterRequest } from '@/interface/user';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = authClient.getUser();
        const token = authClient.getToken();

        if (storedUser && token) {
          // Verify token is still valid
          const isValid = await authClient.verifyToken();
          if (isValid) {
            setUser(storedUser);
          } else {
            authClient.clearAuth();
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await authClient.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      setIsError(true);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await authClient.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      setIsError(true);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await authClient.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isJudge: user?.role === 'judge',
    login,
    register,
    logout,
  };
}
