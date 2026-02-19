import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '../utils/cn';
import {
  stageOrder,
  stageLabels,
  getStageCommandData,
  getWeeklyThroughput,
  type Stage,
} from '../data/mockData';
import { StatCard } from '../components/dashboard/StatCard';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { AgingHeatmap } from '../components/dashboard/AgingHeatmap';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';

export default function StageCommand() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  if (!stageId || !stageOrder.includes(stageId as Stage)) {
    return <Navigate to="/control-tower" replace />;
  }

  const stage = stageId as Stage;
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
    name,
    completion,
  }));

  const columns: Column<Record<string, any>>[] = [
    { key: 'id', label: 'Case ID' },
    { key: 'title', label: 'Title' },
    { key: 'attorney', label: 'Attorney' },
    { key: 'daysInStage', label: 'Days in Stage' },
    {
      key: 'slaStatus',
      label: 'SLA Status',
      render: (row: Record<string, any>) => {
        const status = row.slaStatus as string;
        return (
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              status === 'breach'
                ? 'bg-red-500/20 text-red-500'
                : status === 'warning'
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-emerald-500/20 text-emerald-500'
            )}
          >
            {status}
          </span>
        );
      },
    },
    { key: 'nextAction', label: 'Next Action' },
    {
      key: 'expectedValue',
      label: 'EV',
      render: (row: Record<string, any>) => formatDollars(row.expectedValue),
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: 'Control Tower', path: '/control-tower' },
          { label: stageLabels[stage] },
        ]}
      />
      <FilterBar />

      {/* Section 1: Stage Inventory */}
      <div className="space-y-4">
        <SectionHeader title={`${stageLabels[stage]} Inventory`} />
        <DashboardGrid cols={3}>
          <StatCard label="Total Cases" value={stageData.total} />
          <StatCard
            label="Over SLA"
            value={stageData.overSla}
            delta={`${stageData.overSlaPct}% of stage`}
            deltaType="negative"
          />
          <StatCard label="SLA Target" value={`${stageData.slaTarget} days`} />
        </DashboardGrid>

        <div className="rounded-lg border border-border bg-card p-4">
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, stageData.attorneyDistribution.length * 32)}
          >
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

      {/* Section 2: Stage Aging & SLA */}
      <div className="space-y-4">
        <SectionHeader title="Stage Aging & SLA" />
        <DashboardGrid cols={3}>
          <StatCard label="Median Age" value={`${stageData.medianAge}d`} />
          <StatCard label="90th Percentile" value={`${stageData.p90Age}d`} />
          <StatCard
            label="Over SLA %"
            value={`${stageData.overSlaPct}%`}
            deltaType={stageData.overSlaPct > 20 ? "negative" : "positive"}
          />
        </DashboardGrid>
        <AgingHeatmap
          data={{ [stage]: stageData.aging } as any}
          stages={[stage]}
        />
      </div>

      {/* Section 3: Motion & Throughput */}
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

      {/* Section 4: Readiness Gates */}
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

      {/* Section 5: Risk + Priority Queue */}
      <div className="space-y-4">
        <SectionHeader title="Priority Queue" subtitle="Cases needing attention, sorted by urgency" />
        <DataTable
          columns={columns}
          data={stageData.priorityQueue}
          keyField="id"
          onRowClick={(row) => navigate(`/case/${row.id}`)}
          maxRows={20}
        />
      </div>
    </div>
  );
}
