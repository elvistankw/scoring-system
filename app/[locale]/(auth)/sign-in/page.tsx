// Sign-in page with form validation
// Requirements: 1.1, 1.2, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2, 14.3, 15.1, 15.3, 15.5

import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { DynamicSignInClient } from '@/lib/dynamic-imports';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.signIn.title,
    description: dict.metadata.signIn.description,
  };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  return <DynamicSignInClient locale={locale} />;
}
