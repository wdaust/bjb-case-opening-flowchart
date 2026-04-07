import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtNum, getDashRows } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { STATS_ID, FORM_C_REPORT_ID } from '../data/sfReportIds';
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
const PINK = '#ec4899';

type DefDiscRow = { bucket: string; count: number; status: string; _color: string };

const defDiscTableCols: Column<DefDiscRow>[] = [
  { key: 'bucket', label: 'Bucket' },
  { key: 'count', label: 'Count', render: (r) => fmtNum(r.count) },
  {
    key: 'status',
    label: 'Status',
    render: (r) => (
      <span className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        r._color === GREEN ? 'bg-green-500/15 text-green-400' :
        r._color === RED ? 'bg-red-500/15 text-red-400' :
        'bg-amber-500/15 text-amber-400',
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
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function DefendantsDiscoveryDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const overdueOnly = searchParams.get('overdue') === 'true';

  const { data: statsData, loading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const { data: reportData, loading: reportLoading } =
    useSalesforceReport<ReportSummaryResponse>({
      id: FORM_C_REPORT_ID,
      type: 'report',
      mode: 'full',
    });

  const [filterText, setFilterText] = useState('');

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

  // Detail rows from source report
  const allDetailRows = (reportData?.detailRows ?? []) as DetailRow[];

  // Apply overdue pre-filter when linked from escalation card
  const detailRowsRaw = useMemo(() => {
    if (!overdueOnly) return allDetailRows;
    return allDetailRows.filter(r => {
      const lbl = r._groupingLabel;
      return typeof lbl === 'string' && ESCALATION_FILTERS.formC(lbl);
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

  const filteredDetailRows = useMemo(() => {
    if (!filterText) return detailRowsRaw;
    const q = filterText.toLowerCase();
    return detailRowsRaw.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [detailRowsRaw, filterText]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Defendants Discovery' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Defendants Discovery (Form C Past Due)</h1>
      <p className="text-sm text-muted-foreground">
        Action-based bucket breakdown from the Stats dashboard with matter-level detail from Form C source report.
      </p>

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

      {/* Bucket Data Table */}
      <section>
        <SectionHeader title="Action Bucket Data" subtitle="Sortable table of defendants discovery action buckets" />
        <DataTable
          data={formCData.map(d => ({
            bucket: d.name,
            count: d.value,
            status: d.name.toLowerCase().includes('within time') ? 'Within Time' :
                    d.name.toLowerCase().includes('motion') ? 'Motion Needed' : 'Past Due',
            _color: d.color,
          }))}
          columns={defDiscTableCols}
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
            subtitle={`${fmtNum(filteredDetailRows.length)} of ${fmtNum(allDetailRows.length)} matters`}
          />
          {overdueOnly && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-400 px-2.5 py-1 text-xs font-medium">
                Overdue only
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
            data={filteredDetailRows}
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
