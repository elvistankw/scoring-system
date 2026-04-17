'use client';

// 🎨 Enhanced Score Input Form with Animations
// 增强版评分表单 - 带有精美动画和视觉反馈

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/use-dictionary';
import type { Competition } from '@/interface/competition';
import type { Athlete } from '@/interface/athlete';
import type { IndividualScores, DuoTeamScores, ChallengeScores, ScoreDimensions, SubmitScoreRequest } from '@/interface/score';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

interface EnhancedScoreInputFormProps {
  competition: Competition;
  athlete: Athlete;
  onSubmitSuccess: () => void;
}

export function EnhancedScoreInputForm({ competition, athlete, onSubmitSuccess }: EnhancedScoreInputFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  
  const getDimensionLabel = (field: string): string => {
    switch (field) {
      case 'action_difficulty':
        return t('score.actionDifficulty');
      case 'stage_artistry':
        return t('score.stageArtistry');
      case 'action_creativity':
        return t('score.actionCreativity');
      case 'action_fluency':
        return t('score.actionFluency');
      case 'costume_styling':
        return t('score.costumeStyling');
      case 'action_interaction':
        return t('score.actionInteraction');
      default:
        return field;
    }
  };

  const getDimensionWeight = (field: string): number => {
    if (competition.competition_type === 'individual') {
      switch (field) {
        case 'action_difficulty': return 30;
        case 'stage_artistry': return 25;
        case 'action_creativity': return 20;
        case 'action_fluency': return 15;
        case 'costume_styling': return 10;
        default: return 0;
      }
    } else if (competition.competition_type === 'duo' || competition.competition_type === 'team') {
      switch (field) {
        case 'action_difficulty': return 35;
        case 'stage_artistry': return 25;
        case 'action_interaction': return 15;
        case 'action_creativity': return 15;
        case 'costume_styling': return 10;
        default: return 0;
      }
    } else {
      switch (field) {
        case 'action_difficulty': return 50;
        case 'action_creativity': return 30;
        case 'action_fluency': return 20;
        default: return 0;
      }
    }
  };
  
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const baseScores: Record<string, string> = {};
    
    if (competition.competition_type === 'individual') {
      baseScores.action_difficulty = '';
      baseScores.stage_artistry = '';
      baseScores.action_creativity = '';
      baseScores.action_fluency = '';
      baseScores.costume_styling = '';
    } else if (competition.competition_type === 'duo' || competition.competition_type === 'team') {
      baseScores.action_difficulty = '';
      baseScores.stage_artistry = '';
      baseScores.action_interaction = '';
      baseScores.action_creativity = '';
      baseScores.costume_styling = '';
    } else {
      baseScores.action_difficulty = '';
      baseScores.action_creativity = '';
      baseScores.action_fluency = '';
    }
    
    return baseScores;
  });

  const getFields = (): string[] => {
    if (competition.competition_type === 'individual') {
      return ['action_difficulty', 'stage_artistry', 'action_creativity', 'action_fluency', 'costume_styling'];
    } else if (competition.competition_type === 'duo' || competition.competition_type === 'team') {
      return ['action_difficulty', 'stage_artistry', 'action_interaction', 'action_creativity', 'costume_styling'];
    } else {
      return ['action_difficulty', 'action_creativity', 'action_fluency'];
    }
  };

  const fields = getFields();

  // 计算完成进度
  const progress = (completedFields.size / fields.length) * 100;

  const handleInputChange = (field: string, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setScores(prev => ({ ...prev, [field]: value }));
      
      // 更新完成状态
      if (value !== '') {
        setCompletedFields(prev => new Set([...prev, field]));
      } else {
        setCompletedFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
      }
    }
  };

  const validateScores = (): boolean => {
    for (const field of fields) {
      const value = scores[field];
      if (value === '' || value === null || value === undefined) {
        toast.error(`${getDimensionLabel(field)}: ${t('judge.fillAllScores')}`);
        return false;
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        toast.error(`${getDimensionLabel(field)}: ${t('judge.invalidNumber')}`);
        return false;
      }
    }

    for (const field of fields) {
      const value = parseFloat(scores[field]);
      const maxScore = getDimensionWeight(field);
      
      if (value < 0 || value > maxScore) {
        toast.error(`${getDimensionLabel(field)}: ${t('judge.scoreRangeError')} 0-${maxScore}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateScores()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error(t('auth.emailRequired'));
        return;
      }

      let scoreData: ScoreDimensions;
      
      if (competition.competition_type === 'individual') {
        scoreData = {
          action_difficulty: parseFloat(scores.action_difficulty),
          stage_artistry: parseFloat(scores.stage_artistry),
          action_creativity: parseFloat(scores.action_creativity),
          action_fluency: parseFloat(scores.action_fluency),
          costume_styling: parseFloat(scores.costume_styling),
        } as IndividualScores;
      } else if (competition.competition_type === 'duo' || competition.competition_type === 'team') {
        scoreData = {
          action_difficulty: parseFloat(scores.action_difficulty),
          stage_artistry: parseFloat(scores.stage_artistry),
          action_interaction: parseFloat(scores.action_interaction),
          action_creativity: parseFloat(scores.action_creativity),
          costume_styling: parseFloat(scores.costume_styling),
        } as DuoTeamScores;
      } else {
        scoreData = {
          action_difficulty: parseFloat(scores.action_difficulty),
          action_creativity: parseFloat(scores.action_creativity),
          action_fluency: parseFloat(scores.action_fluency),
        } as ChallengeScores;
      }

      const requestBody: SubmitScoreRequest = {
        competition_id: competition.id,
        athlete_id: athlete.id,
        scores: scoreData,
      };

      const response = await fetch(API_ENDPOINTS.scores.submit, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('judge.scoreSubmitted'));
      }

      toast.success(t('judge.scoreSubmitted'));
      
      const emptyScores: Record<string, string> = {};
      fields.forEach(field => {
        emptyScores[field] = '';
      });
      setScores(emptyScores);
      setCompletedFields(new Set());
      
      onSubmitSuccess();
    } catch (error) {
      console.error('Score submission error:', error);
      toast.error(error instanceof Error ? error.message : t('common.operationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 🎯 选手信息卡片 - 带渐变和动画 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 p-6 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse delay-75" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="font-bold text-2xl text-white drop-shadow-lg">
              {athlete.name}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              {t('athlete.athleteNumber')}: {athlete.athlete_number}
            </span>
            {athlete.team_name && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {t('athlete.teamName')}: {athlete.team_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 📊 进度条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            评分进度
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {completedFields.size} / {fields.length}
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-white/30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 🎨 评分输入区域 - 网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field, index) => {
          const weight = getDimensionWeight(field);
          const isFocused = focusedField === field;
          const isCompleted = completedFields.has(field);
          
          return (
            <div 
              key={field}
              className="transform transition-all duration-300"
              style={{
                animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <label
                htmlFor={field}
                className="block mb-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    {getDimensionLabel(field)}
                    <span className="text-red-500">*</span>
                    {isCompleted && (
                      <span className="text-green-500 animate-bounce">✓</span>
                    )}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">
                    {weight}%
                  </span>
                </div>
              </label>
              
              <div className="relative">
                <input
                  id={field}
                  type="text"
                  inputMode="decimal"
                  value={scores[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onFocus={() => setFocusedField(field)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={`0-${weight}`}
                  className={`
                    w-full px-5 py-4 rounded-xl text-lg font-semibold
                    bg-white dark:bg-gray-800 
                    border-2 transition-all duration-300
                    text-gray-900 dark:text-gray-100
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    ${isFocused 
                      ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/30 scale-105' 
                      : isCompleted
                      ? 'border-green-500 dark:border-green-400'
                      : 'border-gray-300 dark:border-gray-600'
                    }
                    ${isCompleted && !isFocused ? 'bg-green-50 dark:bg-green-900/20' : ''}
                  `}
                  style={{ minHeight: '56px' }}
                  disabled={isSubmitting}
                />
                
                {/* 聚焦时的光晕效果 */}
                {isFocused && (
                  <div className="absolute inset-0 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 animate-pulse pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚀 提交按钮 - 带动画和渐变 */}
      <button
        type="submit"
        disabled={isSubmitting || completedFields.size !== fields.length}
        className={`
          w-full py-5 px-6 rounded-xl font-bold text-lg
          transition-all duration-300 transform
          ${isSubmitting || completedFields.size !== fields.length
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'
          }
        `}
        style={{ minHeight: '56px' }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('judge.submitting')}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>✨</span>
            {t('judge.submitScore')}
            <span>✨</span>
          </span>
        )}
      </button>

      {/* 💡 提示文字 */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-2">
        <span>💡</span>
        {t('judge.scoreRangeNote')}
      </p>

      {/* 添加动画关键帧 */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </form>
  );
}
