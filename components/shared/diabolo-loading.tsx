'use client';

/**
 * Diabolo Loading Animation Component
 * 空竹加载动画组件 - 用于系统全局加载状态
 * 
 * Features:
 * - Animated diabolo spinning effect
 * - Bouncing motion simulation
 * - Stick movement animation
 * - Glass morphism backdrop
 * - Dark mode support
 */

interface DiaboloLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function DiaboloLoading({ message, fullScreen = true }: DiaboloLoadingProps) {
  const containerClass = fullScreen
    ? "fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
    : "flex items-center justify-center w-full h-full";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-6">
        {/* Diabolo Animation Container */}
        <div className="relative w-40 h-40">
          {/* String */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/30 animate-pulse"></div>
          
          {/* Left Stick */}
          <div className="absolute left-0 top-1/2 w-2 h-10 bg-white/60 rounded-full -translate-y-1/2 animate-stick-left"></div>
          
          {/* Right Stick */}
          <div className="absolute right-0 top-1/2 w-2 h-10 bg-white/60 rounded-full -translate-y-1/2 animate-stick-right"></div>
          
          {/* Diabolo */}
          <div className="absolute left-1/2 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2">
            {/* Spinning core */}
            <div className="w-full h-full rounded-full border-4 border-orange-400 border-t-transparent animate-spin-slow"></div>
            {/* Bounce effect */}
            <div className="absolute inset-0 animate-bounce-soft"></div>
          </div>
        </div>

        {/* Loading Message */}
        {message && (
          <div className="text-white/90 text-lg font-medium animate-pulse">
            {message}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(720deg); }
        }

        @keyframes bounce-soft {
          0%, 100% { transform: translateY(-2px); }
          50% { transform: translateY(6px); }
        }

        @keyframes stick-left {
          0%, 100% { transform: translateY(-50%) rotate(-10deg); }
          50% { transform: translateY(-50%) rotate(-20deg); }
        }

        @keyframes stick-right {
          0%, 100% { transform: translateY(-50%) rotate(10deg); }
          50% { transform: translateY(-50%) rotate(20deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 1s linear infinite;
        }

        .animate-bounce-soft {
          animation: bounce-soft 1s ease-in-out infinite;
        }

        .animate-stick-left {
          animation: stick-left 1s ease-in-out infinite;
        }

        .animate-stick-right {
          animation: stick-right 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Inline Diabolo Loading - for use within components
 * 内联加载动画 - 用于组件内部
 */
export function DiaboloLoadingInline({ message }: { message?: string }) {
  return <DiaboloLoading message={message} fullScreen={false} />;
}
