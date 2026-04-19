// Rankings client component with competition selection and regional filtering
// Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.4, 12.1, 12.2, 13.1, 13.2, 13.3, 13.5

'use client';

import { useState, useEffect } from 'react';
import { DynamicRankingTable } from '@/lib/dynamic-imports';
import { usePublicCompetitions } from '@/hooks/use-competitions';
import { measurePageLoad } from '@/lib/performance-monitor';
import { useTranslation } from '@/i18n/use-dictionary';
import type { Competition } from '@/interface/competition';
import { toast } from 'sonner';

/**
 * Rankings client component
 * Allows selection of competition and optional regional filtering
 */
export function RankingsClient() {
  const { t } = useTranslation();
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [regions, setRegions] = useState<string[]>([]);

  // Use public competitions hook
  const { competitions, isLoading, isError, error } = usePublicCompetitions({ status: 'active' });

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('Rankings');
  }, []);

  // Update regions and auto-select first competition when competitions are loaded
  useEffect(() => {
    if (competitions.length > 0) {
      // Extract unique regions
      const uniqueRegions = Array.from(
        new Set(competitions.map((c: Competition) => c.region))
      ) as string[];
      setRegions(uniqueRegions);
      
      // Auto-select first competition if not already selected
      if (!selectedCompetition) {
        setSelectedCompetition(competitions[0]);
      }
    }
  }, [competitions, selectedCompetition]);

  // Handle competition selection
  const handleCompetitionChange = (competitionId: string) => {
    const competition = competitions.find((c: Competition) => c.id === parseInt(competitionId));
    if (competition) {
      setSelectedCompetition(competition);
      setSelectedRegion(''); // Reset region filter when changing competition
    }
  };

  // Handle region filter change
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-400">{t('display.loading')}</p>
        </div>
      </div>
    );
  }

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

  if (competitions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold mb-2">{t('display.noActiveCompetitions')}</h2>
          <p className="text-gray-400">{t('display.noActiveCompetitionsDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Competition and Region Selector Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          {/* Competition Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="competition-select" className="text-sm font-medium text-gray-300">
              {t('competition.selectCompetition')}:
            </label>
            <select
              id="competition-select"
              value={selectedCompetition?.id || ''}
              onChange={(e) => handleCompetitionChange(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
            >
              {competitions.map((competition: Competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name} - {competition.region}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          {regions.length > 1 && (
            <div className="flex items-center gap-3">
              <label htmlFor="region-select" className="text-sm font-medium text-gray-300">
                {t('athlete.filterByRegion')}:
              </label>
              <select
                id="region-select"
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <option value="">{t('common.all')}</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Competition Type Badge */}
          {selectedCompetition && (
            <div className="ml-auto">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                {selectedCompetition.competition_type === 'individual' && t('competition.individual')}
                {selectedCompetition.competition_type === 'duo' && t('competition.duo')}
                {selectedCompetition.competition_type === 'team' && t('competition.team')}
                {selectedCompetition.competition_type === 'challenge' && t('competition.challenge')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rankings Table */}
      {selectedCompetition && (
        <DynamicRankingTable
          competitionId={selectedCompetition.id}
          competitionType={selectedCompetition.competition_type}
          region={selectedRegion || undefined}
        />
      )}
    </div>
  );
}
