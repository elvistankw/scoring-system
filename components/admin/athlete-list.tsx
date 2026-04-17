// Athlete list component with search functionality
// Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Athlete } from '@/interface/athlete';
import type { Competition } from '@/interface/competition';
import { useAthletes, deleteAthlete } from '@/hooks/use-athletes';
import { useTranslation } from '@/i18n/use-dictionary';
import { API_ENDPOINTS } from '@/lib/api-config';

interface AthleteListProps {
  onEdit: (athlete: Athlete) => void;
  onViewCompetitions: (athlete: Athlete) => void;
  refreshTrigger?: number;
}

export function AthleteList({ onEdit, onViewCompetitions, refreshTrigger }: AthleteListProps) {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [expandedAthleteId, setExpandedAthleteId] = useState<number | null>(null);
  const [athleteCompetitions, setAthleteCompetitions] = useState<Record<number, Competition[]>>({});
  const [loadingCompetitions, setLoadingCompetitions] = useState<number | null>(null);
  const { athletes, isLoading, isError, refresh } = useAthletes();

  // Refresh when trigger changes
  useState(() => {
    if (refreshTrigger) {
      refresh();
    }
  });

  const handleDelete = async (athlete: Athlete) => {
    if (!confirm(`确定要删除选手 "${athlete.name}" 吗？此操作不可撤销。`)) {
      return;
    }

    setIsDeleting(athlete.id);
    try {
      await deleteAthlete(athlete.id);
      toast.success(t('athlete.athleteDeleted'));
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('athlete.deleteFailed'));
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleCompetitions = async (athleteId: number) => {
    if (expandedAthleteId === athleteId) {
      setExpandedAthleteId(null);
      return;
    }

    setExpandedAthleteId(athleteId);

    // If already loaded, don't fetch again
    if (athleteCompetitions[athleteId]) {
      return;
    }

    // Fetch competitions for this athlete
    setLoadingCompetitions(athleteId);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(API_ENDPOINTS.athletes.competitions(athleteId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch athlete competitions');
      }

      const result = await response.json();
      setAthleteCompetitions(prev => ({
        ...prev,
        [athleteId]: result.data.competitions || []
      }));
    } catch (error) {
      toast.error(t('athlete.loadCompetitionsFailed') || '加载比赛记录失败');
      setExpandedAthleteId(null);
    } finally {
      setLoadingCompetitions(null);
    }
  };

  // Filter athletes based on search term (name, number, team, age, school)
  const filteredAthletes = athletes.filter((athlete: Athlete) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      athlete.name.toLowerCase().includes(search) ||
      athlete.athlete_number.toLowerCase().includes(search) ||
      athlete.team_name?.toLowerCase().includes(search) ||
      athlete.age?.toString().includes(search) ||
      athlete.school?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{t('athlete.loadAthletesFailed')}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={t('athlete.searchAthletes') || '搜索选手（姓名、编号、年龄、学校）'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={t('common.clear')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search hint */}
      {searchTerm && (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
          <span className="font-medium">{t('athlete.searchingFor') || '搜索'}:</span> "{searchTerm}"
          <span className="ml-2">
            ({t('athlete.searchFields') || '可搜索：姓名、编号、年龄、学校'})
          </span>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t('common.total')} {filteredAthletes.length} {t('athlete.athletes')}
        {searchTerm && ` (${t('common.from')} ${athletes.length} ${t('common.filtered')})`}
      </div>

      {/* Athlete list */}
      {filteredAthletes.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {searchTerm ? t('athlete.noMatchingAthletes') : t('athlete.noAthleteData')}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAthletes.map((athlete: Athlete) => (
            <div
              key={athlete.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {athlete.name}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                        {athlete.athlete_number}
                      </span>
                    </div>
                    
                    {athlete.team_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {t('common.team')}: {athlete.team_name}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {athlete.age && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {athlete.age} {t('athlete.age')}
                        </span>
                      )}
                      {athlete.gender && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {t(`athlete.${athlete.gender}`)}
                        </span>
                      )}
                      {athlete.school && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {athlete.school}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleCompetitions(athlete.id)}
                      className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                      title={t('athlete.viewCompetitionRecord')}
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedAthleteId === athlete.id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {t('athlete.competitions')}
                    </button>
                    <button
                      onClick={() => onEdit(athlete)}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                      title={t('athlete.editAthleteInfo')}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(athlete)}
                      disabled={isDeleting === athlete.id}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                      title={t('athlete.deleteAthlete')}
                    >
                      {isDeleting === athlete.id ? t('athlete.deleting') : t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable competitions list */}
              {expandedAthleteId === athlete.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                  {loadingCompetitions === athlete.id ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {t('common.loading')}...
                      </span>
                    </div>
                  ) : athleteCompetitions[athlete.id]?.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      {t('athlete.noCompetitionHistory')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {t('athlete.competitionHistory')} ({athleteCompetitions[athlete.id]?.length || 0})
                      </h4>
                      {athleteCompetitions[athlete.id]?.map((competition: Competition) => (
                        <div
                          key={competition.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {competition.name}
                              </h5>
                              <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                  {competition.region}
                                </span>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                  {t(`competition.${competition.competition_type}`)}
                                </span>
                                {competition.division && (
                                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded">
                                    {competition.division}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded ${
                                  competition.status === 'active' 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : competition.status === 'upcoming'
                                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {t(`competition.${competition.status}`)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(competition.start_date).toLocaleDateString('zh-CN')}
                                {competition.end_date && ` - ${new Date(competition.end_date).toLocaleDateString('zh-CN')}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
