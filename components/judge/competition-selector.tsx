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

  // Filter competitions by region and type on client side
  const filteredCompetitions = useMemo(() => {
    return competitions.filter(competition => {
      const matchesRegion = regionFilter === 'all' || competition.region === regionFilter;
      const matchesType = typeFilter === 'all' || competition.competition_type === typeFilter;
      return matchesRegion && matchesType;
    });
  }, [competitions, regionFilter, typeFilter]);

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
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('competition.status')}
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CompetitionStatus | 'all')}
            className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">{t('competition.allStatus')}</option>
            <option value="active">{t('competition.active')}</option>
            <option value="upcoming">{t('competition.upcoming')}</option>
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label htmlFor="region-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('competition.region')}
          </label>
          <select
            id="region-filter"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">{t('competition.allRegions')}</option>
            {regions.map(region => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('competition.competitionType')}
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CompetitionType | 'all')}
            className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">{t('competition.allTypes')}</option>
            <option value="individual">{t('competition.individual')}</option>
            <option value="duo">{t('competition.duo')}</option>
            <option value="team">{t('competition.team')}</option>
            <option value="challenge">{t('competition.challenge')}</option>
          </select>
        </div>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitionsWithAvailability.map((competition) => {
            // Determine scoring availability status
            const isScoringCompleted = competition.status === 'active' && 
                                      competition.available_athletes_count !== undefined && 
                                      competition.available_athletes_count === 0;
            const canScore = competition.status === 'active' && !isScoringCompleted;

            return (
              <button
                key={competition.id}
                onClick={() => onSelect(competition)}
                disabled={competition.status !== 'active'}
                className={`
                  text-left border rounded-lg p-6 transition-all duration-200
                  ${competition.status === 'active' 
                    ? 'hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
                    : 'cursor-not-allowed opacity-60'
                  }
                  ${
                    selectedCompetition?.id === competition.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : competition.status === 'active'
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
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
              <div className="space-y-2">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(competition.status)}`}>
                    {getStatusLabel(competition.status)}
                  </span>
                </div>
                
                {/* Scoring Availability Indicator */}
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

              {/* Selected Indicator */}
              {selectedCompetition?.id === competition.id && (
                <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('common.selected')}</span>
                </div>
              )}
            </button>
          );
        })}
        </div>
      )}
    </div>
  );
}
