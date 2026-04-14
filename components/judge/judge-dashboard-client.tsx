// Judge Dashboard Client Component
// Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2, 18.1, 18.2, 18.3

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/i18n/use-dictionary';
import { DynamicCompetitionSelector } from '@/lib/dynamic-imports';
import { SettingsModal } from '@/components/shared/settings-modal';
import { measurePageLoad } from '@/lib/performance-monitor';
import type { Competition } from '@/interface/competition';
import { toast } from 'sonner';

export function JudgeDashboardClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: userLoading, isJudge, logout } = useUser();
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [locale, setLocale] = useState('zh');

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('JudgeDashboard');
  }, []);

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

  // Redirect if not authenticated or not a judge
  useEffect(() => {
    if (!userLoading && !user) {
      toast.error(t('auth.signInError'));
      router.push('/sign-in');
    } else if (!userLoading && !isJudge) {
      toast.error(t('auth.signInError'));
      router.push('/');
    }
  }, [user, userLoading, isJudge, router, t]);

  // Handle competition selection
  const handleCompetitionSelect = (competition: Competition) => {
    setSelectedCompetition(competition);
    
    // Store selected competition in localStorage for persistence
    localStorage.setItem('selected_competition', JSON.stringify(competition));
    
    toast.success(`${t('competition.selectCompetition')}: ${competition.name}`);
    
    // Navigate to scoring page
    router.push(`/${locale}/scoring`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('auth.logoutSuccess'));
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(t('auth.logoutError'));
    }
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not a judge
  if (!user || !isJudge) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('judge.dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.welcome')}, {user.username}! {t('judge.selectCompetition')}
          </p>
        </div>

        {/* User Menu */}
        <div className="relative user-menu">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.username?.charAt(0)?.toUpperCase() || 'J'}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.username || t('judge.dashboard')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('judge.dashboard')}
              </p>
            </div>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username || t('judge.dashboard')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/score-summary`)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t('judge.scoreSummary')}
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSettings(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('common.settings')}
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
          )}
        </div>
      </div>

      {/* Competition Selector */}
      <DynamicCompetitionSelector
        onSelect={handleCompetitionSelect}
        selectedCompetition={selectedCompetition}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        currentLocale={locale as 'zh' | 'en'}
      />
    </div>
  );
}
