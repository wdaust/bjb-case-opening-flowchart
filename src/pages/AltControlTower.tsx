import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { ResponsiveSankey } from '@nivo/sankey';
import { nivoTheme } from '../lib/nivoTheme';
// Colors defined locally; nivoTheme chartColors updated to green-first palette
import {
  getControlTowerData, getActiveCases, attorneys,
  parentStageLabels, getWeeklyThroughput,
  type ParentStage,
} from '../data/mockData';

// ── Palette ────────────────────────────────────────────────────────────
const GREEN = '#22c55e';
const VIOLET = '#a78bfa';
const SKY = '#38bdf8';
const PINK = '#f472b6';
const YELLOW = '#facc15';
const STAGE_COLORS: Record<string, string> = {
  Intake: GREEN,
  'Pre-Litigation': VIOLET,
  Litigation: SKY,
};
const OFFICE_COLORS: Record<string, string> = {
  Hartford: GREEN,
  NYC: VIOLET,
  Chicago: SKY,
};

// ── Helpers ────────────────────────────────────────────────────────────
function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtNum(n: number) {
  return n.toLocaleString();
}

const CASE_TYPE_COLORS: Record<string, string> = {
  PI: GREEN,
  'Med Mal': VIOLET,
  'Product Liability': SKY,
  'Premises Liability': PINK,
  'Auto Accident': YELLOW,
  'Wrongful Death': '#fb923c',
};

const SANKEY_COLORS = [GREEN, VIOLET, SKY, PINK, YELLOW, '#fb923c', '#f87171', '#22d3ee', '#818cf8'];

function buildSankeyData(activeCases: { caseType: string; parentStage: ParentStage; expectedValue: number }[]) {
  const caseTypeSet = new Set(activeCases.map(c => c.caseType));
  const caseTypes = Array.from(caseTypeSet);
  const stages: ParentStage[] = ['intake', 'pre-lit', 'lit'];

  // Stages on the left, case types on the right
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

// ── Tooltip ────────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e4e4e7' },
  itemStyle: { color: '#a1a1aa' },
};

