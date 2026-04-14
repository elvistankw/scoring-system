// Loading skeleton for scoreboard page
// Requirements: 13.1, 13.2, 13.4, 13.5

import { SkeletonScoreboard } from '@/components/shared/loading-skeleton';

export default function ScoreboardLoading() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-10 w-64 bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-40 bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="h-4 w-16 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-12 bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          <div className="text-right">
            <div className="h-4 w-16 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-12 bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          <div className="text-right">
            <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Scoreboard Skeleton */}
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
        <SkeletonScoreboard rows={10} />
      </div>

      {/* Footer Skeleton */}
      <div className="mt-6 text-center">
        <div className="h-4 w-48 bg-gray-700 rounded animate-pulse mx-auto mb-2"></div>
        <div className="h-4 w-64 bg-gray-700 rounded animate-pulse mx-auto"></div>
      </div>
    </div>
  );
}
