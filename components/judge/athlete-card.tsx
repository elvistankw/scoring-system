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
        w-full p-4 rounded-xl border-2 transition-all duration-300
        hover:shadow-lg active:scale-[0.98]
        ${
          isSelected
            ? 'backdrop-blur-xl bg-blue-500/30 dark:bg-blue-500/20 border-blue-500/60 dark:border-blue-400/60 shadow-xl ring-2 ring-blue-500/50'
            : 'backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border-white/40 dark:border-gray-700/20 hover:bg-white/40 dark:hover:bg-gray-800/20 hover:border-white/60'
        }
      `}
      style={{ minHeight: '44px' }} // Touch target requirement
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-lg ${
              isSelected 
                ? 'text-blue-900 dark:text-blue-100' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {athlete.name}
            </span>
            {athlete.team_name && (
              <span className={`text-sm ${
                isSelected
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                ({athlete.team_name})
              </span>
            )}
          </div>
          <div className={`text-sm mt-1 ${
            isSelected
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {t('common.number')}: {athlete.athlete_number}
          </div>
        </div>
        
        {isSelected && (
          <div className="ml-4">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-300"
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
