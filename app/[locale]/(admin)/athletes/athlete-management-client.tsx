// Client component for athlete management
// Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Athlete } from '@/interface/athlete';
import { DynamicAthleteForm, DynamicAthleteList, DynamicCompetitionAthleteList } from '@/lib/dynamic-imports';
import { measurePageLoad } from '@/lib/performance-monitor';
import { useTranslation } from '@/i18n/use-dictionary';
import { BackButton } from '@/components/shared/back-button';
import type { Competition } from '@/interface/competition';
import type { Locale } from '@/i18n/config';

interface AthleteManagementClientProps {
  locale: Locale;
}

export function AthleteManagementClient({ locale }: AthleteManagementClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [showForm, setShowForm] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [viewingCompetitions, setViewingCompetitions] = useState<Athlete | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('AthleteManagement');
  }, []);

  const handleCreateNew = () => {
    setEditingAthlete(null);
    setShowForm(true);
  };

  const handleEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAthlete(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAthlete(null);
  };

  const handleViewCompetitions = (athlete: Athlete) => {
    setViewingCompetitions(athlete);
    // In a real implementation, you would fetch the athlete's competitions
    // For now, we'll just show a placeholder
  };

  const handleGoBack = () => {
    // Navigate back to admin dashboard
    const segments = pathname.split('/');
    const locale = segments[1];
    router.push(`/${locale}/admin-dashboard`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <BackButton 
                onClick={handleGoBack}
                label={t('common.back')}
              />
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('admin.athleteManagement')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {t('admin.createAthlete')}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('athlete.addAthlete')}
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  {editingAthlete ? t('athlete.editAthlete') : t('athlete.addAthlete')}
                </h2>
                <DynamicAthleteForm
                  athlete={editingAthlete}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Competition Athletes Modal */}
        {selectedCompetition && (
          <DynamicCompetitionAthleteList
            competitionId={selectedCompetition.id}
            onClose={() => setSelectedCompetition(null)}
          />
        )}

        {/* Athlete List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <DynamicAthleteList
            onEdit={handleEdit}
            onViewCompetitions={handleViewCompetitions}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* View Competitions Placeholder */}
        {viewingCompetitions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {viewingCompetitions.name} {t('athlete.athleteDetails')}
                </h2>
                <button
                  onClick={() => setViewingCompetitions(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>{t('athlete.noAthletes')}</p>
                <p className="text-sm mt-2">{t('admin.createAthlete')}</p>
              </div>
              <button
                onClick={() => setViewingCompetitions(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
