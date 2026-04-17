'use client';

// 🎨 Enhanced Athlete Card with Animations
// 增强版选手卡片 - 带有精美动画和交互效果

import type { Athlete } from '@/interface/athlete';
import { useTranslation } from '@/i18n/use-dictionary';
import { useState } from 'react';

interface EnhancedAthleteCardProps {
  athlete: Athlete;
  onSelect: () => void;
  isSelected: boolean;
  index?: number;
}

export function EnhancedAthleteCard({ athlete, onSelect, isSelected, index = 0 }: EnhancedAthleteCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full p-6 rounded-2xl transition-all duration-500 overflow-hidden
        transform hover:-translate-y-2
        ${
          isSelected
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 shadow-2xl scale-105'
            : 'bg-white dark:bg-gray-800 hover:shadow-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
        }
      `}
      style={{ 
        minHeight: '120px',
        animation: `fadeInScale 0.5s ease-out ${index * 0.1}s both`
      }}
    >
      {/* 背景装饰效果 */}
      <div className={`
        absolute inset-0 transition-opacity duration-500
        ${isSelected ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* 悬停时的光晕效果 */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-400/10 dark:to-purple-500/10 animate-pulse" />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* 头像圆圈 */}
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl
            transition-all duration-300 transform
            ${isSelected 
              ? 'bg-white/20 backdrop-blur-sm text-white scale-110 rotate-12' 
              : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
            }
            ${isHovered && !isSelected ? 'scale-110 rotate-6' : ''}
          `}>
            {athlete.name.charAt(0)}
          </div>

          {/* 选手信息 */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className={`
                font-bold text-xl transition-colors duration-300
                ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}
              `}>
                {athlete.name}
              </span>
              {athlete.team_name && (
                <span className={`
                  text-sm px-3 py-1 rounded-full transition-all duration-300
                  ${isSelected 
                    ? 'bg-white/20 backdrop-blur-sm text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {athlete.team_name}
                </span>
              )}
            </div>
            <div className={`
              text-sm font-medium transition-colors duration-300
              ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}
            `}>
              {t('common.number')}: {athlete.athlete_number}
            </div>
          </div>
        </div>
        
        {/* 选中指示器 */}
        <div className={`
          ml-4 transition-all duration-300 transform
          ${isSelected ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
        `}>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg
              className="w-7 h-7 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* 未选中时的箭头指示器 */}
        {!isSelected && (
          <div className={`
            ml-4 transition-all duration-300 transform
            ${isHovered ? 'translate-x-2 opacity-100' : 'translate-x-0 opacity-50'}
          `}>
            <svg
              className="w-6 h-6 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 选中时的边框光效 */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-pulse pointer-events-none" />
      )}

      {/* 添加动画关键帧 */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </button>
  );
}
