# Performance Optimization Quick Reference

## Quick Start

### 1. Use Dynamic Imports for Heavy Components

```typescript
import { DynamicScoreboardGrid } from '@/lib/dynamic-imports';

// Instead of:
// import { ScoreboardGrid } from '@/components/display/scoreboard-grid';

<DynamicScoreboardGrid competitionId={1} competitionType="individual" />
```

### 2. Choose the Right SWR Config

```typescript
import { staticSwrConfig, realtimeSwrConfig, immutableSwrConfig } from '@/lib/swr-config';

// For static data (competition lists, athlete rosters)
useSWR(url, fetcher, staticSwrConfig);

// For real-time data (scoreboard, live scores)
useSWR(url, fetcher, realtimeSwrConfig);

// For immutable data (completed competitions)
useSWR(url, fetcher, immutableSwrConfig);
```

### 3. Add Skeleton Loading

```typescript
import { SkeletonAthleteList } from '@/components/shared/loading-skeleton';

{isLoading ? (
  <SkeletonAthleteList count={5} />
) : (
  <AthleteList athletes={athletes} />
)}
```

### 4. Monitor Performance

```typescript
import { measurePageLoad, measureApiCall } from '@/lib/performance-monitor';

// In component
useEffect(() => {
  measurePageLoad('PageName');
}, []);

// For API calls
const data = await measureApiCall('apiName', () => fetchData());
```

## Available Dynamic Components

### Admin
- `DynamicCompetitionForm`
- `DynamicAthleteForm`
- `DynamicCompetitionList`
- `DynamicAthleteList`
- `DynamicCompetitionAthleteList`

### Judge
- `DynamicCompetitionSelector`
- `DynamicScoreInputForm`
- `DynamicAthleteCard`

### Display
- `DynamicScoreboardGrid`
- `DynamicRankingTable`
- `DynamicScoreAnimation`

### Auth
- `DynamicSignInClient`
- `DynamicSignUpClient`

### Dashboards
- `DynamicAdminDashboard`
- `DynamicJudgeDashboard`

## Available Skeleton Components

- `Skeleton` - Base skeleton
- `SkeletonText` - Text lines
- `SkeletonCard` - Card layout
- `SkeletonAthleteList` - Athlete list
- `SkeletonCompetitionList` - Competition grid
- `SkeletonScoreForm` - Score form
- `SkeletonScoreboard` - Scoreboard grid
- `SkeletonTable` - Generic table
- `SkeletonDashboardStats` - Dashboard stats

## SWR Config Comparison

| Config | Revalidate on Focus | Revalidate on Reconnect | Refresh Interval | Use Case |
|--------|-------------------|------------------------|------------------|----------|
| `swrConfig` | ❌ | ✅ | None | General data |
| `realtimeSwrConfig` | ✅ | ✅ | 5s | Live data |
| `staticSwrConfig` | ❌ | ❌ | None | Static lists |
| `immutableSwrConfig` | ❌ | ❌ | None | Historical data |

## Performance Monitoring Functions

```typescript
// Page load metrics
measurePageLoad('PageName');

// API call metrics
await measureApiCall('apiName', async () => {
  return fetch('/api/endpoint').then(r => r.json());
});

// Component render time
measureComponentRender('ComponentName', () => {
  // render logic
});

// Get summary
const summary = getPerformanceSummary();

// Clear metrics
clearPerformanceMetrics();
```

## View Metrics in Console

```javascript
// Page metrics
console.table(JSON.parse(sessionStorage.getItem('performance_metrics')));

// API metrics
console.table(JSON.parse(sessionStorage.getItem('api_metrics')));
```

## Performance Targets

- **TTFB**: < 200ms
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **TTI**: < 3.5s
- **API Calls**: < 300ms
- **Initial Bundle**: < 200KB (gzipped)

## Common Patterns

### Pattern 1: Data Fetching with Loading State

```typescript
import { useCompetitions } from '@/hooks/use-competitions';
import { SkeletonCompetitionList } from '@/components/shared/loading-skeleton';

function CompetitionPage() {
  const { competitions, isLoading } = useCompetitions();
  
  if (isLoading) {
    return <SkeletonCompetitionList count={6} />;
  }
  
  return <CompetitionList competitions={competitions} />;
}
```

### Pattern 2: Dynamic Import with Skeleton

```typescript
import dynamic from 'next/dynamic';
import { SkeletonCard } from '@/components/shared/loading-skeleton';

const DynamicComponent = dynamic(
  () => import('@/components/heavy-component'),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);
```

### Pattern 3: Performance Monitored API Call

```typescript
import { measureApiCall } from '@/lib/performance-monitor';

async function fetchData() {
  return measureApiCall('fetchCompetitions', async () => {
    const response = await fetch('/api/competitions');
    return response.json();
  });
}
```

### Pattern 4: Page with Performance Monitoring

```typescript
'use client';

import { useEffect } from 'react';
import { measurePageLoad } from '@/lib/performance-monitor';

export default function Page() {
  useEffect(() => {
    measurePageLoad('PageName');
  }, []);
  
  return <div>Content</div>;
}
```

## Checklist for New Components

- [ ] Use dynamic import if component is heavy (>50KB)
- [ ] Add skeleton loading state
- [ ] Choose appropriate SWR config
- [ ] Add performance monitoring for API calls
- [ ] Test on slow network (3G)
- [ ] Verify no layout shift (CLS)
- [ ] Check bundle size impact

## Troubleshooting

### Issue: Slow page load
**Solution**: Check performance metrics, verify SWR caching, use dynamic imports

### Issue: Large bundle size
**Solution**: Run bundle analyzer, check dynamic imports are working

### Issue: Too many API calls
**Solution**: Verify SWR config, check dedupingInterval, use static config

### Issue: Blank screen during load
**Solution**: Add skeleton loading component

### Issue: Layout shift
**Solution**: Use skeleton that matches content layout exactly
