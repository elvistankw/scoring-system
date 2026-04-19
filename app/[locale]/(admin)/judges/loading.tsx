// Judge Management Loading Page
// Requirements: Judge Identity System

import { SkeletonCard } from '@/components/shared/loading-skeleton';

export default function JudgesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
        </div>
        <SkeletonCard />
      </div>
    </div>
  );
}