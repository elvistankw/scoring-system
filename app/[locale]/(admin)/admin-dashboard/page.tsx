// Admin Dashboard Page - Competition Management
// Requirements: 2.1, 2.2, 8.1, 8.2, 13.1, 13.2, 13.5, 14.1, 14.2, 15.1, 15.4, 17.3, 18.1, 18.2, 18.3

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.adminDashboard.title,
    description: dict.metadata.adminDashboard.description,
  };
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <AdminDashboardClient locale={locale} />;
}
