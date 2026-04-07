import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtNum, getDashRows, complianceColor } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { STATS_ID, DEP_REPORT_ID } from '../data/sfReportIds';
import type { DashboardResponse, ReportSummaryResponse } from '../types/salesforce';
import { cn } from '../utils/cn';
import { DataTable } from '../components/dashboard/DataTable';
import type { Column } from '../components/dashboard/DataTable';
import { ESCALATION_FILTERS } from '../utils/escalationFilters';

interface DetailRow extends Record<string, unknown> {
  _groupingLabel?: string;
}

type DepRow = { bucket: string; count: number; status: string; isTimely: boolean };

const depTableCols: Column<DepRow>[] = [
  { key: 'bucket', label: 'Bucket' },
  { key: 'count', label: 'Count', render: (r) => fmtNum(r.count) },
  {
    key: 'status',
    label: 'Status',
    render: (r) => (
      <span className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        r.isTimely ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400',
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
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function DepositionDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const overdueOnly = searchParams.get('overdue') === 'true';

  const { data: statsData, loading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const { data: reportData, loading: reportLoading } =
    useSalesforceReport<ReportSummaryResponse>({
      id: DEP_REPORT_ID,
      type: 'report',
      mode: 'full',
    });

  const [filterText, setFilterText] = useState('');

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

  // Detail rows from source report
  const allDetailRows = (reportData?.detailRows ?? []) as DetailRow[];

  // Apply overdue pre-filter when linked from escalation card
  const detailRowsRaw = useMemo(() => {
    if (!overdueOnly) return allDetailRows;
    return allDetailRows.filter(r => {
      const lbl = r._groupingLabel;
      return typeof lbl === 'string' && ESCALATION_FILTERS.deps(lbl);
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

      {/* Bucket Data Table */}
      <section>
        <SectionHeader title="Deposition Data" subtitle="Sortable table of deposition timing buckets" />
        <DataTable
          data={timingRows.map(r => ({
            bucket: r.bucket,
            count: r.count,
            status: r.isTimely ? 'On Time' : 'Late',
            isTimely: r.isTimely,
          }))}
          columns={depTableCols}
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
                Overdue &gt;90d only
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
