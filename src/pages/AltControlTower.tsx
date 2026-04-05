import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { InfoTooltip } from '../components/dashboard/InfoTooltip';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { MATTERS_ID, RESOLUTIONS_ID, STATS_ID, TIMING_ID } from '../data/sfReportIds';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import {
  fmt$, fmtNum,
  getTimingCompliance, compliancePct, complianceColor,
} from '../utils/sfHelpers';

// ── Palette ────────────────────────────────────────────────────────────
const GREEN = '#22c55e';
const VIOLET = '#a78bfa';
const SKY = '#38bdf8';
const PINK = '#f472b6';
const YELLOW = '#facc15';
const ORANGE = '#fb923c';
const BAR_COLORS = [GREEN, VIOLET, SKY, PINK, YELLOW, ORANGE, '#f87171', '#22d3ee'];

// ── Pre-lit / Lit keyword classification ───────────────────────────────
const PRE_LIT_KEYWORDS = [
  'account opening', 'treatment monitoring', 'pre-lit',
  'value development', 'demand readiness', 'negotiation', 'resolution pending',
];
const LIT_KEYWORDS = [
  'case opening', 'discovery', 'expert', 'arbitration', 'trial',
];

function classifyStage(label: string): 'pre-lit' | 'lit' | 'unknown' {
  const lower = label.toLowerCase();
  if (PRE_LIT_KEYWORDS.some(k => lower.includes(k))) return 'pre-lit';
  if (LIT_KEYWORDS.some(k => lower.includes(k))) return 'lit';
  return 'unknown';
}

// ── Tooltip ────────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e4e4e7' },
  itemStyle: { color: '#a1a1aa' },
};

// ── Card Shell ─────────────────────────────────────────────────────────
function DashCard({
  icon, title, unit, description, info, children,
}: {
  icon: React.ReactNode;
  title: string;
  unit: string;
  description: string;
  info?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          {icon}
          <span>{title}</span>
          {info && <InfoTooltip text={info} />}
          <span className="text-zinc-500 font-normal">/ {unit}</span>
        </div>
        <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-zinc-400">{label}</span>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="h-4 w-40 bg-zinc-800 rounded" />
      <div className="h-3 w-56 bg-zinc-800/60 rounded" />
      <div className="h-[120px] bg-zinc-800/40 rounded" />
    </div>
  );
}

