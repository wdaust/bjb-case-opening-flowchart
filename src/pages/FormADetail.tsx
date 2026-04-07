import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtNum, getDashRows, getTimingCompliance, compliancePct, complianceColor } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { TIMING_ID, STATS_ID, FORM_A_REPORT_ID } from '../data/sfReportIds';
import type { DashboardResponse, ReportSummaryResponse } from '../types/salesforce';
import { cn } from '../utils/cn';
import { DataTable } from '../components/dashboard/DataTable';
import type { Column } from '../components/dashboard/DataTable';
import { ESCALATION_FILTERS } from '../utils/escalationFilters';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

interface DetailRow extends Record<string, unknown> {
  _groupingLabel?: string;
}

const tooltipStyle = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(var(--foreground))' },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

const GREEN = '#22c55e';
const AMBER = '#f59e0b';
const RED = '#ef4444';

type FormARow = { bucket: string; count: number; status: string; _color: string };

const formATableCols: Column<FormARow>[] = [
  { key: 'bucket', label: 'Bucket' },
  { key: 'count', label: 'Count', render: (r) => fmtNum(r.count) },
  {
    key: 'status',
    label: 'Status',
    render: (r) => (
      <span className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        r._color === RED ? 'bg-red-500/15 text-red-400' :
        r._color === AMBER ? 'bg-amber-500/15 text-amber-400' :
        'bg-green-500/15 text-green-400',
      )}>
        {r.status}
      </span>
    ),
  },
];

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-6 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function FormADetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const overdueOnly = searchParams.get('overdue') === 'true';

  const { data: timingData, loading: timingLoading } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });
  const { data: statsData, loading: statsLoading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const { data: reportData, loading: reportLoading } =
    useSalesforceReport<ReportSummaryResponse>({
      id: FORM_A_REPORT_ID,
      type: 'report',
      mode: 'full',
    });

  const [filterText, setFilterText] = useState('');

  const loading = timingLoading || statsLoading;

  const formA = getTimingCompliance(timingData, 'Form A Timing NJ in Days from Answer');
  const pct = compliancePct(formA);
  const total = formA.timely + formA.late;

  // Past-due aging data from Stats dashboard
  const formAPastDueData = useMemo(() => {
    const rows = getDashRows(statsData, 'Form A Past Due (NJ)');
    return rows.map(r => {
      const v = r.values[0]?.value ?? 0;
      const lbl = r.label;
      const isOverdue30 = lbl.includes('30+') || lbl.includes('30-');
      const isOverdue = lbl.toLowerCase().includes('overdue');
      return { name: lbl, value: v, color: isOverdue30 ? RED : isOverdue ? AMBER : GREEN };
    });
  }, [statsData]);

  const pastDueTotal = formAPastDueData.reduce((s, d) => s + d.value, 0);

  // Timing breakdown rows from timing dashboard
  const timingRows = useMemo(() => {
    const rows = getDashRows(timingData, 'Form A Timing NJ in Days from Answer');
    return rows.map(r => ({
      bucket: r.label,
      count: r.values[0]?.value ?? 0,
      isTimely: r.label.toLowerCase().includes('timely') ||
        r.label.toLowerCase().includes('compliant') ||
        r.label.toLowerCase().includes('under'),
    }));
  }, [timingData]);

  // Detail rows from source report
  const allDetailRows = (reportData?.detailRows ?? []) as DetailRow[];

  // Apply overdue pre-filter when linked from escalation card
  const detailRows = useMemo(() => {
    if (!overdueOnly) return allDetailRows;
    return allDetailRows.filter(r => {
      const lbl = r._groupingLabel;
      return typeof lbl === 'string' && ESCALATION_FILTERS.formA(lbl);
    });
  }, [allDetailRows, overdueOnly]);

  const detailColumns: Column<DetailRow>[] = useMemo(() => {
    if (!allDetailRows.length) return [];
    const first = allDetailRows[0];
    return Object.keys(first)
      .filter(k => k !== '_groupingLabel')
      .map(k => ({
        key: k,
        label: k,
        sortable: true,
        render: (row: DetailRow) => {
          const v = row[k];
          if (v == null) return '—';
          if (typeof v === 'number') return fmtNum(v);
          return String(v);
        },
      }));
  }, [allDetailRows]);

  const allDetailColumns: Column<DetailRow>[] = useMemo(() => {
    if (!allDetailRows.length || !allDetailRows[0]._groupingLabel) return detailColumns;
    return [
      { key: '_groupingLabel', label: 'Group', sortable: true },
      ...detailColumns,
    ];
  }, [detailColumns, allDetailRows]);

  const filteredRows = useMemo(() => {
    if (!filterText) return detailRows;
    const q = filterText.toLowerCase();
    return detailRows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [detailRows, filterText]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Form A Detail' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Form A: Plaintiff Discovery Detail</h1>
      <p className="text-sm text-muted-foreground">
        Compliance timing and past-due breakdown for Form A discovery responses.
      </p>

      {/* KPI Strip */}
      <DashboardGrid cols={4}>
        <div className={cn('rounded-xl border p-5 text-center', complianceColor(pct))}>
          <p className="text-xs font-medium opacity-70 mb-1">Compliance Rate</p>
          <p className="text-4xl font-bold">{pct}%</p>
          <p className="text-[11px] mt-1 opacity-60">{fmtNum(formA.timely)} timely / {fmtNum(total)} total</p>
        </div>
        <StatCard label="Timely" value={fmtNum(formA.timely)} variant="glass" />
        <StatCard label="Late" value={fmtNum(formA.late)} variant="glass" />
        <StatCard label="Past Due" value={fmtNum(pastDueTotal)} variant="glass" />
      </DashboardGrid>

      {/* Timing Bucket Breakdown */}
      <section>
        <SectionHeader title="Timing Buckets" subtitle="Form A timing breakdown by days from answer" />
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

      {/* Past Due Aging */}
      {formAPastDueData.length > 0 && (
        <section>
          <SectionHeader title="Past Due Aging" subtitle={`${fmtNum(pastDueTotal)} total past-due matters`} />
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-8">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={formAPastDueData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" stroke="none" paddingAngle={1}>
                      {formAPastDueData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {formAPastDueData.map(d => (
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

      {/* Bucket Data Table */}
      <section>
        <SectionHeader title="Past Due Data" subtitle="Sortable table of Form A past-due buckets" />
        <DataTable
          data={formAPastDueData.map(d => ({
            bucket: d.name,
            count: d.value,
            status: d.color === RED ? 'Overdue 30+' : d.color === AMBER ? 'Overdue' : 'On Track',
            _color: d.color,
          }))}
          columns={formATableCols}
          keyField="bucket"
        />
      </section>

      {/* Matter Detail Table */}
      {reportLoading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading matter-level detail...
        </div>
      )}
      {!reportLoading && allDetailRows.length > 0 && (
        <section>
          <SectionHeader
            title="Matter Detail"
            subtitle={`${fmtNum(filteredRows.length)} of ${fmtNum(allDetailRows.length)} matters`}
          />
          {overdueOnly && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-400 px-2.5 py-1 text-xs font-medium">
                Overdue &gt;60d only
              </span>
              <button
                onClick={() => { setSearchParams({}); }}
                className="text-xs text-primary hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Filter matters..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full max-w-sm px-3 py-1.5 text-sm rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
            />
          </div>
          <DataTable
            data={filteredRows}
            columns={allDetailColumns}
            keyField="_groupingLabel"
            maxRows={100}
          />
        </section>
      )}
      {!reportLoading && allDetailRows.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No detail rows available. Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">scripts/refresh-sf-data.sh</code> to fetch detail data.
        </div>
      )}
    </div>
  );
}
