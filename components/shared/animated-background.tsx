'use client';

// 🎨 Animated Background Components
// 动画背景组件 - 多种精美背景效果

import { ReactNode, useState, useEffect } from 'react';

interface AnimatedBackgroundProps {
  children: ReactNode;
  variant?: 'gradient-wave' | 'floating-circles' | 'grid-pattern' | 'particles' | 'diabolo-theme' | 'aurora';
  className?: string;
}

export function AnimatedBackground({ 
  children, 
  variant = 'gradient-wave',
  className = '' 
}: AnimatedBackgroundProps) {
  
  const renderBackground = () => {
    switch (variant) {
      case 'gradient-wave':
        return <GradientWaveBackground />;
      case 'floating-circles':
        return <FloatingCirclesBackground />;
      case 'grid-pattern':
        return <GridPatternBackground />;
      case 'particles':
        return <ParticlesBackground />;
      case 'diabolo-theme':
        return <DiaboloThemeBackground />;
      case 'aurora':
        return <AuroraBackground />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* 背景层 - 确保继承父级的 dark 类 */}
      <div className="absolute inset-0 z-0">
        {renderBackground()}
      </div>
      
      {/* 内容层 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// 1. 渐变波浪背景
function GradientWaveBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* 波浪层 1 */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            fill="url(#wave1)" 
            fillOpacity="1" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave"
          />
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* 波浪层 2 */}
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute bottom-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            fill="url(#wave2)" 
            fillOpacity="1" 
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slow"
          />
          <defs>
            <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(-25%) translateY(-10px);
          }
        }
        
        @keyframes wave-slow {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(25%) translateY(-15px);
          }
        }
        
        .animate-wave {
          animation: wave 15s ease-in-out infinite;
        }
        
        .animate-wave-slow {
          animation: wave-slow 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// 2. 浮动圆圈背景
function FloatingCirclesBackground() {
  const circles = [
    { size: 'w-64 h-64', color: 'bg-blue-500/20', delay: '0s', duration: '20s', x: '10%', y: '20%' },
    { size: 'w-96 h-96', color: 'bg-purple-500/20', delay: '2s', duration: '25s', x: '70%', y: '10%' },
    { size: 'w-80 h-80', color: 'bg-pink-500/20', delay: '4s', duration: '22s', x: '50%', y: '60%' },
    { size: 'w-72 h-72', color: 'bg-indigo-500/20', delay: '1s', duration: '18s', x: '20%', y: '70%' },
    { size: 'w-56 h-56', color: 'bg-cyan-500/20', delay: '3s', duration: '24s', x: '80%', y: '50%' },
  ];

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {circles.map((circle, index) => (
        <div
          key={index}
          className={`absolute ${circle.size} ${circle.color} rounded-full blur-3xl`}
          style={{
            left: circle.x,
            top: circle.y,
            animation: `float ${circle.duration} ease-in-out infinite`,
            animationDelay: circle.delay,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}

// 3. 网格图案背景
function GridPatternBackground() {
  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-950">
      {/* 网格 */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* 渐变光晕 */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* 移动的光点 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

// 4. 粒子背景
function ParticlesBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // 返回静态背景，避免 hydration mismatch
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900">
        {/* 渐变光晕 (Light Mode) */}
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-yellow-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900">
      {/* 主要粒子层 - 增加到 100 个 */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => {
          const size = Math.random() * 4 + 2;
          const duration = Math.random() * 20 + 10;
          const delay = Math.random() * 5;
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-blue-500 dark:bg-white"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particle-float ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                opacity: Math.random() * 0.4 + 0.2,
              }}
            />
          );
        })}
      </div>
      
      {/* 额外的彩色粒子 (Light Mode) - 增加到 60 个 */}
      <div className="absolute inset-0 dark:hidden">
        {[...Array(60)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          const duration = Math.random() * 15 + 10;
          const delay = Math.random() * 3;
          const colors = ['bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-rose-500', 'bg-fuchsia-500'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={`color-${i}`}
              className={`absolute rounded-full ${color}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particle-float ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                opacity: Math.random() * 0.3 + 0.2,
              }}
            />
          );
        })}
      </div>

      {/* 小型快速粒子 (Light Mode) - 新增 40 个 */}
      <div className="absolute inset-0 dark:hidden">
        {[...Array(40)].map((_, i) => {
          const size = Math.random() * 2 + 0.5;
          const duration = Math.random() * 10 + 5;
          const delay = Math.random() * 2;
          const colors = ['bg-amber-400', 'bg-orange-400', 'bg-yellow-400'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={`fast-${i}`}
              className={`absolute rounded-full ${color}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particle-float-fast ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                opacity: Math.random() * 0.4 + 0.3,
              }}
            />
          );
        })}
      </div>

      {/* 渐变光晕 (Light Mode) */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-yellow-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <style jsx>{`
        @keyframes particle-float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-100px) translateX(50px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
        
        @keyframes particle-float-fast {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(-80px) translateX(40px) rotate(180deg);
          }
          100% {
            transform: translateY(0) translateX(0) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// 5. 扯铃主题背景
function DiaboloThemeBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900">
      {/* 扯铃图案 */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-9xl"
            style={{
              left: `${(i % 4) * 25}%`,
              top: `${Math.floor(i / 4) * 50}%`,
              animation: `spin-diabolo ${15 + i * 2}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            🪀
          </div>
        ))}
      </div>
      
      {/* 彩色圆圈 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <style jsx>{`
        @keyframes spin-diabolo {
          0% {
            transform: rotate(0deg) translateY(0);
          }
          50% {
            transform: rotate(180deg) translateY(-20px);
          }
          100% {
            transform: rotate(360deg) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// 6. 极光背景
function AuroraBackground() {
  return (
    <div className="absolute inset-0 bg-gray-950">
      {/* 极光层 1 */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
          backgroundSize: '400% 400%',
          animation: 'aurora 15s ease infinite',
        }}
      />
      
      {/* 极光层 2 */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(-45deg, #06b6d4, #8b5cf6, #f59e0b, #06b6d4)',
          backgroundSize: '400% 400%',
          animation: 'aurora 20s ease infinite',
          animationDelay: '2s',
        }}
      />
      
      {/* 星星 */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes aurora {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// 预设背景组件
export function GradientWave({ children, className }: { children: ReactNode; className?: string }) {
  return <AnimatedBackground variant="gradient-wave" className={className}>{children}</AnimatedBackground>;
}

export function FloatingCircles({ children, className }: { children: ReactNode; className?: string }) {
  return <AnimatedBackground variant="floating-circles" className={className}>{children}</AnimatedBackground>;
}

export function GridPattern({ children, className }: { children: ReactNode; className?: string }) {
  return <AnimatedBackground variant="grid-pattern" className={className}>{children}</AnimatedBackground>;
}

export function Particles({ children, className }: { children: ReactNode; className?: string }) {
  return <AnimatedBackground variant="particles" className={className}>{children}</AnimatedBackground>;
}

export function DiaboloTheme({ children, className }: { children: ReactNode; className?: string }) {
  return <AnimatedBackground variant="diabolo-theme" className={className}>{children}</AnimatedBackground>;
}

export function Aurora({ children, className }: { children: ReactNode; className?: string }) {
  return <AnimatedBackground variant="aurora" className={className}>{children}</AnimatedBackground>;
}
