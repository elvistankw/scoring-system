'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useJudgeSession } from '@/hooks/use-judge-session';
import { useCompetitions } from '@/hooks/use-competitions';
import { useAthletes } from '@/hooks/use-athletes';
import { measurePageLoad } from '@/lib/performance-monitor';
import { API_ENDPOINTS } from '@/lib/api-config';
import { judgeApiClient } from '@/lib/judge-api-client';
import { GoogleAuthButton } from '@/components/shared/google-auth-button';
import { SettingsModal } from '@/components/shared/settings-modal';
import { JudgeSettingsModal } from '@/components/judge/judge-settings-modal';
import { JudgeVideoBackground } from '@/components/shared/video-background';
import { GlassCard } from '@/components/shared/animated-card';
import { BackButton } from '@/components/shared/back-button';
import { BilingualText } from '@/components/shared/bilingual-text';
import type { Competition } from '@/interface/competition';
import type { Athlete } from '@/interface/athlete';
import type { ScoreWithDetails } from '@/interface/score';
import { useTranslation } from '@/i18n/use-dictionary';

export function ScoreSummaryClient() {
  const { t } = useTranslation();

  const router = useRouter();
  const { currentSession, loadingSession } = useJudgeSession();
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [scores, setScores] = useState<ScoreWithDetails[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [locale, setLocale] = useState('zh');
  
  // State for competitions
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionsLoading, setCompetitionsLoading] = useState(true);

  // Refs for auto-scroll functionality
  const athletesSectionRef = useRef<HTMLDivElement>(null);
  const scoresSectionRef = useRef<HTMLDivElement>(null);
  
  // Fetch athletes for selected competition
  const { athletes, isLoading: athletesLoading } = useAthletes(
    selectedCompetition?.id || undefined,
    undefined,
    false,
    currentSession?.id.toString() // Pass judge session ID for device-based auth
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
  
  // Fetch competitions using judgeApiClient
  useEffect(() => {
    const fetchCompetitions = async () => {
      if (!currentSession) return;
      
      // Set the current session in judgeApiClient
      judgeApiClient.setSession(currentSession);
      
      setCompetitionsLoading(true);
      try {
        const response = await judgeApiClient.getCompetitions({
          include_completed_for_summary: true
        });
        
        setCompetitions(response.data?.competitions || []);
      } catch (error) {
        console.error('Error fetching competitions:', error);
        toast.error(error instanceof Error ? error.message : '加载比赛列表失败');
        setCompetitions([]);
      } finally {
        setCompetitionsLoading(false);
      }
    };
    
    fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession]); // Only depend on currentSession, not t

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

  // Redirect if no active judge session
  useEffect(() => {
    if (!loadingSession && !currentSession) {
      toast.error(t('judge.pleaseSelectJudgeIdentity'));
      const targetLocale = locale || 'zh';
      router.push(`/${targetLocale}/judge-landing`);
    }
  }, [currentSession, loadingSession, router, locale, t]);

  // Fetch scores for selected athlete
  const fetchAthleteScores = async (athleteId: number) => {
    if (!selectedCompetition) return;
    
    setIsLoadingScores(true);
    try {
      // Check if judge has active session
      if (!judgeApiClient.hasActiveSession()) {
        toast.error(t('judge.pleaseSelectJudgeIdentity'));
        return;
      }

      const data = await judgeApiClient.getScores({
        athlete_id: athleteId,
        competition_id: selectedCompetition.id
      });

      console.log('📊 API Response:', data);
      
      // Backend returns: { success: true, data: { scores: [...], count: N } }
      const scoresArray = data.data?.scores || [];
      console.log('📊 Scores array length:', scoresArray.length);
      
      // 🔍 DEBUG: Check each score object
      if (scoresArray.length > 0) {
        scoresArray.forEach((score: any, index: number) => {
          console.log(`Score ${index + 1}:`, {
            id: score.id,
            action_difficulty: score.action_difficulty,
            stage_artistry: score.stage_artistry,
            action_creativity: score.action_creativity,
            action_fluency: score.action_fluency,
            costume_styling: score.costume_styling,
            action_interaction: score.action_interaction,
            types: {
              action_difficulty: typeof score.action_difficulty,
              stage_artistry: typeof score.stage_artistry,
            }
          });
        });
      } else {
        console.log('⚠️ No scores found in response');
      }
      
      setScores(scoresArray);
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
      // End judge session instead of logout
      const targetLocale = locale || 'zh';
      router.push(`/${targetLocale}/judge-landing`);
      toast.success(t('judge.returnedToJudgeSelection'));
    } catch (error) {
      console.error('Navigation failed:', error);
      toast.error(t('judge.navigationFailed'));
    }
  };

  // Export functions
  const handleExportToExcel = async (exportType: 'download' | 'google-drive' | 'online-excel', targetEmail?: string) => {
    if (!selectedCompetition) {
      toast.error(t('common.pleaseSelectCompetition'));
      return;
    }

    // Export functionality is not available for judge sessions
    toast.error(t('judge.exportOnlyForAdmin'));
    return;
  };

  // Show loading state while checking session
  if (loadingSession) {
    return (
      <JudgeVideoBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </JudgeVideoBackground>
    );
  }

  // Don't render if no active session
  if (!currentSession) {
    return null;
  }

  return (
    <JudgeVideoBackground>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button and User Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <BackButton 
              href={`/${locale}/judge-dashboard`}
              label={t('common.back')}
            />

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                <BilingualText 
                  translationKey="judge.scoreSummaryTitle" 
                  chineseSize="text-3xl" 
                  englishSize="text-2xl"
                  layout="vertical"
                />
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                <BilingualText 
                  translationKey="judge.scoreSummaryDescription" 
                  chineseSize="text-base" 
                  englishSize="text-sm"
                />
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative user-menu">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 shadow-lg hover:bg-white/40 dark:hover:bg-gray-800/20 transition-all duration-300"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-medium">
                  {currentSession?.judge_name?.charAt(0)?.toUpperCase() || 'J'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentSession?.judge_name || t('judge.judge')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <BilingualText 
                    translationKey="judge.judgeRole" 
                    chineseSize="text-xs" 
                    englishSize="text-xs"
                  />
                </p>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 mt-2 w-56 rounded-xl overflow-hidden backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 shadow-2xl transition-all duration-300 z-50 ${
                showUserMenu
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="py-1">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-white/10 dark:border-gray-700/20">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentSession?.judge_name || t('judge.judge')}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    <BilingualText 
                      translationKey="judge.judgeCodeLabel" 
                      chineseSize="text-xs" 
                      englishSize="text-xs"
                    />: {currentSession?.judge_code}
                  </p>
                </div>
                
                {/* Judge Dashboard Link */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    const targetLocale = locale || 'zh';
                    router.push(`/${targetLocale}/judge-dashboard`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    <BilingualText 
                      translationKey="judge.judgeDashboard" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
                  </div>
                </button>
                
                {/* Settings Button */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSettings(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <BilingualText 
                      translationKey="common.settings" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
                  </div>
                </button>
                
                {/* End Session Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200 border-t border-white/10 dark:border-gray-700/20"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <BilingualText 
                      translationKey="judge.endSession" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Selection */}
        <GlassCard hoverEffect="none">
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
                <GlassCard
                  key={competition.id}
                  hoverEffect="scale"
                  onClick={() => handleCompetitionSelect(competition)}
                  className={`
                    cursor-pointer text-left transition-all duration-200
                    ${
                      selectedCompetition?.id === competition.id
                        ? 'ring-2 ring-blue-500 bg-blue-500/10'
                        : ''
                    }
                  `}
                >
                  <div>
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
                      {competition.athlete_count !== undefined && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {competition.athlete_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {competition.region}
                    </p>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Athletes and Scores */}
        {selectedCompetition && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Athletes List */}
            <GlassCard hoverEffect="none">
              <div ref={athletesSectionRef}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  <BilingualText 
                    translationKey="judge.selectAthlete" 
                    chineseSize="text-xl" 
                    englishSize="text-lg"
                    layout="vertical"
                  />
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {athletes.length} <BilingualText 
                    translationKey="judge.athletesCount" 
                    chineseSize="text-sm" 
                    englishSize="text-xs"
                  />
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
                        w-full p-4 rounded-lg border-2 transition-all duration-300
                        hover:shadow-md active:scale-[0.98]
                        ${
                          selectedAthlete?.id === athlete.id
                            ? 'border-blue-500 backdrop-blur-xl bg-blue-500/20 dark:bg-blue-500/30 dark:border-blue-400 shadow-lg shadow-blue-500/20'
                            : 'border-gray-200 backdrop-blur-md bg-white/60 dark:bg-gray-800/60 dark:border-gray-700 hover:border-gray-300 hover:backdrop-blur-lg'
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
            </GlassCard>

            {/* Scores Display */}
            <GlassCard hoverEffect="none">
              <div ref={scoresSectionRef}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('score.scoreDetails')}
              </h2>
              
              {!selectedAthlete ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div className="text-lg font-medium mb-2">
                    <BilingualText 
                      translationKey="judge.selectAthleteFirst" 
                      chineseSize="text-lg" 
                      englishSize="text-base"
                      layout="vertical"
                    />
                  </div>
                  <div className="text-sm">
                    <BilingualText 
                      translationKey="judge.selectAthleteFromList" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
                  </div>
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
                  <GlassCard hoverEffect="none" className="bg-blue-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {selectedAthlete.name}
                        </h3>
                        {selectedAthlete.team_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedAthlete.team_name}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {t('judge.athleteNumber')}: {selectedAthlete.athlete_number}
                          </span>
                          {selectedAthlete.age && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {selectedAthlete.age} <BilingualText 
                                translationKey="athlete.age" 
                                chineseSize="text-xs" 
                                englishSize="text-xs"
                              />
                            </span>
                          )}
                          {selectedAthlete.gender && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {t(`athlete.${selectedAthlete.gender}`)}
                            </span>
                          )}
                          {selectedAthlete.school && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {selectedAthlete.school}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Scores List */}
                  {scores.map((score, index) => (
                    <GlassCard key={`${score.id}-${score.judge_id || index}-${index}`} hoverEffect="none">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {score.judge_name || `${t('judge.judge')} #${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(score.submitted_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {/* 显示所有评分项，包括0分 - 处理字符串和数字类型 */}
                        {(score.action_difficulty !== null && score.action_difficulty !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              <BilingualText 
                                translationKey="score.actionDifficulty" 
                                chineseSize="text-sm" 
                                englishSize="text-xs"
                              />:
                            </span>
                            <span className={`font-medium ${Number(score.action_difficulty) === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                              {Number(score.action_difficulty).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {(score.stage_artistry !== null && score.stage_artistry !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              <BilingualText 
                                translationKey="score.stageArtistry" 
                                chineseSize="text-sm" 
                                englishSize="text-xs"
                              />:
                            </span>
                            <span className={`font-medium ${Number(score.stage_artistry) === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                              {Number(score.stage_artistry).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {(score.action_creativity !== null && score.action_creativity !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              <BilingualText 
                                translationKey="score.actionCreativity" 
                                chineseSize="text-sm" 
                                englishSize="text-xs"
                              />:
                            </span>
                            <span className={`font-medium ${Number(score.action_creativity) === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                              {Number(score.action_creativity).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {(score.action_fluency !== null && score.action_fluency !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              <BilingualText 
                                translationKey="score.actionFluency" 
                                chineseSize="text-sm" 
                                englishSize="text-xs"
                              />:
                            </span>
                            <span className={`font-medium ${Number(score.action_fluency) === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                              {Number(score.action_fluency).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {(score.costume_styling !== null && score.costume_styling !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              <BilingualText 
                                translationKey="score.costumeStyling" 
                                chineseSize="text-sm" 
                                englishSize="text-xs"
                              />:
                            </span>
                            <span className={`font-medium ${Number(score.costume_styling) === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                              {Number(score.costume_styling).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {(score.action_interaction !== null && score.action_interaction !== undefined) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              <BilingualText 
                                translationKey="score.actionInteraction" 
                                chineseSize="text-sm" 
                                englishSize="text-xs"
                              />:
                            </span>
                            <span className={`font-medium ${Number(score.action_interaction) === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                              {Number(score.action_interaction).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Settings Modal */}
        <JudgeSettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
        />

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 !mt-0">
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
    </JudgeVideoBackground>
  );
}

export default ScoreSummaryClient;