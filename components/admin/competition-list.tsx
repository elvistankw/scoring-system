// Competition list component with filters
// Requirements: 2.1, 2.2, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCompetitions, deleteCompetition } from '@/hooks/use-competitions';
import { SkeletonCompetitionList } from '@/components/shared/loading-skeleton';
import type { Competition, CompetitionStatus, CompetitionType } from '@/interface/competition';
import { useTranslation } from '@/i18n/use-dictionary';

interface CompetitionListProps {
  onEdit: (competition: Competition) => void;
  onViewDetails: (competition: Competition) => void;
}

export function CompetitionList({ onEdit, onViewDetails }: CompetitionListProps) {
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<CompetitionStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CompetitionType | ''>('');
  const [regionFilter, setRegionFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { competitions, isLoading, isError, refresh } = useCompetitions({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    region: regionFilter || undefined,
  });

  // Client-side search filter
  const filteredCompetitions = competitions.filter(competition => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!(
        competition.name.toLowerCase().includes(search) ||
        competition.region.toLowerCase().includes(search)
      )) {
        return false;
      }
    }
    
    // Division filter
    if (divisionFilter && competition.division !== divisionFilter) {
      return false;
    }
    
    return true;
  });

  const handleDelete = async (competition: Competition) => {
    if (!confirm(t('competition.confirmDeleteMessage'))) {
      return;
    }

    setDeletingId(competition.id);

    try {
      await deleteCompetition(competition.id);
      toast.success(t('competition.competitionDeleted'));
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('competition.deleteFailed');
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const getCompetitionTypeLabel = (type: CompetitionType) => {
    const labels = {
      individual: t('competition.individual'),
      duo: t('competition.duo'),
      team: t('competition.team'),
      challenge: t('competition.challenge'),
    };
    return labels[type];
  };

  const getStatusLabel = (status: CompetitionStatus) => {
    const labels = {
      upcoming: t('competition.upcoming'),
      active: t('competition.active'),
      completed: t('competition.completed'),
    };
    return labels[status];
  };

  const getStatusColor = (status: CompetitionStatus) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status];
  };

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{t('competition.loadCompetitionsFailed')}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.search') + ' ' + t('competition.competitionName')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('competition.filterConditions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('competition.status')}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CompetitionStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('competition.allStatus')}</option>
              <option value="upcoming">{t('competition.upcoming')}</option>
              <option value="active">{t('competition.active')}</option>
              <option value="completed">{t('competition.completed')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('competition.competitionType')}
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CompetitionType | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('competition.allTypes')}</option>
              <option value="individual">{t('competition.individual')}</option>
              <option value="duo">{t('competition.duo')}</option>
              <option value="team">{t('competition.team')}</option>
              <option value="challenge">{t('competition.challenge')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="division-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('competition.division')}
            </label>
            <select
              id="division-filter"
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('competition.allDivisions')}</option>
              <option value="小学组">{t('competition.primarySchool')}</option>
              <option value="公开组">{t('competition.openDivision')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="region-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('competition.region')}
            </label>
            <input
              type="text"
              id="region-filter"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              placeholder={t('competition.enterRegionName')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Competition List */}
      {isLoading ? (
        <SkeletonCompetitionList count={6} />
      ) : filteredCompetitions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? t('competition.noMatchingCompetitions') : t('competition.noCompetitionData')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitions.map((competition) => (
            <div
              key={competition.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="mb-3">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white overflow-hidden" 
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4em',
                        maxHeight: '2.8em'
                      }}
                      title={competition.name}>
                    {competition.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(competition.status)}`}>
                    {getStatusLabel(competition.status)}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {getCompetitionTypeLabel(competition.competition_type)}
                  </span>
                  {competition.division && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 whitespace-nowrap">
                      {competition.division}
                    </span>
                  )}
                  {competition.athlete_count !== undefined && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 whitespace-nowrap flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {competition.athlete_count}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{t('competition.regionLabel')}</span>
                  {competition.region}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{t('competition.dateLabel')}</span>
                  {new Date(competition.start_date).toLocaleDateString('zh-CN')} - {new Date(competition.end_date).toLocaleDateString('zh-CN')}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onViewDetails(competition)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('common.viewDetails')}
                </button>
                <button
                  onClick={() => onEdit(competition)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(competition)}
                  disabled={deletingId === competition.id}
                  className="px-3 py-2 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deletingId === competition.id ? t('athlete.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
