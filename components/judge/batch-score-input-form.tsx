'use client';

// Individual score input form - saves each field independently with partial updates
// Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 12.1, 12.2, 12.3, 12.4, 12.5, 14.1, 14.2, 14.3

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/use-dictionary';
import { BilingualText } from '@/components/shared/bilingual-text';
import { judgeApiClient } from '@/lib/judge-api-client';
import type { Competition } from '@/interface/competition';
import type { Athlete } from '@/interface/athlete';
import type { IndividualScores, DuoTeamScores, ChallengeScores, ScoreDimensions } from '@/interface/score';
import type { ReactElement } from 'react';

interface BatchScoreInputFormProps {
  competition: Competition;
  athlete: Athlete;
  existingScores: ScoreDimensions | null;
  onScoreUpdate: (athleteId: number, scores: ScoreDimensions | null, isComplete: boolean) => void;
}

export function BatchScoreInputForm({ 
  competition, 
  athlete, 
  existingScores,
  onScoreUpdate 
}: BatchScoreInputFormProps) {
  const { t } = useTranslation();
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const saveTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastValidationRef = useRef<{ isValid: boolean; scoreData: ScoreDimensions | null }>({ isValid: false, scoreData: null });
  const currentAthleteIdRef = useRef<number>(athlete.id);
  
  // Get dimension labels as BilingualText component
  const getDimensionLabel = (field: string): ReactElement => {
    let translationKey: string;
    switch (field) {
      case 'action_difficulty':
        translationKey = 'score.actionDifficulty';
        break;
      case 'stage_artistry':
        translationKey = 'score.stageArtistry';
        break;
      case 'action_creativity':
        translationKey = 'score.actionCreativity';
        break;
      case 'action_fluency':
        translationKey = 'score.actionFluency';
        break;
      case 'costume_styling':
        translationKey = 'score.costumeStyling';
        break;
      case 'action_interaction':
        translationKey = 'score.actionInteraction';
        break;
      default:
        translationKey = 'common.unknown';
    }
    
    return (
      <BilingualText 
        translationKey={translationKey}
        chineseSize="text-sm" 
        englishSize="text-xs"
      />
    );
  };

  // Get dimension labels as plain text for error messages
  const getDimensionLabelText = (field: string): string => {
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
  
  // Initialize scores based on competition type and existing scores
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
    
    // Load existing scores if available
    if (existingScores) {
      Object.keys(baseScores).forEach(key => {
        const value = (existingScores as any)[key];
        if (value !== null && value !== undefined) {
          baseScores[key] = String(value);
        }
      });
    }
    
    return baseScores;
  });

  // Update scores when athlete changes (but not when existingScores updates during input)
  useEffect(() => {
    const athleteChanged = currentAthleteIdRef.current !== athlete.id;
    
    // Update the ref
    currentAthleteIdRef.current = athlete.id;
    
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
    
    // Load existing scores for this athlete
    if (existingScores) {
      Object.keys(baseScores).forEach(key => {
        const existingValue = (existingScores as any)[key];
        if (existingValue !== null && existingValue !== undefined) {
          baseScores[key] = String(existingValue);
        }
      });
    }
    
    // Always update scores - either because athlete changed or existingScores changed
    setScores(prevScores => {
      // If athlete changed, use baseScores completely
      if (athleteChanged) {
        return baseScores;
      }
      
      // If athlete didn't change, we need to be smart about merging
      // Only preserve form values that are different from existingScores
      const mergedScores: Record<string, string> = { ...baseScores };
      
      Object.keys(prevScores).forEach(key => {
        const prevValue = prevScores[key];
        const existingValue = existingScores ? String((existingScores as any)[key] || '') : '';
        
        // If user has modified this field (different from existing), keep user's value
        if (prevValue !== existingValue) {
          mergedScores[key] = prevValue;
        }
      });
      
      return mergedScores;
    });
  }, [athlete.id, existingScores, competition.competition_type]);

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
    // Allow empty string for deletion
    if (value === '') {
      setScores(prev => ({ ...prev, [field]: value }));
      saveFieldPartially(field, value);
      return;
    }
    
    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    // Limit to 2 digits before decimal point and 2 digits after
    const parts = value.split('.');
    if (parts[0].length > 2) {
      return; // More than 2 digits before decimal
    }
    if (parts.length > 1 && parts[1].length > 2) {
      return; // More than 2 digits after decimal
    }
    
    // Check maximum value based on field weight
    const maxScore = getDimensionWeight(field);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > maxScore) {
      return; // Exceeds maximum allowed score
    }
    
    setScores(prev => ({ ...prev, [field]: value }));
    
    // Trigger partial save for this field
    saveFieldPartially(field, value);
  };

  // Save individual field with debouncing
  const saveFieldPartially = async (field: string, value: string) => {
    // Clear existing timer for this field
    const existingTimer = saveTimersRef.current.get(field);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set saving state for this field
    setSavingFields(prev => new Set(prev).add(field));

    // Create new debounced timer for this field
    const timer = setTimeout(async () => {
      try {
        // Validate value
        let numValue: number | null = null;
        if (value !== '' && value !== null && value !== undefined) {
          numValue = parseFloat(value);
          if (isNaN(numValue)) {
            console.log(`Skipping save for invalid value: ${value}`);
            return;
          }

          // Check range based on field weight
          const maxScore = getDimensionWeight(field);
          if (numValue < 0 || numValue > maxScore) {
            toast.error(`${getDimensionLabelText(field)} must be between 0-${maxScore}`);
            return;
          }
        }

        // Check if judge has active session
        if (!judgeApiClient.hasActiveSession()) {
          toast.error('请先选择评委身份');
          return;
        }

        // Call partial update API
        const result = await judgeApiClient.partialScoreUpdate({
          competition_id: competition.id,
          athlete_id: athlete.id,
          field: field,
          value: numValue
        });

        // Update parent component with current state
        updateParentWithCurrentScores();

      } catch (error) {
        console.error(`❌ Failed to save field ${field}:`, error);
        toast.error(`Failed to save ${getDimensionLabelText(field)}`);
      } finally {
        // Remove saving state for this field
        setSavingFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
        
        // Remove timer reference
        saveTimersRef.current.delete(field);
      }
    }, 500); // 500ms debounce for individual fields

    // Store timer reference
    saveTimersRef.current.set(field, timer);
  };

  // Update parent component with current scores
  const updateParentWithCurrentScores = useCallback(() => {
    const { isValid, scoreData } = validateScores();
    
    // Only update parent if validation state has actually changed
    const lastValidation = lastValidationRef.current;
    if (lastValidation.isValid !== isValid || 
        JSON.stringify(lastValidation.scoreData) !== JSON.stringify(scoreData)) {
      lastValidationRef.current = { isValid, scoreData };
      onScoreUpdate(athlete.id, scoreData, isValid);
    }
  }, [athlete.id, scores]); // Remove onScoreUpdate from dependencies to prevent infinite loops

  const validateScores = (): { isValid: boolean; scoreData: ScoreDimensions | null } => {
    // Build partial score data from current form state (only include non-null values)
    const partialScoreData: any = {};
    
    // Check all fields are filled
    let allFieldsFilled = true;
    for (const field of fields) {
      const value = scores[field];
      if (value === '' || value === null || value === undefined) {
        allFieldsFilled = false;
        // Don't include null fields in partial data
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          allFieldsFilled = false;
          // Don't include invalid fields
        } else {
          // Only include valid numeric values
          partialScoreData[field] = numValue;
        }
      }
    }

    // If not all fields are filled, return partial data (only filled fields)
    if (!allFieldsFilled) {
      // Return null if no fields are filled, otherwise return partial data
      return { 
        isValid: false, 
        scoreData: Object.keys(partialScoreData).length > 0 ? partialScoreData as ScoreDimensions : null 
      };
    }

    // Check score range
    for (const field of fields) {
      const value = parseFloat(scores[field]);
      const maxScore = getDimensionWeight(field);
      
      if (value < 0 || value > maxScore) {
        return { isValid: false, scoreData: partialScoreData as ScoreDimensions };
      }
    }

    // Create complete score data object
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

    return { isValid: true, scoreData };
  };

  // Auto-save on input change (debounced) - REMOVED
  // Now using individual field partial updates instead
  useEffect(() => {
    // Update parent with current validation state
    updateParentWithCurrentScores();
  }, [updateParentWithCurrentScores]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      saveTimersRef.current.forEach(timer => clearTimeout(timer));
      saveTimersRef.current.clear();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Athlete Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          {athlete.name}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <BilingualText 
            translationKey="athlete.athleteNumber" 
            chineseSize="text-sm" 
            englishSize="text-xs"
          />: {athlete.athlete_number}
          {athlete.team_name && ` | `}
          {athlete.team_name && (
            <>
              <BilingualText 
                translationKey="athlete.teamName" 
                chineseSize="text-sm" 
                englishSize="text-xs"
              />: {athlete.team_name}
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
          {athlete.age && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {athlete.age} <BilingualText 
                translationKey="athlete.age" 
                chineseSize="text-sm" 
                englishSize="text-xs"
              />
            </span>
          )}
          {athlete.gender && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <BilingualText 
                translationKey={`athlete.${athlete.gender}`}
                chineseSize="text-sm" 
                englishSize="text-xs"
              />
            </span>
          )}
          {athlete.school && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {athlete.school}
            </span>
          )}
        </div>
      </div>

      {/* Score Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const weight = getDimensionWeight(field);
          const isFieldSaving = savingFields.has(field);
          
          return (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getDimensionLabel(field)}
                    <span className="text-red-500 ml-1">*</span>
                    {isFieldSaving && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
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
                style={{ minHeight: '44px' }}
              />
            </div>
          );
        })}
      </div>


      {/* Helper Text */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        💡 每个评分项会自动保存，无需填完整张表 / Each score field is auto-saved individually
      </p>
    </div>
  );
}
