'use client';

// 🎨 Animated Button Component
// 通用动画按钮组件 - 支持多种样式和动画效果

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps) {
  
  // 变体样式
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl'
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
    xl: 'px-10 py-5 text-xl rounded-2xl'
  };

  return (
    <button
      className={`
        relative overflow-hidden
        font-semibold
        transition-all duration-300 transform
        hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* 背景动画效果 */}
      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* 按钮内容 */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            <span>加载中...</span>
          </>
        ) : (
          <>
            {icon && <span className="animate-bounce">{icon}</span>}
            {children}
          </>
        )}
      </span>

      {/* 悬停时的光晕效果 */}
      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>

      <style jsx>{`
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
    </button>
  );
}

// 预设按钮组件
export function PrimaryButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton variant="secondary" {...props} />;
}

export function SuccessButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton variant="success" {...props} />;
}

export function DangerButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton variant="danger" {...props} />;
}

export function GradientButton(props: Omit<AnimatedButtonProps, 'variant'>) {
  return <AnimatedButton variant="gradient" {...props} />;
}
