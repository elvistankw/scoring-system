// Judge Management Page
// Requirements: Judge Identity System
// Fixed import path

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { JudgeManagementClient } from '@/components/admin/judge-management-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: `${dict.admin.judgeManagement} | Scoring System`,
    description: dict.admin.createJudge,
  };
}

export default async function JudgesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <JudgeManagementClient locale={locale} />;
}