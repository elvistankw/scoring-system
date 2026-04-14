// TypeScript interfaces for User entity
// Requirements: 1.1, 1.2, 1.3, 19.1, 19.2, 19.3, 19.5

export type UserRole = 'admin' | 'judge';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
