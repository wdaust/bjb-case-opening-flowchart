import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { STATS_ID, TIMING_ID, MATTERS_ID } from '../data/sfReportIds';
import type { DashboardResponse, ReportSummaryResponse } from '../types/salesforce';
import {
  getDashMetric, getDashRows, getTimingCompliance,
  compliancePct, complianceColor, fmtNum,
} from '../utils/sfHelpers';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

// ── Palette ──────────────────────────────────────────────────────────
const STAGE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#ef4444', '#f59e0b', '#ec4899'];
const EVENT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
const FORM_A_COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
};

// ── Skeleton ─────────────────────────────────────────────────────────
function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/50 ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <SkeletonBlock className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32" />
        ))}
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  );
}

// ── Compliance Card ──────────────────────────────────────────────────
function ComplianceCard({ title, timely, late }: { title: string; timely: number; late: number }) {
  const pct = compliancePct({ timely, late });
  const color = complianceColor(pct);
  const total = timely + late;
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{pct}%</p>
      <p className="text-xs mt-1 opacity-70">
        {fmtNum(timely)} timely / {fmtNum(late)} late ({fmtNum(total)} total)
      </p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export default function TodaysExposure() {
  // Fetch all three data sources
  const { data: statsData, loading: statsLoading } = useSalesforceReport<DashboardResponse>({
    id: STATS_ID,
    type: 'dashboard',
  });
  const { data: timingData, loading: timingLoading } = useSalesforceReport<DashboardResponse>({
    id: TIMING_ID,
    type: 'dashboard',
  });
  const { data: mattersData, loading: mattersLoading } = useSalesforceReport<ReportSummaryResponse>({
    id: MATTERS_ID,
    type: 'report',
  });

  const loading = statsLoading || timingLoading || mattersLoading;

  // ── Stat card values ────────────────────────────────────────────────
  const portfolioValue = mattersData
    ? mattersData.grandTotals?.[0]?.value ?? mattersData.groupings.length
    : null;
  const njInventory = getDashMetric(statsData, 'NJ PI Inventory');
  const dedExtensions = getDashMetric(timingData, 'DED Extensions');
  const njResolutions = getDashMetric(timingData, 'NJ Resolutions');

  // ── Inventory by Stage (from matters groupings) ─────────────────────
  const inventoryByStage = useMemo(() => {
    if (!mattersData?.groupings) return [];
    return mattersData.groupings
      .map(g => {
        const openAgg = g.aggregates.find(a => a.label === 'Open');
        const count = openAgg?.value ?? g.aggregates[0]?.value ?? 0;
        return { stage: g.label, count };
      })
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [mattersData]);

  // ── Events (from stats dashboard) ──────────────────────────────────
  const eventsData = useMemo(() => {
    return getDashRows(statsData, 'Events').map(r => ({
      label: r.label,
      value: r.values[0]?.value ?? 0,
    })).filter(d => d.value > 0);
  }, [statsData]);

  // ── Compliance (from timing dashboard) ─────────────────────────────
  const complaintFiling = useMemo(() => getTimingCompliance(timingData, 'Complaint Filing'), [timingData]);
  const formA = useMemo(() => getTimingCompliance(timingData, 'Form A'), [timingData]);
  const formC = useMemo(() => getTimingCompliance(timingData, 'Form C'), [timingData]);
  const deps = useMemo(() => getTimingCompliance(timingData, 'Deps'), [timingData]);

  // ── Form A Past Due (from stats dashboard) ─────────────────────────
  const formAPastDue = useMemo(() => {
    return getDashRows(statsData, 'Form A Past Due').map(r => ({
      label: r.label,
      value: r.values[0]?.value ?? 0,
    })).filter(d => d.value > 0);
  }, [statsData]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <SectionHeader title="Today's Exposure" subtitle="Portfolio inventory, compliance, and key metrics" info="Portfolio value, NJ inventory count, DED extensions, and NJ resolution totals." />

      {/* Top row -- 4 StatCards */}
      <DashboardGrid cols={4}>
        <StatCard
          label="Portfolio Value"
          value={portfolioValue != null ? fmtNum(portfolioValue) : '--'}
          delta="total record count"
          deltaType="neutral"
        />
        <StatCard
          label="NJ Inventory"
          value={njInventory != null ? fmtNum(njInventory) : '--'}
          delta="NJ PI Inventory"
          deltaType="neutral"
        />
        <StatCard
          label="DED Extensions"
          value={dedExtensions != null ? fmtNum(dedExtensions) : '--'}
          delta="from timing dashboard"
          deltaType="neutral"
        />
        <StatCard
          label="NJ Resolutions"
          value={njResolutions != null ? fmtNum(njResolutions) : '--'}
          delta="from timing dashboard"
          deltaType="positive"
        />
      </DashboardGrid>

      {/* Middle section -- 2-column grid: Inventory by Stage + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by Stage -- vertical bar chart */}
        <div>
          <SectionHeader title="Inventory by Stage" subtitle="Open matters grouped by stage" info="Open matter counts broken down by litigation stage." />
          <div className="rounded-lg border border-border bg-card p-4">
            {inventoryByStage.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={inventoryByStage}>
                  <XAxis
                    dataKey="stage"
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Open" radius={[4, 4, 0, 0]}>
                    {inventoryByStage.map((_, i) => (
                      <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">No stage data available</p>
            )}
          </div>
        </div>

        {/* Events -- horizontal bar chart */}
        <div>
          <SectionHeader title="Events" subtitle="Event counts from stats dashboard" info="Upcoming events (arbitrations, mediations, trials) by category." />
          <div className="rounded-lg border border-border bg-card p-4">
            {eventsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={eventsData} layout="vertical">
                  <XAxis
                    type="number"
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={100}
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                    {eventsData.map((_, i) => (
                      <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">No events data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Compliance cards -- 2x2 grid */}
      <SectionHeader title="Timing Compliance" subtitle="On-time performance across key milestones" info="Compliance rates for complaint filing, Form A, Form C, and depositions." />
      <div className="grid grid-cols-2 gap-4">
        <ComplianceCard title="Complaint Filing" timely={complaintFiling.timely} late={complaintFiling.late} />
        <ComplianceCard title="Form A" timely={formA.timely} late={formA.late} />
        <ComplianceCard title="Form C" timely={formC.timely} late={formC.late} />
        <ComplianceCard title="Deps" timely={deps.timely} late={deps.late} />
      </div>

      {/* Form A Past Due breakdown */}
      <SectionHeader title="Form A Past Due" info="Breakdown of Form A matters that are past their due dates." />
      <Tabs defaultValue="form-a-past-due">
        <TabsList>
          <TabsTrigger value="form-a-past-due">Form A Past Due</TabsTrigger>
        </TabsList>
        <TabsContent value="form-a-past-due" className="pt-4">
          <div className="rounded-lg border border-border bg-card p-4">
            {formAPastDue.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={formAPastDue}>
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Past Due" radius={[4, 4, 0, 0]}>
                    {formAPastDue.map((_, i) => (
                      <Cell key={i} fill={FORM_A_COLORS[i % FORM_A_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">No Form A past due data available</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
