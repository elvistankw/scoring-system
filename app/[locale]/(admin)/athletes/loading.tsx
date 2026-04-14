// Loading skeleton for athlete management page
// Requirements: 13.1, 13.2, 13.4

export default function AthletesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {/* Search bar skeleton */}
          <div className="mb-6">
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>

          {/* Results count skeleton */}
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />

          {/* Athlete cards skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Name and number */}
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    </div>
                    
                    {/* Team name */}
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    
                    {/* Contact info */}
                    <div className="flex gap-4">
                      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 ml-4">
                    <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
