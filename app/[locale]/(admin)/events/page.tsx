// Event Management Page
// Requirements: Admin Dashboard, Event Management
// Fixed import path

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { EventManagementClient } from '@/components/admin/event-management-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: `${dict.admin.eventManagement} | Scoring System`,
    description: '管理活动海报和背景视频 / Manage event posters and background videos',
  };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <EventManagementClient locale={locale} />;
}
