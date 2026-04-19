'use client';

// Sign-in client component
// Requirements: 1.1, 1.2, 13.5, 14.1, 14.2, 14.3

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { AuthForm, type AuthFormData } from '@/components/auth/auth-form';
import { authClient } from '@/lib/auth-client';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/i18n/use-dictionary';
import { measurePageLoad } from '@/lib/performance-monitor';
import type { Locale } from '@/i18n/config';

interface SignInClientProps {
  locale: Locale;
}

export function SignInClient({ locale }: SignInClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: isCheckingAuth } = useUser();

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('SignIn');
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isCheckingAuth && user) {
      if (user.role === 'admin') {
        router.replace(`/${locale}/admin-dashboard`);
      } else {
        // Non-admin users should not access login page
        toast.error('Access denied. Admin access only.');
        router.replace(`/${locale}`);
      }
    }
  }, [user, isCheckingAuth, router, locale]);

  const handleSignIn = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      const response = await authClient.login({
        email: data.email,
        password: data.password,
      });

      // Verify response structure
      if (!response || !response.user || !response.user.role) {
        throw new Error(t('auth.signInError'));
      }

      toast.success(t('auth.signInSuccess'));

      // Redirect based on role with locale using replace to prevent back navigation
      if (response.user.role === 'admin') {
        router.replace(`/${locale}/admin-dashboard`);
      } else {
        toast.error('Access denied. Admin access only.');
        router.replace(`/${locale}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.signInError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render form if already authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('auth.signIn')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('metadata.signIn.description')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <AuthForm mode="sign-in" onSubmit={handleSignIn} isLoading={isLoading} />

          {/* Clear Authentication Button - helpful for auth issues */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                authClient.clearAuth();
                toast.success('Authentication data cleared. Please try signing in again.');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            >
              Clear saved authentication data
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link
                href={`/${locale}/sign-up`}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {t('auth.signUpNow')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
