// Competition Selector Component for Judge Dashboard
// Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2, 18.1, 18.2, 18.3

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCompetitions } from '@/hooks/use-competitions';
import { useUser } from '@/hooks/use-user';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';
import type { Competition, CompetitionStatus, CompetitionType } from '@/interface/competition';
import { SkeletonCompetitionList } from '@/components/shared/loading-skeleton';
import { useTranslation } from '@/i18n/use-dictionary';
import { GlassCard } from '@/components/shared/animated-card';
import { GlassSelect } from '@/components/shared/glass-select';

interface CompetitionSelectorProps {
  onSelect: (competition: Competition) => void;
  selectedCompetition?: Competition | null;
}

interface CompetitionWithAvailability extends Competition {
  available_athletes_count?: number;
}

export function CompetitionSelector({ onSelect, selectedCompetition }: CompetitionSelectorProps) {
  const { t } = useTranslation();
  const { user } = useUser();

  const [statusFilter, setStatusFilter] = useState<CompetitionStatus | 'all'>('active');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<CompetitionType | 'all'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [competitionsWithAvailability, setCompetitionsWithAvailability] = useState<CompetitionWithAvailability[]>([]);

  // Fetch competitions with filters - judges only see active and upcoming
  const { competitions, isLoading, isError, error } = useCompetitions({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Get unique regions from competitions
  const regions = useMemo(() => {
    const uniqueRegions = new Set(competitions.map(c => c.region));
    return Array.from(uniqueRegions).sort();
  }, [competitions]);

  // Filter competitions by region, type, and division on client side
  const filteredCompetitions = useMemo(() => {
    return competitions.filter(competition => {
      const matchesRegion = regionFilter === 'all' || competition.region === regionFilter;
      const matchesType = typeFilter === 'all' || competition.competition_type === typeFilter;
      const matchesDivision = divisionFilter === 'all' || competition.division === divisionFilter;
      const matchesSearch = !searchTerm || 
        competition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        competition.region.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRegion && matchesType && matchesDivision && matchesSearch;
    });
  }, [competitions, regionFilter, typeFilter, divisionFilter, searchTerm]);

  // Fetch available athletes count for each active competition
  useEffect(() => {
    const fetchAvailableAthletesCount = async () => {
      if (!user?.id || filteredCompetitions.length === 0) {
        setCompetitionsWithAvailability(filteredCompetitions);
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCompetitionsWithAvailability(filteredCompetitions);
        return;
      }

      // Fetch available athletes count for each active competition
      const competitionsWithCounts = await Promise.all(
        filteredCompetitions.map(async (competition) => {
          if (competition.status !== 'active') {
            return { ...competition, available_athletes_count: undefined };
          }

          try {
            const url = `${API_ENDPOINTS.athletes.list}?competition_id=${competition.id}&judge_id=${user.id}&exclude_scored=true`;
            const response = await fetch(url, {
              headers: getAuthHeaders(token),
            });

            if (response.ok) {
              const data = await response.json();
              return {
                ...competition,
                available_athletes_count: data.data?.count || data.data?.athletes?.length || 0,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch available athletes for competition ${competition.id}:`, error);
          }

          return { ...competition, available_athletes_count: undefined };
        })
      );

      setCompetitionsWithAvailability(competitionsWithCounts);
    };

    fetchAvailableAthletesCount();
  }, [filteredCompetitions, user?.id]);

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
  if (isLoading) {
    return <SkeletonCompetitionList count={6} />;
  }

  // Error state
  if (isError) {
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
            placeholder={t('common.search') + ' ' + t('competition.competitionName')}
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
          label={t('competition.status')}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as CompetitionStatus | 'all')}
          options={[
            { value: 'all', label: t('competition.allStatus') },
            { value: 'active', label: t('competition.active') },
            { value: 'upcoming', label: t('competition.upcoming') },
          ]}
        />

        {/* Region Filter */}
        <GlassSelect
          id="region-filter"
          label={t('competition.region')}
          value={regionFilter}
          onChange={setRegionFilter}
          options={[
            { value: 'all', label: t('competition.allRegions') },
            ...regions.map(region => ({ value: region, label: region })),
          ]}
        />

        {/* Type Filter */}
        <GlassSelect
          id="type-filter"
          label={t('competition.competitionType')}
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as CompetitionType | 'all')}
          options={[
            { value: 'all', label: t('competition.allTypes') },
            { value: 'individual', label: t('competition.individual') },
            { value: 'duo', label: t('competition.duo') },
            { value: 'team', label: t('competition.team') },
            { value: 'challenge', label: t('competition.challenge') },
          ]}
        />

        {/* Division Filter */}
        <GlassSelect
          id="division-filter"
          label={t('competition.division')}
          value={divisionFilter}
          onChange={setDivisionFilter}
          options={[
            { value: 'all', label: t('competition.allDivisions') },
            { value: '小学组', label: t('competition.primarySchool') },
            { value: '公开组', label: t('competition.openDivision') },
          ]}
        />
      </div>

      {/* Competition Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {t('common.found')} {competitionsWithAvailability.length} {t('competition.competitions')}
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
            // Determine scoring availability status
            const isScoringCompleted = competition.status === 'active' && 
                                      competition.available_athletes_count !== undefined && 
                                      competition.available_athletes_count === 0;
            const canScore = competition.status === 'active' && !isScoringCompleted;

            return (
              <GlassCard
                key={competition.id}
                hoverEffect="scale"
                onClick={() => competition.status === 'active' && onSelect(competition)}
                className={`
                  text-left transition-all duration-200
                  ${competition.status === 'active' 
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
                      <span>{t('judge.scoringCompleted')}</span>
                    </div>
                  ) : canScore ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{t('judge.canScore')}</span>
                      {competition.available_athletes_count !== undefined && (
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          ({competition.available_athletes_count})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      <span>{t('judge.cannotScore')}</span>
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
                  <span>{t('common.selected')}</span>
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
