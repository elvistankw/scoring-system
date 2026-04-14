// Loading skeleton for sign-in page
// Requirements: 13.1, 13.2, 13.4

import { Skeleton } from '@/components/shared/loading-skeleton';

export default function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Skeleton className="h-9 w-32 mx-auto mb-2" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full mt-6" />
          </div>

          <div className="mt-6 text-center">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
