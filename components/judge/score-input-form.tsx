'use client';

// Dynamic score input form component for judge scoring
// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 12.1, 12.2, 12.3, 12.4, 12.5, 14.1, 14.2, 14.3

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/use-dictionary';
import type { Competition } from '@/interface/competition';
import type { Athlete } from '@/interface/athlete';
import type { IndividualScores, DuoTeamScores, ChallengeScores, ScoreDimensions, SubmitScoreRequest } from '@/interface/score';
import { API_ENDPOINTS, getAuthHeaders } from '@/lib/api-config';

interface ScoreInputFormProps {
  competition: Competition;
  athlete: Athlete;
  onSubmitSuccess: () => void;
}

export function ScoreInputForm({ competition, athlete, onSubmitSuccess }: ScoreInputFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  
  // Get dimension labels from translation
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

  // Get dimension weight percentage based on competition type
  const getDimensionWeight = (field: string): number => {
    if (competition.competition_type === 'individual') {
      // 个人舞台赛
      switch (field) {
        case 'action_difficulty': return 30;
        case 'stage_artistry': return 25;
        case 'action_creativity': return 20;
        case 'action_fluency': return 15;
        case 'costume_styling': return 10;
        default: return 0;
      }
    } else if (competition.competition_type === 'duo' || competition.competition_type === 'team') {
      // 双人舞台赛/团体赛 (使用相同的评分标准)
      switch (field) {
        case 'action_difficulty': return 35;
        case 'stage_artistry': return 25;
        case 'action_interaction': return 15;
        case 'action_creativity': return 15;
        case 'costume_styling': return 10;
        default: return 0;
      }
    } else {
      // 挑战赛
      switch (field) {
        case 'action_difficulty': return 50;
        case 'action_creativity': return 30;
        case 'action_fluency': return 20;
        default: return 0;
      }
    }
  };
  
  // Initialize scores based on competition type
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
      // challenge
      baseScores.action_difficulty = '';
      baseScores.action_creativity = '';
      baseScores.action_fluency = '';
    }
    
    return baseScores;
  });

  // Get fields based on competition type
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

  const handleInputChange = (field: string, value: string) => {
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setScores(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateScores = (): boolean => {
    // Check all fields are filled
    for (const field of fields) {
      const value = scores[field];
      if (value === '' || value === null || value === undefined) {
        toast.error(`${getDimensionLabel(field)}: ${t('judge.fillAllScores')}`);
        return false;
      }
      
      // Check if it's a valid number (including 0)
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        toast.error(`${getDimensionLabel(field)}: ${t('judge.invalidNumber')}`);
        return false;
      }
    }

    // Check score range based on dimension weight (0 to weight%)
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
      // Get token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error(t('auth.emailRequired'));
        return;
      }

      // Convert string scores to numbers and create proper score object
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

      // 🔍 DEBUG: Log request data
      console.log('🔍 Submitting score:', {
        competition_id: competition.id,
        competition_type: competition.competition_type,
        athlete_id: athlete.id,
        athlete_name: athlete.name,
        scores: scoreData
      });

      const response = await fetch(API_ENDPOINTS.scores.submit, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || t('judge.scoreSubmitted'));
      }

      toast.success(t('judge.scoreSubmitted'));
      
      // Reset form
      const emptyScores: Record<string, string> = {};
      fields.forEach(field => {
        emptyScores[field] = '';
      });
      setScores(emptyScores);
      
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
      {/* Athlete Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          {athlete.name}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('athlete.athleteNumber')}: {athlete.athlete_number}
          {athlete.team_name && ` | ${t('athlete.teamName')}: ${athlete.team_name}`}
        </p>
      </div>

      {/* Score Inputs - Grid layout for tablet landscape, stack for portrait */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const weight = getDimensionWeight(field);
          return (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <span className="flex items-center justify-between">
                  <span>
                    {getDimensionLabel(field)}
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {weight}%
                  </span>
                </span>
              </label>
              <input
                id={field}
                type="text"
                inputMode="decimal"
                value={scores[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={`0-${weight}`}
                max={weight}
                className="
                  w-full px-4 py-3 rounded-lg 
                  bg-white dark:bg-gray-800 
                  border border-gray-300 dark:border-gray-600 
                  text-gray-900 dark:text-gray-100
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                  text-lg
                "
                style={{ minHeight: '44px' }} // Touch target requirement
                disabled={isSubmitting}
              />
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full py-4 px-6 rounded-lg font-semibold text-lg
          bg-blue-600 hover:bg-blue-700 text-white
          disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors duration-200
          active:scale-[0.98]
        "
        style={{ minHeight: '44px' }} // Touch target requirement
      >
        {isSubmitting ? t('judge.submitting') : t('judge.submitScore')}
      </button>

      {/* Helper Text */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {t('judge.scoreRangeNote')}
      </p>
    </form>
  );
}
