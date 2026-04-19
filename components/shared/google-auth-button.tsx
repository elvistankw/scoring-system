// Google authentication button component
// Requirements: Google OAuth integration, user authentication

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import { useTranslation } from '@/i18n/use-dictionary';

// Temporary flag to disable Google OAuth in production
const GOOGLE_AUTH_ENABLED = process.env.NODE_ENV === 'development';

interface GoogleAuthButtonProps {
  onAuthSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export function GoogleAuthButton({ 
  onAuthSuccess, 
  className = '',
  variant = 'default'
}: GoogleAuthButtonProps) {
  const { t } = useTranslation();

  // If Google Auth is disabled, don't render anything
  if (!GOOGLE_AUTH_ENABLED) {
    return null;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // Check authorization status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_ENDPOINTS.auth.google}/status`, {
        headers: getAuthHeaders(token),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthorized(data.data.is_authorized);
        setGoogleEmail(data.data.google_email);
      } else if (response.status === 503) {
        // Google OAuth is disabled, don't show error
        setIsAuthorized(false);
        setGoogleEmail(null);
      }
    } catch (error) {
      console.error('检查Google授权状态失败:', error);
      // Don't show error toast for status check failures
      setIsAuthorized(false);
      setGoogleEmail(null);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error(t('auth.pleaseLogin'));
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.auth.google}/auth-url`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        // Handle 503 Service Unavailable (Google OAuth disabled)
        if (response.status === 503) {
          const errorData = await response.json();
          toast.error(errorData.message || 'Google OAuth 服务暂时不可用');
          return;
        }
        throw new Error('获取授权链接失败');
      }

      const data = await response.json();
      
      // Open Google authorization page in new window
      const authWindow = window.open(
        data.data.auth_url,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Monitor authorization completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          // Check authorization status after window closes
          setTimeout(async () => {
            await checkAuthStatus();
            if (isAuthorized) {
              toast.success('Google账户授权成功！');
              onAuthSuccess?.();
            }
          }, 1000);
        }
      }, 1000);

    } catch (error) {
      console.error('Google授权失败:', error);
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error('无法连接到服务器，请检查网络连接');
      } else {
        toast.error('Google授权失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If already authorized, show status
  if (isAuthorized && googleEmail) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg ${className}`}>
        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-green-700 dark:text-green-300">
          {variant === 'compact' ? t('connection.connected') : `已连接: ${googleEmail}`}
        </span>
      </div>
    );
  }

  // Show connect button
  return (
    <button
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 
        border border-gray-300 dark:border-gray-600 rounded-lg 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {isLoading ? '授权中...' : '连接Google账户'}
      </span>
    </button>
  );
}
