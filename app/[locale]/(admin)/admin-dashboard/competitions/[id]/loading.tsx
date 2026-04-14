// Loading state for competition edit page
// Requirements: 13.1, 13.2

import { SkeletonCard, SkeletonAthleteList } from '@/components/shared/loading-skeleton';

export default function CompetitionEditLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <SkeletonCard />
      <SkeletonAthleteList count={8} />
    </div>
  );
}
