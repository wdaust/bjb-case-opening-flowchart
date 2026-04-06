import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../utils/cn';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import { MATTERS_ID, OPEN_LIT_ID, STATS_ID, TIMING_ID } from '../data/sfReportIds';
import {
  getDashMetric,
  getTimingCompliance,
  compliancePct,
  complianceColor,
  fmtNum,
  fmt$,
} from '../utils/sfHelpers';

// ── Types ───────────────────────────────────────────────────────────
interface StageRow {
  stage: string;
  open: number;
  closed: number;
  recordCount: number;
}

interface OpenLitRow {
  name: string;
  cases: number;
  avgAge: number;
  caseRating: number;
  trueValue: number;
  maxOffer: number;
}

// ── Loading skeleton ────────────────────────────────────────────────
function InventoryHealthSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Skeleton className="h-4 w-48 mb-2" />
      <DashboardGrid cols={4}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </DashboardGrid>
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
}

// ── Timing compliance titles ────────────────────────────────────────
const TIMING_LABELS = [
  { label: 'Complaint Filing', title: 'Complaint Timing NJ' },
  { label: 'Form A', title: 'Form A Timing NJ in Days from Answer' },
  { label: 'Form C', title: 'Form C Timing NJ in Days from Answer' },
  { label: 'Depositions', title: 'Dep Timing NJ in Days from Form A' },
] as const;

