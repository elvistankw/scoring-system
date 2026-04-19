// Scoreboard client component with competition selection and performance monitoring
// Requirements: 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.4, 12.1, 12.2, 13.1, 13.2, 13.3, 13.5, 20.1, 20.3

'use client';

import { useState, useEffect } from 'react';
import { DynamicScoreboardGrid } from '@/lib/dynamic-imports';
import { usePublicCompetitions } from '@/hooks/use-competitions';
import { measurePageLoad } from '@/lib/performance-monitor';
import { useTranslation } from '@/i18n/use-dictionary';
import type { Competition } from '@/interface/competition';
import { toast } from 'sonner';

/**
 * Scoreboard client component
 * Handles competition selection and displays scoreboard
 */
export function ScoreboardClient() {
  const { t } = useTranslation();
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  
  // Use public competitions hook
  const { competitions, isLoading, isError, error } = usePublicCompetitions({ status: 'active' });

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('Scoreboard');
  }, []);

  // Auto-select first competition when competitions are loaded
  useEffect(() => {
    if (competitions.length > 0 && !selectedCompetition) {
      setSelectedCompetition(competitions[0]);
    }
  }, [competitions, selectedCompetition]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">{t('display.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">{t('display.loadFailed')}</h2>
          <p className="text-gray-400 mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {t('display.retry')}
          </button>
        </div>
      </div>
    );
  }

  // No competitions state
  if (competitions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold mb-2">{t('display.noActiveCompetitions')}</h2>
          <p className="text-gray-400">{t('display.noActiveCompetitionsDesc')}</p>
        </div>
      </div>
    );
  }

  // Competition selection (if multiple competitions)
  if (!selectedCompetition && competitions.length > 1) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">{t('competition.selectCompetition')}</h1>
          <div className="grid gap-4 md:grid-cols-2">
            {competitions.map((competition: Competition) => (
              <button
                key={competition.id}
                onClick={() => setSelectedCompetition(competition)}
                className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors border-2 border-transparent hover:border-blue-500"
              >
                <h3 className="text-xl font-bold mb-2">{competition.name}</h3>
                <div className="space-y-1 text-sm text-gray-400">
                  <p>{t('competition.competitionType')}: {competition.competition_type}</p>
                  <p>{t('competition.region')}: {competition.region}</p>
                  <p>{t('competition.status')}: {competition.status}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Display scoreboard
  return (
    <div>
      {selectedCompetition && (
        <DynamicScoreboardGrid
          competitionId={selectedCompetition.id}
          competitionType={selectedCompetition.competition_type}
        />
      )}
    </div>
  );
}
