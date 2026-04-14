// Authentication client with token management
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3

import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@/interface/user';
import { API_ENDPOINTS, getAuthHeaders } from './api-config';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Token management
export const authClient = {
  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  // Set token
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Remove token
  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  // Get stored user
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  // Set user
  setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Remove user
  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  },

  // Clear all auth data
  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Check if user has specific role
  hasRole(role: 'admin' | 'judge'): boolean {
    const user = this.getUser();
    return user?.role === role;
  },

  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Login failed');
    }

    // Backend returns data in nested structure: { status, message, data: { token, user } }
    const data: AuthResponse = responseData.data || responseData;

    if (data.token && data.user) {
      this.setToken(data.token);
      this.setUser(data.user);
    } else {
      throw new Error('Invalid response format from server');
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
      message: responseData.message
    };
  },

  // Register
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(API_ENDPOINTS.auth.register, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Registration failed');
    }

    // Backend returns data in nested structure: { status, message, data: { token, user } }
    const data: AuthResponse = responseData.data || responseData;

    if (data.token && data.user) {
      this.setToken(data.token);
      this.setUser(data.user);
    } else {
      throw new Error('Invalid response format from server');
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
      message: responseData.message
    };
  },

  // Logout
  async logout(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(API_ENDPOINTS.auth.logout, {
          method: 'POST',
          headers: getAuthHeaders(token),
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    this.clearAuth();
  },

  // Verify token
  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(API_ENDPOINTS.auth.verify, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        this.clearAuth();
        return false;
      }

      return true;
    } catch {
      this.clearAuth();
      return false;
    }
  },

  // Get auth headers for API requests
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return getAuthHeaders(token);
  },
};
