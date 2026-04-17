// Shared user menu component with logout functionality
// Requirements: 1.3, 1.4, 2.1, 2.2, 14.1, 14.2

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/i18n/use-dictionary';

interface UserMenuProps {
  userType?: 'admin' | 'judge';
  additionalMenuItems?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
}

export function UserMenu({ userType = 'admin', additionalMenuItems = [] }: UserMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [locale, setLocale] = useState('zh');

  // Get locale from URL
  useEffect(() => {
    const pathLocale = window.location.pathname.split('/')[1];
    if (pathLocale) setLocale(pathLocale);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('auth.logoutSuccess'));
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(t('auth.logoutError'));
    }
  };

  const avatarColor = userType === 'admin' ? 'bg-blue-600' : 'bg-green-600';
  const roleLabel = userType === 'admin' ? t('admin.dashboard') : t('judge.dashboard');

  return (
    <div className="relative user-menu">
      {/* User Menu Button */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 shadow-lg hover:bg-white/40 dark:hover:bg-gray-800/20 transition-all duration-300"
      >
        <div className={`w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center shadow-md`}>
          <span className="text-white text-sm font-medium">
            {user?.username?.charAt(0)?.toUpperCase() || roleLabel.charAt(0)}
          </span>
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.username || roleLabel}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {roleLabel}
          </p>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-56 rounded-xl overflow-hidden backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 shadow-2xl transition-all duration-300 z-50 ${
          showUserMenu
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="py-1">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/10 dark:border-gray-700/20">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.username || roleLabel}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {user?.email}
            </p>
          </div>
          
          {/* Additional menu items */}
          {additionalMenuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </div>
            </button>
          ))}
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200 border-t border-white/10 dark:border-gray-700/20"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('common.logout')}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}