// ── Component ───────────────────────────────────────────────────────
export default function InventoryHealth() {
  const navigate = useNavigate();

  // ── Data fetching ───────────────────────────────────────────────
  const { data: mattersData, loading: mattersLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: MATTERS_ID, type: 'report' });
  const { data: openLitData, loading: openLitLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: OPEN_LIT_ID, type: 'report' });
  const { data: statsData, loading: statsLoading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });
  const { data: timingData, loading: timingLoading } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });

  const loading = mattersLoading || openLitLoading || statsLoading || timingLoading;

  if (loading) return <InventoryHealthSkeleton />;

  // ── StatCard values ─────────────────────────────────────────────
  const openInventory =
    openLitData?.grandTotals?.find(a => a.label === 'Record Count')?.value ?? 0;
  const missingTrackers = getDashMetric(statsData, 'Missing Trackers');
  const missingAnswers = getDashMetric(statsData, 'Missing Answers');

  // Overall compliance: average of 4 timing percentages
  const timingCompliances = TIMING_LABELS.map(t => getTimingCompliance(timingData, t.title));
  const overallCompliance =
    timingCompliances.length > 0
      ? Math.round(
          timingCompliances.reduce((sum, c) => sum + compliancePct(c), 0) /
            timingCompliances.length,
        )
      : 0;

  // ── Tab 1: Stage Inventory rows ─────────────────────────────────
  const stageRows: StageRow[] = (mattersData?.groupings ?? []).map(g => ({
    stage: g.label,
    recordCount: g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0,
    open: g.aggregates.find(a => a.label === 'Open')?.value ?? 0,
    closed: g.aggregates.find(a => a.label === 'Closed')?.value ?? 0,
  }));

  const stageColumns: Column<StageRow>[] = [
    { key: 'stage', label: 'Stage' },
    { key: 'open', label: 'Open', render: (r: StageRow) => fmtNum(r.open) },
    { key: 'closed', label: 'Closed', render: (r: StageRow) => fmtNum(r.closed) },
    { key: 'recordCount', label: 'Total', render: (r: StageRow) => fmtNum(r.recordCount) },
  ];

  // ── Tab 4: Open Lit by Attorney ────────────────────────────────
  const openLitRows: OpenLitRow[] = (openLitData?.groupings ?? [])
    .filter(g => g.label !== 'Micronetbd User')
    .map(g => {
      const agg = (label: string) => g.aggregates.find(a => a.label === label)?.value ?? 0;
      return {
        name: g.label,
        cases: agg('Record Count'),
        avgAge: agg('Avg Age in Litigation'),
        caseRating: agg('Case Rating Midpoint'),
        trueValue: agg('Historical True Value'),
        maxOffer: agg('Max Negotiation Offer'),
      };
    })
    .sort((a, b) => b.cases - a.cases);

  const openLitColumns: Column<OpenLitRow>[] = [
    { key: 'name', label: 'Attorney' },
    { key: 'cases', label: 'Open Matters', render: (r) => fmtNum(r.cases) },
    { key: 'avgAge', label: 'Avg Age (days)', render: (r) => r.avgAge.toFixed(1) },
    { key: 'caseRating', label: 'Case Rating', render: (r) => fmt$(r.caseRating) },
    { key: 'trueValue', label: 'True Value', render: (r) => fmt$(r.trueValue) },
    { key: 'maxOffer', label: 'Max Offer', render: (r) => fmt$(r.maxOffer) },
  ];

  // ── Tab 2: Compliance signals ───────────────────────────────────
  const negotiations = getDashMetric(statsData, 'Negotiations');
  const complaintFiling = getDashMetric(statsData, 'Complaint Filing');

  // ── Tab 3: Risk indicators ─────────────────────────────────────
  const noService35 = getDashMetric(statsData, 'No Service 35+');

  const riskIndicators = [
    { label: 'Missing Trackers', value: missingTrackers },
    { label: 'No Service 35+', value: noService35 },
    { label: 'Missing Answers', value: missingAnswers },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: 'Control Tower', path: '/control-tower' },
          { label: 'Inventory Health' },
        ]}
      />

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <SectionHeader
        title="KPI Cards"
        subtitle=""
        info="Open inventory total, missing tracker and answer counts, and overall compliance percentage."
      />
      <DashboardGrid cols={4}>
        <StatCard label="Open Inventory" value={fmtNum(openInventory as number)} />
        <StatCard
          label="Missing Trackers"
          value={missingTrackers != null ? fmtNum(missingTrackers) : '\u2014'}
          deltaType={missingTrackers && missingTrackers > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          label="Missing Answers"
          value={missingAnswers != null ? fmtNum(missingAnswers) : '\u2014'}
          deltaType={missingAnswers && missingAnswers > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          label="Overall Compliance"
          value={`${overallCompliance}%`}
          deltaType={overallCompliance >= 50 ? 'positive' : 'negative'}
        />
      </DashboardGrid>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <Tabs defaultValue="stage-inventory">
        <TabsList>
          <TabsTrigger value="stage-inventory">Stage Inventory</TabsTrigger>
          <TabsTrigger value="compliance-signals">Compliance Signals</TabsTrigger>
          <TabsTrigger value="risk-indicators">Risk Indicators</TabsTrigger>
          <TabsTrigger value="open-lit-attorney">Open Lit by Attorney</TabsTrigger>
        </TabsList>

        {/* Tab 1: Stage Inventory */}
        <TabsContent value="stage-inventory" className="space-y-4 pt-4">
          <SectionHeader
            title="Stage Inventory"
            subtitle="Matters grouped by litigation stage"
            info="Matter counts by stage showing open, closed, and total for each litigation stage."
          />
          <DataTable data={stageRows} columns={stageColumns} keyField="stage" />
        </TabsContent>

        {/* Tab 2: Compliance Signals */}
        <TabsContent value="compliance-signals" className="space-y-6 pt-4">
          <SectionHeader
            title="Timing Compliance"
            subtitle="NJ timing compliance across key milestones"
            info="Timing compliance rates plus operational metrics for negotiations and complaint filing."
          />
          <DashboardGrid cols={4}>
            {TIMING_LABELS.map(({ label, title }) => {
              const data = getTimingCompliance(timingData, title);
              const p = compliancePct(data);
              return (
                <div
                  key={label}
                  className={cn('rounded-xl border p-5 text-center', complianceColor(p))}
                >
                  <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                  <p className="text-4xl font-bold">{p}%</p>
                  <p className="text-[11px] mt-1 opacity-60">
                    {fmtNum(data.timely)} timely / {fmtNum(data.timely + data.late)} total
                  </p>
                </div>
              );
            })}
          </DashboardGrid>

          <SectionHeader title="Additional Metrics" subtitle="" />
          <DashboardGrid cols={2}>
            <StatCard
              label="Negotiations"
              value={negotiations != null ? fmtNum(negotiations) : '\u2014'}
            />
            <StatCard
              label="Complaint Filing"
              value={complaintFiling != null ? fmtNum(complaintFiling) : '\u2014'}
            />
          </DashboardGrid>
        </TabsContent>

        {/* Tab 3: Risk Indicators */}
        <TabsContent value="risk-indicators" className="space-y-4 pt-4">
          <SectionHeader
            title="Risk Indicators"
            subtitle="Metrics that signal operational risk"
            info="Counts of matters with missing trackers, overdue service, and missing answers requiring attention."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {riskIndicators.map(({ label, value }) => {
              const isRed = value != null && value > 0;
              return (
                <div
                  key={label}
                  className={cn(
                    'rounded-xl border-l-4 border bg-white/[0.04] p-5',
                    isRed
                      ? 'border-l-red-500 border-red-500/30'
                      : 'border-l-green-500 border-green-500/30',
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                  <p
                    className={cn(
                      'text-3xl font-bold',
                      isRed ? 'text-red-400' : 'text-green-400',
                    )}
                  >
                    {value != null ? fmtNum(value) : '\u2014'}
                  </p>
                </div>
              );
            })}
          </div>
        </TabsContent>
        {/* Tab 4: Open Lit by Attorney */}
        <TabsContent value="open-lit-attorney" className="space-y-4 pt-4">
          <SectionHeader
            title="Open Lit by Attorney"
            subtitle="Open litigation matters grouped by attorney"
            info="Attorney-level breakdown of open cases, average age, case ratings, true value, and max negotiation offers."
          />
          <DataTable
            data={openLitRows}
            columns={openLitColumns}
            keyField="name"
            onRowClick={(row) => navigate(`/attorney/${encodeURIComponent(row.name)}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
