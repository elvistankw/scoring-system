// Example component demonstrating use-realtime-scores hook
// Requirements: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4

'use client';

import { useRealtimeScores } from '@/hooks/use-realtime-scores';
import type { RealtimeScoreUpdate } from '@/interface/score';
import { useTranslation } from '@/i18n/use-dictionary';

interface RealtimeScoreDisplayProps {
  competitionId: number;
}

/**
 * Example component showing real-time score updates
 * Demonstrates proper usage of useRealtimeScores hook
 */
export function RealtimeScoreDisplay({ competitionId }: RealtimeScoreDisplayProps) {
  const { t } = useTranslation();

  const {
    latestScore,
    scores,
    status,
    isConnected,
    reconnectAttempts,
    error,
    connectionCount,
    reconnect,
    clearScores
  } = useRealtimeScores(competitionId);

  // Connection status indicator
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'reconnecting': return 'bg-orange-500';
      case 'disconnected': return 'bg-gray-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return '🟢 ' + t('common.connected');
      case 'connecting': return '🟡 ' + t('common.connecting');
      case 'reconnecting': return '🟠 ' + t('common.reconnecting');
      case 'disconnected': return '⚪ ' + t('common.disconnected');
      case 'failed': return '🔴 ' + t('common.failed');
      default: return '⚪ ' + t('common.unknown');
    }
  };

  // Format score dimensions for display
  const formatScores = (score: RealtimeScoreUpdate) => {
    const { scores: dimensions, competition_type } = score;
    
    if (competition_type === 'individual') {
      const individualScores = dimensions as any;
      return (
        <div className="grid grid-cols-5 gap-2">
          <div>难度: {individualScores.action_difficulty}</div>
          <div>艺术: {individualScores.stage_artistry}</div>
          <div>创意: {individualScores.action_creativity}</div>
          <div>流畅: {individualScores.action_fluency}</div>
          <div>服装: {individualScores.costume_styling}</div>
        </div>
      );
    } else if (competition_type === 'duo_team') {
      const duoScores = dimensions as any;
      return (
        <div className="grid grid-cols-5 gap-2">
          <div>难度: {duoScores.action_difficulty}</div>
          <div>艺术: {duoScores.stage_artistry}</div>
          <div>互动: {duoScores.action_interaction}</div>
          <div>创意: {duoScores.action_creativity}</div>
          <div>服装: {duoScores.costume_styling}</div>
        </div>
      );
    } else if (competition_type === 'challenge') {
      const challengeScores = dimensions as any;
      return (
        <div className="grid grid-cols-3 gap-2">
          <div>难度: {challengeScores.action_difficulty}</div>
          <div>创意: {challengeScores.action_creativity}</div>
          <div>流畅: {challengeScores.action_fluency}</div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="font-medium">{getStatusText()}</span>
          {reconnectAttempts > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              (尝试 {reconnectAttempts}/10)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            👥 {connectionCount} 在线观众
          </span>
          
          {!isConnected && (
            <button
              onClick={reconnect}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              重新连接
            </button>
          )}
          
          {scores.length > 0 && (
            <button
              onClick={clearScores}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              清空记录
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          <p className="font-medium">{t('display.connectionError')}</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Latest Score Highlight */}
      {latestScore && (
        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-2">{t('display.latestScore')}</h3>
          <div className="space-y-2">
            <p className="text-lg">
              选手: <span className="font-bold">{latestScore.athlete_name}</span> 
              ({latestScore.athlete_number})
            </p>
            <p className="text-sm opacity-90">
              评委: {latestScore.judge_name}
            </p>
            <div className="mt-4 p-4 bg-white/20 rounded">
              {formatScores(latestScore)}
            </div>
            <p className="text-xs opacity-75 mt-2">
              {new Date(latestScore.timestamp).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      )}

      {/* Score History */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('display.scoreRecords')}</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('common.total')} {scores.length} {t('common.records')}
          </span>
        </div>
        
        {scores.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {isConnected ? t('display.waitingScores') : t('display.connectToReceiveScores')}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scores.map((score, index) => (
              <div
                key={`${score.athlete_id}-${score.judge_id}-${index}`}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{score.athlete_name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      ({score.athlete_number})
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(score.timestamp).toLocaleTimeString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  评委: {score.judge_name}
                </p>
                <div className="text-sm">
                  {formatScores(score)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
