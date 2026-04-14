'use client';

// Judge scoring page client component
// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 7.2, 7.3, 7.4, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2, 14.3, 15.1

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAthletes } from '@/hooks/use-athletes';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/i18n/use-dictionary';
import { DynamicAthleteCard, DynamicScoreInputForm } from '@/lib/dynamic-imports';
import { measurePageLoad } from '@/lib/performance-monitor';
import type { Athlete } from '@/interface/athlete';
import type { Competition } from '@/interface/competition';

type SortField = 'number' | 'name' | 'team';
type SortOrder = 'asc' | 'desc';

export default function ScoringPageClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [locale, setLocale] = useState('zh');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Ref for scoring section to enable auto-scroll
  const scoringSectionRef = useRef<HTMLDivElement>(null);
  
  // Fetch athletes for selected competition, excluding already scored ones
  const { athletes, isLoading: athletesLoading, refresh: refreshAthletes } = useAthletes(
    selectedCompetition?.id || undefined,
    user?.id || undefined,
    true // exclude already scored athletes
  );

  // Sort athletes based on selected field and order
  const sortedAthletes = useMemo(() => {
    if (!athletes || athletes.length === 0) return [];

    const sorted = [...athletes].sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'number':
          const numA = a.athlete_number || '';
          const numB = b.athlete_number || '';
          compareResult = numA.localeCompare(numB, undefined, { numeric: true });
          break;
        case 'name':
          const nameA = a.name || '';
          const nameB = b.name || '';
          // Use zh-CN locale for Chinese pinyin sorting (A-Z by pinyin initial)
          // This will sort Chinese names by their pinyin pronunciation
          compareResult = nameA.localeCompare(nameB, 'zh-CN', { 
            sensitivity: 'base',
            numeric: false 
          });
          break;
        case 'team':
          const teamA = a.team_name || '';
          const teamB = b.team_name || '';
          // Use zh-CN locale for team names as well
          compareResult = teamA.localeCompare(teamB, 'zh-CN', { 
            sensitivity: 'base',
            numeric: false 
          });
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return sorted;
  }, [athletes, sortField, sortOrder, locale]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending order
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('JudgeScoring');
  }, []);

  // Get locale from URL
  useEffect(() => {
    const pathLocale = window.location.pathname.split('/')[1];
    if (pathLocale) setLocale(pathLocale);
  }, []);

  // Check if user is authenticated and load selected competition from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error(t('auth.signInError'));
      router.push(`/${locale}/sign-in`);
      return;
    }

    // Try to load selected competition from localStorage (set by judge dashboard)
    const storedCompetition = localStorage.getItem('selected_competition');
    if (storedCompetition) {
      try {
        const competition = JSON.parse(storedCompetition);
        setSelectedCompetition(competition);
      } catch (error) {
        console.error('Failed to parse stored competition:', error);
        // If no valid competition stored, redirect back to judge dashboard
        router.push(`/${locale}/judge-dashboard`);
      }
    } else {
      // If no competition selected, redirect back to judge dashboard
      toast.error(t('judge.selectCompetition'));
      router.push(`/${locale}/judge-dashboard`);
    }
  }, [router, locale]);

  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    
    // Auto-scroll to scoring section on tablet/mobile devices
    // Use setTimeout to ensure the DOM has updated before scrolling
    setTimeout(() => {
      if (scoringSectionRef.current) {
        scoringSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

  const handleSubmitSuccess = () => {
    // Reset athlete selection after successful submission
    setSelectedAthlete(null);
    // Refresh athletes list to remove the scored athlete
    refreshAthletes();
    toast.success(t('judge.scoreSubmitted'));
  };

  const handleBackToDashboard = () => {
    // Clear selected competition and go back to judge dashboard
    localStorage.removeItem('selected_competition');
    router.push(`/${locale}/judge-dashboard`);
  };

  // Loading state
  if (!selectedCompetition) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.back')}
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('judge.scoring')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedCompetition.name} - {selectedCompetition.region}
              </p>
            </div>
          </div>
          
          {/* Competition Info Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCompetition.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {selectedCompetition.status === 'active' ? t('competition.active') : t('competition.upcoming')}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium">
              {selectedCompetition.competition_type === 'individual' && t('competition.individual')}
              {selectedCompetition.competition_type === 'duo_team' && t('competition.duoTeam')}
              {selectedCompetition.competition_type === 'challenge' && t('competition.challenge')}
            </span>
          </div>
        </div>

        {/* Athlete Selection and Scoring Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Athlete List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('judge.selectAthlete')}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {athletes.length} {t('athlete.athletes')}
              </span>
            </div>

            {/* Sort Controls */}
            {athletes.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('judge.sortBy')}:
                  </span>
                  <button
                    onClick={() => handleSortChange('number')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      sortField === 'number'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                  >
                    {t('judge.sortByNumber')}
                    {sortField === 'number' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleSortChange('name')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      sortField === 'name'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                    }`}
                  >
                    {t('judge.sortByName')}
                    {sortField === 'name' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                  {/* Only show "Sort by Team" button for duo_team competitions */}
                  {selectedCompetition?.competition_type === 'duo_team' && (
                    <button
                      onClick={() => handleSortChange('team')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                        sortField === 'team'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                      }`}
                    >
                      {t('judge.sortByTeam')}
                      {sortField === 'team' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {athletesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : athletes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">{t('judge.noAthletes')}</p>
                <p className="text-sm">{t('judge.noAthletes')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {sortedAthletes.map((athlete: Athlete) => (
                  <DynamicAthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    onSelect={() => handleAthleteSelect(athlete)}
                    isSelected={selectedAthlete?.id === athlete.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Score Input Form */}
          <div ref={scoringSectionRef} className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('judge.scoring')}
            </h2>
            
            {/* Check if competition is active before allowing scoring */}
            {selectedCompetition.status !== 'active' ? (
              <div className="text-center py-12">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <svg className="w-16 h-16 mx-auto mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    {t('judge.competitionNotActive')}
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                    {selectedCompetition.status === 'upcoming' 
                      ? t('judge.competitionUpcoming') 
                      : t('judge.competitionCompleted')
                    }
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {t('judge.onlyActiveCompetitionsCanBeScored')}
                  </p>
                </div>
              </div>
            ) : selectedAthlete ? (
              <div>
                {/* Selected Athlete Info */}
                <DynamicScoreInputForm
                  competition={selectedCompetition}
                  athlete={selectedAthlete}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-lg font-medium mb-2">{t('judge.selectAthlete')}</p>
                <p className="text-sm">{t('judge.selectAthlete')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
