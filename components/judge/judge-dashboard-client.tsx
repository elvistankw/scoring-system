// Judge Dashboard Client Component
// Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2, 18.1, 18.2, 18.3

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJudgeSession } from '@/hooks/use-judge-session';
import { useTranslation } from '@/i18n/use-dictionary';
import { DynamicCompetitionSelector } from '@/lib/dynamic-imports';
import { SettingsModal } from '@/components/shared/settings-modal';
import { JudgeSettingsModal } from '@/components/judge/judge-settings-modal';
import { BilingualText } from '@/components/shared/bilingual-text';
import { measurePageLoad } from '@/lib/performance-monitor';
import { JudgeVideoBackground } from '@/components/shared/video-background';
import type { Competition } from '@/interface/competition';
import { toast } from 'sonner';

export function JudgeDashboardClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { 
    currentSession, 
    loadingSession, 
    endSession 
  } = useJudgeSession();
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

  // Redirect if no active judge session
  useEffect(() => {
    if (!loadingSession && !currentSession) {
      toast.error('请先选择评委身份');
      router.push(`/${locale}/judge-landing`);
    }
  }, [currentSession, loadingSession, router, locale]);

  // Handle competition selection
  const handleCompetitionSelect = (competition: Competition) => {
    setSelectedCompetition(competition);
    
    // Store selected competition in localStorage for persistence
    localStorage.setItem('selected_competition', JSON.stringify(competition));
    
    toast.success(`${t('competition.selectCompetition')}: ${competition.name}`);
    
    // Navigate to scoring page
    const targetLocale = locale || 'zh';
    router.push(`/${targetLocale}/scoring`);
  };

  const handleLogout = async () => {
    try {
      const success = await endSession();
      if (success) {
        toast.success('已结束评委会话');
        router.push(`/${locale}/judge-landing`);
      }
    } catch (error) {
      console.error('End session failed:', error);
      toast.error('结束会话失败');
    }
  };

  // Show loading state while checking session
  if (loadingSession) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no active session
  if (!currentSession) {
    return null;
  }

  return (
    <JudgeVideoBackground>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <BilingualText 
                translationKey="judge.dashboard" 
                chineseSize="text-3xl" 
                englishSize="text-2xl"
                layout="vertical"
              />
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('common.welcome')}, {currentSession?.judge_name}! <BilingualText 
                translationKey="judge.selectCompetition" 
                chineseSize="text-base" 
                englishSize="text-sm"
              />
            </p>
          </div>

          {/* User Menu */}
          <div className="relative user-menu">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 shadow-lg hover:bg-white/40 dark:hover:bg-gray-800/20 transition-all duration-300"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-medium">
                  {currentSession?.judge_name?.charAt(0)?.toUpperCase() || 'J'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentSession?.judge_name || t('judge.dashboard')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <BilingualText 
                    zh={`评委`}
                    en={`Judge`}
                    chineseSize="text-xs" 
                    englishSize="text-xs"
                  />
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
                    {currentSession?.judge_name || t('judge.dashboard')}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    评委代码: {currentSession?.judge_code}
                  </p>
                </div>
                
                {/* Score Summary Link */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    const targetLocale = locale || 'zh';
                    router.push(`/${targetLocale}/score-summary`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <BilingualText 
                      translationKey="judge.scoreSummary" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
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
                    <BilingualText 
                      translationKey="common.settings" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
                  </div>
                </button>
                
                {/* End Session Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200 border-t border-white/10 dark:border-gray-700/20"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <BilingualText 
                      translationKey="judge.endSession" 
                      chineseSize="text-sm" 
                      englishSize="text-xs"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Competition Selector */}
        <DynamicCompetitionSelector
          onSelect={handleCompetitionSelect}
          selectedCompetition={selectedCompetition}
        />

        {/* Settings Modal */}
        <JudgeSettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
        />
        </div>
      </div>
    </JudgeVideoBackground>
  );
}
