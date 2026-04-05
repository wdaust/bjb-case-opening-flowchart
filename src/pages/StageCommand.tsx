import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '../utils/cn';
import {
  allValidStageRoutes, stageLabels, parentStageOrder, parentStageLabels,
  substagesOf,
  type Stage, type ParentStage, type SubStage,
} from '../data/mockData';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { MATTERS_ID, TIMING_ID, DISCOVERY_ID, EXPERTS_ID } from '../data/sfReportIds';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import {
  getTimingCompliance, compliancePct, complianceColor, fmtNum,
} from '../utils/sfHelpers';
import { StatCard } from '../components/dashboard/StatCard';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

/* ── Stage-name mapping: MATTERS report grouping labels → route IDs ── */
const mattersLabelToStageId: Record<string, SubStage> = {
  'Account Opening': 'pre-account-opening' as SubStage,
  'Treatment Monitoring (Pre-Lit)': 'pre-treatment-monitoring' as SubStage,
  'Treatment Monitoring': 'pre-treatment-monitoring' as SubStage,
  'Value Development': 'pre-value-development' as SubStage,
  'Demand Readiness': 'pre-demand-readiness' as SubStage,
  'Negotiation': 'pre-negotiation' as SubStage,
  'Resolution Pending': 'pre-resolution-pending' as SubStage,
  'Case Opening': 'lit-case-opening' as SubStage,
  'Treatment Monitoring (Lit)': 'lit-treatment-monitoring' as SubStage,
  'Discovery': 'lit-discovery' as SubStage,
  'Expert & Deposition': 'lit-expert-deposition' as SubStage,
  'Arbitration/Mediation': 'lit-arb-med' as SubStage,
  'Trial': 'lit-trial' as SubStage,
};

/* ── Loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-pulse">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-muted" />
    </div>
  );
}

export default function StageCommand() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  /* ── Salesforce data hooks ── */
  const { data: mattersData, loading: mattersLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: MATTERS_ID, type: 'report' });
  const { data: timingData, loading: timingLoading } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });
  const { data: discData, loading: discLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: DISCOVERY_ID, type: 'report' });
  const { loading: expertsLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: EXPERTS_ID, type: 'report' });

  const loading = mattersLoading || timingLoading || discLoading || expertsLoading;

  if (!stageId || !allValidStageRoutes.includes(stageId as Stage)) {
    return <Navigate to="/control-tower" replace />;
  }

  const stage = stageId as Stage;
  const isParentStage = (parentStageOrder as Stage[]).includes(stage) && stage !== 'intake';

  /* ── Breadcrumbs ── */
  const crumbs: { label: string; path?: string }[] = [
    { label: 'Control Tower', path: '/control-tower' },
  ];
  if (isParentStage) {
    crumbs.push({ label: stageLabels[stage] });
  } else {
    let parentKey: ParentStage | null = null;
    for (const ps of parentStageOrder) {
      const subs = substagesOf[ps];
      if (subs && subs.includes(stage as SubStage)) { parentKey = ps; break; }
    }
    if (parentKey) {
      crumbs.push({ label: parentStageLabels[parentKey], path: `/stage/${parentKey}` });
    }
    crumbs.push({ label: stageLabels[stage] });
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Breadcrumbs crumbs={crumbs} />
        <FilterBar />
        <LoadingSkeleton />
      </div>
    );
  }

  /* ── Helper: build substage rows from MATTERS groupings ── */
  const buildSubstageRows = (subs: SubStage[]) => {
    const groupings = mattersData?.groupings ?? [];
    return subs.map(sub => {
      // Find the matching grouping by mapping label → stageId
      const match = groupings.find(g => mattersLabelToStageId[g.label] === sub);
      const open = match?.aggregates?.[0]?.value ?? 0;
      const closed = match?.aggregates?.[1]?.value ?? 0;
      const total = open + closed;
      return { stage: sub, label: stageLabels[sub], open, closed, total };
    });
  };

  /* ═══════════════════════════════════════════════════════════════════════
     Parent stage mode
     ═══════════════════════════════════════════════════════════════════════ */
  if (isParentStage) {
    const ps = stage as ParentStage;
    const subs = substagesOf[ps] || [];
    const rows = buildSubstageRows(subs as SubStage[]);

    const subColumns: Column<typeof rows[0]>[] = [
      { key: 'label', label: 'Stage' },
      { key: 'open', label: 'Open' },
      { key: 'closed', label: 'Closed' },
      { key: 'total', label: 'Total' },
    ];

    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Breadcrumbs crumbs={crumbs} />
        <FilterBar />

        <SectionHeader title={`${stageLabels[stage]} Substages`} info="Substage breakdown showing open, closed, and total matters for each substage." />
        <DataTable
          data={rows}
          columns={subColumns}
          keyField="stage"
          onRowClick={row => navigate(`/stage/${row.stage}`)}
        />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Sub-stage mode (and intake) — 3 tabs
     ═══════════════════════════════════════════════════════════════════════ */

  // Overview metrics
  const stageGrouping = mattersData?.groupings?.find(g => mattersLabelToStageId[g.label] === stage);
  const openCount = stageGrouping?.aggregates?.[0]?.value ?? 0;

  // Compliance from TIMING dashboard — average across the 4 timing metrics
  const complaintComp = getTimingCompliance(timingData, 'Complaint Filing');
  const formAComp = getTimingCompliance(timingData, 'Form A');
  const formCComp = getTimingCompliance(timingData, 'Form C');
  const depsComp = getTimingCompliance(timingData, 'Deps');

  const compliancePcts = [
    compliancePct(complaintComp),
    compliancePct(formAComp),
    compliancePct(formCComp),
    compliancePct(depsComp),
  ];
  const avgCompliance = compliancePcts.length
    ? Math.round(compliancePcts.reduce((a, b) => a + b, 0) / compliancePcts.length)
    : 0;

  // Discovery tracker count
  const discoveryTotal = discData?.grandTotals?.[0]?.value ?? 0;

  // Workload: attorney distribution from DISCOVERY groupings
  const workloadData = useMemo(() => {
    const groupings = discData?.groupings ?? [];
    return groupings
      .map(g => ({
        name: g.label,
        count: g.aggregates?.[0]?.value ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [discData]);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={crumbs} />
      <FilterBar />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ── */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <SectionHeader title={`${stageLabels[stage]} Overview`} info="Stage-level open count, average compliance rate, and discovery tracker total." />
          <DashboardGrid cols={3}>
            <StatCard label="Open Matters" value={fmtNum(openCount)} />
            <StatCard
              label="Compliance %"
              value={`${avgCompliance}%`}
              deltaType={avgCompliance >= 60 ? 'positive' : 'negative'}
            />
            <StatCard label="Discovery Tracker" value={fmtNum(discoveryTotal)} />
          </DashboardGrid>
        </TabsContent>

        {/* ── Tab 2: Compliance ── */}
        <TabsContent value="compliance" className="space-y-4 pt-4">
          <SectionHeader title="Timing Compliance" info="Timing compliance rates for complaint filing, Form A, Form C, and depositions." />
          <DashboardGrid cols={2}>
            {[
              { label: 'Complaint Filing', data: complaintComp },
              { label: 'Form A', data: formAComp },
              { label: 'Form C', data: formCComp },
              { label: 'Deps', data: depsComp },
            ].map(({ label, data }) => {
              const pct = compliancePct(data);
              return (
                <div
                  key={label}
                  className={cn(
                    'rounded-lg border p-4 space-y-1',
                    complianceColor(pct),
                  )}
                >
                  <p className="text-sm font-medium opacity-80">{label}</p>
                  <p className="text-2xl font-bold">{pct}%</p>
                  <p className="text-xs opacity-60">
                    {fmtNum(data.timely)} timely / {fmtNum(data.late)} late
                  </p>
                </div>
              );
            })}
          </DashboardGrid>
        </TabsContent>

        {/* ── Tab 3: Workload ── */}
        <TabsContent value="workload" className="space-y-4 pt-4">
          <SectionHeader title="Attorney Distribution" subtitle="From Discovery report" info="Attorney workload distribution based on discovery tracker assignments." />
          <div className="rounded-lg border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={Math.max(200, workloadData.length * 32)}>
              <BarChart data={workloadData} layout="vertical">
                <XAxis
                  type="number"
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
