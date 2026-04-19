'use client';

// Judge Management Client Component
// Requirements: Judge Identity System

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { JudgeList } from '@/components/admin/judge-list';
import { SkeletonCard } from '@/components/shared/loading-skeleton';
import { BackButton } from '@/components/shared/back-button';
import { useTranslation } from '@/i18n/use-dictionary';
import type { Locale } from '@/i18n/config';

interface JudgeManagementClientProps {
  locale: Locale;
}

export function JudgeManagementClient({ locale }: JudgeManagementClientProps) {
  const { user, isLoading, isAdmin } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !user) {
      const targetLocale = locale || 'zh';
      router.push(`/${targetLocale}/sign-in`);
    } else if (!isLoading && user && !isAdmin) {
      const targetLocale = locale || 'zh';
      router.push(`/${targetLocale}/judge-landing`);
    }
  }, [user, isLoading, isAdmin, router, locale]);

  // Show loading while checking authentication
  if (isLoading) {
    return <SkeletonCard />;
  }

  // Don't render anything if not authenticated or not admin
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('admin.judgeManagement')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('admin.createJudge')}
            </p>
          </div>
        </div>

        {/* Judge List - Only render when user is confirmed admin */}
        {user && isAdmin && <JudgeList />}
      </div>
    </div>
  );
}