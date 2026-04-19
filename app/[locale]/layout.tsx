import type { Metadata } from 'next';
import { Providers } from '@/components/shared/providers';
import { ConditionalFooter } from '@/components/shared/conditional-footer';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale, type Locale } from '@/i18n/config';

export const metadata: Metadata = {
  title: 'Scoring System | 评分系统',
  description: '实时比赛评分系统 - 支持多种赛事类型的实时评分与展示',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params to get locale (Next.js 15+ requirement)
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam) as Locale;
  
  // Load dictionary for this locale
  const dictionary = await getDictionary(locale);
  
  return (
    <Providers dictionary={dictionary}>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        <ConditionalFooter />
      </div>
    </Providers>
  );
}
