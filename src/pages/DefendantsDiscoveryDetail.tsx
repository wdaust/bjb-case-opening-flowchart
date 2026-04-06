import { useMemo } from 'react';
import { fmtNum, getDashRows } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { STATS_ID } from '../data/sfReportIds';
import type { DashboardResponse } from '../types/salesforce';
import { cn } from '../utils/cn';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

const tooltipStyle = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(var(--foreground))' },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

const GREEN = '#22c55e';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const PINK = '#ec4899';

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-6 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function DefendantsDiscoveryDetail() {
  const { data: statsData, loading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const formCData = useMemo(() => {
    const rows = getDashRows(statsData, 'Form C Past Due (NJ)');
    return rows.map(r => {
      const v = r.values[0]?.value ?? 0;
      const lbl = r.label;
      const isWithinTime = lbl.toLowerCase().includes('within time');
      return { name: lbl, value: v, color: isWithinTime ? GREEN : lbl.toLowerCase().includes('motion') ? RED : AMBER };
    });
  }, [statsData]);

  const totalPastDue = formCData
    .filter(d => !d.name.toLowerCase().includes('within time'))
    .reduce((s, d) => s + d.value, 0);
  const withinTime = formCData
    .filter(d => d.name.toLowerCase().includes('within time'))
    .reduce((s, d) => s + d.value, 0);
  const totalAll = formCData.reduce((s, d) => s + d.value, 0);

  // Assign distinct colors for donut
  const PALETTE = [GREEN, AMBER, RED, PINK, '#6366f1', '#14b8a6'];
  const donutData = formCData.map((d, i) => ({
    ...d,
    color: d.name.toLowerCase().includes('within time') ? GREEN : PALETTE[(i % (PALETTE.length - 1)) + 1],
  }));

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Defendants Discovery' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Defendants Discovery (Form C Past Due)</h1>
      <p className="text-sm text-muted-foreground">
        Action-based bucket breakdown from the Stats dashboard. Buckets are action-based, not day-based —
        pending a dedicated SF report for &gt;75 day filtering.
      </p>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
        <span className="font-semibold">Temp card</span> — Buckets are action-based (e.g. "Need to File Motion"), not day-based.
        A dedicated Salesforce report is needed to filter defendants discovery &gt;75 days.
      </div>

      {/* KPI Strip */}
      <DashboardGrid cols={3}>
        <StatCard label="Total" value={fmtNum(totalAll)} variant="glass" />
        <StatCard label="Past Due" value={fmtNum(totalPastDue)} variant="glass" />
        <StatCard label="Within Time" value={fmtNum(withinTime)} variant="glass" />
      </DashboardGrid>

      {/* Donut + legend */}
      {donutData.length > 0 && (
        <section>
          <SectionHeader title="Action Buckets" subtitle={`${fmtNum(totalAll)} total across all action categories`} />
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-8">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" stroke="none" paddingAngle={1}>
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-foreground">{fmtNum(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Colored bucket cards */}
      <section>
        <SectionHeader title="Bucket Detail" subtitle="Individual action bucket counts" />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {formCData.map(d => (
              <div
                key={d.name}
                className={cn(
                  'rounded-lg border p-4 text-center',
                  d.name.toLowerCase().includes('within time')
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : d.name.toLowerCase().includes('motion')
                      ? 'border-red-500/30 bg-red-500/10 text-red-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                )}
              >
                <p className="text-[11px] font-medium opacity-80 mb-1">{d.name}</p>
                <p className="text-2xl font-bold">{fmtNum(d.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder */}
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Day-Based Filtering</p>
        <p className="text-sm">
          Day-based filtering (&gt;75 days) requires a dedicated Salesforce report.
          Once created, add the report ID to <code className="text-xs bg-muted px-1.5 py-0.5 rounded">sfReportIds.ts</code> and
          this page will show day-based aging breakdown.
        </p>
      </div>
    </div>
  );
}
