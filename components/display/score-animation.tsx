// Score animation component for new score updates
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 20.1, 20.3

'use client';

import { useEffect, useState } from 'react';
import type { RealtimeScoreUpdate } from '@/interface/score';
import { useTranslation } from '@/i18n/use-dictionary';

interface ScoreAnimationProps {
  score: RealtimeScoreUpdate;
  onAnimationComplete?: () => void;
}

/**
 * Animated score display component
 * Shows a brief animation when new scores arrive
 */
export function ScoreAnimation({ score, onAnimationComplete }: ScoreAnimationProps) {
  const { t } = useTranslation();

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg shadow-2xl min-w-[300px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✨</span>
          <span className="font-bold text-lg">{t('display.newScore')}</span>
        </div>
        <p className="text-sm opacity-90">
          {score.athlete_name} ({score.athlete_number})
        </p>
        <p className="text-xs opacity-75 mt-1">
          评委: {score.judge_name}
        </p>
      </div>
    </div>
  );
}
