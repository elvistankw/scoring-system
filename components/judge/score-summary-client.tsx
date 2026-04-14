'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useCompetitions } from '@/hooks/use-competitions';
import { useAthletes } from '@/hooks/use-athletes';
import { measurePageLoad } from '@/lib/performance-monitor';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import { GoogleAuthButton } from '@/components/shared/google-auth-button';
import { SettingsModal } from '@/components/shared/settings-modal';
import type { Competition } from '@/interface/competition';
import type { Athlete } from '@/interface/athlete';
import type { ScoreWithDetails } from '@/interface/score';
import { useTranslation } from '@/i18n/use-dictionary';

export function ScoreSummaryClient() {
  const { t } = useTranslation();

  const router = useRouter();
  const { user, isLoading: userLoading, isJudge, logout } = useUser();
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [scores, setScores] = useState<ScoreWithDetails[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [locale, setLocale] = useState('zh');

  // Refs for auto-scroll functionality
  const athletesSectionRef = useRef<HTMLDivElement>(null);
  const scoresSectionRef = useRef<HTMLDivElement>(null);

  // Fetch competitions - include completed competitions for score summary
  const { competitions, isLoading: competitionsLoading } = useCompetitions({
    includeCompletedForSummary: true
  });
  
  // Fetch athletes for selected competition
  const { athletes, isLoading: athletesLoading } = useAthletes(
    selectedCompetition?.id || undefined
  );

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('ScoreSummary');
  }, []);

  // Get locale from URL
  useEffect(() => {
    const pathLocale = window.location.pathname.split('/')[1];
    if (pathLocale) setLocale(pathLocale);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Redirect if not authenticated or not a judge
  useEffect(() => {
    if (!userLoading && !user) {
      toast.error(t('auth.pleaseLogin'));
      router.push(`/${locale}/sign-in`);
    } else if (!userLoading && !isJudge) {
      toast.error(t('auth.noJudgePermission'));
      router.push(`/${locale}`);
    }
  }, [user, userLoading, isJudge, router, locale]);

  // Fetch scores for selected athlete
  const fetchAthleteScores = async (athleteId: number) => {
    if (!selectedCompetition) return;
    
    setIsLoadingScores(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error(t('auth.pleaseLogin'));
        return;
      }

      const url = `${API_ENDPOINTS.scores.byAthlete(athleteId)}&competition_id=${selectedCompetition.id}`;
      console.log('Fetching scores from:', url);

      const response = await fetch(url, {
        headers: getAuthHeaders(token),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch scores`);
      }

      const data = await response.json();
      console.log('Scores data:', data);
      setScores(data.data?.scores || []);
    } catch (error) {
      console.error('Error fetching scores:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error(t('common.serverConnectionError'));
      } else {
        toast.error(error instanceof Error ? error.message : t('score.loadScoresFailed'));
      }
      setScores([]);
    } finally {
      setIsLoadingScores(false);
    }
  };

  const handleCompetitionSelect = (competition: Competition) => {
    setSelectedCompetition(competition);
    setSelectedAthlete(null);
    setScores([]);
    
    // Auto-scroll to athletes section on tablet/mobile devices
    setTimeout(() => {
      if (athletesSectionRef.current) {
        athletesSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    fetchAthleteScores(athlete.id);
    
    // Auto-scroll to scores section on tablet/mobile devices
    setTimeout(() => {
      if (scoresSectionRef.current) {
        scoresSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('auth.logoutSuccess'));
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(t('auth.logoutError'));
    }
  };

  // Export functions
  const handleExportToExcel = async (exportType: 'download' | 'google-drive' | 'online-excel', targetEmail?: string) => {
    if (!selectedCompetition) {
      toast.error(t('common.pleaseSelectCompetition'));
      return;
    }

    setIsExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error(t('auth.pleaseLogin'));
        return;
      }

      const response = await fetch(API_ENDPOINTS.competitions.exportExcel(selectedCompetition.id), {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          export_type: exportType,
          target_email: targetEmail || user?.email,
          competition_id: selectedCompetition.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(errorData.message || 'Export failed');
      }

      const data = await response.json();

      switch (exportType) {
        case 'download':
          // Create download link with proper error handling
          try {
            if (!data.data.file_content) {
              throw new Error(t('common.fileContentEmpty'));
            }
            
            // Decode base64 content
            const binaryString = atob(data.data.file_content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { 
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.data.filename || `${selectedCompetition.name}_${t('judge.scoreSummary')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`${t('common.fileDownloadSuccess')} ${Math.round((data.data.size || 0) / 1024)}KB`);
          } catch (downloadError) {
            console.error('Download error:', downloadError);
            toast.error(t('common.fileDownloadFailed'));
          }
          break;
        
        case 'google-drive':
          toast.success(`${t('common.fileSavedTo')} ${targetEmail || user?.email}${t('common.googleDrive')}`);
          break;
        
        case 'online-excel':
          if (data.data.excel_url) {
            window.open(data.data.excel_url, '_blank');
            toast.success(t('common.onlineExcelCreated'));
          }
          break;
      }

      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : t('common.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not a judge
  if (!user || !isJudge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button and User Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => router.push(`/${locale}/judge-dashboard`)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={t('common.back')}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{t('common.back')}</span>
            </button>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('judge.scoreSummaryTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('judge.scoreSummaryDescription')}
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative user-menu">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.username?.charAt(0)?.toUpperCase() || 'J'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.username || t('judge.judge')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('judge.judgeRole')}
                </p>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.username || t('judge.judge')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/${locale}/judge-dashboard`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                      {t('judge.judgeDashboard')}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSettings(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('common.settings')}
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t('common.logout')}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Competition Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('judge.selectCompetitionFirst')}
            </h2>
            <div className="flex items-center gap-3">
              <GoogleAuthButton 
                onAuthSuccess={() => {
                  toast.success(t('judge.googleAccountConnected'));
                }}
                variant="compact"
              />
              <button
                onClick={() => setShowExportModal(true)}
                disabled={!selectedCompetition}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${selectedCompetition 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  }
                `}
                title={!selectedCompetition ? t('common.pleaseSelectCompetition') : t('judge.exportExcel')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('judge.exportExcel')}
              </button>
            </div>
          </div>
          
          {competitionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('judge.noCompetitions')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitions.map((competition) => (
                <button
                  key={competition.id}
                  onClick={() => handleCompetitionSelect(competition)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200
                    hover:shadow-md active:scale-[0.98]
                    ${
                      selectedCompetition?.id === competition.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {competition.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        competition.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : competition.status === 'completed'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {competition.status === 'active' ? t('competition.active') : 
                         competition.status === 'completed' ? t('competition.completed') : t('competition.upcoming')}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {competition.competition_type === 'individual' && t('competition.individual')}
                        {competition.competition_type === 'duo' && t('competition.duo')}
                        {competition.competition_type === 'team' && t('competition.team')}
                        {competition.competition_type === 'challenge' && t('competition.challenge')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {competition.region}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Athletes and Scores */}
        {selectedCompetition && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Athletes List */}
            <div ref={athletesSectionRef} className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('judge.selectAthlete')}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {athletes.length} {t('judge.athletesCount')}
                </span>
              </div>
              
              {athletesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : athletes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('judge.noAthletesInCompetition')}
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {athletes.map((athlete: Athlete) => (
                    <button
                      key={athlete.id}
                      onClick={() => handleAthleteSelect(athlete)}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all duration-200
                        hover:shadow-md active:scale-[0.98]
                        ${
                          selectedAthlete?.id === athlete.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                            : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">
                              {athlete.name}
                            </span>
                            {athlete.team_name && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({athlete.team_name})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t('judge.athleteNumber')}: {athlete.athlete_number}
                          </div>
                        </div>
                        
                        {selectedAthlete?.id === athlete.id && (
                          <div className="ml-4">
                            <svg
                              className="w-6 h-6 text-blue-500 dark:text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scores Display */}
            <div ref={scoresSectionRef} className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('score.scoreDetails')}
              </h2>
              
              {!selectedAthlete ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">{t('judge.selectAthleteFirst')}</p>
                  <p className="text-sm">{t('judge.selectAthleteFromList')}</p>
                </div>
              ) : isLoadingScores ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : scores.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg font-medium mb-2">{t('judge.noScoreData')}</p>
                  <p className="text-sm">{t('judge.athleteNoScores')}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {/* Selected Athlete Info */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {selectedAthlete.athlete_number}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {selectedAthlete.name}
                        </h3>
                        {selectedAthlete.team_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedAthlete.team_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scores List */}
                  {scores.map((score, index) => (
                    <div key={score.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {t('judge.judgeNumber')} #{index + 1}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(score.submitted_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {score.action_difficulty != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('score.actionDifficulty')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{Number(score.action_difficulty).toFixed(2)}</span>
                          </div>
                        )}
                        {score.stage_artistry != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('score.stageArtistry')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{Number(score.stage_artistry).toFixed(2)}</span>
                          </div>
                        )}
                        {score.action_creativity != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('score.actionCreativity')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{Number(score.action_creativity).toFixed(2)}</span>
                          </div>
                        )}
                        {score.action_fluency != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('score.actionFluency')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{Number(score.action_fluency).toFixed(2)}</span>
                          </div>
                        )}
                        {score.costume_styling != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('score.costumeStyling')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{Number(score.costume_styling).toFixed(2)}</span>
                          </div>
                        )}
                        {score.action_interaction != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{t('score.actionInteraction')}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{Number(score.action_interaction).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          currentLocale={locale as 'zh' | 'en'}
        />

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('judge.exportExcelFile')}
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('judge.selectExportMethod')}
                </p>

                {/* Direct Download Option */}
                <button
                  onClick={() => handleExportToExcel('download')}
                  disabled={isExporting}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{t('judge.directDownload')}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('judge.directDownloadDesc')}</p>
                    </div>
                  </div>
                </button>

                {/* Google Drive Option */}
                <button
                  onClick={() => handleExportToExcel('google-drive')}
                  disabled={isExporting}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{t('judge.saveToGoogleDrive')}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('judge.saveToGoogleDriveDesc')}</p>
                    </div>
                  </div>
                </button>

                {/* Online Excel Option */}
                <button
                  onClick={() => handleExportToExcel('online-excel')}
                  disabled={isExporting}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{t('judge.createOnlineExcel')}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('judge.createOnlineExcelDesc')}</p>
                    </div>
                  </div>
                </button>

                {isExporting && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{t('common.exporting')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default ScoreSummaryClient;