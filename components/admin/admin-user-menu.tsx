'use client';

// Admin User Menu Component with Judge Management
// Requirements: Judge Identity System, Admin Dashboard

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/i18n/use-dictionary';
import { SettingsModal } from '@/components/shared/settings-modal';
import type { Locale } from '@/i18n/config';

interface AdminUserMenuProps {
  locale: Locale;
}

export function AdminUserMenu({ locale }: AdminUserMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  return (
    <>
      {/* User Menu */}
      <div className="relative user-menu">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 shadow-lg hover:bg-white/40 dark:hover:bg-gray-800/20 transition-all duration-300"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-medium">
              {user?.username?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.username || t('admin.dashboard')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('admin.dashboard')}
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
                {user?.username || t('admin.dashboard')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {user?.email}
              </p>
            </div>
            
            {/* Athlete Management Link */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                const targetLocale = locale || 'zh';
                router.push(`/${targetLocale}/athletes`);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                {t('admin.athleteManagement')}
              </div>
            </button>
            
            {/* Judge Management Link */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                const targetLocale = locale || 'zh';
                router.push(`/${targetLocale}/judges`);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {t('admin.judgeManagement')}
              </div>
            </button>
            
            {/* Event Management Link */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                const targetLocale = locale || 'zh';
                router.push(`/${targetLocale}/events`);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('admin.eventManagement')}
              </div>
            </button>
            
            {/* Settings Button */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                setShowSettings(true);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('common.settings')}
              </div>
            </button>
            
            {/* Logout Button */}
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

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        currentLocale={locale}
      />
    </>
  );
}