'use client';

// Judge Dashboard Client Component
// Requirements: 1.1, 1.3, 1.4, 15.1, 15.3

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { SkeletonCard } from '@/components/shared/loading-skeleton';
import { useTranslation } from '@/i18n/use-dictionary';

export function JudgeDashboard() {
  const { user, isLoading, isJudge } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    } else if (!isLoading && user && !isJudge) {
      router.push('/admin-dashboard');
    }
  }, [user, isLoading, isJudge, router]);

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!user || !isJudge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('judge.dashboard')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('admin.welcomeBack')}，{user.username}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Select Competition Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('judge.selectCompetition')}
              </h2>
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('judge.selectCompetition')}
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {t('judge.selectCompetition')}
            </button>
          </div>

          {/* Scoring Interface Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('judge.scoring')}
              </h2>
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('judge.scoring')}
            </p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              {t('judge.scoring')}
            </button>
          </div>

          {/* My Scores Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('judge.scoreSummary')}
              </h2>
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('judge.scoreSummary')}
            </p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              {t('common.view')}
            </button>
          </div>

          {/* Help Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('judge.help')}
              </h2>
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('judge.helpDescription')}
            </p>
            <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              {t('judge.viewHelp')}
            </button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            ℹ️ {t('judge.scoringTip')}
          </h3>
          <p className="text-green-800 dark:text-green-200">
            {t('judge.scoringTipDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
