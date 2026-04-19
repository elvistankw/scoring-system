// Admin athlete management page
// Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 15.1, 15.4, 17.3, 18.1, 18.2, 18.3
// Fixed import path

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { AthleteManagementClient } from '@/components/admin/athlete-management-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.athletes.title,
    description: dict.metadata.athletes.description,
  };
}

export default async function AthletesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <AthleteManagementClient locale={locale} />;
}
