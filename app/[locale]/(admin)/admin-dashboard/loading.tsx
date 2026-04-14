// Loading state for admin dashboard
// Requirements: 13.1, 13.2, 13.4, 13.5

import { SkeletonCompetitionList } from '@/components/shared/loading-skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="animate-pulse">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>

        {/* Competition List Skeleton */}
        <SkeletonCompetitionList count={6} />
      </div>
    </div>
  );
}
