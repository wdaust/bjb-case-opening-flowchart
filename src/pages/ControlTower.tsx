import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { getControlTowerData, getActiveCases, getUpcomingDeadlines, stageLabels } from '../data/mockData';
import type { SubStageCount } from '../data/mockData';
import { StatCard } from '../components/dashboard/StatCard';
import { StageBar } from '../components/dashboard/StageBar';
import { FilterBar } from '../components/dashboard/FilterBar';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { SectionHeader } from '../components/dashboard/SectionHeader';

export default function ControlTower() {
  const navigate = useNavigate();
  const controlTowerData = getControlTowerData();
  const activeCases = useMemo(() => getActiveCases(), []);
  const allDeadlines = useMemo(() => getUpcomingDeadlines(90), []);

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
  const highestEvCase = activeCases.reduce((max, c) => c.expectedValue > max.expectedValue ? c : max, activeCases[0]);
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

  const courtDates = allDeadlines.filter(d => ["trial", "court", "depo", "motion"].includes(d.type));
  const trials = courtDates.filter(d => d.type === "trial").length;
  const depositions = courtDates.filter(d => d.type === "depo").length;
  const motions = courtDates.filter(d => d.type === "motion").length;

  const overSlaCases = activeCases.filter(c => c.riskFlags.includes("Over SLA"));
  const bothFlags = activeCases.filter(c => c.riskFlags.includes("Over SLA") && c.riskFlags.includes("Silent stall")).length;

  const maxExposureCase = activeCases.reduce((max, c) => c.exposureAmount > max.exposureAmount ? c : max, activeCases[0]);
  const minExposureCase = activeCases.reduce((min, c) => c.exposureAmount < min.exposureAmount ? c : min, activeCases[0]);
  const avgExposurePerCase = activeCases.length > 0 ? Math.round(totalExposure / activeCases.length) : 0;

  const evExposureRatio = totalExposure > 0 ? Math.round((controlTowerData.totalEV / totalExposure) * 1000) / 10 : 0;
  const preLitExposure = preLitCases.reduce((s, c) => s + c.exposureAmount, 0);
  const preLitEV = preLitCases.reduce((s, c) => s + c.expectedValue, 0);
  const litExposure = litCases.reduce((s, c) => s + c.exposureAmount, 0);
  const litEV = litCases.reduce((s, c) => s + c.expectedValue, 0);
  const preLitRatio = preLitExposure > 0 ? Math.round((preLitEV / preLitExposure) * 1000) / 10 : 0;
  const litRatio = litExposure > 0 ? Math.round((litEV / litExposure) * 1000) / 10 : 0;

  // Flatten all substages for heat map
  const heatMapSubstages: (SubStageCount & { parentStage: string })[] = controlTowerData.stageCounts
    .filter(sc => sc.parentStage !== "intake")
    .flatMap(sc => sc.substages.map(sub => ({ ...sub, parentStage: sc.parentStage })));

  // Simulated throughput and stall % derived from existing data
  const getSimThroughput = (sub: SubStageCount) => {
    // Higher count + lower avgAge = higher throughput
    const base = sub.count > 0 ? Math.round((sub.count / Math.max(sub.avgAge, 1)) * 7 * 10) / 10 : 0;
    return Math.min(Math.max(base, 0.2), 8.0);
  };
  const getSimStall = (sub: SubStageCount) => {
    // Stall % derived from overSla ratio and avgAge
    const base = sub.count > 0 ? (sub.overSla / sub.count) * 0.4 + (Math.min(sub.avgAge, 300) / 300) * 0.2 : 0;
    return Math.round(base * 1000) / 10;
  };

  // Premium heat map helpers
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

  // Group spans for header row
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

  // DRY metric row definitions
  const metricRows: {
    key: string;
    label: string;
    unit: string;
    accentBorder: string;
    getValue: (sub: SubStageCount) => number;
    format: (v: number) => string;
    metricKey: string;
  }[] = [
    {
      key: "avgAge",
      label: "Avg Age",
      unit: "days",
      accentBorder: "border-l-blue-500/60",
      getValue: (sub) => sub.avgAge,
      format: (v) => `${v}`,
      metricKey: "avgAge",
    },
    {
      key: "overSla",
      label: "Over-SLA",
      unit: "%",
      accentBorder: "border-l-amber-500/60",
      getValue: (sub) => sub.count > 0 ? Math.round((sub.overSla / sub.count) * 1000) / 10 : 0,
      format: (v) => `${v}%`,
      metricKey: "overSla",
    },
    {
      key: "throughput",
      label: "Throughput",
      unit: "/wk",
      accentBorder: "border-l-emerald-500/60",
      getValue: (sub) => getSimThroughput(sub),
      format: (v) => `${v}`,
      metricKey: "throughput",
    },
    {
      key: "stall",
      label: "Stall",
      unit: "%",
      accentBorder: "border-l-rose-500/60",
      getValue: (sub) => getSimStall(sub),
      format: (v) => `${v}%`,
      metricKey: "stall",
    },
  ];

  const abbreviateStage = (stage: string) =>
    stageLabels[stage]
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
      <FilterBar />

      {/* Row 1 — Portfolio Overview */}
      <DashboardGrid cols={4}>
        <StatCard
          label="Total Active Inventory"
          value={controlTowerData.totalActive}
          delta="+30 vs 30d ago"
          deltaType="positive"
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
          subMetrics={[
            { label: "Pre-Lit SLA%", value: `${preLitSla}%`, deltaType: preLitSla > 20 ? "negative" : "positive" },
            { label: "Lit SLA%", value: `${litSla}%`, deltaType: litSla > 20 ? "negative" : "positive" },
            { label: "Worst stage", value: "Discovery", deltaType: "negative" },
          ]}
        />
      </DashboardGrid>

      {/* Row 2 — Velocity & Throughput */}
      <DashboardGrid cols={4}>
        <StatCard
          label="Silent Stall %"
          value={`${controlTowerData.stallPct}%`}
          delta="no activity 21d+"
          deltaType={controlTowerData.stallPct > 5 ? "negative" : "positive"}
          onClick={() => navigate('/inventory-health')}
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
          subMetrics={[
            { label: "Median days", value: `${Math.round(litAvgAge * 0.85)}d`, deltaType: "neutral" },
            { label: "Cases > 365d", value: litOver365, deltaType: litOver365 > 20 ? "negative" : "neutral" },
            { label: "Throughput/wk", value: "3.1", deltaType: "positive" },
          ]}
        />
      </DashboardGrid>

      {/* Row 3 — Risk & Operational */}
      <DashboardGrid cols={4}>
        <StatCard
          label="Weekly Closures"
          value={weeklyClosures}
          delta={`${controlTowerData.closedOut30d}/30d`}
          deltaType="positive"
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
          subMetrics={[
            { label: "Over-SLA", value: overSlaCases.length, deltaType: "negative" },
            { label: "Stalled", value: stalledCases.length, deltaType: "negative" },
            { label: "Both flags", value: bothFlags, deltaType: "negative" },
          ]}
        />
      </DashboardGrid>

      {/* Full-width sections */}
      <SectionHeader title="Inventory by Stage" />
      <StageBar parentStages={controlTowerData.stageCounts} />

      <SectionHeader
        title="Bottleneck Detector"
        subtitle="Heat map by sub-stage — severity-coded metrics"
      />
      <div className="rounded-xl border border-border bg-card p-5 overflow-x-auto">
        {/* Inline legend */}
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
            {/* Group header row */}
            <tr>
              <th className="sticky left-0 bg-card z-10" />
              {groups.map((g) => (
                <th
                  key={g.label}
                  colSpan={g.colSpan}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1"
                >
                  {g.label}
                </th>
              ))}
            </tr>
            {/* Stage name header row */}
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
  );
}
