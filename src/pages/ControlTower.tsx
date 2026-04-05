import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptimusIntro } from '../components/OptimusIntro';
import { cn } from '../utils/cn';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DataTable, type Column } from '../components/dashboard/DataTable';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { HeroSummaryTicker } from '../components/dashboard/HeroSummaryTicker';
import { ControlTowerSkeleton } from '../components/dashboard/ControlTowerSkeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { saveMetricSnapshots, useMetricHistory, detectAnomaly } from '../hooks/useMetricHistory';
import { ScoreGauge } from '../components/scoring/ScoreGauge';
import { LCIBadge } from '../components/dashboard/LCIBadge';
import { computeRealLCI } from '../data/lciEngineReal';
import { RefreshCw } from 'lucide-react';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { fmt$, fmtNum, getDashMetric, getDashRows, getTimingCompliance, compliancePct, complianceColor } from '../utils/sfHelpers';

// ── Report IDs ────────────────────────────────────────────────────────
const MATTERS_ID     = '00OPp000003OaGjMAK';
const RESOLUTIONS_ID = '00OPp000003OOCLMA4';
const STATS_ID       = '01ZPp0000015Ug1MAE';
const TIMING_ID      = '01ZPp0000015dGHMAY';
const DISCOVERY_ID   = '00OPp000003OUcjMAG';
const EXPERTS_ID     = '00OPp000003PLtxMAG';

// ── Palette ───────────────────────────────────────────────────────────
const GREEN = '#22c55e';
const AMBER = '#f59e0b';
const RED   = '#ef4444';
const PINK  = '#ec4899';
const INDIGO = '#6366f1';

const tooltipStyle = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(var(--foreground))' },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

const hoverCard = "transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20";

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Attorney row type ─────────────────────────────────────────────────
interface AttorneyRow {
  name: string;
  cases: number;
  settlement: number;
  avgSettlement: number;
  netFee: number;
  feePercent: number;
}

