'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { useState, useRef, useEffect } from 'react';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export function LanguageSwitcher({ currentLocale, className = '' }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Replace the locale in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPathname = segments.join('/');
    
    router.push(newPathname);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Switch language"
      >
        <span className="text-lg">{localeFlags[currentLocale]}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {localeNames[currentLocale]}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={`
                w-full flex items-center gap-2 px-4 py-2 text-left
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors
                ${locale === currentLocale ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                ${locale === locales[0] ? 'rounded-t-lg' : ''}
                ${locale === locales[locales.length - 1] ? 'rounded-b-lg' : ''}
              `}
            >
              <span className="text-lg">{localeFlags[locale]}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {localeNames[locale]}
              </span>
              {locale === currentLocale && (
                <svg
                  className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
