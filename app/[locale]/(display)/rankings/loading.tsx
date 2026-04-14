// Loading skeleton for rankings page
// Requirements: 13.1, 13.2, 13.4, 13.5

export default function RankingsLoading() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-10 w-64 bg-gray-700 rounded mb-2"></div>
          <div className="h-5 w-48 bg-gray-700 rounded"></div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="h-4 w-16 bg-gray-700 rounded mb-2"></div>
            <div className="h-8 w-12 bg-gray-700 rounded"></div>
          </div>
          
          <div className="text-right">
            <div className="h-4 w-16 bg-gray-700 rounded mb-2"></div>
            <div className="h-8 w-12 bg-gray-700 rounded"></div>
          </div>
          
          <div className="text-right">
            <div className="h-4 w-16 bg-gray-700 rounded mb-2"></div>
            <div className="h-6 w-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="grid grid-cols-9 gap-4 p-4 bg-gray-700 border-b-2 border-gray-600">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-600 rounded"></div>
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-700">
          {Array.from({ length: 10 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-9 gap-4 p-4">
              {Array.from({ length: 9 }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className="h-6 bg-gray-700 rounded"
                  style={{ 
                    opacity: 1 - (rowIndex * 0.05) 
                  }}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="mt-6 text-center">
        <div className="h-4 w-64 bg-gray-700 rounded mx-auto mb-2"></div>
        <div className="h-4 w-48 bg-gray-700 rounded mx-auto"></div>
      </div>
    </div>
  );
}
