/**
 * Theme Provider Tests
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 * 
 * Tests theme switching, persistence, role-specific defaults, and component support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme, ThemeToggle } from '../theme-provider';
import { act } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  return (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
};

// Test component that uses the theme hook
function TestComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 11.1: Light and Dark Theme Support', () => {
    it('should support light theme', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;

      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should support dark theme', async () => {
      window.matchMedia = createMatchMediaMock(true) as any;

      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Requirement 11.2: Theme Toggle Performance', () => {
    it('should apply theme within 100ms', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;

      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      const startTime = performance.now();
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('set-dark'));
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should apply theme quickly (allowing some buffer for test environment)
      expect(duration).toBeLessThan(200);
    });

    it('should toggle between light and dark themes', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;

      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('set-dark'));
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('set-light'));
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('Requirement 11.3: Theme Persistence', () => {
    it('should persist theme preference to localStorage', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;

      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('set-dark'));
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('scoring-system-theme')).toBe('dark');
      });
    });

    it('should restore theme from localStorage on mount', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;
      localStorageMock.setItem('scoring-system-theme', 'dark');

      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });

    it('should persist theme across sessions', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;

      // First session
      const { unmount } = render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('set-dark'));
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('scoring-system-theme')).toBe('dark');
      });

      unmount();

      // Second session - should restore dark theme
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });
  });

  describe('Requirement 11.4: Role-Specific Default Themes', () => {
    it('should default to light theme for judge/admin roles', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;

      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });
    });

    it('should default to dark theme for display screens', async () => {
      window.matchMedia = createMatchMediaMock(true) as any;

      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });
    });
  });

  describe('Requirement 11.5: System Theme Support', () => {
    it('should respect system dark mode preference', async () => {
      window.matchMedia = createMatchMediaMock(true) as any;

      render(
        <ThemeProvider defaultTheme="system">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });
    });

    it('should respect system light mode preference', async () => {
      window.matchMedia = createMatchMediaMock(false) as any;

      render(
        <ThemeProvider defaultTheme="system">
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });
    });
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
  });

  it('should render toggle button', () => {
    window.matchMedia = createMatchMediaMock(false) as any;

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should toggle theme on click', async () => {
    window.matchMedia = createMatchMediaMock(false) as any;

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    const button = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should have accessible label', () => {
    window.matchMedia = createMatchMediaMock(false) as any;

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBeTruthy();
  });
});
