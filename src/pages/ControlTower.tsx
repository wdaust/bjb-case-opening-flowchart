import { useMemo, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import {
  getControlTowerData, getActiveCases, getUpcomingDeadlines, stageLabels,
  getTopStageAgeMetrics, getPreLitStageAgeMetrics, parentStageLabels,
  getWeeklyExitsByStage, getOverdueTasksByStage,
  type ParentStage,
} from '../data/mockData';
import type { SubStageCount, Stage } from '../data/mockData';
import { calculateFirmLCI, getEscalations } from '../data/lciEngine';
import { StatCard } from '../components/dashboard/StatCard';
import { StageBar } from '../components/dashboard/StageBar';
import { StageAgeGauges } from '../components/dashboard/StageAgeGauges';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { EscalationBanner } from '../components/dashboard/EscalationBanner';
import { ScoreGauge } from '../components/scoring/ScoreGauge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { ResponsiveSankey } from '@nivo/sankey';
import { nivoTheme } from '../lib/nivoTheme';

// ── Palette ─────────────────────────────────────────────────────────────
// Case type colors (categorical)
const GREEN = '#22c55e';
const VIOLET = '#a78bfa';
const SKY = '#38bdf8';
const PINK = '#f472b6';
const YELLOW = '#facc15';
// Semantic severity colors (good → warning → danger → critical)
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const ROSE = '#e11d48';

const STAGE_COLORS: Record<string, string> = {
  Intake: GREEN,
  'Pre-Litigation': VIOLET,
  Litigation: SKY,
};

const CASE_TYPE_COLORS: Record<string, string> = {
  PI: GREEN,
  'Med Mal': VIOLET,
  'Product Liability': SKY,
  'Premises Liability': PINK,
  'Auto Accident': YELLOW,
  'Wrongful Death': '#fb923c',
};

const SANKEY_COLORS = [GREEN, VIOLET, SKY, PINK, YELLOW, '#fb923c', '#f87171', '#22d3ee', '#818cf8'];

// ── Helpers ────────────────────────────────────────────────────────────
function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function buildSankeyData(activeCases: { caseType: string; parentStage: ParentStage; expectedValue: number }[]) {
  const caseTypeSet = new Set(activeCases.map(c => c.caseType));
  const caseTypes = Array.from(caseTypeSet);
  const stages: ParentStage[] = ['intake', 'pre-lit', 'lit'];

  const nodes = [
    ...stages.map(s => ({ id: parentStageLabels[s], nodeColor: STAGE_COLORS[parentStageLabels[s]] || GREEN })),
    ...caseTypes.map(ct => ({ id: ct, nodeColor: CASE_TYPE_COLORS[ct] || GREEN })),
  ];

  const links: { source: string; target: string; value: number }[] = [];
  for (const ps of stages) {
    for (const ct of caseTypes) {
      const ev = activeCases
        .filter(c => c.caseType === ct && c.parentStage === ps)
        .reduce((s, c) => s + c.expectedValue, 0);
      if (ev > 0) {
        links.push({ source: parentStageLabels[ps], target: ct, value: Math.round(ev / 1_000_000 * 100) / 100 });
      }
    }
  }

  return { nodes, links };
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'hsl(var(--foreground))' },
  itemStyle: { color: 'hsl(var(--muted-foreground))' },
};

const hoverCard = "transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20";

// Reactively detect dark mode from the <html> class toggle
const darkSubscribe = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
};
const darkSnapshot = () => document.documentElement.classList.contains('dark');

