import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { RESOLUTIONS_ID, MATTERS_ID, STATS_ID } from '../data/sfReportIds';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import { fmt$, fmtNum } from '../utils/sfHelpers';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
};

const BAR_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#7c3aed',
  '#6d28d9', '#5b21b6', '#4f46e5', '#4338ca', '#3730a3',
  '#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#7c3aed',
];

interface AttorneyRow {
  attorney: string;
  cases: number;
  settlement: number;
  avgSettlement: number;
  fee: number;
  feePct: number;
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-pulse">
      <div className="h-6 w-64 bg-muted rounded" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-8 w-80 bg-muted rounded" />
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}

export default function Forecast() {
  const { data: resData, loading: resLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report' });
  const { data: mattersData, loading: mattersLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: MATTERS_ID, type: 'report' });
  const { data: statsData, loading: statsLoading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const loading = resLoading || mattersLoading || statsLoading;

  // --- Derived data from RESOLUTIONS report ---
  const attorneyRows = useMemo(() => {
    return (resData?.groupings ?? []).map(g => {
      const cases = g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0;
      const settlement = g.aggregates.find(a => a.label === 'Settlement')?.value ?? 0;
      const fee = g.aggregates.find(a => a.label === 'Fee')?.value ?? 0;
      return {
        attorney: g.label,
        cases,
        settlement,
        avgSettlement: cases > 0 ? Math.round(settlement / cases) : 0,
        fee,
        feePct: settlement > 0 ? Math.round((fee / settlement) * 100) : 0,
      };
    });
  }, [resData]);

  const totalSettlement = resData?.grandTotals?.find(a => a.label === 'Settlement')?.value ?? 0;
  const totalFee = resData?.grandTotals?.find(a => a.label === 'Fee')?.value ?? 0;
  const totalMatters = mattersData?.grandTotals?.find(a => a.label === 'Record Count')?.value ?? 0;

  // Top 15 attorneys by settlement for chart
  const top15 = useMemo(
    () => [...attorneyRows].sort((a, b) => b.settlement - a.settlement).slice(0, 15),
    [attorneyRows],
  );

  // Pipeline stages from MATTERS report
  const pipelineStages = useMemo(() => {
    return (mattersData?.groupings ?? []).map(g => ({
      stage: g.label,
      open: g.aggregates.find(a => a.label === 'Open')?.value ?? 0,
    }));
  }, [mattersData]);

  // --- Attorney performance table columns ---
  const attorneyColumns: Column<AttorneyRow>[] = [
    { key: 'attorney', label: 'Attorney' },
    { key: 'cases', label: 'Cases' },
    {
      key: 'settlement',
      label: 'Settlement',
      render: (row: AttorneyRow) => fmt$(row.settlement),
    },
    {
      key: 'avgSettlement',
      label: 'Avg Settlement',
      render: (row: AttorneyRow) => fmt$(row.avgSettlement),
    },
    {
      key: 'fee',
      label: 'Fee',
      render: (row: AttorneyRow) => fmt$(row.fee),
    },
    {
      key: 'feePct',
      label: 'Fee %',
      render: (row: AttorneyRow) => `${row.feePct}%`,
    },
  ];

  if (loading && !resData && !mattersData && !statsData) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Forecast & Yield' },
      ]} />

      <DashboardGrid cols={4}>
        <StatCard label="Portfolio Value" value={fmt$(totalSettlement)} />
        <StatCard label="Total Settlements" value={fmt$(totalSettlement)} />
        <StatCard label="Net Fees" value={fmt$(totalFee)} />
        <StatCard label="Open Pipeline" value={`${fmtNum(totalMatters)} matters`} />
      </DashboardGrid>

      <Tabs defaultValue="resolution-outcomes">
        <TabsList>
          <TabsTrigger value="resolution-outcomes">Resolution Outcomes</TabsTrigger>
          <TabsTrigger value="pipeline-stage">Pipeline by Stage</TabsTrigger>
          <TabsTrigger value="attorney-performance">Attorney Performance</TabsTrigger>
        </TabsList>

        {/* Tab 1: Resolution Outcomes */}
        <TabsContent value="resolution-outcomes" className="space-y-4">
          <SectionHeader title="Resolution Outcomes" subtitle="Top 15 attorneys by settlement amount" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={top15} margin={{ bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="attorney"
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v: number) => fmt$(v)}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => fmt$(v ?? 0)} />
                <Bar dataKey="settlement" name="Settlement" radius={[4, 4, 0, 0]}>
                  {top15.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Tab 2: Pipeline by Stage */}
        <TabsContent value="pipeline-stage" className="space-y-4">
          <SectionHeader title="Pipeline by Stage" subtitle="Open matters by litigation stage" />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={Math.max(300, pipelineStages.length * 40)}>
              <BarChart data={pipelineStages} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={110}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="open" name="Open Matters" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Tab 3: Attorney Performance */}
        <TabsContent value="attorney-performance" className="space-y-4">
          <SectionHeader title="Attorney Performance" subtitle="Resolution metrics by attorney" />
          <DataTable
            data={attorneyRows}
            columns={attorneyColumns}
            keyField="attorney"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
