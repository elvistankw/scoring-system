// Admin Dashboard Client Component
// Requirements: 2.1, 2.2, 8.1, 8.2, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/i18n/use-dictionary';
import { DynamicCompetitionList, DynamicCompetitionForm } from '@/lib/dynamic-imports';
import { AdminUserMenu } from '@/components/admin/admin-user-menu';
import { measurePageLoad } from '@/lib/performance-monitor';
import type { Competition } from '@/interface/competition';
import type { Locale } from '@/i18n/config';

interface AdminDashboardClientProps {
  locale: Locale;
}

export function AdminDashboardClient({ locale }: AdminDashboardClientProps) {
  const router = useRouter();
  const { user, isLoading, isAdmin, logout } = useUser();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Locale is passed as prop, no need to extract from URL

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('AdminDashboard');
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      const targetLocale = locale || 'zh';
      router.push(`/${targetLocale}/sign-in`);
    }
  }, [isLoading, isAdmin, router, locale]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const handleCreateNew = () => {
    setEditingCompetition(null);
    setShowForm(true);
  };

  const handleEdit = (competition: Competition) => {
    setEditingCompetition(competition);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCompetition(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCompetition(null);
  };

  const handleViewDetails = (competition: Competition) => {
    // Navigate to competition details page with locale
    const targetLocale = locale || 'zh';
    router.push(`/${targetLocale}/admin-dashboard/competitions/${competition.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('admin.competitionManagement')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.createCompetition')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {!showForm && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                + {t('competition.addCompetition')}
              </button>
            )}
            
            <AdminUserMenu locale={locale} />
          </div>
        </div>

        {/* Form or List */}
        {showForm ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingCompetition ? t('competition.editCompetition') : t('competition.addCompetition')}
            </h2>
            <DynamicCompetitionForm
              competition={editingCompetition}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : (
          <DynamicCompetitionList
            key={refreshKey}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>
    </div>
  );
}
