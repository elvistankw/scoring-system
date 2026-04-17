'use client';

// 🎨 Loading Spinner Component
// 加载动画组件 - 多种样式可选

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bounce' | 'diabolo';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <svg 
            className={`animate-spin ${sizeClasses[size]} text-blue-600 dark:text-blue-400`} 
            viewBox="0 0 24 24"
          >
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
        );

      case 'dots':
        return (
          <div className="flex items-center gap-2">
            <div className={`${sizeClasses[size]} bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce`} style={{ animationDelay: '0s' }} />
            <div className={`${sizeClasses[size]} bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
            <div className={`${sizeClasses[size]} bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }} />
          </div>
        );

      case 'pulse':
        return (
          <div className="relative">
            <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse`} />
            <div className={`absolute inset-0 ${sizeClasses[size]} bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-ping opacity-75`} />
          </div>
        );

      case 'bounce':
        return (
          <div className="flex items-end gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-2 ${size === 'sm' ? 'h-8' : size === 'md' ? 'h-12' : size === 'lg' ? 'h-16' : 'h-20'} bg-gradient-to-t from-blue-600 to-purple-600 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case 'diabolo':
        return (
          <div className="relative">
            {/* 扯铃形状的加载动画 */}
            <div className={`${sizeClasses[size]} relative animate-spin`}>
              <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 40%)' }} />
              <div className="absolute inset-0 border-4 border-purple-600 dark:border-purple-400 rounded-full" style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)' }} />
              <div className="absolute top-1/2 left-1/2 w-1 h-full bg-gradient-to-b from-blue-600 to-purple-600 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl animate-bounce">🪀</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {renderSpinner()}
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-gray-700 dark:text-gray-300 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// 预设加载组件
export function SpinnerLoader(props: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="spinner" {...props} />;
}

export function DotsLoader(props: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="dots" {...props} />;
}

export function PulseLoader(props: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="pulse" {...props} />;
}

export function BounceLoader(props: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="bounce" {...props} />;
}

export function DiaboloLoader(props: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="diabolo" {...props} />;
}
