// Admin Dashboard Client Component
// Requirements: 2.1, 2.2, 8.1, 8.2, 13.1, 13.2, 13.3, 13.5, 14.1, 14.2

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/i18n/use-dictionary';
import { DynamicCompetitionList, DynamicCompetitionForm } from '@/lib/dynamic-imports';
import { SettingsModal } from '@/components/shared/settings-modal';
import { measurePageLoad } from '@/lib/performance-monitor';
import type { Competition } from '@/interface/competition';
import type { Locale } from '@/i18n/config';

interface AdminDashboardClientProps {
  locale: Locale;
}

export function AdminDashboardClient({ locale }: AdminDashboardClientProps) {
  const router = useRouter();
  const { user, isLoading, isAdmin, logout } = useUser();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Locale is passed as prop, no need to extract from URL

  // Measure page load performance
  useEffect(() => {
    measurePageLoad('AdminDashboard');
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

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push(`/${locale}/sign-in`);
    }
  }, [isLoading, isAdmin, router, locale]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const handleCreateNew = () => {
    setEditingCompetition(null);
    setShowForm(true);
  };

  const handleEdit = (competition: Competition) => {
    setEditingCompetition(competition);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCompetition(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCompetition(null);
  };

  const handleViewDetails = (competition: Competition) => {
    // Navigate to competition details page with locale
    router.push(`/${locale}/admin-dashboard/competitions/${competition.id}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('auth.logoutSuccess'));
      // The useUser hook will automatically redirect to sign-in
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(t('auth.logoutError'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('admin.competitionManagement')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.createCompetition')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {!showForm && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                + {t('competition.addCompetition')}
              </button>
            )}
            
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
                      router.push(`/${locale}/athletes`);
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
          </div>
        </div>

        {/* Form or List */}
        {showForm ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingCompetition ? t('competition.editCompetition') : t('competition.addCompetition')}
            </h2>
            <DynamicCompetitionForm
              competition={editingCompetition}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        ) : (
          <DynamicCompetitionList
            key={refreshKey}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* Settings Modal */}
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          currentLocale={locale}
        />
      </div>
    </div>
  );
}
