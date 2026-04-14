// Ranking table component for displaying athlete rankings
// Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.4, 12.1, 12.2

'use client';

import { useEffect, useState } from 'react';
import { useRealtimeScores } from '@/hooks/use-realtime-scores';
import type { AthleteRanking } from '@/interface/score';
import type { CompetitionType } from '@/interface/competition';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useTranslation } from '@/i18n/use-dictionary';

interface RankingTableProps {
  competitionId: number;
  competitionType: CompetitionType;
  region?: string;
}

/**
 * Ranking table component for large display screens
 * Shows average scores by dimension with regional filtering support
 * Optimized for 1080p/4K displays with dark theme
 */
export function RankingTable({ competitionId, competitionType, region }: RankingTableProps) {
  const { t } = useTranslation();

  const [rankings, setRankings] = useState<AthleteRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    latestScore,
    isConnected,
    status,
    reconnectAttempts,
    error: wsError,
    connectionCount,
    reconnect
  } = useRealtimeScores(competitionId);

  // Fetch rankings from API
  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = API_ENDPOINTS.display.rankings(competitionId);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rankings: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        let rankingsData = data.data;
        
        // Filter by region if specified
        if (region) {
          // Note: Backend doesn't filter by region yet, so we filter client-side
          // In production, this should be done server-side via query parameter
          rankingsData = rankingsData.filter((r: AthleteRanking) => 
            r.competition_name.includes(region)
          );
        }
        
        setRankings(rankingsData);
      } else {
        throw new Error(data.message || 'Failed to load rankings');
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRankings();
  }, [competitionId, region]);

  // Refresh rankings when new score arrives via WebSocket
  useEffect(() => {
    if (latestScore) {
      console.log('📊 New score received, refreshing rankings...');
      fetchRankings();
    }
  }, [latestScore]);

  // Get column headers based on competition type
  const getHeaders = () => {
    const baseHeaders = ['排名', t('athlete.athlete'), t('athlete.athleteNumber'), '评委数'];
    
    if (competitionType === 'individual') {
      return [...baseHeaders, t('score.actionDifficulty'), t('score.stageArtistry'), t('score.actionCreativity'), t('score.actionFluency'), t('score.costumeStyling')];
    } else if (competitionType === 'duo_team') {
      return [...baseHeaders, t('score.actionDifficulty'), t('score.stageArtistry'), t('score.actionInteraction'), t('score.actionCreativity'), t('score.costumeStyling')];
    } else if (competitionType === 'challenge') {
      return [...baseHeaders, t('score.actionDifficulty'), t('score.actionCreativity'), t('score.actionFluency')];
    }
    
    return baseHeaders;
  };

  // Get score values based on competition type
  const getScoreValues = (ranking: AthleteRanking) => {
    const { average_scores } = ranking;
    
    if (competitionType === 'individual') {
      return [
        average_scores.action_difficulty,
        average_scores.stage_artistry,
        average_scores.action_creativity,
        average_scores.action_fluency,
        average_scores.costume_styling
      ];
    } else if (competitionType === 'duo_team') {
      return [
        average_scores.action_difficulty,
        average_scores.stage_artistry,
        average_scores.action_interaction,
        average_scores.action_creativity,
        average_scores.costume_styling
      ];
    } else if (competitionType === 'challenge') {
      return [
        average_scores.action_difficulty,
        average_scores.action_creativity,
        average_scores.action_fluency
      ];
    }
    
    return [];
  };

  // Format score value for display
  const formatScore = (score: string | null) => {
    if (!score) return '-';
    return parseFloat(score).toFixed(2);
  };

  // Connection status indicator
  const getStatusIndicator = () => {
    const statusConfig = {
      connected: { icon: '🟢', text: t('connection.connected'), color: 'text-green-400' },
      connecting: { icon: '🟡', text: t('connection.connecting'), color: 'text-yellow-400' },
      reconnecting: { icon: '🟠', text: t('connection.reconnecting'), color: 'text-orange-400' },
      disconnected: { icon: '⚪', text: t('connection.disconnected'), color: 'text-gray-400' },
      failed: { icon: '🔴', text: t('connection.failed'), color: 'text-red-400' }
    };

    const config = statusConfig[status] || statusConfig.disconnected;

    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <span>{config.icon}</span>
        <span className="text-sm font-medium">{config.text}</span>
        {reconnectAttempts > 0 && (
          <span className="text-xs opacity-75">({reconnectAttempts}/10)</span>
        )}
      </div>
    );
  };

  const headers = getHeaders();

  if (loading && rankings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-xl text-gray-400">{t('display.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('display.rankings')}</h1>
          <p className="text-gray-400">Competition ID: {competitionId}</p>
          {region && (
            <p className="text-gray-400 mt-1">赛区: {region}</p>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-400">{t('display.onlineViewers')}</p>
            <p className="text-2xl font-bold">{connectionCount}</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">{t('display.participants')}</p>
            <p className="text-2xl font-bold">{rankings.length}</p>
          </div>
          
          <div className="text-right">
            {getStatusIndicator()}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(error || wsError) && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium text-red-200">{t('display.connectionError')}</p>
            <p className="text-sm text-red-300">{error || wsError}</p>
          </div>
          <button
            onClick={() => {
              fetchRankings();
              reconnect();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            重新加载
          </button>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div 
          className="grid gap-4 p-4 bg-gray-700 font-bold text-lg border-b-2 border-gray-600"
          style={{ 
            gridTemplateColumns: `80px 2fr 1fr 100px repeat(${headers.length - 4}, 1fr)` 
          }}
        >
          {headers.map((header, index) => (
            <div key={index} className="text-center">
              {header}
            </div>
          ))}
        </div>

        {/* Table Body */}
        {rankings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-2xl text-gray-400">
              {isConnected ? t('display.noRankingData') : t('display.waitingConnection')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {rankings.map((ranking) => {
              const scoreValues = getScoreValues(ranking);
              
              // Highlight top 3
              const rankClass = 
                ranking.rank === 1 ? 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/30' :
                ranking.rank === 2 ? 'bg-gradient-to-r from-gray-700/30 to-gray-600/30' :
                ranking.rank === 3 ? 'bg-gradient-to-r from-orange-900/30 to-orange-800/30' :
                'hover:bg-gray-750';

              return (
                <div
                  key={ranking.athlete_id}
                  className={`grid gap-4 p-4 transition-all duration-300 ${rankClass}`}
                  style={{ 
                    gridTemplateColumns: `80px 2fr 1fr 100px repeat(${headers.length - 4}, 1fr)` 
                  }}
                >
                  {/* Rank */}
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${
                      ranking.rank === 1 ? 'text-yellow-400' :
                      ranking.rank === 2 ? 'text-gray-300' :
                      ranking.rank === 3 ? 'text-orange-400' :
                      'text-white'
                    }`}>
                      {ranking.rank === 1 ? '🥇' : 
                       ranking.rank === 2 ? '🥈' : 
                       ranking.rank === 3 ? '🥉' : 
                       ranking.rank}
                    </span>
                  </div>
                  
                  {/* Athlete Name */}
                  <div className="text-left font-medium text-lg">
                    {ranking.athlete_name}
                  </div>
                  
                  {/* Athlete Number */}
                  <div className="text-center text-gray-300">
                    {ranking.athlete_number}
                  </div>
                  
                  {/* Judge Count */}
                  <div className="text-center text-gray-300">
                    {ranking.judge_count}
                  </div>
                  
                  {/* Score Dimensions */}
                  {scoreValues.map((value, idx) => (
                    <div key={idx} className="text-center text-xl font-bold text-blue-400">
                      {formatScore(value)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>实时排名系统 | Realtime Ranking System</p>
        <p className="mt-1">
          {new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}
