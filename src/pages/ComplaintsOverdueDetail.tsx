import { useMemo, useState } from 'react';
import { fmtNum, getDashRows } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { DataTable } from '../components/dashboard/DataTable';
import type { Column } from '../components/dashboard/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { STATS_ID, COMPLAINTS_REPORT_ID } from '../data/sfReportIds';
import type { DashboardResponse, ReportSummaryResponse } from '../types/salesforce';
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

type ComplaintRow = { bucket: string; count: number; status: string; _color: string };

const complaintsTableCols: Column<ComplaintRow>[] = [
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
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

interface DetailRow extends Record<string, unknown> {
  _groupingLabel?: string;
}

export default function ComplaintsOverdueDetail() {
  const { data: statsData, loading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const { data: reportData, loading: reportLoading } =
    useSalesforceReport<ReportSummaryResponse>({
      id: COMPLAINTS_REPORT_ID,
      type: 'report',
      mode: 'full',
    });

  const [filterText, setFilterText] = useState('');

  const complaintFilingData = useMemo(() => {
    const rows = getDashRows(statsData, 'Complaint Filing Dashboard (NJ LIT)');
    return rows.map(r => {
      const v = r.values[0]?.value ?? 0;
      const lbl = r.label;
      const isOverdue = lbl.toLowerCase().includes('overdue');
      return { name: lbl, value: v, color: isOverdue ? RED : lbl.includes('Exception') ? AMBER : GREEN };
    });
  }, [statsData]);

  const totalComplaints = complaintFilingData.reduce((s, d) => s + d.value, 0);
  const overdue14Plus = complaintFilingData
    .filter(d => d.name.includes('Overdue') && !d.name.includes('0-14'))
    .reduce((s, d) => s + d.value, 0);
  const overdue30Plus = complaintFilingData
    .filter(d => {
      const n = d.name;
      return n.includes('30-59') || n.includes('60-89') || n.includes('90');
    })
    .reduce((s, d) => s + d.value, 0);

  // Detail rows from source report
  const detailRows = (reportData?.detailRows ?? []) as DetailRow[];

  const detailColumns: Column<DetailRow>[] = useMemo(() => {
    if (!detailRows.length) return [];
    const first = detailRows[0];
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
  }, [detailRows]);

  const allDetailColumns: Column<DetailRow>[] = useMemo(() => {
    if (!detailRows.length || !detailRows[0]._groupingLabel) return detailColumns;
    return [
      { key: '_groupingLabel', label: 'Group', sortable: true },
      ...detailColumns,
    ];
  }, [detailColumns, detailRows]);

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
        { label: 'Complaints Overdue' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Outstanding Complaints &gt;14 Days</h1>
      <p className="text-sm text-muted-foreground">
        Aging breakdown for NJ complaint filings from the Stats dashboard.
      </p>

      {/* KPI Strip */}
      <DashboardGrid cols={3}>
        <StatCard label="Total Complaints" value={fmtNum(totalComplaints)} variant="glass" />
        <StatCard label="Overdue >14 Days" value={fmtNum(overdue14Plus)} variant="glass" />
        <StatCard label="Overdue >30 Days" value={fmtNum(overdue30Plus)} variant="glass" />
      </DashboardGrid>

      {/* Aging Bucket Breakdown */}
      {complaintFilingData.length > 0 && (
        <section>
          <SectionHeader title="Complaint Aging Buckets" subtitle={`${fmtNum(totalComplaints)} total across all buckets`} />
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-8">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={complaintFilingData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" stroke="none" paddingAngle={1}>
                      {complaintFilingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {complaintFilingData.map(d => (
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
        <SectionHeader title="Bucket Detail" subtitle="Individual aging bucket counts" />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {complaintFilingData.map(d => (
              <div
                key={d.name}
                className={cn(
                  'rounded-lg border p-4 text-center',
                  d.color === RED
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : d.color === AMBER
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : 'border-green-500/30 bg-green-500/10 text-green-400',
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
        <SectionHeader title="Bucket Data" subtitle="Sortable table of all complaint aging buckets" />
        <DataTable
          data={complaintFilingData.map(d => ({
            bucket: d.name,
            count: d.value,
            status: d.color === RED ? 'Overdue' : d.color === AMBER ? 'Exception' : 'On Track',
            _color: d.color,
          }))}
          columns={complaintsTableCols}
          keyField="bucket"
        />
      </section>

      {/* Matter Detail Table */}
      {reportLoading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading matter-level detail...
        </div>
      )}
      {!reportLoading && detailRows.length > 0 && (
        <section>
          <SectionHeader
            title="Matter Detail"
            subtitle={`${fmtNum(filteredRows.length)} of ${fmtNum(detailRows.length)} matters`}
          />
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
      {!reportLoading && detailRows.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No detail rows available. Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">scripts/refresh-sf-data.sh</code> to fetch detail data.
        </div>
      )}
    </div>
  );
}
