import { Skeleton } from '../ui/skeleton';
import { DashboardGrid } from './DashboardGrid';

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* KPI Strip */}
      <DashboardGrid cols={3}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </DashboardGrid>

      {/* Attorney Rankings */}
      <div>
        <Skeleton className="h-5 w-52 mb-2" />
        <Skeleton className="h-3 w-48 mb-4" />
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </div>
      </div>

      {/* Discovery Workload */}
      <div>
        <Skeleton className="h-5 w-56 mb-2" />
        <Skeleton className="h-3 w-72 mb-4" />
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
          <Skeleton className="h-[450px] w-full" />
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-3 w-64 mb-4" />
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>

      {/* Compliance */}
      <div>
        <Skeleton className="h-5 w-44 mb-2" />
        <Skeleton className="h-3 w-56 mb-4" />
        <DashboardGrid cols={4}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </DashboardGrid>
      </div>
    </div>
  );
}
