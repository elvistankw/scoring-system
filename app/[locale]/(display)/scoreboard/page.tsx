// Scoreboard page for real-time score display
// Requirements: 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.4, 12.1, 12.2, 15.1, 15.2, 20.1, 20.3

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { ScoreboardClient } from './scoreboard-client';
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
    title: dict.metadata.scoreboard.title,
    description: dict.metadata.scoreboard.description,
    keywords: ['实时比分', '比赛大屏幕', '得分显示', 'scoreboard'],
  };
}

/**
 * Scoreboard page - Server Component
 * Delegates to client component for WebSocket functionality
 */
export default async function ScoreboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <ScoreboardClient />;
}
