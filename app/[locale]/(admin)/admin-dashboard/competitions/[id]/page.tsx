// Competition edit page
// Requirements: 2.1, 2.2, 13.1, 13.2, 15.1, 15.4

import type { Metadata } from 'next';
import { CompetitionEditClient } from '@/components/admin/competition-edit-client';
import { useTranslation } from '@/i18n/use-dictionary';

export const metadata: Metadata = {
  title: '编辑比赛 | Scoring System',
  description: '编辑比赛信息和选手名单',
};

export default function CompetitionEditPage() {
  return <CompetitionEditClient />;
}
