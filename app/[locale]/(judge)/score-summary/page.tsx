// Score summary page for judges
// Requirements: 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 13.1, 13.2

import type { Metadata } from 'next';
import { ScoreSummaryClient } from '@/components/judge/score-summary-client';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: '评分汇总 | Scoring System',
  description: '查看比赛评分汇总和选手得分详情',
};

export default function ScoreSummaryPage() {
  return <ScoreSummaryClient />;
}