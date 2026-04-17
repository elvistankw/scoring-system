'use client';

// 🎨 Enhanced Scoreboard Card for Large Display
// 增强版大屏幕比分卡片 - 适用于1080P/4K投影仪

import { useState, useEffect } from 'react';
import type { AthleteRanking } from '@/interface/score';

interface EnhancedScoreboardCardProps {
  ranking: AthleteRanking;
  competitionType: 'individual' | 'duo' | 'team' | 'challenge';
  isNew?: boolean;
}

export function EnhancedScoreboardCard({ ranking, competitionType, isNew = false }: EnhancedScoreboardCardProps) {
  const [showAnimation, setShowAnimation] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // 获取排名样式
  const getRankStyle = () => {
    switch (ranking.rank) {
      case 1:
        return {
          gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
          icon: '🥇',
          glow: 'shadow-yellow-500/50',
          border: 'border-yellow-400'
        };
      case 2:
        return {
          gradient: 'from-gray-300 via-gray-400 to-gray-500',
          icon: '🥈',
          glow: 'shadow-gray-400/50',
          border: 'border-gray-400'
        };
      case 3:
        return {
          gradient: 'from-orange-400 via-orange-500 to-orange-600',
          icon: '🥉',
          glow: 'shadow-orange-500/50',
          border: 'border-orange-400'
        };
      default:
        return {
          gradient: 'from-blue-500 via-purple-500 to-pink-500',
          icon: ranking.rank.toString(),
          glow: 'shadow-blue-500/30',
          border: 'border-blue-500'
        };
    }
  };

  const rankStyle = getRankStyle();

  // 获取分数维度
  const getScoreDimensions = () => {
    const { average_scores } = ranking;
    
    if (competitionType === 'individual') {
      return [
        { label: '动作难度', value: average_scores.action_difficulty, weight: 30 },
        { label: '舞台艺术', value: average_scores.stage_artistry, weight: 25 },
        { label: '动作创意', value: average_scores.action_creativity, weight: 20 },
        { label: '动作流畅', value: average_scores.action_fluency, weight: 15 },
        { label: '服装造型', value: average_scores.costume_styling, weight: 10 }
      ];
    } else if (competitionType === 'duo' || competitionType === 'team') {
      return [
        { label: '动作难度', value: average_scores.action_difficulty, weight: 35 },
        { label: '舞台艺术', value: average_scores.stage_artistry, weight: 25 },
        { label: '动作配合', value: average_scores.action_interaction, weight: 15 },
        { label: '动作创意', value: average_scores.action_creativity, weight: 15 },
        { label: '服装造型', value: average_scores.costume_styling, weight: 10 }
      ];
    } else {
      return [
        { label: '动作难度', value: average_scores.action_difficulty, weight: 50 },
        { label: '动作创意', value: average_scores.action_creativity, weight: 30 },
        { label: '动作流畅', value: average_scores.action_fluency, weight: 20 }
      ];
    }
  };

  const dimensions = getScoreDimensions();

  const formatScore = (score: string | null) => {
    if (score === null || score === undefined) return '-';
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '-';
    return numScore.toFixed(2);
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-3xl
        bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
        border-2 ${rankStyle.border}
        shadow-2xl ${rankStyle.glow}
        transition-all duration-500 transform
        ${showAnimation ? 'scale-105 animate-pulse' : 'hover:scale-105'}
      `}
      style={{
        animation: showAnimation ? 'newScoreFlash 3s ease-in-out' : undefined
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full blur-3xl -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 新分数标记 */}
      {showAnimation && (
        <div className="absolute top-4 right-4 z-20">
          <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white font-bold text-sm animate-bounce shadow-lg">
            ✨ NEW
          </div>
        </div>
      )}

      <div className="relative z-10 p-8">
        {/* 排名和选手信息 */}
        <div className="flex items-center gap-6 mb-6">
          {/* 排名徽章 */}
          <div className={`
            relative w-24 h-24 rounded-2xl
            bg-gradient-to-br ${rankStyle.gradient}
            flex items-center justify-center
            shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-300
          `}>
            <span className="text-4xl font-black text-white drop-shadow-lg">
              {rankStyle.icon}
            </span>
            {ranking.rank <= 3 && (
              <div className="absolute inset-0 rounded-2xl border-4 border-white/30 animate-pulse" />
            )}
          </div>

          {/* 选手信息 */}
          <div className="flex-1">
            <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
              {ranking.athlete_name}
            </h3>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
                编号: {ranking.athlete_number}
              </span>
              <span className="px-4 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
                评委: {ranking.judge_count}
              </span>
            </div>
          </div>
        </div>

        {/* 分数维度 */}
        <div className="space-y-4">
          {dimensions.map((dim, index) => {
            const score = formatScore(dim.value);
            const percentage = dim.value ? (parseFloat(dim.value) / dim.weight) * 100 : 0;
            
            return (
              <div 
                key={index}
                className="space-y-2"
                style={{
                  animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/80 font-medium text-lg">
                    {dim.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-full text-white/70">
                      {dim.weight}%
                    </span>
                    <span className="text-2xl font-black text-white min-w-[80px] text-right">
                      {score}
                    </span>
                  </div>
                </div>
                
                {/* 进度条 */}
                <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 边框光效 */}
      <div className="absolute inset-0 rounded-3xl border-2 border-white/10 pointer-events-none" />

      {/* 添加动画关键帧 */}
      <style jsx>{`
        @keyframes newScoreFlash {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8), 0 0 60px rgba(168, 85, 247, 0.6);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
