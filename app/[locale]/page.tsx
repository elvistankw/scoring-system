// Root locale page - redirects to sign-in
// Requirements: 15.1, 15.5

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.home.title,
    description: dict.metadata.home.description,
  };
}

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Redirect to sign-in page with locale
  redirect(`/${locale}/sign-in`);
}
