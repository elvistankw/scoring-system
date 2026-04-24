'use client';

// Judge scoring page client component - Batch scoring with confirmation modal
// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 7.2, 7.3, 7.4, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2, 14.3, 15.1

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAthletes } from '@/hooks/use-athletes';
import { useJudgeSession } from '@/hooks/use-judge-session';
import { useTranslation } from '@/i18n/use-dictionary';
import { judgeApiClient } from '@/lib/judge-api-client';
import { DynamicAthleteCard } from '@/lib/dynamic-imports';
import { TeamCard, type Team } from '@/components/judge/team-card';
import { measurePageLoad } from '@/lib/performance-monitor';
import { BackButton } from '@/components/shared/back-button';
import { BilingualText } from '@/components/shared/bilingual-text';
import { JudgeVideoBackground } from '@/components/shared/video-background';
import { GlassCard } from '@/components/shared/animated-card';
import { BatchScoreInputForm } from '@/components/judge/batch-score-input-form';
import { SubmitConfirmationModal } from '@/components/judge/submit-confirmation-modal';
import { LeaveConfirmationModal } from '@/components/judge/leave-confirmation-modal';
import type { Athlete } from '@/interface/athlete';
import type { Competition } from '@/interface/competition';
import type { ScoreDimensions } from '@/interface/score';

type SortField = 'number' | 'name' | 'team';
type SortOrder = 'asc' | 'desc';

export interface AthleteScore {
  athlete: Athlete;
  scores: ScoreDimensions | null;
  isComplete: boolean;
}

export interface TeamScore {
  team: Team;
  scores: ScoreDimensions | null;
  isComplete: boolean;
}

