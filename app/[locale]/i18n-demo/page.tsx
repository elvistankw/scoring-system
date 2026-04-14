import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';
import { I18nDemoClient } from './i18n-demo-client';

export const metadata: Metadata = {
  title: 'i18n Demo | Scoring System',
  description: 'Internationalization demonstration',
};

export default async function I18nDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Server Component Example */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {dict.common.welcome} - Server Component
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p><strong>Current Locale:</strong> {locale}</p>
            <p><strong>Loading:</strong> {dict.common.loading}</p>
            <p><strong>Submit:</strong> {dict.common.submit}</p>
            <p><strong>Cancel:</strong> {dict.common.cancel}</p>
          </div>
        </div>

        {/* Client Component Example */}
        <I18nDemoClient locale={locale} />
      </div>
    </div>
  );
}
