'use client';

// Theme provider for light/dark mode support
// Requirements: 11.1, 11.2, 11.3, 11.4, 11.5

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'scoring-system-theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage after component mounts
  useEffect(() => {
    setMounted(true);
    
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, [storageKey]);

  // Update resolved theme based on theme setting and system preference
  useEffect(() => {
    if (!mounted) return;

    const updateResolvedTheme = () => {
      let resolved: 'light' | 'dark';

      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }

      setResolvedTheme(resolved);

      // Apply theme to document
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      
      // Also set data attribute for additional compatibility
      root.setAttribute('data-theme', resolved);
      
      console.log('Theme updated:', { theme, resolved, classList: root.classList.toString() });
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (mounted) {
      localStorage.setItem(storageKey, newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme toggle component
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme, mounted } = useTheme();

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`p-2 rounded-lg w-9 h-9 ${className}`}>
        <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <svg
          className="w-5 h-5 text-gray-700 dark:text-gray-300"
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
      ) : (
        <svg
          className="w-5 h-5 text-gray-700 dark:text-gray-300"
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
      )}
    </button>
  );
}
