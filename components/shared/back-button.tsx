'use client';

// 🔙 Glass Back Button Component
// 玻璃态返回按钮组件 - 统一的返回按钮样式

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ 
  href, 
  onClick, 
  label = 'Back',
  className = '' 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        backdrop-blur-md bg-white/30 dark:bg-gray-800/30
        border border-white/40 dark:border-gray-700/40
        px-5 py-2 rounded-xl shadow-lg
        flex items-center gap-2
        hover:bg-white/50 dark:hover:bg-gray-800/50
        transition-all duration-300
        text-gray-700 dark:text-gray-300
        font-medium
        ${className}
      `}
    >
      <span className="text-lg">←</span>
      <span>{label}</span>
    </button>
  );
}
