// Loading state for judge dashboard
// Requirements: 13.1, 13.2, 13.4, 13.5

import { SkeletonCompetitionList } from '@/components/shared/loading-skeleton';

export default function JudgeDashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-48 mb-2" />
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-64" />
      </div>
      
      {/* Filter skeleton */}
      <div className="mb-6 flex gap-4">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-10 w-48" />
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-10 w-48" />
      </div>
      
      {/* Competition list skeleton */}
      <SkeletonCompetitionList count={6} />
    </div>
  );
}
