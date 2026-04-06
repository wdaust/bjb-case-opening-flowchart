import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtNum } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { OPEN_LIT_ID } from '../data/sfReportIds';
import type { ReportSummaryResponse } from '../types/salesforce';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const tooltipStyle = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(var(--foreground))' },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

const INDIGO = '#6366f1';

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-6 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

interface DetailRow extends Record<string, unknown> {
  _groupingLabel: string;
}

export default function OpenInventoryDetail() {
  const navigate = useNavigate();
  const { data, loading } = useSalesforceReport<ReportSummaryResponse>({
    id: OPEN_LIT_ID,
    type: 'report',
    mode: 'full',
  });

  const [filterText, setFilterText] = useState('');

  // Grand total aggregates
  const totalOpen = (data?.grandTotals?.find(g => g.label === 'Record Count')?.value ?? 0) as number;

  // Attorney grouping breakdown
  const attorneyBreakdown = useMemo(() => {
    if (!data?.groupings) return [];
    return data.groupings
      .map(g => ({
        name: g.label,
        count: (g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0) as number,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // Detail rows
  const detailRows = (data?.detailRows ?? []) as DetailRow[];

  // Derive column keys from first row
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

  // Add attorney column first
  const allColumns: Column<DetailRow>[] = useMemo(() => {
    return [
      { key: '_groupingLabel', label: 'Attorney', sortable: true },
      ...detailColumns,
    ];
  }, [detailColumns]);

  // Filter rows by text
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
        { label: 'Open Inventory' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Open Inventory Detail</h1>
      <p className="text-sm text-muted-foreground">
        Matter-level detail for all open litigation matters grouped by attorney.
      </p>

      {/* KPI Strip */}
      <DashboardGrid cols={4}>
        <StatCard label="Total Open Matters" value={fmtNum(totalOpen)} variant="glass" />
        <StatCard label="Attorneys" value={attorneyBreakdown.length} variant="glass" />
        <StatCard
          label="Avg per Attorney"
          value={attorneyBreakdown.length ? fmtNum(Math.round(totalOpen / attorneyBreakdown.length)) : '—'}
          variant="glass"
        />
        <StatCard label="Detail Rows" value={fmtNum(detailRows.length)} variant="glass" />
      </DashboardGrid>

      {/* Attorney Breakdown Bar Chart */}
      <section>
        <SectionHeader
          title="Attorney Breakdown"
          subtitle={`${attorneyBreakdown.length} attorneys with open matters`}
        />
        <div className="rounded-xl border border-border bg-card p-5">
          <ResponsiveContainer width="100%" height={Math.max(200, attorneyBreakdown.length * 28)}>
            <BarChart
              data={attorneyBreakdown.slice(0, 25)}
              layout="vertical"
              margin={{ left: 120, right: 20, top: 5, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} width={115} axisLine={false} tickLine={false} />
              <RechartsTooltip {...tooltipStyle} />
              <Bar
                dataKey="count"
                fill={INDIGO}
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(_d: unknown, idx: number) => {
                  const name = attorneyBreakdown[idx]?.name;
                  if (name) navigate(`/attorney/${encodeURIComponent(name)}`);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Matter Detail Table */}
      {detailRows.length > 0 && (
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
            columns={allColumns}
            keyField="_groupingLabel"
            maxRows={100}
          />
        </section>
      )}

      {detailRows.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No detail rows available. Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">scripts/refresh-sf-data.sh</code> to fetch detail data.
        </div>
      )}
    </div>
  );
}
