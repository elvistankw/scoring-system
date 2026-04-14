'use client';

// Admin Dashboard Client Component
// Requirements: 1.1, 1.3, 1.4, 15.1, 15.4

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { SkeletonCard } from '@/components/shared/loading-skeleton';
import { useTranslation } from '@/i18n/use-dictionary';

export function AdminDashboard() {
  const { user, isLoading, isAdmin } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    } else if (!isLoading && user && !isAdmin) {
      router.push('/judge-dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('admin.dashboard')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('admin.welcomeBack')}，{user.username}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Competition Management Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('admin.competitionManagement')}
              </h2>
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
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
              {t('admin.createCompetition')}
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              {t('admin.manageCompetitions')}
            </button>
          </div>

          {/* Athlete Management Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('admin.athleteManagement')}
              </h2>
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('admin.createAthlete')}
            </p>
            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              {t('admin.manageAthletes')}
            </button>
          </div>

          {/* Statistics Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('admin.statistics')}
              </h2>
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('admin.viewStats')}
            </p>
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              {t('admin.viewStatistics')}
            </button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ {t('admin.systemInfo')}
          </h3>
          <p className="text-blue-800 dark:text-blue-200">
            {t('admin.systemInfoDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
