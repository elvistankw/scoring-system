'use client';

// Athlete card component for judge scoring interface
// Requirements: 7.2, 7.3, 12.1, 12.2, 12.3, 12.4, 12.5

import type { Athlete } from '@/interface/athlete';
import { useTranslation } from '@/i18n/use-dictionary';

interface AthleteCardProps {
  athlete: Athlete;
  onSelect: () => void;
  isSelected: boolean;
}

export function AthleteCard({ athlete, onSelect, isSelected }: AthleteCardProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 rounded-lg border-2 transition-all duration-200
        hover:shadow-md active:scale-[0.98]
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
            : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300'
        }
      `}
      style={{ minHeight: '44px' }} // Touch target requirement
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {athlete.name}
            </span>
            {athlete.team_name && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({athlete.team_name})
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('common.number')}: {athlete.athlete_number}
          </div>
        </div>
        
        {isSelected && (
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
  );
}
