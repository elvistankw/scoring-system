// Email verification page
// Requirements: 1.1, 1.2, 15.1, 15.5

import type { Metadata } from 'next';
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
    title: dict.metadata.verifyEmail.title,
    description: dict.metadata.verifyEmail.description,
  };
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {dict.auth.verifyEmail}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {dict.auth.checkEmail}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
          <div className="text-6xl mb-4">📧</div>
          <p className="text-gray-700 dark:text-gray-300">
            {dict.auth.verificationSent}
          </p>
        </div>
      </div>
    </div>
  );
}
