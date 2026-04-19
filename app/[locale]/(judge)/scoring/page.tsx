// Judge scoring page
// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 7.2, 7.3, 7.4, 12.1, 12.2, 12.3, 12.4, 12.5, 14.1, 14.2, 14.3, 15.1, 15.3

import type { Metadata } from 'next';
import ScoringPageClient from '@/components/judge/scoring-client';

export const metadata: Metadata = {
  title: '评分界面 | Scoring System',
  description: '评审打分界面 - 为选手评分',
};

export default function ScoringPage() {
  return <ScoringPageClient />;
}
