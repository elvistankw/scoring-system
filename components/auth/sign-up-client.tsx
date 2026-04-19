'use client';

// Sign-up client component
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

interface SignUpClientProps {
  locale: Locale;
}

export function SignUpClient({ locale }: SignUpClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: isCheckingAuth } = useUser();

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('SignUp');
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isCheckingAuth && user) {
      if (user.role === 'admin') {
        router.replace(`/${locale}/admin-dashboard`);
      } else {
        // Non-admin users should not access registration page
        toast.error('Access denied. Admin access only.');
        router.replace(`/${locale}`);
      }
    }
  }, [user, isCheckingAuth, router, locale]);

  const handleSignUp = async (data: AuthFormData) => {
    if (!data.username || !data.role) {
      toast.error(t('validation.required'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.register({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      // Verify response structure
      if (!response || !response.user || !response.user.role) {
        throw new Error(t('auth.signUpError'));
      }

      toast.success(t('auth.signUpSuccess'));

      // Redirect based on role with locale using replace to prevent back navigation
      if (response.user.role === 'admin') {
        router.replace(`/${locale}/admin-dashboard`);
      } else {
        toast.error('Access denied. Admin access only.');
        router.replace(`/${locale}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.signUpError');
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
            {t('auth.signUp')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('metadata.signUp.description')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <AuthForm mode="sign-up" onSubmit={handleSignUp} isLoading={isLoading} />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('auth.hasAccount')}{' '}
              <Link
                href={`/${locale}/sign-in`}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {t('auth.signInNow')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