export default function ScoringPageClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentSession, loadingSession } = useJudgeSession();
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [locale, setLocale] = useState('zh');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Batch scoring state - stores scores for all athletes
  const [athleteScores, setAthleteScores] = useState<Map<number, AthleteScore>>(new Map());
  
  // Team scoring state - stores scores for all teams (duo/team competitions)
  const [teamScores, setTeamScores] = useState<Map<string, TeamScore>>(new Map());
  
  // Ref for scoring section to enable auto-scroll
  const scoringSectionRef = useRef<HTMLDivElement>(null);
  
  // Throttled localStorage save function (saves at most once every 2 seconds)
  const throttledSaveToLocalStorage = useRef<{
    athleteScores: NodeJS.Timeout | null;
    teamScores: NodeJS.Timeout | null;
  }>({ athleteScores: null, teamScores: null });
  
  // Fetch athletes for selected competition (all athletes, not excluding scored ones)
  const { athletes, isLoading: athletesLoading, refresh: refreshAthletes } = useAthletes(
    selectedCompetition?.id || undefined,
    undefined,
    false, // Get all athletes
    currentSession?.id.toString() // Pass judge session ID for device-based auth
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
          compareResult = nameA.localeCompare(nameB, 'zh-CN', { 
            sensitivity: 'base',
            numeric: false 
          });
          break;
        case 'team':
          const teamA = a.team_name || '';
          const teamB = b.team_name || '';
          compareResult = teamA.localeCompare(teamB, 'zh-CN', { 
            sensitivity: 'base',
            numeric: false 
          });
          break;
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return sorted;
  }, [athletes, sortField, sortOrder]);

  // Group athletes by team for duo/team competitions
  const groupedTeams = useMemo<Team[]>(() => {
    if (!selectedCompetition || (selectedCompetition.competition_type !== 'duo' && selectedCompetition.competition_type !== 'team')) {
      return [];
    }

    const teamsMap = new Map<string, Athlete[]>();
    
    sortedAthletes.forEach(athlete => {
      if (athlete.team_name && athlete.team_name.trim() !== '') {
        if (!teamsMap.has(athlete.team_name)) {
          teamsMap.set(athlete.team_name, []);
        }
        teamsMap.get(athlete.team_name)!.push(athlete);
      }
    });
    
    return Array.from(teamsMap.entries()).map(([teamName, members]) => ({
      teamName,
      members: members.sort((a, b) => a.athlete_number.localeCompare(b.athlete_number, undefined, { numeric: true }))
    }));
  }, [sortedAthletes, selectedCompetition]);

  // Calculate completion stats (for duo/team: by teams, for individual/challenge: by athletes)
  const completionStats = useMemo(() => {
    if (selectedCompetition && (selectedCompetition.competition_type === 'duo' || selectedCompetition.competition_type === 'team')) {
      const total = groupedTeams.length;
      const completed = Array.from(teamScores.values()).filter(ts => ts.isComplete).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, percentage };
    } else {
      const total = athletes.length;
      const completed = Array.from(athleteScores.values()).filter(as => as.isComplete).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, percentage };
    }
  }, [athletes, athleteScores, groupedTeams, teamScores, selectedCompetition]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Memoized athlete select handler
  const handleAthleteSelect = useCallback((athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setSelectedTeam(null);
    
    setTimeout(() => {
      if (scoringSectionRef.current) {
        scoringSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }, []);

  // Memoized team select handler
  const handleTeamSelect = useCallback((team: Team) => {
    setSelectedTeam(team);
    setSelectedAthlete(null);
    
    setTimeout(() => {
      if (scoringSectionRef.current) {
        scoringSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }, []);

  // Memoized score update handler
  const handleScoreUpdate = useCallback((athleteId: number, scores: ScoreDimensions | null, isComplete: boolean) => {
    setAthleteScores(prev => {
      const athlete = athletes.find((a: Athlete) => a.id === athleteId);
      if (!athlete) return prev;

      const newMap = new Map(prev);
      newMap.set(athleteId, { athlete, scores, isComplete });
      return newMap;
    });
  }, [athletes]);

  // Memoized team score update handler
  const handleTeamScoreUpdate = useCallback((teamName: string, scores: ScoreDimensions | null, isComplete: boolean) => {
    setTeamScores(prev => {
      const team = groupedTeams.find(t => t.teamName === teamName);
      if (!team) return prev;

      const newMap = new Map(prev);
      newMap.set(teamName, { team, scores, isComplete });
      return newMap;
    });
  }, [groupedTeams]);

  // Load cached scores from localStorage on mount
  useEffect(() => {
    if (!selectedCompetition || !currentSession) return;
    
    // Load athlete scores cache
    const cacheKey = `scores_${selectedCompetition.id}_${currentSession.judge_id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        const restoredMap = new Map<number, AthleteScore>();
        
        Object.entries(parsedCache).forEach(([athleteId, athleteScore]) => {
          restoredMap.set(Number(athleteId), athleteScore as AthleteScore);
        });
        
        setAthleteScores(restoredMap);
        toast.success('已恢复缓存的评分数据 / Cached scores restored');
      } catch (error) {
        console.error('Failed to restore cached athlete scores:', error);
      }
    }
    
    // Load team scores cache
    const teamCacheKey = `team_scores_${selectedCompetition.id}_${currentSession.judge_id}`;
    const teamCached = localStorage.getItem(teamCacheKey);
    
    if (teamCached) {
      try {
        const parsedTeamCache = JSON.parse(teamCached);
        const restoredTeamMap = new Map<string, TeamScore>();
        
        Object.entries(parsedTeamCache).forEach(([teamName, teamScore]) => {
          restoredTeamMap.set(teamName, teamScore as TeamScore);
        });
        
        setTeamScores(restoredTeamMap);
        if (!cached) {
          // Only show toast if we didn't already show it for athlete scores
          toast.success('已恢复缓存的团队评分数据 / Cached team scores restored');
        }
      } catch (error) {
        console.error('Failed to restore cached team scores:', error);
      }
    }
  }, [selectedCompetition, currentSession]);

  // Load saved scores from database
  useEffect(() => {
    if (!selectedCompetition || !currentSession || !athletes.length) return;
    
    const loadSavedScores = async () => {
      try {
        // Fetch scores for this judge and competition
        const response = await judgeApiClient.getScores({
          competition_id: selectedCompetition.id,
          athlete_id: undefined,
          judge_id: currentSession.judge_id  // Filter by current judge
        });
        
        // Handle both response formats: data.scores or data directly
        const scoresData = response.data?.scores || response.data;
        
        if (scoresData && Array.isArray(scoresData)) {
          const scoresMap = new Map<number, AthleteScore>();
          
          scoresData.forEach((scoreRecord: any) => {
            const athlete = athletes.find((a: Athlete) => a.id === scoreRecord.athlete_id);
            if (athlete) {
              const scores: any = {
                action_difficulty: scoreRecord.action_difficulty,
                stage_artistry: scoreRecord.stage_artistry,
                action_creativity: scoreRecord.action_creativity,
                action_fluency: scoreRecord.action_fluency,
                costume_styling: scoreRecord.costume_styling,
                action_interaction: scoreRecord.action_interaction
              };
              
              // Check if all required fields are filled
              const isComplete = checkScoreCompletion(scores, selectedCompetition.competition_type);
              
              scoresMap.set(athlete.id, {
                athlete,
                scores,
                isComplete
              });
            }
          });
          
          // Merge with existing athleteScores (localStorage cache takes precedence)
          setAthleteScores(prev => {
            const merged = new Map(scoresMap);
            // Override with cached scores if they exist
            prev.forEach((value, key) => {
              merged.set(key, value);
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('❌ Failed to load saved scores:', error);
        // Don't show error toast - this is a background operation
      }
    };
    
    loadSavedScores();
  }, [selectedCompetition, currentSession, athletes]);

  // Helper function to check if scores are complete
  const checkScoreCompletion = (scores: any, competitionType: string): boolean => {
    if (competitionType === 'individual') {
      return !!(
        scores.action_difficulty !== null && scores.action_difficulty !== undefined &&
        scores.stage_artistry !== null && scores.stage_artistry !== undefined &&
        scores.action_creativity !== null && scores.action_creativity !== undefined &&
        scores.action_fluency !== null && scores.action_fluency !== undefined &&
        scores.costume_styling !== null && scores.costume_styling !== undefined
      );
    } else if (competitionType === 'duo' || competitionType === 'team') {
      return !!(
        scores.action_difficulty !== null && scores.action_difficulty !== undefined &&
        scores.stage_artistry !== null && scores.stage_artistry !== undefined &&
        scores.action_interaction !== null && scores.action_interaction !== undefined &&
        scores.action_creativity !== null && scores.action_creativity !== undefined &&
        scores.costume_styling !== null && scores.costume_styling !== undefined
      );
    } else { // challenge
      return !!(
        scores.action_difficulty !== null && scores.action_difficulty !== undefined &&
        scores.action_creativity !== null && scores.action_creativity !== undefined &&
        scores.action_fluency !== null && scores.action_fluency !== undefined
      );
    }
  };

  // Save scores to localStorage whenever they change (throttled to every 2 seconds)
  useEffect(() => {
    if (!selectedCompetition || !currentSession) return;
    
    // Save athlete scores (throttled)
    if (athleteScores.size > 0) {
      // Clear existing timer
      if (throttledSaveToLocalStorage.current.athleteScores) {
        clearTimeout(throttledSaveToLocalStorage.current.athleteScores);
      }
      
      // Set new timer
      throttledSaveToLocalStorage.current.athleteScores = setTimeout(() => {
        const cacheKey = `scores_${selectedCompetition.id}_${currentSession.judge_id}`;
        const cacheData = Object.fromEntries(athleteScores);
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
          console.error('Failed to cache athlete scores:', error);
        }
      }, 2000); // 2 second throttle
    }
    
    // Save team scores (throttled)
    if (teamScores.size > 0) {
      // Clear existing timer
      if (throttledSaveToLocalStorage.current.teamScores) {
        clearTimeout(throttledSaveToLocalStorage.current.teamScores);
      }
      
      // Set new timer
      throttledSaveToLocalStorage.current.teamScores = setTimeout(() => {
        const teamCacheKey = `team_scores_${selectedCompetition.id}_${currentSession.judge_id}`;
        const teamCacheData = Object.fromEntries(teamScores);
        
        try {
          localStorage.setItem(teamCacheKey, JSON.stringify(teamCacheData));
        } catch (error) {
          console.error('Failed to cache team scores:', error);
        }
      }, 2000); // 2 second throttle
    }
    
    // Cleanup function
    return () => {
      if (throttledSaveToLocalStorage.current.athleteScores) {
        clearTimeout(throttledSaveToLocalStorage.current.athleteScores);
      }
      if (throttledSaveToLocalStorage.current.teamScores) {
        clearTimeout(throttledSaveToLocalStorage.current.teamScores);
      }
    };
  }, [athleteScores, teamScores, selectedCompetition, currentSession]);

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('JudgeScoring');
  }, []);

  // Get locale from URL
  useEffect(() => {
    const pathLocale = window.location.pathname.split('/')[1];
    if (pathLocale) setLocale(pathLocale);
  }, []);

  // Check if judge has active session and load selected competition from localStorage
  useEffect(() => {
    // Don't check session if still loading
    if (loadingSession) return;
    
    if (!currentSession) {
      toast.error('请先选择评委身份');
      const targetLocale = locale || 'zh';
      router.push(`/${targetLocale}/judge-landing`);
      return;
    }

    const storedCompetition = localStorage.getItem('selected_competition');
    if (storedCompetition) {
      try {
        const competition = JSON.parse(storedCompetition);
        setSelectedCompetition(competition);
      } catch (error) {
        console.error('Failed to parse stored competition:', error);
        const targetLocale = locale || 'zh';
        router.push(`/${targetLocale}/judge-dashboard`);
      }
    } else {
      toast.error('请选择比赛 / Please select a competition');
      const targetLocale = locale || 'zh';
      router.push(`/${targetLocale}/judge-dashboard`);
    }
  }, [currentSession, loadingSession, router, locale]); // 添加 loadingSession 到依赖数组

  const handleSubmitAll = () => {
    // Check if all athletes have been scored
    if (completionStats.completed < completionStats.total) {
      toast.error(`请为所有选手打分 (${completionStats.completed}/${completionStats.total}) / Please score all athletes`);
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedCompetition || !currentSession) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      // Check if judge has active session
      if (!judgeApiClient.hasActiveSession()) {
        toast.error('请先选择评委身份');
        return;
      }

      let submissions: any[] = [];

      // For duo/team competitions: submit team scores (same score for all team members)
      if (selectedCompetition.competition_type === 'duo' || selectedCompetition.competition_type === 'team') {
        for (const [teamName, teamScore] of teamScores.entries()) {
          if (teamScore.isComplete && teamScore.scores) {
            // Add submission for each team member with the same scores
            for (const member of teamScore.team.members) {
              submissions.push({
                competition_id: selectedCompetition.id,
                athlete_id: member.id,
                scores: teamScore.scores,
              });
            }
          }
        }
      } else {
        // For individual/challenge competitions: submit individual scores
        submissions = Array.from(athleteScores.values())
          .filter(as => as.isComplete && as.scores)
          .map(as => ({
            competition_id: selectedCompetition.id,
            athlete_id: as.athlete.id,
            scores: as.scores!,
          }));
      }

      const result = await judgeApiClient.batchSubmitScores({ submissions });

      const entityType = (selectedCompetition.competition_type === 'duo' || selectedCompetition.competition_type === 'team') ? '团队' : '选手';
      const entityCount = (selectedCompetition.competition_type === 'duo' || selectedCompetition.competition_type === 'team') 
        ? teamScores.size 
        : submissions.length;
      
      toast.success(`成功提交 ${entityCount} 个${entityType}的评分 / Successfully submitted scores for ${entityCount} ${entityType === '团队' ? 'teams' : 'athletes'}`);
      
      // Clear cache and state
      const cacheKey = `scores_${selectedCompetition.id}_${currentSession.judge_id}`;
      const teamCacheKey = `team_scores_${selectedCompetition.id}_${currentSession.judge_id}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(teamCacheKey);
      setAthleteScores(new Map());
      setTeamScores(new Map());
      setSelectedAthlete(null);
      setSelectedTeam(null);
      
      // Refresh athletes list
      refreshAthletes();
      
      // Redirect back to dashboard
      setTimeout(() => {
        const targetLocale = locale || 'zh';
        router.push(`/${targetLocale}/judge-dashboard`);
      }, 1500);
      
    } catch (error) {
      console.error('Batch submission error:', error);
      toast.error(error instanceof Error ? error.message : '提交失败 / Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    // Warn if there are unsaved scores
    if (athleteScores.size > 0 || teamScores.size > 0) {
      setShowLeaveModal(true);
      return;
    }
    
    // No unsaved scores, proceed directly
    proceedToLeave();
  };

  const proceedToLeave = () => {
    localStorage.removeItem('selected_competition');
    const targetLocale = locale || 'zh';
    router.push(`/${targetLocale}/judge-dashboard`);
  };

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false);
    proceedToLeave();
  };

  const handleLeaveCancel = () => {
    setShowLeaveModal(false);
  };

  // Loading state
  if (!selectedCompetition) {
    return (
      <JudgeVideoBackground>
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm rounded w-1/4"></div>
              <div className="h-32 bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm rounded"></div>
            </div>
          </div>
        </div>
      </JudgeVideoBackground>
    );
  }

  // Loading state
  if (!selectedCompetition) {
    return (
      <JudgeVideoBackground>
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm rounded w-1/4"></div>
              <div className="h-32 bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm rounded"></div>
            </div>
          </div>
        </div>
      </JudgeVideoBackground>
    );
  }

  return (
    <JudgeVideoBackground>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton 
              onClick={handleBackToDashboard}
              label={t('common.back')}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                <BilingualText 
                  translationKey="judge.scoring" 
                  chineseSize="text-3xl" 
                  englishSize="text-2xl"
                  layout="vertical"
                />
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
              {selectedCompetition.competition_type === 'duo' && t('competition.duo')}
              {selectedCompetition.competition_type === 'team' && t('competition.team')}
              {selectedCompetition.competition_type === 'challenge' && t('competition.challenge')}
            </span>
          </div>
        </div>

        {/* Athlete Selection and Scoring Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Athlete List */}
          <GlassCard hoverEffect="none">
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
                {completionStats.completed}/{completionStats.total} <BilingualText 
                  translationKey="athlete.athletes" 
                  chineseSize="text-sm" 
                  englishSize="text-xs"
                />
              </span>
            </div>

            {/* Sort Controls */}
            {athletes.length > 0 && (
              <div className="mb-4 p-3 backdrop-blur-md bg-white/40 dark:bg-gray-700/40 rounded-lg border border-white/20 dark:border-gray-600/20">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <BilingualText 
                      translationKey="judge.sortBy" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />:
                  </span>
                  <button
                    onClick={() => handleSortChange('number')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      sortField === 'number'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'backdrop-blur-sm bg-white/60 dark:bg-gray-600/60 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-500/80'
                    }`}
                  >
                    <BilingualText 
                      translationKey="judge.sortByNumber" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
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
                        : 'backdrop-blur-sm bg-white/60 dark:bg-gray-600/60 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-500/80'
                    }`}
                  >
                    <BilingualText 
                      translationKey="judge.sortByName" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
                    {sortField === 'name' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                  {(selectedCompetition?.competition_type === 'duo' || selectedCompetition?.competition_type === 'team') && (
                    <button
                      onClick={() => handleSortChange('team')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                        sortField === 'team'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'backdrop-blur-sm bg-white/60 dark:bg-gray-600/60 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-500/80'
                      }`}
                    >
                      <BilingualText 
                        translationKey="judge.sortByTeam" 
                        chineseSize="text-sm" 
                        englishSize="text-xs"
                      />
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
                  <div key={i} className="h-20 bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : athletes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">{t('judge.noAthletes')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {/* Duo/Team competitions: Show team cards */}
                {(selectedCompetition.competition_type === 'duo' || selectedCompetition.competition_type === 'team') ? (
                  groupedTeams.map((team: Team) => {
                    const teamScore = teamScores.get(team.teamName);
                    const isScored = teamScore?.isComplete || false;
                    
                    return (
                      <TeamCard
                        key={team.teamName}
                        team={team}
                        onSelect={() => handleTeamSelect(team)}
                        isSelected={selectedTeam?.teamName === team.teamName}
                        isScored={isScored}
                      />
                    );
                  })
                ) : (
                  /* Individual/Challenge competitions: Show athlete cards */
                  sortedAthletes.map((athlete: Athlete) => {
                    const athleteScore = athleteScores.get(athlete.id);
                    const isScored = athleteScore?.isComplete || false;
                    
                    return (
                      <div key={athlete.id} className="relative">
                        <DynamicAthleteCard
                          athlete={athlete}
                          onSelect={() => handleAthleteSelect(athlete)}
                          isSelected={selectedAthlete?.id === athlete.id}
                        />
                        {isScored && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </GlassCard>

          {/* Score Input Form */}
          <GlassCard hoverEffect="none">
            <div ref={scoringSectionRef}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                <BilingualText 
                  translationKey="judge.scoring" 
                  chineseSize="text-xl" 
                  englishSize="text-lg"
                  layout="vertical"
                />
              </h2>
              
              {selectedCompetition.status !== 'active' ? (
                <div className="text-center py-12">
                  <div className="backdrop-blur-md bg-yellow-50/80 dark:bg-yellow-900/30 border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg p-6">
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
                  </div>
                </div>
              ) : selectedTeam ? (
                <BatchScoreInputForm
                  competition={selectedCompetition}
                  team={selectedTeam}
                  existingScores={teamScores.get(selectedTeam.teamName)?.scores || null}
                  onScoreUpdate={(teamName: string, scores: ScoreDimensions | null, isComplete: boolean) => handleTeamScoreUpdate(teamName, scores, isComplete)}
                />
              ) : selectedAthlete ? (
                <BatchScoreInputForm
                  competition={selectedCompetition}
                  athlete={selectedAthlete}
                  existingScores={athleteScores.get(selectedAthlete.id)?.scores || null}
                  onScoreUpdate={handleScoreUpdate}
                />
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
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Submit All Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmitAll}
            disabled={completionStats.completed < completionStats.total || isSubmitting}
            className={`
              px-8 py-4 rounded-lg font-bold text-lg
              transition-all duration-200
              ${completionStats.completed === completionStats.total
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                提交中... / Submitting...
              </span>
            ) : (
              <>
                提交所有评分 / Submit All Scores ({completionStats.completed}/{completionStats.total})
              </>
            )}
          </button>
        </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <SubmitConfirmationModal
          athleteScores={Array.from(athleteScores.values())}
          teamScores={Array.from(teamScores.values())}
          competition={selectedCompetition}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <LeaveConfirmationModal
          isOpen={showLeaveModal}
          onConfirm={handleLeaveConfirm}
          onCancel={handleLeaveCancel}
        />
      )}
    </JudgeVideoBackground>
  );
}
