// Google OAuth success client component
// Requirements: Google OAuth integration

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/use-dictionary';

export function GoogleSuccessClient() {
  const { t } = useTranslation();

  const router = useRouter();

  useEffect(() => {
    // Auto-close window after 2 seconds
    const timer = setTimeout(() => {
      window.close();
      // If window.close() doesn't work (not opened by script), redirect
      setTimeout(() => {
        router.push('/zh/score-summary');
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          授权成功！
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          您的Google账户已成功连接
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          <span>{t('common.closingWindow')}</span>
        </div>
      </div>
    </div>
  );
}
