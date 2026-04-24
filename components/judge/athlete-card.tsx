'use client';

// Athlete card component for judge scoring interface
// Requirements: 7.2, 7.3, 12.1, 12.2, 12.3, 12.4, 12.5
// Performance optimized with React.memo

import { memo } from 'react';
import type { Athlete } from '@/interface/athlete';
import { useTranslation } from '@/i18n/use-dictionary';
import { BilingualText } from '@/components/shared/bilingual-text';

interface AthleteCardProps {
  athlete: Athlete;
  onSelect: () => void;
  isSelected: boolean;
}

const AthleteCardComponent = ({ athlete, onSelect, isSelected }: AthleteCardProps) => {
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
            <BilingualText 
              translationKey="common.number" 
              chineseSize="text-sm" 
              englishSize="text-xs"
            />: {athlete.athlete_number}
          </div>
        </div>
        
        {isSelected && (
          <div className="ml-4">
          </div>
        )}
      </div>
    </button>
  );
};

// Memoize component to prevent unnecessary re-renders
export const AthleteCard = memo(AthleteCardComponent, (prevProps, nextProps) => {
  // Only re-render if athlete ID or selection state changes
  return (
    prevProps.athlete.id === nextProps.athlete.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});
