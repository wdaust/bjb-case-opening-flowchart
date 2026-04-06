import { Skeleton } from '../ui/skeleton';
import { DashboardGrid } from './DashboardGrid';

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 ${className ?? ''}`}>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ControlTowerSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Section 1: Hero + KPI Cards */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <DashboardGrid cols={4}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </DashboardGrid>
      </div>

      {/* Section 3: NJ Operations Velocity (4 cols) */}
      <div>
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-3 w-72 mb-4" />
        <DashboardGrid cols={4}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </DashboardGrid>
      </div>

      {/* Section 4: Risk Signals (4 cols) */}
      <div>
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-3 w-64 mb-4" />
        <DashboardGrid cols={4}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </DashboardGrid>
      </div>

      {/* Section 5: NJ Operations Analytics (3 compact donuts) */}
      <div>
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-3 w-72 mb-4" />
        <DashboardGrid cols={3}>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-[140px] w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-[140px] w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-[140px] w-full" />
          </div>
        </DashboardGrid>
      </div>

      {/* Section 7: Timing Compliance */}
      <div>
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-3 w-64 mb-4" />
        <DashboardGrid cols={4}>
          <SkeletonCard className="text-center" />
          <SkeletonCard className="text-center" />
          <SkeletonCard className="text-center" />
          <SkeletonCard className="text-center" />
        </DashboardGrid>
      </div>

      {/* Section 8: Operational Analytics (3 compact bars) */}
      <div>
        <Skeleton className="h-5 w-44 mb-2" />
        <Skeleton className="h-3 w-72 mb-4" />
        <DashboardGrid cols={3}>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-[140px] w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-[140px] w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-[140px] w-full" />
          </div>
        </DashboardGrid>
      </div>

      {/* Section 9: Resolution Performance */}
      <div>
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-3 w-56 mb-4" />
        <DashboardGrid cols={4}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </DashboardGrid>
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </div>
      </div>

      {/* Section 10: Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4 pb-2">
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-24" />
          ))}
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}
