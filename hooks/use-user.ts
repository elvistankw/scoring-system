// Custom hook for user authentication state
// Requirements: 1.1, 1.3, 1.4, 18.1, 18.2, 18.3

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import type { User } from '@/interface/user';

interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isJudge: boolean;
  login: typeof authClient.login;
  logout: () => Promise<void>;
  refresh: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUser = () => {
    const storedUser = authClient.getUser();
    setUser(storedUser);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUser();

    // Listen for storage changes (for multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user' || e.key === 'auth_token') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = async () => {
    await authClient.logout();
    setUser(null);
    router.push('/sign-in');
  };

  const refresh = () => {
    loadUser();
  };

  return {
    user,
    isLoading,
    isAuthenticated: authClient.isAuthenticated(),
    isAdmin: user?.role === 'admin',
    isJudge: user?.role === 'judge',
    login: authClient.login,
    logout,
    refresh,
  };
}
