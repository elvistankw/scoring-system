// Loading component for score summary page
// Requirements: 2.1, 2.2, 4.1, 4.2

import { DiaboloLoading } from '@/components/shared/diabolo-loading';

export default function ScoreSummaryLoading() {
  return <DiaboloLoading message="加载成绩汇总..." />;
}