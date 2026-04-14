// Rankings page for displaying athlete rankings with average scores
// Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.4, 12.1, 12.2

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { RankingsClient } from './rankings-client';
import { useTranslation } from '@/i18n/use-dictionary';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.rankings.title,
    description: dict.metadata.rankings.description,
    keywords: ['实时排名', '比赛排行榜', '平均得分', 'rankings', 'leaderboard'],
  };
}

/**
 * Rankings page - Server Component
 * Delegates to client component for WebSocket functionality and interactivity
 */
export default async function RankingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <RankingsClient />;
}
