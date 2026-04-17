'use client';

// 🎨 Animated Card Component
// 通用动画卡片组件 - 支持多种动画效果

import { ReactNode, useState } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'neon' | 'elevated';
  hoverEffect?: 'lift' | 'glow' | 'tilt' | 'scale' | 'none';
  className?: string;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  variant = 'default',
  hoverEffect = 'lift',
  className = '',
  onClick
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 变体样式
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    gradient: 'bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white',
    glass: 'bg-gray-100/80 dark:bg-gray-900/10 backdrop-blur-lg border border-gray-300/50 dark:border-white/20',
    neon: 'bg-gray-900 border-2 border-blue-500 shadow-lg shadow-blue-500/50',
    elevated: 'bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700'
  };

  // 悬停效果样式
  const hoverEffectStyles = {
    lift: 'hover:-translate-y-2 hover:shadow-2xl',
    glow: 'hover:shadow-2xl hover:shadow-blue-500/50',
    tilt: 'hover:rotate-1 hover:scale-105',
    scale: 'hover:scale-105',
    none: ''
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6
        transition-all duration-300 transform
        ${variantStyles[variant]}
        ${hoverEffectStyles[hoverEffect]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 背景装饰 */}
      {variant === 'gradient' && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      {/* 悬停时的光晕效果 */}
      {isHovered && hoverEffect === 'glow' && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 animate-pulse" />
      )}

      {/* Neon 边框动画 */}
      {variant === 'neon' && isHovered && (
        <div className="absolute inset-0 border-2 border-purple-500 rounded-2xl animate-pulse" />
      )}

      {/* 内容 */}
      <div className="relative z-10">
        {children}
      </div>

      {/* 边框光效 */}
      {variant !== 'default' && (
        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
      )}
    </div>
  );
}

// 预设卡片组件
export function DefaultCard(props: Omit<AnimatedCardProps, 'variant'>) {
  return <AnimatedCard variant="default" {...props} />;
}

export function GradientCard(props: Omit<AnimatedCardProps, 'variant'>) {
  return <AnimatedCard variant="gradient" {...props} />;
}

export function GlassCard(props: Omit<AnimatedCardProps, 'variant'>) {
  return <AnimatedCard variant="glass" {...props} />;
}

export function NeonCard(props: Omit<AnimatedCardProps, 'variant'>) {
  return <AnimatedCard variant="neon" {...props} />;
}

export function ElevatedCard(props: Omit<AnimatedCardProps, 'variant'>) {
  return <AnimatedCard variant="elevated" {...props} />;
}