// ── Card Shell ─────────────────────────────────────────────────────────
function DashCard({
  icon, title, unit, description, children,
}: {
  icon: React.ReactNode;
  title: string;
  unit: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          {icon}
          <span>{title}</span>
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

// ── Main Component ─────────────────────────────────────────────────────
export default function AltControlTower() {
  const controlData = useMemo(() => getControlTowerData(), []);
  const activeCases = useMemo(() => getActiveCases(), []);
  const weeklyData = useMemo(() => getWeeklyThroughput(), []);

  // ── Card 1: Total Inventory ──────────────────────────────────────────
  const stageBarData = useMemo(() => {
    const parentStages: ParentStage[] = ['intake', 'pre-lit', 'lit'];
    const caseTypeSet = new Set(activeCases.map(c => c.caseType));
    const caseTypes = Array.from(caseTypeSet).slice(0, 5);

    return parentStages.map(ps => {
      const psCases = activeCases.filter(c => c.parentStage === ps);
      const row: Record<string, string | number> = { stage: parentStageLabels[ps], total: psCases.length };
      caseTypes.forEach(ct => {
        row[ct] = psCases.filter(c => c.caseType === ct).length;
      });
      return row;
    });
  }, [activeCases]);

  const caseTypes = useMemo(() => {
    const s = new Set(activeCases.map(c => c.caseType));
    return Array.from(s).slice(0, 5);
  }, [activeCases]);

  const avgPerAttorney = Math.round(controlData.totalActive / attorneys.length);

  // ── Card 2: Stage Distribution ───────────────────────────────────────
  const pieData = useMemo(() => {
    return controlData.stageCounts.map(sc => ({
      name: sc.label,
      value: sc.count,
      color: STAGE_COLORS[sc.label] || GREEN,
    }));
  }, [controlData]);

  // ── Card 3: Expected Value ───────────────────────────────────────────
  const totalEV = controlData.totalEV;
  const totalExposure = useMemo(() => activeCases.reduce((s, c) => s + c.exposureAmount, 0), [activeCases]);
  const lastQtrEV = Math.round(totalEV * 0.91); // simulated last quarter
  const lastQtrExposure = Math.round(totalExposure * 0.95);
  const evChange = Math.round(((totalEV - lastQtrEV) / lastQtrEV) * 100);
  const expChange = Math.round(((totalExposure - lastQtrExposure) / lastQtrExposure) * 100);
  const evBarData = [
    { label: 'Expected Value', now: totalEV, lastQtr: lastQtrEV },
    { label: 'Exposure', now: totalExposure, lastQtr: lastQtrExposure },
  ];

  // ── Sankey: EV Distribution ─────────────────────────────────────────
  const sankeyData = useMemo(() => buildSankeyData(activeCases), [activeCases]);
  const sankeyCaseTypes = useMemo(() => Array.from(new Set(activeCases.map(c => c.caseType))), [activeCases]);

  // ── Card 4: Over-SLA vs On-Track ────────────────────────────────────
  const slaTableData = useMemo(() => {
    return controlData.stageCounts.map(sc => {
      const onTrack = sc.count - sc.overSla;
      const pct = sc.count > 0 ? Math.round((sc.overSla / sc.count) * 100) : 0;
      return {
        stage: sc.label,
        count: sc.count,
        overSla: sc.overSla,
        onTrack,
        pct,
      };
    });
  }, [controlData]);

  const totalOverSla = slaTableData.reduce((s, r) => s + r.overSla, 0);
  const totalOnTrack = slaTableData.reduce((s, r) => s + r.onTrack, 0);

  // ── Card 5: Distribution by Office ───────────────────────────────────
  const officeAreaData = useMemo(() => {
    const offices = ['Hartford', 'NYC', 'Chicago'];
    // Use weekly data to simulate office distribution over time
    return weeklyData.map((w, i) => {
      const row: Record<string, string | number> = { week: w.week };
      offices.forEach((office, oi) => {
        const officeCases = activeCases.filter(c => c.office === office);
        const officeEV = officeCases.reduce((s, c) => s + c.expectedValue, 0);
        // Simulate trending with slight week-based variance
        const factor = 0.9 + (((i + oi) % 5) * 0.05);
        row[office] = Math.round(officeEV * factor / 1_000_000 * 100) / 100;
      });
      return row;
    });
  }, [activeCases, weeklyData]);

  const officeEVTotals = useMemo(() => {
    const offices = ['Hartford', 'NYC', 'Chicago'];
    return offices.map(office => {
      const ev = activeCases.filter(c => c.office === office).reduce((s, c) => s + c.expectedValue, 0);
      return { office, ev };
    });
  }, [activeCases]);

  const totalOfficeEV = officeEVTotals.reduce((s, o) => s + o.ev, 0);

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
        <DashCard
          icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          title="Total Inventory"
          unit="cases"
          description="Active caseload across all stages and attorneys"
        >
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <div className="text-3xl font-bold text-white">{fmtNum(controlData.totalActive)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">avg {avgPerAttorney} per attorney</div>
            </div>
            <div className="flex-1 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageBarData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RechartsTooltip {...tooltipStyle} />
                  {caseTypes.map((ct, i) => (
                    <Bar key={ct} dataKey={ct} stackId="a" fill={[GREEN, VIOLET, SKY, PINK, YELLOW][i % 5]} radius={i === caseTypes.length - 1 ? [3, 3, 0, 0] : undefined} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-1">
            {caseTypes.map((ct, i) => (
              <LegendDot key={ct} color={[GREEN, VIOLET, SKY, PINK, YELLOW][i % 5]} label={ct} />
            ))}
          </div>
        </DashCard>

        {/* Card 2 — Stage Distribution */}
        <DashCard
          icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
          title="Stage Distribution"
          unit="%"
          description="Case count breakdown by parent stage"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div className="text-3xl font-bold text-white">3</div>
              <div className="text-xs text-zinc-500 mt-0.5">parent stages</div>
              <div className="text-lg font-semibold text-zinc-400 mt-2">13</div>
              <div className="text-xs text-zinc-500">sub-stages</div>
            </div>
            <div className="flex-1 h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex gap-4 mt-1">
            {pieData.map(p => (
              <LegendDot key={p.name} color={p.color} label={`${p.name} (${fmtNum(p.value)})`} />
            ))}
          </div>
        </DashCard>

        {/* Card 3 — Expected Value */}
        <DashCard
          icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="Expected Value"
          unit="$M"
          description="Portfolio EV vs exposure — current quarter comparison"
        >
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <div className="text-3xl font-bold text-white">{fmt$(totalEV)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">total EV</div>
              <div className="text-lg font-semibold text-zinc-400 mt-2">{fmt$(totalExposure)}</div>
              <div className="text-xs text-zinc-500">total exposure</div>
            </div>
            <div className="flex-1 space-y-2 mt-1">
              {evBarData.map((row, i) => {
                const max = Math.max(totalEV, totalExposure, lastQtrEV, lastQtrExposure);
                const nowPct = (row.now / max) * 100;
                const lastPct = (row.lastQtr / max) * 100;
                const change = i === 0 ? evChange : expChange;
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{row.label}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="h-3 rounded-sm" style={{ width: `${nowPct}%`, backgroundColor: i === 0 ? GREEN : VIOLET }} />
                      <div className="h-2 rounded-sm opacity-40" style={{ width: `${lastPct}%`, backgroundColor: i === 0 ? GREEN : VIOLET }} />
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-4 mt-2">
                <LegendDot color={GREEN} label="Current Qtr" />
                <LegendDot color={`${GREEN}66`} label="Last Qtr" />
              </div>
            </div>
          </div>
        </DashCard>
      </div>

      {/* Middle Row — Sankey */}
      <div className="mb-3">
        <DashCard
          icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
          title="EV Distribution by Case Type"
          unit="$M"
          description="Expected value flow from case types into litigation stages"
        >
          <div className="flex gap-6">
            {/* Left stats panel */}
            <div className="shrink-0 w-[180px] flex flex-col justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{fmt$(totalEV)}</div>
                <div className="text-xs text-zinc-500 mt-0.5">Redistributed</div>
                <div className="text-lg font-semibold text-zinc-400 mt-3">{fmt$(totalExposure)}</div>
                <div className="text-xs text-zinc-500">Total amount</div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4">
                {sankeyCaseTypes.map(ct => (
                  <LegendDot key={ct} color={CASE_TYPE_COLORS[ct] || GREEN} label={ct} />
                ))}
              </div>
            </div>
            {/* Right Sankey diagram */}
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
                linkOpacity={0.25}
                linkHoverOpacity={0.75}
                linkHoverOthersOpacity={0.08}
                linkContract={0}
                linkBlendMode="screen"
                enableLinkGradient
                labelPosition="outside"
                labelOrientation="horizontal"
                labelPadding={12}
                labelTextColor="#a1a1aa"
                margin={{ top: 10, right: 140, bottom: 10, left: 10 }}
              />
            </div>
          </div>
        </DashCard>
      </div>

      {/* Bottom Row — 2 cards */}
      <div className="grid grid-cols-2 gap-3">

        {/* Card 4 — Over-SLA vs On-Track */}
        <DashCard
          icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="Over-SLA vs On-Track"
          unit="cases"
          description="SLA compliance breakdown by parent stage"
        >
          <div className="flex items-start gap-6 mb-3">
            <div className="shrink-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-red-400">{fmtNum(totalOverSla)}</span>
                <span className="text-xs text-zinc-500">over-SLA</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-green-400">{fmtNum(totalOnTrack)}</span>
                <span className="text-xs text-zinc-500">on-track</span>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-800/60 text-zinc-400">
                  <th className="text-left py-2 px-3 font-medium">Stage</th>
                  <th className="text-right py-2 px-3 font-medium">Count</th>
                  <th className="text-right py-2 px-3 font-medium">Over-SLA</th>
                  <th className="text-right py-2 px-3 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {slaTableData.map(row => (
                  <tr key={row.stage} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2 px-3 text-zinc-300">{row.stage}</td>
                    <td className="py-2 px-3 text-right text-zinc-300">{fmtNum(row.count)}</td>
                    <td className="py-2 px-3 text-right text-red-400">{fmtNum(row.overSla)}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${row.pct > 15 ? 'bg-red-500/20 text-red-400' : row.pct > 8 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                        {row.pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashCard>

        {/* Card 5 — Distribution by Office */}
        <DashCard
          icon={<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          title="Distribution by Office"
          unit="$M"
          description="Expected value distribution across offices over time"
        >
          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <div className="text-3xl font-bold text-white">{fmt$(totalOfficeEV)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">total portfolio EV</div>
              <div className="mt-3 space-y-1">
                {officeEVTotals.map(o => (
                  <div key={o.office} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: OFFICE_COLORS[o.office] }} />
                    <span className="text-[11px] text-zinc-400">{o.office}</span>
                    <span className="text-[11px] text-zinc-500 ml-auto">{fmt$(o.ev)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={officeAreaData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#52525b' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RechartsTooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="Hartford" stackId="1" stroke={GREEN} fill={GREEN} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="NYC" stackId="1" stroke={VIOLET} fill={VIOLET} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="Chicago" stackId="1" stroke={SKY} fill={SKY} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DashCard>
      </div>
    </div>
  );
}
