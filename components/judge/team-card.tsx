'use client';

// Team card component for duo/team competitions
// Displays team information and members
// Performance optimized with React.memo

import { memo } from 'react';
import { BilingualText } from '@/components/shared/bilingual-text';
import type { Athlete } from '@/interface/athlete';

export interface Team {
  teamName: string;
  members: Athlete[];
}

interface TeamCardProps {
  team: Team;
  onSelect: () => void;
  isSelected: boolean;
  isScored?: boolean;
}

const TeamCardComponent = ({ team, onSelect, isSelected, isScored = false }: TeamCardProps) => {
  const MAX_VISIBLE_MEMBERS = 3;
  const hasMoreMembers = team.members.length > MAX_VISIBLE_MEMBERS;
  const visibleMembers = hasMoreMembers ? team.members.slice(0, MAX_VISIBLE_MEMBERS) : team.members;
  const hiddenCount = team.members.length - MAX_VISIBLE_MEMBERS;

  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer transition-all duration-200
        backdrop-blur-md rounded-lg p-3 border-2
        ${isSelected
          ? 'bg-blue-100/80 dark:bg-blue-900/40 border-blue-500 shadow-lg'
          : 'bg-white/60 dark:bg-gray-800/60 border-white/20 dark:border-gray-700/20 hover:bg-white/80 dark:hover:bg-gray-800/80'
        }
      `}
    >
      {/* Scored indicator */}
      {isScored && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Team header - more compact */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {team.teamName}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{team.members.length}</span>{' '}
            <BilingualText 
              translationKey="athlete.members" 
              chineseSize="text-xs" 
              englishSize="text-[10px]"
            />
          </p>
        </div>
      </div>

      {/* Team members - compact layout with limit */}
      <div className="space-y-1">
        {visibleMembers.map((member, index) => (
          <div 
            key={member.id}
            className="flex items-center gap-1.5 text-xs"
          >
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-[10px] font-medium">
              {index + 1}
            </span>
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">
              {member.athlete_number}
            </span>
            <span className="text-gray-900 dark:text-white font-medium truncate text-xs">
              {member.name}
            </span>
          </div>
        ))}
        
        {/* Show "and X more" indicator if there are hidden members */}
        {hasMoreMembers && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 italic pl-6">
            <span>+{hiddenCount} more...</span>
          </div>
        )}
      </div>

      {/* Additional info - more compact */}
      {team.members.length > 0 && team.members[0].school && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate">{team.members[0].school}</span>
          </div>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const TeamCard = memo(TeamCardComponent, (prevProps, nextProps) => {
  // Only re-render if team name, selection state, or scored state changes
  return (
    prevProps.team.teamName === nextProps.team.teamName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isScored === nextProps.isScored
  );
});