export default function ControlTower() {
  const navigate = useNavigate();
  const isDark = useSyncExternalStore(darkSubscribe, darkSnapshot);
  const controlTowerData = getControlTowerData();
  const topStageMetrics = getTopStageAgeMetrics();
  const preLitMetrics = getPreLitStageAgeMetrics();
  const activeCases = useMemo(() => getActiveCases(), []);
  const allDeadlines = useMemo(() => getUpcomingDeadlines(90), []);
  const firmLCI = useMemo(() => calculateFirmLCI(), []);
  const escalations = useMemo(() => getEscalations(), []);

  const formattedEV = `$${(controlTowerData.totalEV / 1_000_000).toFixed(1)}M`;

  // Compute derived metrics
  const preLitCases = activeCases.filter(c => c.parentStage === "pre-lit");
  const litCases = activeCases.filter(c => c.parentStage === "lit");
  const totalAttorneys = new Set(activeCases.map(c => c.attorney)).size;
  const avgPerAttorney = totalAttorneys > 0 ? Math.round(activeCases.length / totalAttorneys) : 0;

  const preLitSla = preLitCases.length > 0
    ? Math.round(preLitCases.filter(c => c.riskFlags.includes("Over SLA")).length / preLitCases.length * 1000) / 10
    : 0;
  const litSla = litCases.length > 0
    ? Math.round(litCases.filter(c => c.riskFlags.includes("Over SLA")).length / litCases.length * 1000) / 10
    : 0;

  const stalledCases = activeCases.filter(c => c.riskFlags.includes("Silent stall"));
  const stall7d = stalledCases.filter(c => {
    const days = Math.ceil((new Date("2026-02-19").getTime() - new Date(c.lastActivityDate).getTime()) / 86400000);
    return days >= 7 && days < 21;
  }).length;
  const stall21d = stalledCases.filter(c => {
    const days = Math.ceil((new Date("2026-02-19").getTime() - new Date(c.lastActivityDate).getTime()) / 86400000);
    return days >= 21;
  }).length;
  const avgStallDays = stalledCases.length > 0
    ? Math.round(stalledCases.reduce((s, c) => s + Math.ceil((new Date("2026-02-19").getTime() - new Date(c.lastActivityDate).getTime()) / 86400000), 0) / stalledCases.length)
    : 0;

  const totalExposure = activeCases.reduce((s, c) => s + c.exposureAmount, 0);
  const avgEvPerCase = activeCases.length > 0 ? Math.round(controlTowerData.totalEV / activeCases.length) : 0;
  const avgEvConfidence = activeCases.length > 0
    ? Math.round(activeCases.reduce((s, c) => s + c.evConfidence, 0) / activeCases.length * 100)
    : 0;

  // Row 2 metrics
  const preLitAvgAge = controlTowerData.stageCounts.find(s => s.parentStage === "pre-lit")?.avgAge ?? 0;
  const litAvgAge = controlTowerData.stageCounts.find(s => s.parentStage === "lit")?.avgAge ?? 0;
  const preLitOver180 = preLitCases.filter(c => {
    const days = Math.ceil((new Date("2026-02-19").getTime() - new Date(c.stageEntryDate).getTime()) / 86400000);
    return days > 180;
  }).length;
  const litOver365 = litCases.filter(c => {
    const days = Math.ceil((new Date("2026-02-19").getTime() - new Date(c.stageEntryDate).getTime()) / 86400000);
    return days > 365;
  }).length;

  const weeklyClosures = Math.round(controlTowerData.closedOut30d / 4.3);
  const conversionRate = preLitCases.length > 0
    ? Math.round(litCases.length / (preLitCases.length + litCases.length) * 100)
    : 0;

  // Row 3 metrics
  const solDeadlines = allDeadlines.filter(d => d.type === "SOL");
  const sol7d = solDeadlines.filter(d => {
    const days = Math.ceil((new Date(d.date).getTime() - new Date("2026-02-19").getTime()) / 86400000);
    return days >= 0 && days < 7;
  }).length;
  const sol7to14 = solDeadlines.filter(d => {
    const days = Math.ceil((new Date(d.date).getTime() - new Date("2026-02-19").getTime()) / 86400000);
    return days >= 7 && days < 14;
  }).length;
  const sol14to30 = solDeadlines.filter(d => {
    const days = Math.ceil((new Date(d.date).getTime() - new Date("2026-02-19").getTime()) / 86400000);
    return days >= 14 && days <= 30;
  }).length;

  const overSlaCases = activeCases.filter(c => c.riskFlags.includes("Over SLA"));
  const bothFlags = activeCases.filter(c => c.riskFlags.includes("Over SLA") && c.riskFlags.includes("Silent stall")).length;

  // ── Sankey data ───────────────────────────────────────────────────────
  const sankeyData = useMemo(() => buildSankeyData(activeCases), [activeCases]);
  const sankeyCaseTypes = useMemo(() => Array.from(new Set(activeCases.map(c => c.caseType))), [activeCases]);

  // ── Donut 1: SLA Compliance ───────────────────────────────────────────
  const slaComplianceData = useMemo(() => {
    let onTrack = 0, warning = 0, overSla = 0;
    for (const sc of controlTowerData.stageCounts) {
      for (const sub of sc.substages) {
        const onTrackCount = sub.count - sub.overSla;
        const warningCount = Math.round(sub.overSla * 0.3);
        onTrack += onTrackCount;
        warning += warningCount;
        overSla += sub.overSla - warningCount;
      }
      if (sc.substages.length === 0) {
        onTrack += sc.count - sc.overSla;
        overSla += sc.overSla;
      }
    }
    const total = onTrack + warning + overSla;
    const compliancePct = total > 0 ? Math.round((onTrack / total) * 100) : 0;
    return {
      data: [
        { name: 'On-Track', value: onTrack, color: EMERALD },
        { name: 'Warning', value: warning, color: AMBER },
        { name: 'Over SLA', value: overSla, color: RED },
      ],
      compliancePct,
    };
  }, [controlTowerData]);

  // ── Donut 2: Next-Action Coverage ─────────────────────────────────────
  const nextActionData = useMemo(() => {
    const total = activeCases.length;
    const covered = Math.round(total * 0.82);
    const partial = Math.round(total * 0.11);
    const none = total - covered - partial;
    const coveragePct = total > 0 ? Math.round((covered / total) * 100) : 0;
    return {
      data: [
        { name: 'Covered', value: covered, color: EMERALD },
        { name: 'Partial', value: partial, color: AMBER },
        { name: 'No Next Action', value: none, color: RED },
      ],
      coveragePct,
    };
  }, [activeCases]);

  // ── Donut 3: Case Risk Distribution ───────────────────────────────────
  const caseRiskData = useMemo(() => {
    let low = 0, medium = 0, high = 0, critical = 0;
    for (const c of activeCases) {
      const flagCount = c.riskFlags.length;
      if (flagCount === 0) low++;
      else if (flagCount === 1) medium++;
      else if (flagCount === 2) high++;
      else critical++;
    }
    return {
      data: [
        { name: 'Low Risk', value: low, color: EMERALD },
        { name: 'Medium Risk', value: medium, color: AMBER },
        { name: 'High Risk', value: high, color: RED },
        { name: 'Critical', value: critical, color: ROSE },
      ],
      highRiskCount: high + critical,
    };
  }, [activeCases]);

  // ── Stacked Bar 1: Inventory by Case Type ─────────────────────────────
  const inventoryBarData = useMemo(() => {
    const parentStages: ParentStage[] = ['intake', 'pre-lit', 'lit'];
    const ctSet = new Set(activeCases.map(c => c.caseType));
    const cts = Array.from(ctSet).slice(0, 5);
    return {
      data: parentStages.map(ps => {
        const psCases = activeCases.filter(c => c.parentStage === ps);
        const row: Record<string, string | number> = { stage: parentStageLabels[ps], total: psCases.length };
        cts.forEach(ct => { row[ct] = psCases.filter(c => c.caseType === ct).length; });
        return row;
      }),
      caseTypes: cts,
    };
  }, [activeCases]);

  // ── Stacked Bar 2: Weekly Exits by Stage ──────────────────────────────
  const weeklyExitsData = useMemo(() => getWeeklyExitsByStage(), []);
  const totalWeeklyExits = useMemo(() => {
    const last = weeklyExitsData[weeklyExitsData.length - 1];
    return last ? last['Pre-Lit'] + last.Lit + last.Settled + last.Dismissed : 0;
  }, [weeklyExitsData]);

  // ── Stacked Bar 3: Overdue Tasks by Stage ─────────────────────────────
  const overdueData = useMemo(() => getOverdueTasksByStage(), []);
  const totalOverdue = useMemo(
    () => overdueData.reduce((s, d) => s + d['1-7 days'] + d['8-14 days'] + d['15+ days'], 0),
    [overdueData],
  );

  // ── Heat map data ─────────────────────────────────────────────────────
  const heatMapSubstages: (SubStageCount & { parentStage: string })[] = controlTowerData.stageCounts
    .filter(sc => sc.parentStage !== "intake")
    .flatMap(sc => sc.substages.map(sub => ({ ...sub, parentStage: sc.parentStage })));

  const getSimThroughput = (sub: SubStageCount) => {
    const base = sub.count > 0 ? Math.round((sub.count / Math.max(sub.avgAge, 1)) * 7 * 10) / 10 : 0;
    return Math.min(Math.max(base, 0.2), 8.0);
  };
  const getSimStall = (sub: SubStageCount) => {
    const base = sub.count > 0 ? (sub.overSla / sub.count) * 0.4 + (Math.min(sub.avgAge, 300) / 300) * 0.2 : 0;
    return Math.round(base * 1000) / 10;
  };

  type Severity = "good" | "warning" | "elevated" | "critical";

  const severityClasses: Record<Severity, string> = {
    good:     "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 ring-emerald-500/20",
    warning:  "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 ring-amber-500/20",
    elevated: "bg-orange-500/15 text-orange-700 dark:bg-orange-400/20 dark:text-orange-300 ring-orange-500/25",
    critical: "bg-red-500/15 text-red-700 dark:bg-red-400/20 dark:text-red-300 ring-red-500/25",
  };

  const getSeverity = (metric: string, value: number): Severity => {
    switch (metric) {
      case "avgAge":
        return value < 30 ? "good" : value < 90 ? "warning" : value < 180 ? "elevated" : "critical";
      case "overSla":
        return value < 10 ? "good" : value < 25 ? "warning" : value < 50 ? "elevated" : "critical";
      case "throughput":
        return value > 3 ? "good" : value > 1 ? "warning" : "critical";
      case "stall":
        return value < 5 ? "good" : value < 15 ? "warning" : "critical";
      default:
        return "good";
    }
  };

  const groups = (() => {
    const result: { label: string; colSpan: number }[] = [];
    let current: string | null = null;
    let count = 0;
    for (const sub of heatMapSubstages) {
      const label = sub.parentStage === "pre-lit" ? "Pre-Lit" : "Litigation";
      if (label !== current) {
        if (current !== null) result.push({ label: current, colSpan: count });
        current = label;
        count = 1;
      } else {
        count++;
      }
    }
    if (current !== null) result.push({ label: current, colSpan: count });
    return result;
  })();

  const metricRows: {
    key: string; label: string; unit: string; accentBorder: string;
    getValue: (sub: SubStageCount) => number; format: (v: number) => string; metricKey: string;
  }[] = [
    { key: "avgAge", label: "Avg Age", unit: "days", accentBorder: "border-l-blue-500/60", getValue: (sub) => sub.avgAge, format: (v) => `${v}`, metricKey: "avgAge" },
    { key: "overSla", label: "Over-SLA", unit: "%", accentBorder: "border-l-amber-500/60", getValue: (sub) => sub.count > 0 ? Math.round((sub.overSla / sub.count) * 1000) / 10 : 0, format: (v) => `${v}%`, metricKey: "overSla" },
    { key: "throughput", label: "Throughput", unit: "/wk", accentBorder: "border-l-emerald-500/60", getValue: (sub) => getSimThroughput(sub), format: (v) => `${v}`, metricKey: "throughput" },
    { key: "stall", label: "Stall", unit: "%", accentBorder: "border-l-rose-500/60", getValue: (sub) => getSimStall(sub), format: (v) => `${v}%`, metricKey: "stall" },
  ];

  const abbreviateStage = (stage: string) =>
    stageLabels[stage as Stage]
      .replace("Treatment Monitoring", "Treat Mon")
      .replace("Account Opening", "Acct Open")
      .replace("Value Development", "Val Dev")
      .replace("Demand Readiness", "Dem Ready")
      .replace("Resolution Pending", "Res Pend")
      .replace("Case Opening", "Case Open")
      .replace("Expert & Deposition", "Exp & Dep")
      .replace("Arbitration/Mediation", "Arb/Med");

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground animate-fade-in-up">Performance Control Tower</h1>
      <FilterBar />

      {escalations.length > 0 && (
        <EscalationBanner escalations={escalations} />
      )}

      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
        <SectionHeader title="Inventory by Stage" />
        <StageBar parentStages={controlTowerData.stageCounts} />
        <StageAgeGauges litMetrics={topStageMetrics} preLitMetrics={preLitMetrics} />
      </div>

      {/* Row 1 — Portfolio Overview */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <DashboardGrid cols={4}>
          {/* LCI Gauge Card */}
          <div className={cn("rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center gap-2", hoverCard)}>
            <ScoreGauge score={firmLCI.score} maxScore={100} size={90} label="Firm LCI" />
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              firmLCI.band === 'green' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : firmLCI.band === 'amber' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-red-500/15 text-red-600 dark:text-red-400',
            )}>
              {firmLCI.band === 'green' ? 'Healthy' : firmLCI.band === 'amber' ? 'Watch' : 'Critical'}
            </span>
          </div>
          <StatCard
            label="Total Active Inventory"
            value={controlTowerData.totalActive}
            delta="+30 vs 30d ago"
            deltaType="positive"
            className={hoverCard}
            subMetrics={[
              { label: "Pre-Lit", value: preLitCases.length, deltaType: "neutral" },
              { label: "Lit", value: litCases.length, deltaType: "neutral" },
              { label: "Avg/attorney", value: avgPerAttorney, deltaType: "neutral" },
            ]}
          />
          <StatCard
            label="New In (30d)"
            value={340}
            delta="+12% vs prior 30d"
            deltaType="positive"
            className={hoverCard}
            subMetrics={[
              { label: "Avg days to intake", value: "4.2d", deltaType: "positive" },
              { label: "Reopen rate", value: "2.1%", deltaType: "neutral" },
              { label: "Net trend (7d)", value: "+8", deltaType: "positive" },
            ]}
          />
          <StatCard
            label="Closed Out (30d)"
            value={310}
            delta="net +30"
            deltaType="positive"
            className={hoverCard}
            subMetrics={[
              { label: "Settled", value: Math.round(310 * 0.65), deltaType: "positive" },
              { label: "Dismissed", value: Math.round(310 * 0.25), deltaType: "neutral" },
              { label: "Trial verdict", value: Math.round(310 * 0.10), deltaType: "neutral" },
            ]}
          />
          <StatCard
            label="Over-SLA %"
            value={`${controlTowerData.overSlaPct}%`}
            delta="by stage"
            deltaType={controlTowerData.overSlaPct > 10 ? "negative" : "positive"}
            onClick={() => navigate('/inventory-health')}
            className={hoverCard}
            subMetrics={[
              { label: "Pre-Lit SLA%", value: `${preLitSla}%`, deltaType: preLitSla > 20 ? "negative" : "positive" },
              { label: "Lit SLA%", value: `${litSla}%`, deltaType: litSla > 20 ? "negative" : "positive" },
              { label: "Worst stage", value: "Discovery", deltaType: "negative" },
            ]}
          />
        </DashboardGrid>
      </div>

      {/* Row 2 — Velocity & Throughput */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
        <DashboardGrid cols={4}>
          <StatCard
            label="Silent Stall %"
            value={`${controlTowerData.stallPct}%`}
            delta="no activity 21d+"
            deltaType={controlTowerData.stallPct > 5 ? "negative" : "positive"}
            onClick={() => navigate('/inventory-health')}
            className={hoverCard}
            subMetrics={[
              { label: "7d stall", value: stall7d, deltaType: "negative" },
              { label: "21d+ stall", value: stall21d, deltaType: "negative" },
              { label: "Avg stall days", value: `${avgStallDays}d`, deltaType: "negative" },
            ]}
          />
          <StatCard
            label="Realizable EV"
            value={formattedEV}
            delta="+3.2% vs last month"
            deltaType="positive"
            className={hoverCard}
            subMetrics={[
              { label: "Avg EV/case", value: `$${(avgEvPerCase / 1000).toFixed(0)}K`, deltaType: "neutral" },
              { label: "Total exposure", value: `$${(totalExposure / 1_000_000).toFixed(1)}M`, deltaType: "neutral" },
              { label: "EV confidence", value: `${avgEvConfidence}%`, deltaType: avgEvConfidence > 50 ? "positive" : "negative" },
            ]}
          />
          <StatCard
            label="Avg Days in Pre-Lit"
            value={`${preLitAvgAge}d`}
            delta="all pre-lit cases"
            deltaType="neutral"
            className={hoverCard}
            subMetrics={[
              { label: "Median days", value: `${Math.round(preLitAvgAge * 0.85)}d`, deltaType: "neutral" },
              { label: "Cases > 180d", value: preLitOver180, deltaType: preLitOver180 > 50 ? "negative" : "neutral" },
              { label: "Throughput/wk", value: "4.2", deltaType: "positive" },
            ]}
          />
          <StatCard
            label="Avg Days in Lit"
            value={`${litAvgAge}d`}
            delta="all lit cases"
            deltaType="neutral"
            className={hoverCard}
            subMetrics={[
              { label: "Median days", value: `${Math.round(litAvgAge * 0.85)}d`, deltaType: "neutral" },
              { label: "Cases > 365d", value: litOver365, deltaType: litOver365 > 20 ? "negative" : "neutral" },
              { label: "Throughput/wk", value: "3.1", deltaType: "positive" },
            ]}
          />
        </DashboardGrid>
      </div>

      {/* Row 3 — Risk & Operational */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <DashboardGrid cols={4}>
          <StatCard
            label="Weekly Closures"
            value={weeklyClosures}
            delta={`${controlTowerData.closedOut30d}/30d`}
            deltaType="positive"
            className={hoverCard}
            subMetrics={[
              { label: "Settled", value: Math.round(weeklyClosures * 0.65), deltaType: "positive" },
              { label: "Pre-Lit avg", value: "195d", deltaType: "neutral" },
              { label: "Lit avg", value: "412d", deltaType: "negative" },
            ]}
          />
          <StatCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
            delta="Pre-Lit → Lit"
            deltaType="neutral"
            className={hoverCard}
            subMetrics={[
              { label: "This month", value: `${conversionRate}%`, deltaType: "neutral" },
              { label: "Last month", value: `${conversionRate - 2}%`, deltaType: "neutral" },
              { label: "3mo trend", value: "+1.5%", deltaType: "positive" },
            ]}
          />
          <StatCard
            label="Upcoming SOL (30d)"
            value={solDeadlines.filter(d => {
              const days = Math.ceil((new Date(d.date).getTime() - new Date("2026-02-19").getTime()) / 86400000);
              return days >= 0 && days <= 30;
            }).length}
            delta="statute of limitations"
            deltaType="negative"
            className={hoverCard}
            subMetrics={[
              { label: "< 7 days", value: sol7d, deltaType: sol7d > 0 ? "negative" : "positive" },
              { label: "7-14 days", value: sol7to14, deltaType: sol7to14 > 3 ? "negative" : "neutral" },
              { label: "14-30 days", value: sol14to30, deltaType: "neutral" },
            ]}
          />
          <StatCard
            label="Cases at Risk"
            value={overSlaCases.length + stalledCases.length - bothFlags}
            delta="over-SLA + stalled"
            deltaType="negative"
            className={hoverCard}
            subMetrics={[
              { label: "Over-SLA", value: overSlaCases.length, deltaType: "negative" },
              { label: "Stalled", value: stalledCases.length, deltaType: "negative" },
              { label: "Both flags", value: bothFlags, deltaType: "negative" },
            ]}
          />
        </DashboardGrid>
      </div>

      {/* ── EV Distribution Sankey ─────────────────────────────────────── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        <SectionHeader title="EV Distribution by Case Type" subtitle="Expected value flow from stages into case types" />
        <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
          <div className="flex gap-6">
            <div className="shrink-0 w-[180px] flex flex-col justify-between">
              <div>
                <div className="text-3xl font-bold text-foreground">{fmt$(controlTowerData.totalEV)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total EV</div>
                <div className="text-lg font-semibold text-muted-foreground mt-3">{fmt$(totalExposure)}</div>
                <div className="text-xs text-muted-foreground">Total Exposure</div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4">
                {sankeyCaseTypes.map(ct => (
                  <LegendDot key={ct} color={CASE_TYPE_COLORS[ct] || GREEN} label={ct} />
                ))}
              </div>
            </div>
            <div className="flex-1 h-[350px]">
              <ResponsiveSankey
                data={sankeyData}
                theme={nivoTheme}
                colors={SANKEY_COLORS}
                nodeOpacity={1}
                nodeHoverOthersOpacity={0.35}
                nodeThickness={16}
                nodeSpacing={14}
                nodeBorderWidth={0}
                nodeBorderRadius={3}
                linkOpacity={isDark ? 0.35 : 0.5}
                linkHoverOpacity={isDark ? 0.75 : 0.8}
                linkHoverOthersOpacity={isDark ? 0.08 : 0.1}
                linkContract={0}
                linkBlendMode={isDark ? 'screen' : 'multiply'}
                enableLinkGradient
                labelPosition="outside"
                labelOrientation="horizontal"
                labelPadding={12}
                labelTextColor={isDark ? '#a1a1aa' : { from: 'color', modifiers: [['darker', 1.2]] }}
                margin={{ top: 10, right: 140, bottom: 10, left: 10 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Donut Charts (LCF Framework) ───────────────────────────────── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <SectionHeader title="LCF Framework Metrics" subtitle="SLA compliance, next-action coverage, and risk distribution" />
        <DashboardGrid cols={3}>
          {/* Donut 1: SLA Compliance */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">SLA Compliance by Stage</div>
            <p className="text-xs text-muted-foreground mt-0.5">% of cases within SLA targets</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-foreground">{slaComplianceData.compliancePct}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">compliant</div>
              </div>
              <div className="flex-1 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={slaComplianceData.data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none" paddingAngle={2}>
                      {slaComplianceData.data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              {slaComplianceData.data.map(d => <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
            </div>
          </div>

          {/* Donut 2: Next-Action Coverage */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Next-Action Coverage</div>
            <p className="text-xs text-muted-foreground mt-0.5">Cases with defined next actions</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-foreground">{nextActionData.coveragePct}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">covered</div>
              </div>
              <div className="flex-1 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={nextActionData.data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none" paddingAngle={2}>
                      {nextActionData.data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              {nextActionData.data.map(d => <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
            </div>
          </div>

          {/* Donut 3: Case Risk Distribution */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Case Risk Distribution</div>
            <p className="text-xs text-muted-foreground mt-0.5">Risk levels based on flag density</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-foreground">{caseRiskData.highRiskCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">high-risk cases</div>
              </div>
              <div className="flex-1 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={caseRiskData.data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none" paddingAngle={2}>
                      {caseRiskData.data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {caseRiskData.data.map(d => <LegendDot key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
            </div>
          </div>
        </DashboardGrid>
      </div>

      {/* ── Stacked Bar Charts (LCF Framework) ─────────────────────────── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
        <SectionHeader title="Operational Analytics" subtitle="Inventory breakdown, stage throughput, and overdue task density" />
        <DashboardGrid cols={3}>
          {/* Stacked Bar 1: Inventory by Case Type */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Inventory by Stage & Case Type</div>
            <p className="text-xs text-muted-foreground mt-0.5">Active cases grouped by parent stage</p>
            <div className="flex items-start gap-4 mt-3">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-foreground">{activeCases.length.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">total inventory</div>
                <div className="text-lg font-semibold text-muted-foreground mt-2">{avgPerAttorney}</div>
                <div className="text-xs text-muted-foreground">avg/attorney</div>
              </div>
              <div className="flex-1 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryBarData.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <RechartsTooltip {...tooltipStyle} />
                    {inventoryBarData.caseTypes.map((ct, i) => (
                      <Bar key={ct} dataKey={ct} stackId="a" fill={[GREEN, VIOLET, SKY, PINK, YELLOW][i % 5]} radius={i === inventoryBarData.caseTypes.length - 1 ? [3, 3, 0, 0] : undefined} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {inventoryBarData.caseTypes.map((ct, i) => <LegendDot key={ct} color={[GREEN, VIOLET, SKY, PINK, YELLOW][i % 5]} label={ct} />)}
            </div>
          </div>

          {/* Stacked Bar 2: Weekly Exits by Stage */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Stage Throughput (Weekly Exits)</div>
            <p className="text-xs text-muted-foreground mt-0.5">Cases exiting each stage per week</p>
            <div className="flex items-start gap-4 mt-3">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-foreground">{totalWeeklyExits}</div>
                <div className="text-xs text-muted-foreground mt-0.5">exits/week</div>
                <div className="text-lg font-semibold text-emerald-500 mt-2">+4.2%</div>
                <div className="text-xs text-muted-foreground">trend</div>
              </div>
              <div className="flex-1 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyExitsData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <RechartsTooltip {...tooltipStyle} />
                    <Bar dataKey="Pre-Lit" stackId="a" fill={VIOLET} />
                    <Bar dataKey="Lit" stackId="a" fill={SKY} />
                    <Bar dataKey="Settled" stackId="a" fill={GREEN} />
                    <Bar dataKey="Dismissed" stackId="a" fill={PINK} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <LegendDot color={VIOLET} label="Pre-Lit" />
              <LegendDot color={SKY} label="Lit" />
              <LegendDot color={GREEN} label="Settled" />
              <LegendDot color={PINK} label="Dismissed" />
            </div>
          </div>

          {/* Stacked Bar 3: Overdue Tasks by Stage */}
          <div className={cn("rounded-xl border border-border bg-card p-5", hoverCard)}>
            <div className="text-sm font-semibold text-foreground">Overdue Tasks by Stage</div>
            <p className="text-xs text-muted-foreground mt-0.5">Task overdue density in top bottleneck stages</p>
            <div className="flex items-start gap-4 mt-3">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-foreground">{totalOverdue}</div>
                <div className="text-xs text-muted-foreground mt-0.5">overdue tasks</div>
              </div>
              <div className="flex-1 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overdueData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <RechartsTooltip {...tooltipStyle} />
                    <Bar dataKey="1-7 days" stackId="a" fill={AMBER} />
                    <Bar dataKey="8-14 days" stackId="a" fill={RED} />
                    <Bar dataKey="15+ days" stackId="a" fill={ROSE} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <LegendDot color={AMBER} label="1-7 days" />
              <LegendDot color={RED} label="8-14 days" />
              <LegendDot color={ROSE} label="15+ days" />
            </div>
          </div>
        </DashboardGrid>
      </div>

      {/* ── Bottleneck Detector ─────────────────────────────────────────── */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
        <SectionHeader
          title="Bottleneck Detector"
          subtitle="Heat map by sub-stage — severity-coded metrics"
        />
        <div className={cn("rounded-xl border border-border bg-card p-5 overflow-x-auto", hoverCard)}>
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Severity</span>
            {([
              { label: "Good", cls: "bg-emerald-500/10 ring-1 ring-emerald-500/20" },
              { label: "Warning", cls: "bg-amber-500/10 ring-1 ring-amber-500/20" },
              { label: "Elevated", cls: "bg-orange-500/15 ring-1 ring-orange-500/25" },
              { label: "Critical", cls: "bg-red-500/15 ring-1 ring-red-500/25" },
            ] as const).map(({ label, cls }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={cn("inline-block w-3 h-3 rounded", cls)} />
                {label}
              </span>
            ))}
          </div>

          <table className="w-full text-sm" style={{ borderSpacing: "4px 4px", borderCollapse: "separate" }}>
            <thead>
              <tr>
                <th className="sticky left-0 bg-card z-10" />
                {groups.map((g) => (
                  <th key={g.label} colSpan={g.colSpan} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1">
                    {g.label}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="text-left text-muted-foreground font-medium p-2 min-w-[120px] sticky left-0 bg-card z-10" />
                {heatMapSubstages.map((sub) => (
                  <th
                    key={sub.stage}
                    className="text-center font-medium p-2 cursor-pointer hover:text-foreground text-muted-foreground whitespace-nowrap text-xs"
                    onClick={() => navigate(`/stage/${sub.stage}`)}
                  >
                    {abbreviateStage(sub.stage)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row, rowIdx) => (
                <tr key={row.key} className={rowIdx % 2 === 1 ? "bg-muted/30 dark:bg-muted/10" : ""}>
                  <td
                    className={cn(
                      "text-left text-foreground font-semibold p-2 sticky left-0 bg-card z-10 whitespace-nowrap border-l-[3px]",
                      row.accentBorder,
                      rowIdx % 2 === 1 && "bg-muted/30 dark:bg-muted/10",
                    )}
                  >
                    {row.label} <span className="text-muted-foreground font-normal text-xs">({row.unit})</span>
                  </td>
                  {heatMapSubstages.map((sub) => {
                    const v = row.getValue(sub);
                    const severity = getSeverity(row.metricKey, v);
                    return (
                      <td
                        key={sub.stage}
                        className={cn(
                          "text-center p-2 cursor-pointer rounded-lg font-bold tabular-nums transition-all duration-200",
                          "hover:scale-105 hover:brightness-110 hover:ring-1 hover:shadow-sm",
                          severityClasses[severity],
                        )}
                        onClick={() => navigate(`/stage/${sub.stage}`)}
                      >
                        {row.format(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