function SkeletonWide() {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="h-4 w-48 bg-zinc-800 rounded" />
      <div className="h-3 w-64 bg-zinc-800/60 rounded" />
      <div className="h-[280px] bg-zinc-800/40 rounded" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function AltControlTower() {
  // Load 4 Salesforce reports
  const { data: mattersData, loading: mattersLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: MATTERS_ID, type: 'report' });
  const { data: resData, loading: resLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report' });
  const { loading: statsLoading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });
  const { data: timingData, loading: timingLoading } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });

  const loading = mattersLoading || resLoading || statsLoading || timingLoading;

  // ── Card 1: Total Inventory — open by stage ────────────────────────
  const stageData = useMemo(() =>
    (mattersData?.groupings ?? []).map(g => ({
      stage: g.label,
      open: g.aggregates.find(a => a.label === 'Open')?.value ?? 0,
    })),
    [mattersData],
  );

  const totalOpen = mattersData?.grandTotals?.find(a => a.label === 'Record Count')?.value ?? 0;

  // ── Card 2: Pre-Lit vs Lit ─────────────────────────────────────────
  const preLitLitData = useMemo(() => {
    let preLit = 0;
    let lit = 0;
    for (const g of mattersData?.groupings ?? []) {
      const openCount = (g.aggregates.find(a => a.label === 'Open')?.value ?? 0) as number;
      const cls = classifyStage(g.label);
      if (cls === 'pre-lit') preLit += openCount;
      else if (cls === 'lit') lit += openCount;
      else {
        // Default unknowns to pre-lit
        preLit += openCount;
      }
    }
    return [
      { name: 'Pre-Lit', value: preLit, color: VIOLET },
      { name: 'Lit', value: lit, color: SKY },
    ];
  }, [mattersData]);

  // ── Card 3: Portfolio Value from RESOLUTIONS ───────────────────────
  const totalSettlement = (resData?.grandTotals?.find(a =>
    a.label.toLowerCase().includes('settlement'))?.value ?? 0) as number;
  const totalFee = (resData?.grandTotals?.find(a =>
    a.label.toLowerCase().includes('fee'))?.value ?? 0) as number;

  const portfolioBarData = [
    { label: 'Settlement', value: totalSettlement },
    { label: 'Fee', value: totalFee },
  ];
  const portfolioMax = Math.max(totalSettlement, totalFee, 1);

  // ── Middle Row: Top 8 Stages horizontal bar ────────────────────────
  const topStages = useMemo(() =>
    [...stageData]
      .sort((a, b) => (b.open as number) - (a.open as number))
      .slice(0, 8),
    [stageData],
  );

  // ── Card 4: Compliance Overview from TIMING ────────────────────────
  const complianceMetrics = useMemo(() => {
    const metrics = [
      { label: 'Complaint Filing', title: 'Complaint Filing Timing' },
      { label: 'Form A', title: 'Form A Timing' },
      { label: 'Form C', title: 'Form C Timing' },
      { label: 'Deps', title: 'Deps Timing' },
    ];
    return metrics.map(m => {
      const c = getTimingCompliance(timingData, m.title);
      const pct = compliancePct(c);
      return { label: m.label, pct, colorClass: complianceColor(pct) };
    });
  }, [timingData]);

  // ── Card 5: Top 5 Attorneys from RESOLUTIONS groupings ────────────
  const topAttorneys = useMemo(() => {
    const groupings = resData?.groupings ?? [];
    return [...groupings]
      .map(g => ({
        name: g.label,
        cases: (g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0) as number,
        settlement: (g.aggregates.find(a =>
          a.label.toLowerCase().includes('settlement'))?.value ?? 0) as number,
      }))
      .sort((a, b) => b.settlement - a.settlement)
      .slice(0, 5);
  }, [resData]);

  return (
    <div className="flex-1 overflow-auto bg-black p-4">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white tracking-tight">Alt Control Tower</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Real-time litigation portfolio intelligence</p>
      </div>

      {/* Top Row — 3 cards */}
      <div className="grid grid-cols-3 gap-3 mb-3">

        {/* Card 1 — Total Inventory */}
        {loading ? <SkeletonCard /> : (
          <DashCard
            icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            title="Total Inventory"
            unit="cases"
            description="Active caseload across all stages"
            info="Open matter count across all stages with bar chart breakdown."
          >
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-white">{fmtNum(totalOpen as number)}</div>
                <div className="text-xs text-zinc-500 mt-0.5">open matters</div>
              </div>
              <div className="flex-1 h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
                    <YAxis hide />
                    <RechartsTooltip {...tooltipStyle} />
                    <Bar dataKey="open" fill={GREEN} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </DashCard>
        )}

        {/* Card 2 — Pre-Lit vs Lit */}
        {loading ? <SkeletonCard /> : (
          <DashCard
            icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            title="Pre-Lit vs Lit"
            unit="%"
            description="Open matters categorized by litigation phase"
            info="Distribution of open matters between pre-litigation and litigation phases."
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {preLitLitData.map(d => (
                  <div key={d.name} className="mb-2">
                    <div className="text-2xl font-bold text-white">{fmtNum(d.value)}</div>
                    <div className="text-xs text-zinc-500">{d.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={preLitLitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={2}
                    >
                      {preLitLitData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-4 mt-1">
              {preLitLitData.map(p => (
                <LegendDot key={p.name} color={p.color} label={`${p.name} (${fmtNum(p.value)})`} />
              ))}
            </div>
          </DashCard>
        )}

        {/* Card 3 — Portfolio Value */}
        {loading ? <SkeletonCard /> : (
          <DashCard
            icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Portfolio Value"
            unit="$"
            description="Total settlement and fee from resolved matters"
            info="Total settlement value and net fees from resolved matters."
          >
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <div className="text-3xl font-bold text-white">{fmt$(totalSettlement)}</div>
                <div className="text-xs text-zinc-500 mt-0.5">total settlement</div>
                <div className="text-lg font-semibold text-zinc-400 mt-2">{fmt$(totalFee)}</div>
                <div className="text-xs text-zinc-500">total fee</div>
              </div>
              <div className="flex-1 space-y-2 mt-1">
                {portfolioBarData.map((row, i) => {
                  const pct = (row.value / portfolioMax) * 100;
                  return (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{row.label}</span>
                        <span className="text-[11px] text-zinc-500">{fmt$(row.value)}</span>
                      </div>
                      <div className="h-3 rounded-sm" style={{ width: `${pct}%`, backgroundColor: i === 0 ? GREEN : VIOLET }} />
                    </div>
                  );
                })}
                <div className="flex gap-4 mt-2">
                  <LegendDot color={GREEN} label="Settlement" />
                  <LegendDot color={VIOLET} label="Fee" />
                </div>
              </div>
            </div>
          </DashCard>
        )}
      </div>

      {/* Middle Row — Top Stages horizontal bar chart */}
      <div className="mb-3">
        {loading ? <SkeletonWide /> : (
          <DashCard
            icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
            title="Top Stages"
            unit="cases"
            description="Top 8 stages by open matter count"
            info="Stages with the highest concentration of open matters."
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStages}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    axisLine={false}
                    tickLine={false}
                    width={160}
                  />
                  <RechartsTooltip {...tooltipStyle} />
                  <Bar dataKey="open" radius={[0, 4, 4, 0]}>
                    {topStages.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashCard>
        )}
      </div>

      {/* Bottom Row — 2 cards */}
      <div className="grid grid-cols-2 gap-3">

        {/* Card 4 — Compliance Overview */}
        {loading ? <SkeletonCard /> : (
          <DashCard
            icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Compliance Overview"
            unit="%"
            description="Timing compliance across key filing milestones"
            info="Timing compliance percentages for four key litigation milestones."
          >
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-800/60 text-zinc-400">
                    <th className="text-left py-2 px-3 font-medium">Milestone</th>
                    <th className="text-right py-2 px-3 font-medium">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceMetrics.map(m => (
                    <tr key={m.label} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2 px-3 text-zinc-300">{m.label}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${m.colorClass}`}>
                          {m.pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashCard>
        )}

        {/* Card 5 — Top 5 Attorneys */}
        {loading ? <SkeletonCard /> : (
          <DashCard
            icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            title="Top 5 Attorneys"
            unit="settlement"
            description="Highest-performing attorneys by total settlement"
            info="Attorneys with the highest settlement totals from resolved matters."
          >
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-800/60 text-zinc-400">
                    <th className="text-left py-2 px-3 font-medium">Attorney</th>
                    <th className="text-right py-2 px-3 font-medium">Cases</th>
                    <th className="text-right py-2 px-3 font-medium">Settlement</th>
                  </tr>
                </thead>
                <tbody>
                  {topAttorneys.map((atty, i) => (
                    <tr key={i} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2 px-3 text-zinc-300 truncate max-w-[180px]">{atty.name}</td>
                      <td className="py-2 px-3 text-right text-zinc-400">{fmtNum(atty.cases)}</td>
                      <td className="py-2 px-3 text-right text-green-400 font-medium">{fmt$(atty.settlement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashCard>
        )}
      </div>
    </div>
  );
}
