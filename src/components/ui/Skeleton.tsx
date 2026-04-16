import clsx from 'clsx';

// ─── 기본 Skeleton ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-slate-200 dark:bg-slate-700',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    />
  );
}

// ─── 카드형 스켈레톤 ────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4">
      <div className="flex gap-3 animate-pulse">
        <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>
    </div>
  );
}

// ─── 목록 스켈레톤 ─────────────────────────────────────────────────────────────

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── 아젠다 카드 스켈레톤 ──────────────────────────────────────────────────────

export function AgendaCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-3 sm:p-4">
      <div className="flex gap-3 animate-pulse">
        <div className="w-1.5 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 self-stretch" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex -space-x-1 flex-shrink-0">
          <Skeleton variant="circular" className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}

export function AgendaListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <AgendaCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── 대시보드 통계 카드 스켈레톤 ───────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 animate-pulse">
      <Skeleton className="h-4 w-20 mb-3" />
      <Skeleton className="h-8 w-12 rounded-lg" variant="rectangular" />
    </div>
  );
}

// ─── 상세 페이지 스켈레톤 ──────────────────────────────────────────────────────

export function AgendaDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-14 rounded-lg" variant="rectangular" />
          <Skeleton className="h-8 w-12 rounded-lg" variant="rectangular" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
        >
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
