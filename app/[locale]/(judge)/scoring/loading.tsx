// Loading skeleton for judge scoring page
// Requirements: 13.1, 13.2, 13.3, 13.4, 13.5

export default function ScoringLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>

        {/* Competition Selection Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Athlete and Form Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Athlete List Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
              <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
