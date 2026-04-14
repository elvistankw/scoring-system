'use client';

// Dynamic imports for code splitting and lazy loading
// Requirements: 13.1, 13.2

import dynamic from 'next/dynamic';
import { SkeletonCard, SkeletonTable, SkeletonScoreboard, SkeletonAthleteList, SkeletonCompetitionList, SkeletonScoreForm } from '@/components/shared/loading-skeleton';

/**
 * Lazy load admin components with appropriate loading states
 */
export const DynamicCompetitionForm = dynamic(
  () => import('@/components/admin/competition-form').then(mod => ({ default: mod.CompetitionForm })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

export const DynamicAthleteForm = dynamic(
  () => import('@/components/admin/athlete-form').then(mod => ({ default: mod.AthleteForm })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

export const DynamicCompetitionList = dynamic(
  () => import('@/components/admin/competition-list').then(mod => ({ default: mod.CompetitionList })),
  {
    loading: () => <SkeletonCompetitionList count={6} />,
    ssr: false,
  }
);

export const DynamicAthleteList = dynamic(
  () => import('@/components/admin/athlete-list').then(mod => ({ default: mod.AthleteList })),
  {
    loading: () => <SkeletonAthleteList count={8} />,
    ssr: false,
  }
);

export const DynamicCompetitionAthleteList = dynamic(
  () => import('@/components/admin/competition-athlete-list').then(mod => ({ default: mod.CompetitionAthleteList })),
  {
    loading: () => <SkeletonAthleteList count={5} />,
    ssr: false,
  }
);

/**
 * Lazy load judge components with appropriate loading states
 */
export const DynamicCompetitionSelector = dynamic(
  () => import('@/components/judge/competition-selector').then(mod => ({ default: mod.CompetitionSelector })),
  {
    loading: () => <SkeletonCompetitionList count={4} />,
    ssr: false,
  }
);

export const DynamicScoreInputForm = dynamic(
  () => import('@/components/judge/score-input-form').then(mod => ({ default: mod.ScoreInputForm })),
  {
    loading: () => <SkeletonScoreForm />,
    ssr: false,
  }
);

export const DynamicAthleteCard = dynamic(
  () => import('@/components/judge/athlete-card').then(mod => ({ default: mod.AthleteCard })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

/**
 * Lazy load display components with appropriate loading states
 */
export const DynamicScoreboardGrid = dynamic(
  () => import('@/components/display/scoreboard-grid').then(mod => ({ default: mod.ScoreboardGrid })),
  {
    loading: () => <SkeletonScoreboard rows={15} />,
    ssr: false,
  }
);

export const DynamicRankingTable = dynamic(
  () => import('@/components/display/ranking-table').then(mod => ({ default: mod.RankingTable })),
  {
    loading: () => <SkeletonTable rows={10} cols={6} />,
    ssr: false,
  }
);

export const DynamicScoreAnimation = dynamic(
  () => import('@/components/display/score-animation').then(mod => ({ default: mod.ScoreAnimation })),
  {
    ssr: false,
  }
);

/**
 * Lazy load auth components
 */
export const DynamicSignInClient = dynamic(
  () => import('@/components/auth/sign-in-client').then(mod => ({ default: mod.SignInClient })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

export const DynamicSignUpClient = dynamic(
  () => import('@/components/auth/sign-up-client').then(mod => ({ default: mod.SignUpClient })),
  {
    loading: () => <SkeletonCard />,
    ssr: false,
  }
);

/**
 * Lazy load dashboard components
 */
export const DynamicAdminDashboard = dynamic(
  () => import('@/components/admin/admin-dashboard-client').then(mod => ({ default: mod.AdminDashboardClient })),
  {
    loading: () => (
      <div className="space-y-6">
        <SkeletonCompetitionList count={3} />
        <SkeletonAthleteList count={5} />
      </div>
    ),
    ssr: false,
  }
);

export const DynamicJudgeDashboard = dynamic(
  () => import('@/components/judge/judge-dashboard-client').then(mod => ({ default: mod.JudgeDashboardClient })),
  {
    loading: () => <SkeletonCompetitionList count={4} />,
    ssr: false,
  }
);