// ── Band helpers ──────────────────────────────────────────────────────
function bandBadgeClasses(band: string) {
  if (band === 'green') return 'bg-green-500/20 text-green-400';
  if (band === 'amber') return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

// ── Main Component ────────────────────────────────────────────────────
export default function ControlTower() {
  const [introPlayed, setIntroPlayed] = useState(
    () => sessionStorage.getItem('optimus-intro-played') === 'true',
  );

  const handleIntroComplete = () => {
    sessionStorage.setItem('optimus-intro-played', 'true');
    setIntroPlayed(true);
  };

  // ── Load all 6 reports in parallel ────────────────────────────────
  const { data: mattersData, loading: mattersLoading, lastFetched: mattersTs, refresh: refreshMatters } =
    useSalesforceReport<ReportSummaryResponse>({ id: MATTERS_ID, type: 'report' });
  const { data: resData, loading: resLoading, lastFetched: resTs, refresh: refreshRes } =
    useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report' });
  const { data: statsData, loading: statsLoading, lastFetched: statsTs, refresh: refreshStats } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });
  const { data: timingData, loading: timingLoading, lastFetched: timingTs, refresh: refreshTiming } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });
  const { data: discData, loading: discLoading, lastFetched: discTs, refresh: refreshDisc } =
    useSalesforceReport<ReportSummaryResponse>({ id: DISCOVERY_ID, type: 'report' });
  const { data: expertsData, loading: expertsLoading, lastFetched: expertsTs, refresh: refreshExperts } =
    useSalesforceReport<ReportSummaryResponse>({ id: EXPERTS_ID, type: 'report' });

  const allLoading = mattersLoading || resLoading || statsLoading || timingLoading || discLoading || expertsLoading;

  const navigate = useNavigate();

  // ── Metric History (must be before early return — rules of hooks) ────
  useMetricHistory('totalMatters'); // preserve hook call order
  const histOpenMatters      = useMetricHistory('openMatters');
  const histPortfolioValue   = useMetricHistory('portfolioValue');
  const histTotalSettlement  = useMetricHistory('totalSettlement');
  const histNjInventory      = useMetricHistory('njInventory');
  const histMissingTrackers  = useMetricHistory('missingTrackers');
  const histNoService35      = useMetricHistory('noService35');
  const histMissingAnswers   = useMetricHistory('missingAnswers');
  const histDedExtensions    = useMetricHistory('dedExtensions');
  const histNjResolutions    = useMetricHistory('njResolutions');
  const histTotalResolved    = useMetricHistory('totalResolved');
  const histTotalNetFee      = useMetricHistory('totalNetFee');

  // ── Section 1: Hero KPIs from Matters Universe + Resolutions + Stats ──
  const totalMatters = (mattersData?.grandTotals.find(g => g.label === 'Record Count')?.value ?? 0) as number;
  const openMatters = (mattersData?.grandTotals.find(g => g.label === 'Open')?.value ?? 0) as number;
  const closedMatters = (mattersData?.grandTotals.find(g => g.label === 'Closed')?.value ?? 0) as number;

  const topOpenStages = useMemo(() => {
    if (!mattersData) return [];
    return mattersData.groupings
      .filter(g => g.label !== 'No Stage')
      .map(g => ({ label: g.label, open: (g.aggregates.find(a => a.label === 'Open')?.value ?? 0) as number }))
      .sort((a, b) => b.open - a.open)
      .slice(0, 3);
  }, [mattersData]);

  const njInventory = getDashMetric(statsData, 'NJ Lit Inventory') ?? 0;
  const portfolioValue = getDashMetric(statsData, 'NJ Lit Inventory (Value)') ?? 0;
  const totalSettlement = (resData?.grandTotals.find(g => g.label.includes('Settlement'))?.value ?? 0) as number;
  const totalResolved = (resData?.grandTotals.find(g => g.label === 'Record Count')?.value ?? 0) as number;
  const totalNetFee = (resData?.grandTotals.find(g => g.label.includes('Fee'))?.value ?? 0) as number;

  // ── LCI Computation ─────────────────────────────────────────────────
  const lci = useMemo(
    () => computeRealLCI({ resData, statsData, timingData, discData, expertsData }),
    [resData, statsData, timingData, discData, expertsData],
  );

  // ── Section 2: Inventory by Stage ───────────────────────────────────
  const pipeline = useMemo(() => {
    if (!mattersData) return [];
    return mattersData.groupings
      .filter(g => g.label !== 'No Stage')
      .map(g => {
        const total = (g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0) as number;
        const open = (g.aggregates.find(a => a.label === 'Open')?.value ?? 0) as number;
        const closed = (g.aggregates.find(a => a.label === 'Closed')?.value ?? 0) as number;
        return { stage: g.label, total, open, closed };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [mattersData]);

  // ── Section 3 & 4: NJ Ops metrics ──────────────────────────────────
  const missingTrackers = getDashMetric(statsData, 'Missing Discovery Trackers (NJ)') ?? 0;
  const serviceGt3d = getDashMetric(statsData, 'NJ- Service Initiated >3 Days from COMP') ?? 0;
  const noService35 = getDashMetric(statsData, 'No Service 35+ Days (NJ)') ?? 0;
  const missingAnswers = getDashMetric(statsData, 'Missing All Ans, No Default (NJ)') ?? 0;

  // Donut data: Negotiations
  const negotiationsData = useMemo(() => {
    const rows = getDashRows(statsData, 'NJ LIT - Negotiations');
    return rows.map(r => {
      const v = r.values[0]?.value ?? 0;
      const lbl = r.label;
      const isHealthy = lbl.toLowerCase().includes('connection within');
      const isWarning = lbl.toLowerCase().includes('attempt within');
      return { name: lbl, value: v, color: isHealthy ? GREEN : isWarning ? AMBER : RED };
    });
  }, [statsData]);

  // Donut data: Complaint Filing
  const complaintFilingData = useMemo(() => {
    const rows = getDashRows(statsData, 'Complaint Filing Dashboard (NJ LIT)');
    return rows.map(r => {
      const v = r.values[0]?.value ?? 0;
      const lbl = r.label;
      const isOverdue = lbl.toLowerCase().includes('overdue');
      return { name: lbl, value: v, color: isOverdue ? RED : lbl.includes('Exception') ? AMBER : GREEN };
    });
  }, [statsData]);

  // Donut data: Form A Past Due
  const formAPastDueData = useMemo(() => {
    const rows = getDashRows(statsData, 'Form A Past Due (NJ)');
    return rows.map(r => {
      const v = r.values[0]?.value ?? 0;
      const lbl = r.label;
      const isOverdue30 = lbl.includes('30+') || lbl.includes('30-');
      const isOverdue = lbl.toLowerCase().includes('overdue');
      return { name: lbl, value: v, color: isOverdue30 ? RED : isOverdue ? AMBER : GREEN };
    });
  }, [statsData]);

  // Upcoming Events
  const eventsData = useMemo(() => {
    const rows = getDashRows(statsData, 'NJ ARB, MED, SET CONF or Trials');
    return rows.map(r => ({
      name: r.label,
      count: r.values[0]?.value ?? 0,
      value: r.values[1]?.value ?? 0,
    }));
  }, [statsData]);

  // ── Timing Compliance ──────────────────────────────────────────────
  const complaint = getTimingCompliance(timingData, 'Complaint Timing NJ');
  const formA = getTimingCompliance(timingData, 'Form A Timing NJ in Days from Answer');
  const formC = getTimingCompliance(timingData, 'Form C Timing NJ in Days from Answer');
  const deps = getTimingCompliance(timingData, 'Dep Timing NJ in Days from Form A');

  const dedExtensions = getDashMetric(timingData, 'DED Extensions') ?? 0;
  const njResolutions = getDashMetric(timingData, 'NJ Resolutions') ?? 0;

  // Complaint timing in days
  const complaintDaysRows = getDashRows(timingData, 'Complaint Timing NJ in Days');
  const complaintTimelyDays = complaintDaysRows.find(r => r.label.toLowerCase().includes('timely'))?.values[0]?.value ?? 0;
  const complaintLateDays = complaintDaysRows.find(r => r.label.toLowerCase().includes('late'))?.values[0]?.value ?? 0;

  // ── Timing Bar Data (Section 8) ─────────────────────────────────────
  const timingBarData = [
    { name: 'Complaint', timely: complaint.timely, late: complaint.late },
    { name: 'Form A', timely: formA.timely, late: formA.late },
    { name: 'Form C', timely: formC.timely, late: formC.late },
    { name: 'Deps', timely: deps.timely, late: deps.late },
  ];
  const overallCompliancePct = Math.round(
    [complaint, formA, formC, deps].reduce((s, c) => s + compliancePct(c), 0) / 4
  );

  // ── Resolution Performance ──────────────────────────────────────────
  const attorneys: AttorneyRow[] = useMemo(() => {
    if (!resData) return [];
    return resData.groupings.map(g => {
      const cases = (g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0) as number;
      const settlement = (g.aggregates.find(a => a.label.includes('Settlement'))?.value ?? 0) as number;
      const netFee = (g.aggregates.find(a => a.label.includes('Fee'))?.value ?? 0) as number;
      return {
        name: g.label,
        cases,
        settlement,
        avgSettlement: cases ? settlement / cases : 0,
        netFee,
        feePercent: settlement ? (netFee / settlement) * 100 : 0,
      };
    }).sort((a, b) => b.settlement - a.settlement);
  }, [resData]);

  const top15Attorneys = attorneys.slice(0, 15);
  const attorneyCount = attorneys.length;
  const feeRatio = totalSettlement ? ((totalNetFee / totalSettlement) * 100).toFixed(1) : '0';

  const attorneyColumns: Column<AttorneyRow>[] = [
    { key: 'name', label: 'Attorney', sortable: true },
    { key: 'cases', label: 'Cases', sortable: true, render: r => fmtNum(r.cases), className: 'text-right' },
    { key: 'settlement', label: 'Settlement', sortable: true, render: r => fmt$(r.settlement), className: 'text-right' },
    { key: 'avgSettlement', label: 'Avg/Case', sortable: true, render: r => fmt$(r.avgSettlement), className: 'text-right' },
    { key: 'netFee', label: 'Net Fee', sortable: true, render: r => fmt$(r.netFee), className: 'text-right' },
    { key: 'feePercent', label: 'Fee %', sortable: true, render: r => `${r.feePercent.toFixed(1)}%`, className: 'text-right' },
  ];

  // ── Workload Distribution (top 8 for compact bars) ──────────────────
  const discoveryTop15 = useMemo(() => {
    if (!discData) return [];
    return discData.groupings
      .map(g => ({ name: g.label, count: (g.aggregates[0]?.value ?? 0) as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [discData]);

  const discTotal = (discData?.grandTotals[0]?.value ?? 0) as number;
  const discTop8 = discoveryTop15.slice(0, 8);

  const expertsTop15 = useMemo(() => {
    if (!expertsData) return [];
    return expertsData.groupings
      .map(g => ({ name: g.label, count: (g.aggregates[0]?.value ?? 0) as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [expertsData]);

  const expertsTotal = (expertsData?.grandTotals[0]?.value ?? 0) as number;
  const expertsTop8 = expertsTop15.slice(0, 8);

  // ── Refresh all reports ───────────────────────────────────────────
  const refreshAll = () => {
    refreshMatters();
    refreshRes();
    refreshStats();
    refreshTiming();
    refreshDisc();
    refreshExperts();
  };

  // ── Save daily metric snapshots ─────────────────────────────────
  useEffect(() => {
    if (allLoading) return;
    saveMetricSnapshots({
      totalMatters, openMatters, closedMatters, portfolioValue, njInventory,
      totalSettlement, totalResolved, totalNetFee,
      missingTrackers, serviceGt3d, noService35, missingAnswers,
      dedExtensions, njResolutions,
      complaintPct: compliancePct(complaint),
      formAPct: compliancePct(formA),
      formCPct: compliancePct(formC),
      depsPct: compliancePct(deps),
    });
  }, [allLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Anomaly detection ──────────────────────────────────────────────
  const anomOpenMatters     = detectAnomaly(histOpenMatters, openMatters);
  const anomPortfolioValue  = detectAnomaly(histPortfolioValue, portfolioValue);
  const anomTotalSettlement = detectAnomaly(histTotalSettlement, totalSettlement);
  const anomNjInventory     = detectAnomaly(histNjInventory, njInventory);
  const anomMissingTrackers = detectAnomaly(histMissingTrackers, missingTrackers);
  const anomNoService35     = detectAnomaly(histNoService35, noService35);
  const anomMissingAnswers  = detectAnomaly(histMissingAnswers, missingAnswers);
  const anomDedExtensions   = detectAnomaly(histDedExtensions, dedExtensions);
  const anomNjResolutions   = detectAnomaly(histNjResolutions, njResolutions);
  const anomTotalResolved   = detectAnomaly(histTotalResolved, totalResolved);
  const anomTotalNetFee     = detectAnomaly(histTotalNetFee, totalNetFee);

  // ── Loading state ─────────────────────────────────────────────────
  if (allLoading) {
    return (
      <>
        {!introPlayed && <OptimusIntro onComplete={handleIntroComplete} />}
        <ControlTowerSkeleton />
      </>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {!introPlayed && <OptimusIntro onComplete={handleIntroComplete} />}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: Hero + LCI Gauge + 3 KPI Cards
          ═══════════════════════════════════════════════════════════════ */}
      <HeroSection>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <HeroTitle title="Optimus Control Tower" subtitle="Firm-Wide Command Center" />
          <HeroSummaryTicker
            items={[
              { label: 'matters', value: fmtNum(totalMatters) },
              { label: 'open', value: fmtNum(openMatters) },
              { label: 'settlements', value: fmt$(totalSettlement) },
            ]}
          />
        </div>

        <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <DashboardGrid cols={4}>
            {/* LCI Gauge Card */}
            <div
              className={cn(
                "rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-5 cursor-pointer border-t-2 border-t-green-500",
                "animate-pulse-glow",
                hoverCard,
              )}
              onClick={() => navigate('/lci-report')}
            >
              <p className="text-xs font-medium text-muted-foreground mb-2">Litigation Control Index</p>
              <div className="flex items-center gap-3">
                <ScoreGauge score={lci.score} maxScore={100} size={90} label="LCI" />
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-bold text-foreground">{Math.round(lci.score)}</span>
                  <LCIBadge score={Math.round(lci.score)} size="sm" />
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full w-fit', bandBadgeClasses(lci.band))}>
                    {lci.band === 'green' ? 'Healthy' : lci.band === 'amber' ? 'Watch' : 'Critical'}
                  </span>
                </div>
              </div>
            </div>

            <StatCard
              label="Open Inventory"
              value={fmtNum(openMatters)}
              variant="glass"
              className={hoverCard}
              sparklineData={histOpenMatters}
              anomaly={anomOpenMatters ?? undefined}
              subMetrics={[
                ...topOpenStages.map(s => ({
                  label: s.label,
                  value: fmtNum(s.open),
                  deltaType: "neutral" as const,
                })),
                { label: "NJ Lit", value: fmtNum(njInventory), deltaType: "neutral" as const },
              ]}
            />
            <StatCard
              label="Portfolio Value"
              value={fmt$(portfolioValue)}
              variant="glass"
              className={hoverCard}
              sparklineData={histPortfolioValue}
              anomaly={anomPortfolioValue ?? undefined}
              subMetrics={[
                { label: "NJ Lit count", value: fmtNum(njInventory), deltaType: "neutral" },
                { label: "Total Matters", value: fmtNum(totalMatters), deltaType: "neutral" },
              ]}
            />
            <StatCard
              label="Settlement Revenue"
              value={fmt$(totalSettlement)}
              variant="glass"
              className={hoverCard}
              sparklineData={histTotalSettlement}
              anomaly={anomTotalSettlement ?? undefined}
              subMetrics={[
                { label: "Resolved", value: fmtNum(totalResolved), deltaType: "neutral" },
                { label: "Net fees", value: fmt$(totalNetFee), deltaType: "neutral" },
              ]}
            />
          </DashboardGrid>
        </div>
      </HeroSection>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: Inventory by Stage (horizontal stacked bar)
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Inventory by Stage" subtitle="Open vs Closed volume across pipeline stages" />
        <div className={cn("bg-white/[0.04] border border-white/[0.08] rounded-xl p-5", hoverCard)}>
          <ResponsiveContainer width="100%" height={Math.max(400, pipeline.length * 32)}>
            <BarChart data={pipeline} layout="vertical" margin={{ left: 160, right: 30, top: 10, bottom: 10 }}>
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} width={150} />
              <RechartsTooltip {...tooltipStyle} />
              <Bar dataKey="open" stackId="a" fill={AMBER} name="Open" cursor="pointer" onClick={(_d: unknown, idx: number) => { const stage = pipeline[idx]?.stage; if (stage) navigate(`/stage/${encodeURIComponent(stage)}`); }} />
              <Bar dataKey="closed" stackId="a" fill={GREEN} name="Closed" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(_d: unknown, idx: number) => { const stage = pipeline[idx]?.stage; if (stage) navigate(`/stage/${encodeURIComponent(stage)}`); }} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
            <LegendDot color={AMBER} label="Open" />
            <LegendDot color={GREEN} label="Closed" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: NJ Operations Velocity (4 cards)
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="NJ Operations Velocity" subtitle="Key operational metrics for NJ litigation pipeline" />
        <DashboardGrid cols={4}>
          <StatCard label="NJ Lit Inventory" value={fmtNum(njInventory)} deltaType="neutral" className={hoverCard} sparklineData={histNjInventory} anomaly={anomNjInventory ?? undefined} />
          <StatCard
            label="Missing Disc. Trackers"
            value={missingTrackers}
            deltaType={missingTrackers <= 5 ? "positive" : "negative"}
            delta={missingTrackers <= 5 ? "low" : "needs attention"}
            className={hoverCard}
            sparklineData={histMissingTrackers}
            anomaly={anomMissingTrackers ?? undefined}
          />
          <StatCard
            label="Service >3d from COMP"
            value={serviceGt3d}
            deltaType={serviceGt3d > 20 ? "negative" : "neutral"}
            className={hoverCard}
          />
          <StatCard
            label="No Service 35+ Days"
            value={noService35}
            deltaType="negative"
            className={hoverCard}
            sparklineData={histNoService35}
            anomaly={anomNoService35 ?? undefined}
          />
        </DashboardGrid>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: Risk Signals (4 cards)
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Risk Signals" subtitle="Items requiring attention across compliance and operations" />
        <DashboardGrid cols={4}>
          <StatCard
            label="Missing Answers"
            value={missingAnswers}
            deltaType="negative"
            className={hoverCard}
            sparklineData={histMissingAnswers}
            anomaly={anomMissingAnswers ?? undefined}
          />
          <StatCard label="DED Extensions" value={fmtNum(dedExtensions)} deltaType="neutral" className={hoverCard} sparklineData={histDedExtensions} anomaly={anomDedExtensions ?? undefined} />
          <StatCard label="NJ Resolutions" value={fmtNum(njResolutions)} deltaType="neutral" className={hoverCard} sparklineData={histNjResolutions} anomaly={anomNjResolutions ?? undefined} />
          <StatCard
            label="Complaint Avg Days"
            value={`${complaintTimelyDays}d`}
            delta={`${complaintLateDays}d when late`}
            deltaType="negative"
            className={hoverCard}
            subMetrics={[
              { label: "Timely avg", value: `${complaintTimelyDays}d`, deltaType: "positive" },
              { label: "Late avg", value: `${complaintLateDays}d`, deltaType: "negative" },
            ]}
          />
        </DashboardGrid>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: NJ Operations Analytics (3 compact donuts)
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="NJ Operations Analytics" subtitle="Negotiations, complaint filing, and form A compliance" />
        <DashboardGrid cols={3}>
          {/* Negotiations donut — compact layout */}
          {(() => {
            const total = negotiationsData.reduce((s, d) => s + d.value, 0);
            return (
              <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
                <div className="text-sm font-semibold text-foreground">NJ LIT — Negotiations</div>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(total)} total matters</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-3xl font-bold text-foreground">{fmtNum(total)}</span>
                  <div className="h-[140px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={negotiationsData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" stroke="none" paddingAngle={1}>
                          {negotiationsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {negotiationsData.map(d => <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
                </div>
              </div>
            );
          })()}

          {/* Complaint Filing donut — compact layout */}
          {(() => {
            const total = complaintFilingData.reduce((s, d) => s + d.value, 0);
            return (
              <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
                <div className="text-sm font-semibold text-foreground">Complaint Filing (NJ LIT)</div>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(total)} total</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-3xl font-bold text-foreground">{fmtNum(total)}</span>
                  <div className="h-[140px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={complaintFilingData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" stroke="none" paddingAngle={1}>
                          {complaintFilingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {complaintFilingData.map(d => <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
                </div>
              </div>
            );
          })()}

          {/* Form A Past Due donut — compact layout */}
          {(() => {
            const total = formAPastDueData.reduce((s, d) => s + d.value, 0);
            return (
              <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
                <div className="text-sm font-semibold text-foreground">Form A Past Due (NJ)</div>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(total)} total</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-3xl font-bold text-foreground">{fmtNum(total)}</span>
                  <div className="h-[140px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={formAPastDueData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" stroke="none" paddingAngle={1}>
                          {formAPastDueData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formAPastDueData.map(d => <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
                </div>
              </div>
            );
          })()}
        </DashboardGrid>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: Events (conditional)
          ═══════════════════════════════════════════════════════════════ */}
      {eventsData.length > 0 && (
        <section>
          <SectionHeader title="Upcoming Events" subtitle="ARB, MED, SET CONF, and Trials" />
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventsData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="count" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="value" orientation="right" tickFormatter={v => fmt$(v)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <RechartsTooltip {...tooltipStyle} formatter={((v: number | undefined, name?: string) => (name === 'value' ? fmt$(v ?? 0) : fmtNum(v ?? 0))) as never} />
                <Bar yAxisId="count" dataKey="count" fill={INDIGO} name="Cases" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar yAxisId="value" dataKey="value" fill={GREEN} name="Value" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <LegendDot color={INDIGO} label="Cases" />
              <LegendDot color={GREEN} label="Portfolio Value" />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7: Timing Compliance (4 colored % cards)
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Timing Compliance" subtitle="NJ PI — percentage meeting compliance windows" />
        <DashboardGrid cols={4}>
          {([
            { label: 'Complaint Filing', data: complaint },
            { label: 'Form A', data: formA },
            { label: 'Form C', data: formC },
            { label: 'Depositions', data: deps },
          ] as const).map(({ label, data }) => {
            const p = compliancePct(data);
            return (
              <div key={label} className={cn('rounded-xl border p-5 text-center', complianceColor(p), hoverCard)}>
                <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                <p className="text-4xl font-bold">{p}%</p>
                <p className="text-[11px] mt-1 opacity-60">
                  {fmtNum(data.timely)} timely / {fmtNum(data.timely + data.late)} total
                </p>
              </div>
            );
          })}
        </DashboardGrid>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8: Operational Analytics (3-col compact bars)
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Operational Analytics" subtitle="Timing breakdown, discovery trackers, and expert coverage" />
        <DashboardGrid cols={3}>
          {/* Timing Compliance Breakdown */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Timing Compliance Breakdown</div>
            <p className="text-xs text-muted-foreground mt-0.5">Timely vs Late across milestones</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-3xl font-bold text-foreground">{overallCompliancePct}%</span>
              <div className="h-[140px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timingBarData} layout="vertical" margin={{ left: 60, right: 10, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} width={55} axisLine={false} tickLine={false} />
                    <RechartsTooltip {...tooltipStyle} />
                    <Bar dataKey="timely" stackId="a" fill={GREEN} name="Timely" />
                    <Bar dataKey="late" stackId="a" fill={RED} name="Late" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <LegendDot color={GREEN} label="Timely" />
              <LegendDot color={RED} label="Late" />
            </div>
          </div>

          {/* Discovery Trackers */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Discovery Trackers</div>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(discTotal)} total across {discData?.groupings.length ?? 0} owners</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-3xl font-bold text-foreground">{fmtNum(discTotal)}</span>
              <div className="h-[140px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={discTop8} layout="vertical" margin={{ left: 60, right: 10, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} width={55} axisLine={false} tickLine={false} />
                    <RechartsTooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill={INDIGO} radius={[0, 3, 3, 0]} cursor="pointer" onClick={(_d: unknown, idx: number) => { const name = discTop8[idx]?.name; if (name) navigate(`/attorney/${encodeURIComponent(name)}`); }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Experts Not Served */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Experts Not Served</div>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtNum(expertsTotal)} total across {expertsData?.groupings.length ?? 0} owners</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-3xl font-bold text-foreground">{fmtNum(expertsTotal)}</span>
              <div className="h-[140px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expertsTop8} layout="vertical" margin={{ left: 60, right: 10, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} width={55} axisLine={false} tickLine={false} />
                    <RechartsTooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill={PINK} radius={[0, 3, 3, 0]} cursor="pointer" onClick={(_d: unknown, idx: number) => { const name = expertsTop8[idx]?.name; if (name) navigate(`/attorney/${encodeURIComponent(name)}`); }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </DashboardGrid>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 9: Resolution Performance
          ═══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Resolution Performance" subtitle="Settlement outcomes across all attorneys" />

        <DashboardGrid cols={4}>
          <StatCard label="Total Resolutions" value={fmtNum(totalResolved)} variant="glass" className={hoverCard} sparklineData={histTotalResolved} anomaly={anomTotalResolved ?? undefined} />
          <StatCard label="Settlement Total" value={fmt$(totalSettlement)} variant="glass" className={hoverCard} sparklineData={histTotalSettlement} />
          <StatCard
            label="Net Fees"
            value={fmt$(totalNetFee)}
            delta={`${feeRatio}% fee ratio`}
            deltaType="neutral"
            variant="glass"
            className={hoverCard}
            sparklineData={histTotalNetFee}
            anomaly={anomTotalNetFee ?? undefined}
          />
          <StatCard label="Attorneys" value={attorneyCount} variant="glass" className={hoverCard} />
        </DashboardGrid>

        <div className="mt-4">
          <DataTable
            data={top15Attorneys}
            columns={attorneyColumns}
            keyField="name"
            maxRows={15}
            onRowClick={(row) => navigate(`/attorney/${encodeURIComponent(row.name)}`)}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 10: Data Freshness Footer
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="flex items-center justify-between border-t border-border pt-4 pb-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Matters', ts: mattersTs },
            { label: 'Resolutions', ts: resTs },
            { label: 'Stats', ts: statsTs },
            { label: 'Timing', ts: timingTs },
            { label: 'Discovery', ts: discTs },
            { label: 'Experts', ts: expertsTs },
          ].map(({ label, ts }) => (
            <span key={label}>
              <span className="font-medium">{label}:</span>{' '}
              {ts ? (ts === 'static export' ? 'static' : new Date(ts).toLocaleTimeString()) : '—'}
            </span>
          ))}
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-accent transition-colors text-foreground text-xs font-medium"
        >
          <RefreshCw size={12} />
          Refresh All
        </button>
      </footer>
    </div>
  );
}
