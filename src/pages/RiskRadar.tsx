import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { STATS_ID, TIMING_ID } from '../data/sfReportIds';
import type { DashboardResponse } from '../types/salesforce';
import {
  getDashMetric,
  getDashRows,
  getTimingCompliance,
  compliancePct,
  complianceColor,
  fmtNum,
} from '../utils/sfHelpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#8b5cf6'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
};

function ComplianceCard({ title, data }: { title: string; data: DashboardResponse | null }) {
  const c = getTimingCompliance(data, title);
  const pct = compliancePct(c);
  const color = complianceColor(pct);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex items-baseline justify-between">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Timely: <span className="text-card-foreground font-semibold">{fmtNum(c.timely)}</span></p>
          <p>Late: <span className="text-card-foreground font-semibold">{fmtNum(c.late)}</span></p>
        </div>
        <span className={`text-2xl font-bold px-2 py-1 rounded border ${color}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

function PieSection({ title, data }: { title: string; data: DashboardResponse | null }) {
  const rows = getDashRows(data, title);
  const chartData = rows.map((r) => ({
    name: r.label,
    value: r.values[0]?.value ?? 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No data</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {chartData.map((d, i) => (
          <span key={i} className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
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
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function RiskRadar() {
  const {
    data: statsData,
    loading: statsLoading,
  } = useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });

  const {
    data: timingData,
    loading: timingLoading,
  } = useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });

  const loading = statsLoading || timingLoading;

  if (loading && !statsData && !timingData) {
    return <LoadingSkeleton />;
  }

  const missingTrackers = getDashMetric(statsData, 'Missing Trackers');
  const noService35 = getDashMetric(statsData, 'No Service 35+');
  const missingAnswers = getDashMetric(statsData, 'Missing Answers');
  const dedExtensions = getDashMetric(timingData, 'DED Extensions');

  const eventsRows = getDashRows(statsData, 'Events');
  const barData = eventsRows.map((r) => ({
    label: r.label,
    value: r.values[0]?.value ?? 0,
  }));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: 'Control Tower', path: '/control-tower' },
          { label: 'Risk & Deadline Radar' },
        ]}
      />

      <DashboardGrid cols={4}>
        <StatCard label="Missing Trackers" value={missingTrackers != null ? fmtNum(missingTrackers) : '—'} />
        <StatCard label="No Service 35+" value={noService35 != null ? fmtNum(noService35) : '—'} />
        <StatCard label="Missing Answers" value={missingAnswers != null ? fmtNum(missingAnswers) : '—'} />
        <StatCard label="DED Extensions" value={dedExtensions != null ? fmtNum(dedExtensions) : '—'} />
      </DashboardGrid>

      <Tabs defaultValue="compliance">
        <TabsList>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4 pt-4">
          <SectionHeader title="Compliance" subtitle="Timing compliance across case lifecycle" />
          <div className="grid grid-cols-2 gap-4">
            <ComplianceCard title="Complaint Filing Timing" data={timingData} />
            <ComplianceCard title="Form A Timing" data={timingData} />
            <ComplianceCard title="Form C Timing" data={timingData} />
            <ComplianceCard title="Deps Timing" data={timingData} />
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4 pt-4">
          <SectionHeader title="Operational" subtitle="Breakdown of key operational metrics" />
          <div className="grid grid-cols-3 gap-4">
            <PieSection title="Negotiations" data={statsData} />
            <PieSection title="Complaint Filing" data={statsData} />
            <PieSection title="Form A Past Due" data={statsData} />
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4 pt-4">
          <SectionHeader title="Events" subtitle="Event volume by category" />
          {barData.length > 0 ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">No event data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
