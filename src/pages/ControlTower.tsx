import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getControlTowerData, getActiveCases, getUpcomingDeadlines, parentStageLabels } from '../data/mockData';
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

  const throughputRates = [4.2, 3.1, 2.4];
  const bottleneckData = controlTowerData.stageCounts.map((sc, i) => ({
    stage: parentStageLabels[sc.parentStage],
    avgAge: sc.avgAge,
    throughput: throughputRates[i] ?? 1.0,
  }));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <FilterBar />

      {/* Row 1 — Portfolio Overview */}
      <DashboardGrid cols={5}>
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
          label="New In / Closed Out (30d)"
          value="340 in / 310 out"
          delta="net +30"
          deltaType="positive"
          subMetrics={[
            { label: "Avg days to intake", value: "4.2d", deltaType: "positive" },
            { label: "Reopen rate", value: "2.1%", deltaType: "neutral" },
            { label: "Net trend (7d)", value: "+8", deltaType: "positive" },
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
            { label: "Highest EV", value: `$${(highestEvCase?.expectedValue / 1000).toFixed(0)}K`, deltaType: "positive" },
            { label: "EV confidence", value: `${avgEvConfidence}%`, deltaType: avgEvConfidence > 50 ? "positive" : "negative" },
          ]}
        />
      </DashboardGrid>

      {/* Row 2 — Velocity & Throughput */}
      <DashboardGrid cols={5}>
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
        <StatCard
          label="Weekly Closures"
          value={weeklyClosures}
          delta={`${controlTowerData.closedOut30d}/30d`}
          deltaType="positive"
          subMetrics={[
            { label: "Settled", value: Math.round(weeklyClosures * 0.65), deltaType: "positive" },
            { label: "Dismissed", value: Math.round(weeklyClosures * 0.25), deltaType: "neutral" },
            { label: "Trial verdict", value: Math.round(weeklyClosures * 0.10), deltaType: "neutral" },
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
          label="Avg Time to Resolution"
          value="285d"
          delta="all resolved cases"
          deltaType="neutral"
          subMetrics={[
            { label: "Pre-Lit avg", value: "195d", deltaType: "neutral" },
            { label: "Lit avg", value: "412d", deltaType: "negative" },
            { label: "Fastest case", value: "45d", deltaType: "positive" },
          ]}
        />
      </DashboardGrid>

      {/* Row 3 — Risk & Financial */}
      <DashboardGrid cols={5}>
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
          label="Court Dates (30d)"
          value={courtDates.length}
          delta="trials, depos, motions"
          deltaType="neutral"
          subMetrics={[
            { label: "Trials", value: trials, deltaType: "neutral" },
            { label: "Depositions", value: depositions, deltaType: "neutral" },
            { label: "Motions", value: motions, deltaType: "neutral" },
          ]}
        />
        <StatCard
          label="Total Exposure"
          value={`$${(totalExposure / 1_000_000).toFixed(1)}M`}
          delta="all active cases"
          deltaType="neutral"
          subMetrics={[
            { label: "Avg/case", value: `$${(avgExposurePerCase / 1000).toFixed(0)}K`, deltaType: "neutral" },
            { label: "Max case", value: `$${(maxExposureCase?.exposureAmount / 1000).toFixed(0)}K`, deltaType: "negative" },
            { label: "Min case", value: `$${(minExposureCase?.exposureAmount / 1000).toFixed(0)}K`, deltaType: "neutral" },
          ]}
        />
        <StatCard
          label="EV / Exposure Ratio"
          value={`${evExposureRatio}%`}
          delta="totalEV / totalExposure"
          deltaType={evExposureRatio > 50 ? "positive" : "negative"}
          subMetrics={[
            { label: "Pre-Lit ratio", value: `${preLitRatio}%`, deltaType: preLitRatio > 50 ? "positive" : "negative" },
            { label: "Lit ratio", value: `${litRatio}%`, deltaType: litRatio > 50 ? "positive" : "negative" },
            { label: "Best type", value: "Med Mal", deltaType: "positive" },
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
        subtitle="Avg age vs throughput by stage track"
      />
      <div className="rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={bottleneckData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="stage" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis yAxisId="left" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }} />
            <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
            <Bar yAxisId="left" dataKey="avgAge" fill="#6366f1" name="Avg Age (days)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={2} name="Throughput" dot={{ fill: '#10b981', r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
