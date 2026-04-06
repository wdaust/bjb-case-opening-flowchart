import { useMemo } from 'react';
import { fmtNum, getDashRows, getTimingCompliance, compliancePct, complianceColor } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { TIMING_ID } from '../data/sfReportIds';
import type { DashboardResponse } from '../types/salesforce';
import { cn } from '../utils/cn';

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-6 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function DepositionDetail() {
  const { data: timingData, loading } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });

  const deps = getTimingCompliance(timingData, 'Dep Timing NJ in Days from Form A');
  const pct = compliancePct(deps);
  const total = deps.timely + deps.late;

  // Timing breakdown rows
  const timingRows = useMemo(() => {
    const rows = getDashRows(timingData, 'Dep Timing NJ in Days from Form A');
    return rows.map(r => ({
      bucket: r.label,
      count: r.values[0]?.value ?? 0,
      isTimely: r.label.toLowerCase().includes('timely') ||
        r.label.toLowerCase().includes('compliant') ||
        r.label.toLowerCase().includes('under'),
    }));
  }, [timingData]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Deposition Detail' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Deposition Timing Detail</h1>
      <p className="text-sm text-muted-foreground">
        Compliance timing breakdown for depositions measured in days from Form A.
      </p>

      {/* KPI Strip */}
      <DashboardGrid cols={3}>
        <div className={cn('rounded-xl border p-5 text-center', complianceColor(pct))}>
          <p className="text-xs font-medium opacity-70 mb-1">Compliance Rate</p>
          <p className="text-4xl font-bold">{pct}%</p>
          <p className="text-[11px] mt-1 opacity-60">{fmtNum(deps.timely)} timely / {fmtNum(total)} total</p>
        </div>
        <StatCard label="Timely" value={fmtNum(deps.timely)} variant="glass" />
        <StatCard label="Late" value={fmtNum(deps.late)} variant="glass" />
      </DashboardGrid>

      {/* Timing Bucket Breakdown */}
      <section>
        <SectionHeader title="Timing Buckets" subtitle="Deposition timing breakdown by days from Form A" />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {timingRows.map(row => (
              <div
                key={row.bucket}
                className={cn(
                  'rounded-lg border p-4 text-center',
                  row.isTimely
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400',
                )}
              >
                <p className="text-[11px] font-medium opacity-80 mb-1">{row.bucket}</p>
                <p className="text-2xl font-bold">{fmtNum(row.count)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder for matter-level data */}
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Matter-Level Detail</p>
        <p className="text-sm">
          Matter-level data requires a dedicated Salesforce report. Once created, add the report ID
          to <code className="text-xs bg-muted px-1.5 py-0.5 rounded">sfReportIds.ts</code> and
          this table will populate automatically.
        </p>
      </div>
    </div>
  );
}
