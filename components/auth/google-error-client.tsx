// Google OAuth error client component
// Requirements: Google OAuth integration

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/i18n/use-dictionary';

export function GoogleErrorClient() {
  const { t } = useTranslation();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState(t('auth.signInError'));

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setErrorMessage(decodeURIComponent(message));
    }

    // Auto-close window after 5 seconds
    const timer = setTimeout(() => {
      window.close();
      // If window.close() doesn't work (not opened by script), redirect
      setTimeout(() => {
        router.push('/zh/score-summary');
      }, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          授权失败
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {errorMessage}
        </p>
        
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          关闭窗口
        </button>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
          <span>{t('common.windowAutoClose')}</span>
        </div>
      </div>
    </div>
  );
}
