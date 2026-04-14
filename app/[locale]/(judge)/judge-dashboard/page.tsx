// Judge Dashboard Page - Competition Selection
// Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 13.1, 13.2, 15.1, 15.3, 17.3, 18.1, 18.2

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { JudgeDashboardClient } from '@/components/judge/judge-dashboard-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.judgeDashboard.title,
    description: dict.metadata.judgeDashboard.description,
  };
}

export default async function JudgeDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <JudgeDashboardClient />;
}
