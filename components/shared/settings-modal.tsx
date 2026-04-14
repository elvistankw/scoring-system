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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('common.settings')}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Theme Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('theme.appearance')}
              </h3>
              <div className="space-y-2">
                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${
                      selectedTheme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-yellow-500"
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
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('theme.lightDesc')}
                    </div>
                  </div>
                  {selectedTheme === 'light' && (
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${
                      selectedTheme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-400"
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
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('theme.darkDesc')}
                    </div>
                  </div>
                  {selectedTheme === 'dark' && (
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {/* System Theme */}
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`
                    w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${
                      selectedTheme === 'system'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white to-gray-800 border-2 border-gray-400 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-600"
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
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {mounted && `${t('theme.systemDesc')}: ${resolvedTheme === 'dark' ? t('theme.dark') : t('theme.light')}`}
                    </div>
                  </div>
                  {selectedTheme === 'system' && (
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Language Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {currentLocale === 'zh' ? t('common.language') : 'Language / 语言'}
              </h3>
              <div className="space-y-2">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => handleLanguageChange(locale)}
                    className={`
                      w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                      ${
                        selectedLocale === locale
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-2xl">
                        {localeFlags[locale]}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {localeNames[locale]}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {locale === 'zh' ? t('common.simplifiedChinese') : 'English'}
                      </div>
                    </div>
                    {selectedLocale === locale && (
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>


          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
