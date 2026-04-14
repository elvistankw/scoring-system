// Athlete list component with search functionality
// Requirements: 2.2, 2.4, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Athlete } from '@/interface/athlete';
import { useAthletes, deleteAthlete } from '@/hooks/use-athletes';
import { useTranslation } from '@/i18n/use-dictionary';

interface AthleteListProps {
  onEdit: (athlete: Athlete) => void;
  onViewCompetitions: (athlete: Athlete) => void;
  refreshTrigger?: number;
}

export function AthleteList({ onEdit, onViewCompetitions, refreshTrigger }: AthleteListProps) {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
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

  // Filter athletes based on search term
  const filteredAthletes = athletes.filter((athlete: Athlete) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      athlete.name.toLowerCase().includes(search) ||
      athlete.athlete_number.toLowerCase().includes(search) ||
      athlete.team_name?.toLowerCase().includes(search)
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
          placeholder={t('athlete.searchAthletes')}
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
      </div>

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
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
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
                    {athlete.contact_email && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {athlete.contact_email}
                      </span>
                    )}
                    {athlete.contact_phone && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {athlete.contact_phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onViewCompetitions(athlete)}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    title={t('athlete.viewCompetitionRecord')}
                  >
                    参赛
                  </button>
                  <button
                    onClick={() => onEdit(athlete)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                    title={t('athlete.editAthleteInfo')}
                  >
                    编辑
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
          ))}
        </div>
      )}
    </div>
  );
}
