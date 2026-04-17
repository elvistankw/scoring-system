'use client';

// Settings modal component
// Provides theme selection and language selection

import { useState, useEffect } from 'react';
import { useTheme } from './theme-provider';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { useTranslation } from '@/i18n/use-dictionary';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale: Locale;
}

export function SettingsModal({ isOpen, onClose, currentLocale }: SettingsModalProps) {
  const { theme, setTheme, resolvedTheme, mounted } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(theme);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  useEffect(() => {
    setSelectedLocale(currentLocale);
  }, [currentLocale]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;
    
    setSelectedLocale(newLocale);
    
    // Replace the locale in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPathname = segments.join('/');
    
    router.push(newPathname);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-all duration-300"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal with Glassmorphism effect */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with glass effect */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-gray-700/30 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('common.settings')}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-200 backdrop-blur-sm"
              aria-label={t('common.close')}
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content with scrollable glass container */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Theme Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('theme.appearance')}
              </h3>
              <div className="space-y-3">
                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 backdrop-blur-sm
                    ${
                      selectedTheme === 'light'
                        ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                        : 'border-white/30 dark:border-gray-700/30 bg-white/20 dark:bg-gray-800/20 hover:bg-white/30 dark:hover:bg-gray-800/30 hover:border-white/40 dark:hover:border-gray-700/40'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 border border-white/30 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('theme.light')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('theme.lightDesc')}
                    </div>
                  </div>
                  {selectedTheme === 'light' && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 backdrop-blur-sm
                    ${
                      selectedTheme === 'dark'
                        ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                        : 'border-white/30 dark:border-gray-700/30 bg-white/20 dark:bg-gray-800/20 hover:bg-white/30 dark:hover:bg-gray-800/30 hover:border-white/40 dark:hover:border-gray-700/40'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 border border-white/30 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('theme.dark')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('theme.darkDesc')}
                    </div>
                  </div>
                  {selectedTheme === 'dark' && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>

                {/* System Theme */}
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 backdrop-blur-sm
                    ${
                      selectedTheme === 'system'
                        ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                        : 'border-white/30 dark:border-gray-700/30 bg-white/20 dark:bg-gray-800/20 hover:bg-white/30 dark:hover:bg-gray-800/30 hover:border-white/40 dark:hover:border-gray-700/40'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 border border-white/30 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('theme.system')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {mounted && `${t('theme.systemDesc')}: ${resolvedTheme === 'dark' ? t('theme.dark') : t('theme.light')}`}
                    </div>
                  </div>
                  {selectedTheme === 'system' && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Language Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {currentLocale === 'zh' ? t('common.language') : 'Language / 语言'}
              </h3>
              <div className="space-y-3">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => handleLanguageChange(locale)}
                    className={`
                      w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 backdrop-blur-sm
                      ${
                        selectedLocale === locale
                          ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                          : 'border-white/30 dark:border-gray-700/30 bg-white/20 dark:bg-gray-800/20 hover:bg-white/30 dark:hover:bg-gray-800/30 hover:border-white/40 dark:hover:border-gray-700/40'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 border border-white/30 flex items-center justify-center text-xl shadow-lg">
                        {localeFlags[locale]}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {localeNames[locale]}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {locale === 'zh' ? t('common.simplifiedChinese') : 'English'}
                      </div>
                    </div>
                    {selectedLocale === locale && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
