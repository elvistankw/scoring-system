// Reusable loading skeleton components
// Requirements: 13.1, 13.2, 13.4, 13.5

import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Base skeleton component
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-label="Loading..."
    />
  );
}

// Skeleton for text lines
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

// Skeleton for cards
export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <Skeleton className="h-6 w-2/3 mb-3" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Skeleton for athlete list
export function SkeletonAthleteList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-4"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for competition list
export function SkeletonCompetitionList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Skeleton for score input form
export function SkeletonScoreForm() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full mt-6" />
    </div>
  );
}

// Skeleton for scoreboard grid
export function SkeletonScoreboard({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton for table
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid gap-4 p-4 border-b-2 border-gray-300 dark:border-gray-600" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4 p-4 border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton for dashboard stats
export function SkeletonDashboardStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
