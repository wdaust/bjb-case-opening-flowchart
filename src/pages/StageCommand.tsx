import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, Legend,
} from 'recharts';
import { cn } from '../utils/cn';
import {
  allValidStageRoutes, stageLabels, parentStageOrder, parentStageLabels,
  substagesOf, getStageCommandData, getWeeklyThroughput, getCasesByParentStage,
  getDaysInStage, getAgingDistribution, stageSlaTargets,
  type Stage, type ParentStage, type SubStage, type AgingBand,
} from '../data/mockData';
import { StatCard } from '../components/dashboard/StatCard';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { AgingHeatmap } from '../components/dashboard/AgingHeatmap';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export default function StageCommand() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  if (!stageId || !allValidStageRoutes.includes(stageId as Stage)) {
    return <Navigate to="/control-tower" replace />;
  }

  const stage = stageId as Stage;
  const isParentStage = (parentStageOrder as Stage[]).includes(stage) && stage !== "intake";

  // Build breadcrumbs
  const crumbs: { label: string; path?: string }[] = [
    { label: 'Control Tower', path: '/control-tower' },
  ];
  if (isParentStage) {
    crumbs.push({ label: stageLabels[stage] });
  } else {
    // Find parent for this substage
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

  // Parent stage overview mode
  if (isParentStage) {
    const ps = stage as ParentStage;
    const subs = substagesOf[ps] || [];
    const parentCases = getCasesByParentStage(ps);
    const totalCount = parentCases.length;
    const overSla = parentCases.filter(c => c.riskFlags.includes("Over SLA")).length;

    const subBreakdown = subs.map(sub => {
      const subCases = parentCases.filter(c => c.stage === sub);
      const ages = subCases.map(getDaysInStage);
      const avg = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
      return {
        stage: sub,
        label: stageLabels[sub],
        count: subCases.length,
        overSla: subCases.filter(c => c.riskFlags.includes("Over SLA")).length,
        avgAge: avg,
        slaTarget: stageSlaTargets[sub],
      };
    });

    const subColumns: Column<typeof subBreakdown[0]>[] = [
      { key: 'label', label: 'Substage' },
      { key: 'count', label: 'Cases' },
      { key: 'overSla', label: 'Over SLA', render: r => <span className={r.overSla > 0 ? "text-red-500 font-medium" : ""}>{r.overSla}</span> },
      { key: 'avgAge', label: 'Avg Age (d)' },
      { key: 'slaTarget', label: 'SLA Target (d)' },
    ];

    // Aging heatmap for substages
    const agingData = subs.reduce((acc, sub) => {
      const subCases = parentCases.filter(c => c.stage === sub);
      acc[sub] = getAgingDistribution(subCases);
      return acc;
    }, {} as Record<Stage, Record<AgingBand, number>>);

    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Breadcrumbs crumbs={crumbs} />
        <FilterBar />

        <DashboardGrid cols={3}>
          <StatCard label="Total Cases" value={totalCount} />
          <StatCard label="Over SLA" value={overSla} delta={`${totalCount > 0 ? Math.round((overSla / totalCount) * 100) : 0}%`} deltaType="negative" />
          <StatCard label="Substages" value={subs.length} />
        </DashboardGrid>

        <Tabs defaultValue="breakdown">
          <TabsList>
            <TabsTrigger value="breakdown">Substage Breakdown</TabsTrigger>
            <TabsTrigger value="aging">Aging Heatmap</TabsTrigger>
          </TabsList>
          <TabsContent value="breakdown" className="space-y-4 pt-4">
            <SectionHeader title={`${stageLabels[stage]} Substages`} />
            <DataTable
              data={subBreakdown}
              columns={subColumns}
              keyField="stage"
              onRowClick={row => navigate(`/stage/${row.stage}`)}
            />
          </TabsContent>
          <TabsContent value="aging" className="space-y-4 pt-4">
            <SectionHeader title="Aging by Substage" />
            <AgingHeatmap data={agingData} stages={subs} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Substage / intake detail mode (existing behavior)
  const stageData = getStageCommandData(stage);
  const weeklyData = getWeeklyThroughput();

  const gateBarColor = (pct: number) => {
    if (pct >= 80) return '#10b981';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const formatDollars = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  const gateChartData = Object.entries(stageData.gateCompletion).map(([name, completion]) => ({
    name, completion,
  }));

  const columns: Column<Record<string, any>>[] = [
    { key: 'id', label: 'Case ID' },
    { key: 'title', label: 'Title' },
    { key: 'attorney', label: 'Attorney' },
    { key: 'daysInStage', label: 'Days in Stage' },
    {
      key: 'slaStatus', label: 'SLA Status',
      render: (row: Record<string, any>) => {
        const status = row.slaStatus as string;
        return (
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            status === 'breach' ? 'bg-red-500/20 text-red-500'
              : status === 'warning' ? 'bg-amber-500/20 text-amber-500'
              : 'bg-emerald-500/20 text-emerald-500'
          )}>{status}</span>
        );
      },
    },
    { key: 'nextAction', label: 'Next Action' },
    {
      key: 'expectedValue', label: 'EV',
      render: (row: Record<string, any>) => formatDollars(row.expectedValue),
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={crumbs} />
      <FilterBar />

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="aging">Aging & SLA</TabsTrigger>
          <TabsTrigger value="throughput">Throughput</TabsTrigger>
          {gateChartData.length > 0 && <TabsTrigger value="gates">Gates</TabsTrigger>}
          <TabsTrigger value="queue">Priority Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="space-y-4">
            <SectionHeader title={`${stageLabels[stage]} Inventory`} />
            <DashboardGrid cols={3}>
              <StatCard label="Total Cases" value={stageData.total} />
              <StatCard label="Over SLA" value={stageData.overSla} delta={`${stageData.overSlaPct}% of stage`} deltaType="negative" />
              <StatCard label="SLA Target" value={`${stageData.slaTarget} days`} />
            </DashboardGrid>
            <div className="rounded-lg border border-border bg-card p-4">
              <ResponsiveContainer width="100%" height={Math.max(200, stageData.attorneyDistribution.length * 32)}>
                <BarChart data={stageData.attorneyDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="aging">
          <div className="space-y-4">
            <SectionHeader title="Stage Aging & SLA" />
            <DashboardGrid cols={3}>
              <StatCard label="Median Age" value={`${stageData.medianAge}d`} />
              <StatCard label="90th Percentile" value={`${stageData.p90Age}d`} />
              <StatCard label="Over SLA %" value={`${stageData.overSlaPct}%`} deltaType={stageData.overSlaPct > 20 ? "negative" : "positive"} />
            </DashboardGrid>
            <AgingHeatmap data={{ [stage]: stageData.aging } as any} stages={[stage]} />
          </div>
        </TabsContent>

        <TabsContent value="throughput">
          <div className="space-y-4">
            <SectionHeader title="Motion & Throughput" subtitle="13-week trailing" />
            <div className="rounded-lg border border-border bg-card p-4">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }} />
                  <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                  <Area type="monotone" dataKey="newIn" fill="#6366f1" fillOpacity={0.3} stroke="#6366f1" strokeWidth={2} name="New In" />
                  <Area type="monotone" dataKey="closedOut" fill="#10b981" fillOpacity={0.3} stroke="#10b981" strokeWidth={2} name="Closed Out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {gateChartData.length > 0 && (
          <TabsContent value="gates">
            <div className="space-y-4">
              <SectionHeader title="Readiness Gates" subtitle="Exit criteria completion across cases" />
              <div className="rounded-lg border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height={Math.max(200, gateChartData.length * 40)}>
                  <BarChart data={gateChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v: number) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={160} stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="completion" radius={[0, 4, 4, 0]}>
                      {gateChartData.map((entry, index) => (
                        <Cell key={`gate-cell-${index}`} fill={gateBarColor(entry.completion)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="queue">
          <div className="space-y-4">
            <SectionHeader title="Priority Queue" subtitle="Cases needing attention, sorted by urgency" />
            <DataTable columns={columns} data={stageData.priorityQueue} keyField="id"
              onRowClick={(row) => navigate(`/case/${row.id}`)} maxRows={20}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
