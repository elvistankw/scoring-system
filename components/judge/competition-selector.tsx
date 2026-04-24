// Competition Selector Component for Judge Dashboard
// Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2, 18.1, 18.2, 18.3

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useJudgeSession } from '@/hooks/use-judge-session';
import { API_ENDPOINTS } from '@/lib/api-config';
import { staticSwrConfig, fetcher, judgeFetcher } from '@/lib/swr-config';
import type { Competition, CompetitionStatus, CompetitionType, CompetitionListResponse } from '@/interface/competition';
import { SkeletonCompetitionList } from '@/components/shared/loading-skeleton';
import { useTranslation } from '@/i18n/use-dictionary';
import { GlassCard } from '@/components/shared/animated-card';
import { GlassSelect } from '@/components/shared/glass-select';
import { BilingualText } from '@/components/shared/bilingual-text';

interface CompetitionSelectorProps {
  onSelect: (competition: Competition) => void;
  selectedCompetition?: Competition | null;
}

interface CompetitionWithAvailability extends Competition {
  available_athletes_count?: number;
}

export function CompetitionSelector({ onSelect, selectedCompetition }: CompetitionSelectorProps) {
  // All hooks must be at the top level - no conditional hooks
  const { t } = useTranslation();
  const { currentSession } = useJudgeSession();

  // All state hooks declared at the top
  const [statusFilter, setStatusFilter] = useState<CompetitionStatus | 'all'>('active');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<CompetitionType | 'all'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [competitionsWithAvailability, setCompetitionsWithAvailability] = useState<CompetitionWithAvailability[]>([]);
  const [judgeScoringStatus, setJudgeScoringStatus] = useState<Record<number, { completed: boolean; scored_count: number; total_athletes: number }>>({});
  
  // Ref to track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch competitions with filters - judges only see assigned competitions
  // Only fetch if judge has active session to prevent unnecessary errors
  const shouldFetchCompetitions = Boolean(
    currentSession && 
    typeof window !== 'undefined'
  );
  
  // Build the URL for competitions - judges use my-competitions endpoint
  let competitionsUrl = API_ENDPOINTS.judges.myCompetitions;
  
  // Use SWR directly with conditional key - IMPORTANT: null key prevents any request
  const swrKey = shouldFetchCompetitions ? competitionsUrl : null;
  
  // Create judge-specific fetcher if judge session is active
  const swrFetcher = currentSession 
    ? judgeFetcher(currentSession.id.toString(), currentSession.device_id)
    : fetcher;
  
  const { data: competitionsData, isLoading: swrLoading, error } = useSWR<CompetitionListResponse>(
    swrKey, // This will be null if user not authenticated, preventing any request
    swrFetcher,
    staticSwrConfig
  );
  
  const allAssignedCompetitions = competitionsData?.data?.competitions || [];
  
  // Apply status filter on assigned competitions
  const competitions = useMemo(() => {
    if (statusFilter === 'all') {
      return allAssignedCompetitions;
    }
    return allAssignedCompetitions.filter(c => c.status === statusFilter);
  }, [allAssignedCompetitions, statusFilter]);

  // Loading state - show loading if SWR is loading
  const isLoadingData = swrLoading;

  // Get unique regions from competitions
  const regions = useMemo(() => {
    const uniqueRegions = new Set(competitions.map(c => c.region));
    return Array.from(uniqueRegions).sort();
  }, [competitions]);

  // Create stable competition IDs for dependency tracking
  const competitionIds = useMemo(() => 
    competitions.map(c => c.id).sort().join(','), 
    [competitions]
  );

  // Fetch judge scoring status - use SWR for automatic caching and deduplication
  const { data: scoringStatusData } = useSWR(
    currentSession?.judge_id && competitions.length > 0 
      ? API_ENDPOINTS.competitions.judgeScoringStatus 
      : null,
    swrFetcher,
    {
      ...staticSwrConfig,
      revalidateOnFocus: false, // Don't refetch when window regains focus
      revalidateOnReconnect: false, // Don't refetch on reconnect
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
    }
  );

  // Update local state when scoring status data changes
  useEffect(() => {
    if (scoringStatusData?.status === 'success') {
      setJudgeScoringStatus(scoringStatusData.data.competitions);
      console.log('📊 Judge scoring status loaded:', scoringStatusData.data.competitions);
    }
  }, [scoringStatusData]);

  // Fetch available athletes count for each active competition
  useEffect(() => {
    const fetchAvailableAthletesCount = async () => {
      // Prevent duplicate requests
      if (isFetchingRef.current) {
        return;
      }
      
      // Check if judge has active session
      if (typeof window === 'undefined') return;
      
      if (!currentSession) {
        setCompetitionsWithAvailability(competitions);
        return;
      }
      
      isFetchingRef.current = true;
      
      try {
        // Recompute filtered competitions inside the effect to avoid stale closure
        const currentFilteredCompetitions = competitions.filter(competition => {
          const matchesRegion = regionFilter === 'all' || competition.region === regionFilter;
          const matchesType = typeFilter === 'all' || competition.competition_type === typeFilter;
          const matchesDivision = divisionFilter === 'all' || competition.division === divisionFilter;
          const matchesSearch = !debouncedSearchTerm || 
            competition.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            competition.region.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
          return matchesRegion && matchesType && matchesDivision && matchesSearch;
        });

        if (currentFilteredCompetitions.length === 0) {
          setCompetitionsWithAvailability([]);
          return;
        }

        // Fetch available athletes count for each active competition
        const competitionsWithCounts = await Promise.all(
          currentFilteredCompetitions.map(async (competition) => {
            if (competition.status !== 'active') {
              return { ...competition, available_athletes_count: undefined };
            }

            try {
              // Skip athlete count for judge sessions - not needed for judge functionality
              return { ...competition, available_athletes_count: undefined };
            } catch (error) {
              console.error(`Failed to fetch available athletes for competition ${competition.id}:`, error);
            }

            return { ...competition, available_athletes_count: undefined };
          })
        );

        setCompetitionsWithAvailability(competitionsWithCounts);
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Only run if we have competitions and judge session is active
    if (competitions.length > 0 && currentSession?.judge_id) {
      fetchAvailableAthletesCount();
    } else {
      setCompetitionsWithAvailability(competitions);
    }
  }, [
    // Use stable dependencies to prevent infinite loops
    competitionIds,
    statusFilter,
    regionFilter,
    typeFilter,
    divisionFilter,
    debouncedSearchTerm,
    currentSession?.judge_id
  ]);

  // Early return AFTER all hooks are declared to avoid Rules of Hooks violation
  if (!currentSession) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Get competition type label
  const getCompetitionTypeLabel = (type: CompetitionType): string => {
    const labels: Record<CompetitionType, string> = {
      individual: t('competition.individual'),
      duo: t('competition.duo'),
      team: t('competition.team'),
      challenge: t('competition.challenge'),
    };
    return labels[type];
  };

  // Get status badge color
  const getStatusBadgeColor = (status: CompetitionStatus): string => {
    const colors: Record<CompetitionStatus, string> = {
      upcoming: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status];
  };

  // Get status label
  const getStatusLabel = (status: CompetitionStatus): string => {
    const labels: Record<CompetitionStatus, string> = {
      upcoming: t('competition.upcoming'),
      active: t('competition.active'),
      completed: t('competition.completed'),
    };
    return labels[status];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (isLoadingData) {
    return <SkeletonCompetitionList count={6} />;
  }

  // Error state
  if (error) {
    // Handle authentication errors gracefully
    if (error?.message?.includes('Session expired') || error?.message?.includes('Unauthorized')) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600" />
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Session expired, redirecting to login...
            </p>
          </div>
        </div>
      );
    }

    // Handle other errors
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">
          {t('competition.loadCompetitionsFailed')}
        </p>
        <p className="text-red-500 dark:text-red-500 text-sm">
          {error?.message || t('common.retryLater')}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar with Glass Morphism */}
      <div className="mb-4">
        <div className="relative backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-xl border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <input
            type="text"
            placeholder="搜索比赛名称 / Search Competition Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <GlassSelect
          id="status-filter"
          label={
            <BilingualText 
              translationKey="competition.status" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />
          }
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as CompetitionStatus | 'all')}
          options={[
            { value: 'all', label: <BilingualText translationKey="competition.allStatus" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: 'active', label: <BilingualText translationKey="competition.active" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: 'upcoming', label: <BilingualText translationKey="competition.upcoming" chineseSize="text-sm" englishSize="text-xs" /> },
          ]}
        />

        {/* Region Filter */}
        <GlassSelect
          id="region-filter"
          label={
            <BilingualText 
              translationKey="competition.region" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />
          }
          value={regionFilter}
          onChange={setRegionFilter}
          options={[
            { value: 'all', label: <BilingualText translationKey="competition.allRegions" chineseSize="text-sm" englishSize="text-xs" /> },
            ...regions.map(region => ({ value: region, label: region })),
          ]}
        />

        {/* Type Filter */}
        <GlassSelect
          id="type-filter"
          label={
            <BilingualText 
              translationKey="competition.competitionType" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />
          }
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as CompetitionType | 'all')}
          options={[
            { value: 'all', label: <BilingualText translationKey="competition.allTypes" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: 'individual', label: <BilingualText translationKey="competition.individual" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: 'duo', label: <BilingualText translationKey="competition.duo" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: 'team', label: <BilingualText translationKey="competition.team" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: 'challenge', label: <BilingualText translationKey="competition.challenge" chineseSize="text-sm" englishSize="text-xs" /> },
          ]}
        />

        {/* Division Filter */}
        <GlassSelect
          id="division-filter"
          label={
            <BilingualText 
              translationKey="competition.division" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />
          }
          value={divisionFilter}
          onChange={setDivisionFilter}
          options={[
            { value: 'all', label: <BilingualText translationKey="competition.allDivisions" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: '小学组', label: <BilingualText translationKey="competition.primarySchool" chineseSize="text-sm" englishSize="text-xs" /> },
            { value: '公开组', label: <BilingualText translationKey="competition.openDivision" chineseSize="text-sm" englishSize="text-xs" /> },
          ]}
        />
      </div>

      {/* Competition Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Found {competitionsWithAvailability.length} Competitions / 找到 {competitionsWithAvailability.length} 比赛列表
      </div>

      {/* Competition Grid */}
      {competitionsWithAvailability.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {t('competition.noMatchingCompetitions')}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            {t('competition.adjustFilterConditions')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {competitionsWithAvailability.map((competition) => {
            // Determine scoring availability status based on judge's completion
            const scoringStatus = judgeScoringStatus[competition.id];
            const isScoringCompleted = scoringStatus?.completed || false;
            const canScore = competition.status === 'active' && !isScoringCompleted;

            return (
              <GlassCard
                key={competition.id}
                hoverEffect="scale"
                onClick={() => canScore && onSelect(competition)}
                className={`
                  text-left transition-all duration-200
                  ${canScore
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-60'
                  }
                  ${
                    selectedCompetition?.id === competition.id
                      ? 'ring-2 ring-blue-500 bg-blue-500/20'
                      : ''
                  }
                `}
              >
              {/* Competition Name */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {competition.name}
              </h3>

              {/* Competition Type */}
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {getCompetitionTypeLabel(competition.competition_type)}
                </span>
                {competition.division && (
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {competition.division}
                  </span>
                )}
                {competition.athlete_count !== undefined && (
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {competition.athlete_count}
                  </span>
                )}
              </div>

              {/* Region */}
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{competition.region}</span>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(competition.start_date)}</span>
              </div>

              {/* Status Badge and Scoring Availability */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(competition.status)}`}>
                    {getStatusLabel(competition.status)}
                  </span>
                </div>
                
                {/* Scoring Availability Indicator */}
                <div className="flex-shrink-0">
                  {isScoringCompleted ? (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <BilingualText 
                        translationKey="judge.scoringCompleted" 
                        chineseSize="text-xs" 
                        englishSize="text-xs"
                      />
                      {scoringStatus && (
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          ({scoringStatus.scored_count}/{scoringStatus.total_athletes})
                        </span>
                      )}
                    </div>
                  ) : canScore ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <BilingualText 
                        translationKey="judge.canScore" 
                        chineseSize="text-xs" 
                        englishSize="text-xs"
                      />
                      {scoringStatus && (
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          ({scoringStatus.scored_count}/{scoringStatus.total_athletes})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      <BilingualText 
                        translationKey="judge.cannotScore" 
                        chineseSize="text-xs" 
                        englishSize="text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Indicator */}
              {selectedCompetition?.id === competition.id && (
                <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <BilingualText 
                    translationKey="common.selected" 
                    chineseSize="text-sm" 
                    englishSize="text-xs"
                  />
                </div>
              )}
            </GlassCard>
          );
        })}
        </div>
      )}
    </div>
  );
}