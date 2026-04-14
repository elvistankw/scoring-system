# Shared Components

This directory contains reusable UI components used across the Realtime Scoring System.

## Components

### error-boundary.tsx
React Error Boundary component for graceful error handling.

**Usage:**
```typescript
import { ErrorBoundary, withErrorBoundary } from '@/components/shared/error-boundary';

// Wrap components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(YourComponent);
```

**Features:**
- Catches React errors in component tree
- Displays user-friendly error message
- Shows error details in development
- Reset button to retry
- Return to home button
- Dark mode support

**Requirements:**
- 13.1: Display skeleton screens during loading
- 14.3: Display error notifications with descriptive messages

### loading-skeleton.tsx
Reusable skeleton loading components.

**Components:**
- `Skeleton`: Base skeleton element
- `SkeletonText`: Multiple text lines
- `SkeletonCard`: Card skeleton
- `SkeletonAthleteList`: Athlete list skeleton
- `SkeletonCompetitionList`: Competition grid skeleton
- `SkeletonScoreForm`: Score input form skeleton
- `SkeletonScoreboard`: Scoreboard grid skeleton
- `SkeletonTable`: Table skeleton
- `SkeletonDashboardStats`: Dashboard stats skeleton

**Usage:**
```typescript
import {
  Skeleton,
  SkeletonAthleteList,
  SkeletonScoreboard,
} from '@/components/shared/loading-skeleton';

// In loading.tsx
export default function Loading() {
  return <SkeletonAthleteList count={5} />;
}

// Conditional rendering
{isLoading ? <SkeletonScoreboard /> : <Scoreboard data={data} />}
```

**Requirements:**
- 13.1: Display skeleton screen matching expected content layout
- 13.2: No blank white screens during data loading
- 13.4: Replace skeleton with actual content within 50ms
- 13.5: Skeleton screens for athlete lists, score displays, competition selections

### theme-provider.tsx
Theme provider for light/dark mode support.

**Exports:**
- `ThemeProvider`: Context provider component
- `useTheme`: Hook to access theme context
- `ThemeToggle`: Toggle button component

**Usage:**
```typescript
import { ThemeProvider, useTheme, ThemeToggle } from '@/components/shared/theme-provider';

// In root layout (already configured)
<ThemeProvider defaultTheme="system">
  {children}
</ThemeProvider>

// In components
function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {resolvedTheme}</p>
      <ThemeToggle />
    </div>
  );
}
```

**Features:**
- Light, dark, and system theme modes
- Persists theme preference to localStorage
- Listens to system theme changes
- Smooth theme transitions
- Toggle button with icons

**Requirements:**
- 11.1: Support both light and dark color themes
- 11.2: Apply selected theme within 100ms
- 11.3: Persist theme preference across sessions
- 11.4: Display_Screen defaults to dark theme
- 11.5: Judge/Admin interfaces default to light theme

### providers.tsx
Client-side providers wrapper.

**Usage:**
```typescript
// Already configured in app/[locale]/layout.tsx
import { Providers } from '@/components/shared/providers';

<Providers>{children}</Providers>
```

**Includes:**
- ErrorBoundary
- ThemeProvider
- SWRConfig
- Sonner Toaster

**Requirements:**
- 11.1: Theme support
- 13.1: Loading state feedback
- 14.1: User feedback notifications with Sonner
- 14.2: Success notifications for operations
- 14.4: No browser native alert() or confirm()
- 14.5: Auto-dismiss notifications after 4 seconds
- 18.4: SWR for data fetching

## Toast Notifications

The Sonner toaster is configured globally in the Providers component. Use it in your components:

```typescript
import { toast } from 'sonner';

// Success
toast.success('评分提交成功！');

// Error
toast.error('提交失败，请重试');

// Info
toast.info('正在加载数据...');

// Warning
toast.warning('请先选择比赛');

// Loading
const toastId = toast.loading('正在提交...');
// Later
toast.success('提交成功！', { id: toastId });
```

## Dark Mode Classes

All components support dark mode using Tailwind's `dark:` prefix:

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content
</div>
```

## Responsive Design

Components are designed to be responsive:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

**Requirements:**
- 12.1: Adjust layout for tablet viewport
- 12.2: No horizontal scrolling on tablets
- 12.3: Stack inputs vertically in portrait
- 12.4: Grid layout in landscape
- 12.5: Touch targets at least 44px height
