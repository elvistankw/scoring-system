// Scoreboard grid component for displaying all scores
// Requirements: 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.4, 12.1, 12.2, 20.1, 20.3

'use client';

import { useRealtimeScores } from '@/hooks/use-realtime-scores';
import type { RealtimeScoreUpdate } from '@/interface/score';
import type { CompetitionType } from '@/interface/competition';
import { ScoreAnimation } from './score-animation';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/use-dictionary';

interface ScoreboardGridProps {
  competitionId: number;
  competitionType: CompetitionType;
}

/**
 * Scoreboard grid component for large display screens
 * Optimized for 1080p/4K displays with dark theme
 */
export function ScoreboardGrid({ competitionId, competitionType }: ScoreboardGridProps) {
  const { t } = useTranslation();

  const {
    latestScore,
    scores,
    status,
    isConnected,
    reconnectAttempts,
    error,
    connectionCount,
    reconnect
  } = useRealtimeScores(competitionId);

  const [showAnimation, setShowAnimation] = useState(false);
  const [animationScore, setAnimationScore] = useState<RealtimeScoreUpdate | null>(null);

  // Show animation when new score arrives
  useEffect(() => {
    if (latestScore) {
      setAnimationScore(latestScore);
      setShowAnimation(true);
    }
  }, [latestScore]);

  // Get column headers based on competition type
  const getHeaders = () => {
    const baseHeaders = [t('athlete.athlete'), t('athlete.athleteNumber'), t('judge.judge')];
    
    if (competitionType === 'individual') {
      return [...baseHeaders, t('score.actionDifficulty'), t('score.stageArtistry'), t('score.actionCreativity'), t('score.actionFluency'), t('score.costumeStyling')];
    } else if (competitionType === 'duo' || competitionType === 'team') {
      return [...baseHeaders, t('score.actionDifficulty'), t('score.stageArtistry'), t('score.actionInteraction'), t('score.actionCreativity'), t('score.costumeStyling')];
    } else if (competitionType === 'challenge') {
      return [...baseHeaders, t('score.actionDifficulty'), t('score.actionCreativity'), t('score.actionFluency')];
    }
    
    return baseHeaders;
  };

  // Get score values based on competition type
  const getScoreValues = (score: RealtimeScoreUpdate) => {
    const { scores: dimensions } = score;
    const dims = dimensions as any; // Type assertion for flexibility
    
    if (competitionType === 'individual') {
      return [
        dims.action_difficulty,
        dims.stage_artistry,
        dims.action_creativity,
        dims.action_fluency,
        dims.costume_styling
      ];
    } else if (competitionType === 'duo' || competitionType === 'team') {
      return [
        dims.action_difficulty,
        dims.stage_artistry,
        dims.action_interaction,
        dims.action_creativity,
        dims.costume_styling
      ];
    } else if (competitionType === 'challenge') {
      return [
        dims.action_difficulty,
        dims.action_creativity,
        dims.action_fluency
      ];
    }
    
    return [];
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Animation overlay */}
      {showAnimation && animationScore && (
        <ScoreAnimation
          score={animationScore}
          onAnimationComplete={() => setShowAnimation(false)}
        />
      )}

      {/* Header Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t('display.scoreboard')}</h1>
          <p className="text-gray-400">Competition ID: {competitionId}</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-400">{t('display.onlineViewers')}</p>
            <p className="text-2xl font-bold">{connectionCount}</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">{t('display.scoreRecords')}</p>
            <p className="text-2xl font-bold">{scores.length}</p>
          </div>
          
          <div className="text-right">
            {getStatusIndicator()}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium text-red-200">{t('display.connectionError')}</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button
            onClick={reconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            重新连接
          </button>
        </div>
      )}

      {/* Scoreboard Grid */}
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="grid gap-4 p-4 bg-gray-700 font-bold text-lg border-b-2 border-gray-600"
             style={{ gridTemplateColumns: `2fr 1fr 1.5fr repeat(${headers.length - 3}, 1fr)` }}>
          {headers.map((header, index) => (
            <div key={index} className="text-center">
              {header}
            </div>
          ))}
        </div>

        {/* Table Body */}
        {scores.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-2xl text-gray-400">
              {isConnected ? t('display.waitingScores') : t('display.waitingConnection')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {scores.map((score, index) => {
              const scoreValues = getScoreValues(score);
              const isLatest = latestScore && 
                score.athlete_id === latestScore.athlete_id && 
                score.judge_id === latestScore.judge_id &&
                score.timestamp === latestScore.timestamp;

              return (
                <div
                  key={`${score.athlete_id}-${score.judge_id}-${index}`}
                  className={`grid gap-4 p-4 transition-all duration-500 ${
                    isLatest 
                      ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 animate-pulse-slow' 
                      : 'hover:bg-gray-750'
                  }`}
                  style={{ gridTemplateColumns: `2fr 1fr 1.5fr repeat(${headers.length - 3}, 1fr)` }}
                >
                  <div className="text-left font-medium text-lg">
                    {score.athlete_name}
                  </div>
                  <div className="text-center text-gray-300">
                    {score.athlete_number}
                  </div>
                  <div className="text-center text-gray-300">
                    {score.judge_name}
                  </div>
                  {scoreValues.map((value, idx) => (
                    <div key={idx} className="text-center text-xl font-bold text-blue-400">
                      {value?.toFixed(2) || '-'}
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
        <p>实时比分系统 | Realtime Scoring System</p>
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
