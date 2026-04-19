// Competition edit client component
// Requirements: 2.1, 2.2, 8.1, 8.2, 13.1, 13.2, 15.1, 15.4

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCompetition } from '@/hooks/use-competitions';
import { CompetitionForm } from './competition-form';
import { CompetitionAthleteList } from './competition-athlete-list';
import { CompetitionScoresManager } from './competition-scores-manager';
import { useTranslation } from '@/i18n/use-dictionary';

export function CompetitionEditClient() {
  const { t } = useTranslation();

  const params = useParams();
  const router = useRouter();
  const competitionId = params.id ? parseInt(params.id as string) : null;
  
  const { competition, isLoading, isError, error } = useCompetition(competitionId);
  const [activeTab, setActiveTab] = useState<'info' | 'athletes' | 'scores'>('info');
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle error states
  useEffect(() => {
    if (isError && error) {
      toast.error(error.message || '加载比赛失败');
    }
  }, [isError, error]);

  const handleUpdateSuccess = () => {
    toast.success(t('competition.competitionUpdated'));
    // Optionally redirect back to competitions list
    // router.push('/admin-dashboard');
  };

  const handleCancel = () => {
    router.back();
  };

  // Show loading state during SSR and initial client load
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !competition) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('competition.competitionNotFound')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || t('competition.competitionNotFoundDesc')}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('competition.editCompetition')}: {competition.name}
            </h1>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              competition.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : competition.status === 'completed'
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {competition.status === 'active' ? t('competition.active') : 
               competition.status === 'completed' ? t('competition.completed') : t('competition.upcoming')}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {competition.region} · {competition.competition_type === 'individual' ? t('competition.individual') : 
                                    competition.competition_type === 'duo' ? t('competition.duo') :
                                    competition.competition_type === 'team' ? t('competition.team') : t('competition.challenge')}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('competition.competitionDetails')}
              </button>
              <button
                onClick={() => setActiveTab('athletes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'athletes'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('admin.athleteManagement')}
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'scores'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                评分管理
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {activeTab === 'info' ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('competition.editCompetition')}
              </h2>
              <CompetitionForm
                competition={competition}
                onSuccess={handleUpdateSuccess}
                onCancel={handleCancel}
              />
            </div>
          ) : activeTab === 'athletes' ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('admin.athleteManagement')}
              </h2>
              <CompetitionAthleteList competitionId={competition.id} />
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                评分管理
              </h2>
              <CompetitionScoresManager competitionId={competition.id} competitionType={competition.competition_type} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}