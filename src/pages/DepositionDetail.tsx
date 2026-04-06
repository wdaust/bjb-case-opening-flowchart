import { useMemo } from 'react';
import { fmtNum, getDashRows, complianceColor } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { STATS_ID } from '../data/sfReportIds';
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
  const { data: statsData, loading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const depRows = useMemo(() => getDashRows(statsData, 'Dep Report for NJ PI LIT'), [statsData]);
  const total = useMemo(() => depRows.reduce((s, r) => s + (r.values[0]?.value ?? 0), 0), [depRows]);
  const overdue90 = useMemo(() => {
    return depRows
      .filter(r => r.label.includes('90-179') || r.label.includes('180'))
      .reduce((s, r) => s + (r.values[0]?.value ?? 0), 0);
  }, [depRows]);
  const onTime = total - overdue90;
  const pct = total ? Math.round((onTime / total) * 100) : 0;

  // Bucket breakdown rows
  const timingRows = useMemo(() => {
    return depRows.map(r => {
      const lbl = r.label;
      const isLate = lbl.includes('90-179') || lbl.includes('180');
      return {
        bucket: lbl,
        count: r.values[0]?.value ?? 0,
        isTimely: !isLate,
      };
    });
  }, [depRows]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Deposition Detail' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Deposition Detail</h1>
      <p className="text-sm text-muted-foreground">
        Deposition compliance — matters overdue by 90+ days are considered late.
      </p>

      {/* KPI Strip */}
      <DashboardGrid cols={3}>
        <div className={cn('rounded-xl border p-5 text-center', complianceColor(pct))}>
          <p className="text-xs font-medium opacity-70 mb-1">On Time (&lt;90 days)</p>
          <p className="text-4xl font-bold">{pct}%</p>
          <p className="text-[11px] mt-1 opacity-60">{fmtNum(onTime)} on time / {fmtNum(total)} total</p>
        </div>
        <StatCard label="On Time" value={fmtNum(onTime)} variant="glass" />
        <StatCard label="Late >90d" value={fmtNum(overdue90)} variant="glass" />
      </DashboardGrid>

      {/* Timing Bucket Breakdown */}
      <section>
        <SectionHeader title="Deposition Buckets" subtitle="Breakdown by overdue status from Stats dashboard" />
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
