import { useMemo, useState } from 'react';
import { ResponsiveNetwork } from '@nivo/network';
import { ResponsiveRadialBar } from '@nivo/radial-bar';
import { ResponsiveSankey } from '@nivo/sankey';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveTreeMap } from '@nivo/treemap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { nivoTheme, chartColors } from '../lib/nivoTheme';
import {
  getControlTowerData, getActiveCases, attorneys,
  stageOrder, stageLabels, parentStageLabels,
  getDaysInStage, getAgingDistribution,
  type ParentStage, type Stage, type SubStage,
  preLitSubStageOrder, litSubStageOrder,
} from '../data/mockData';

// ── Helpers ────────────────────────────────────────────────────────────
function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ── Data builders (memoized inside component) ──────────────────────────

function buildNetworkData(activeCases: ReturnType<typeof getActiveCases>) {
  // Attorney nodes + Stage nodes, linked by case volume
  const attCaseCounts = new Map<string, number>();
  const linkMap = new Map<string, number>();
  activeCases.forEach(c => {
    attCaseCounts.set(c.attorney, (attCaseCounts.get(c.attorney) || 0) + 1);
    const key = `${c.attorney}|||${c.stage}`;
    linkMap.set(key, (linkMap.get(key) || 0) + 1);
  });

  const attNodes = attorneys.map((a, i) => ({
    id: `att-${a.name}`,
    radius: 4 + Math.sqrt(a.caseCount) * 0.8,
    color: chartColors[i % chartColors.length],
  }));

  const stageNodes = stageOrder.map((s, i) => ({
    id: `stg-${s}`,
    radius: 8 + Math.sqrt(activeCases.filter(c => c.stage === s).length) * 0.6,
    color: chartColors[(i + 5) % chartColors.length],
  }));

  const links: { source: string; target: string; distance: number }[] = [];
  linkMap.forEach((count, key) => {
    const [att, stage] = key.split('|||');
    if (count > 5) {
      links.push({ source: `att-${att}`, target: `stg-${stage}`, distance: 100 - Math.min(count, 60) });
    }
  });

  return { nodes: [...attNodes, ...stageNodes], links };
}

function buildRadialGauges(controlData: ReturnType<typeof getControlTowerData>, activeCases: ReturnType<typeof getActiveCases>) {
  const withNextAction = activeCases.filter(c => c.nextAction && c.nextActionDue > '2026-02-19').length;
  const nextActionPct = Math.round((withNextAction / activeCases.length) * 100);
  const activityRate = Math.round(activeCases.filter(c => c.lastActivityDate > '2026-01-29').length / activeCases.length * 100);
  const avgEvConf = Math.round(activeCases.reduce((s, c) => s + c.evConfidence, 0) / activeCases.length * 100);
  const throughput = Math.round((310 / activeCases.length) * 1000) / 10; // closed30d / active

  return [
    { label: 'SLA Compliance', value: 100 - controlData.overSlaPct, color: '#34d399' },
    { label: 'Activity Rate', value: activityRate, color: '#38bdf8' },
    { label: 'Next-Action %', value: nextActionPct, color: '#a78bfa' },
    { label: 'Throughput', value: Math.min(throughput * 10, 100), color: '#fb923c' },
    { label: 'EV Confidence', value: avgEvConf, color: '#f472b6' },
  ];
}

function buildSankeyData(activeCases: ReturnType<typeof getActiveCases>) {
  // Prefix labels to avoid duplicate node IDs (e.g. "Treatment Monitoring" in both pre-lit and lit)
  const sankeyLabel = (s: SubStage): string => {
    if (preLitSubStageOrder.includes(s as any)) return `PL: ${stageLabels[s]}`;
    return `Lit: ${stageLabels[s]}`;
  };

  const nodes: { id: string }[] = [
    { id: 'Intake' },
    ...preLitSubStageOrder.map(s => ({ id: sankeyLabel(s) })),
    ...litSubStageOrder.map(s => ({ id: sankeyLabel(s) })),
  ];

  const stageCounts = new Map<Stage, number>();
  activeCases.forEach(c => stageCounts.set(c.stage, (stageCounts.get(c.stage) || 0) + 1));

  const links: { source: string; target: string; value: number }[] = [];
  const intakeCount = stageCounts.get('intake') || 183;

  // Intake feeds into first pre-lit stage
  links.push({ source: 'Intake', target: sankeyLabel('pre-account-opening'), value: intakeCount });

  // Sequential pre-lit flow
  for (let i = 0; i < preLitSubStageOrder.length - 1; i++) {
    const from = preLitSubStageOrder[i];
    const to = preLitSubStageOrder[i + 1];
    const val = stageCounts.get(from) || 100;
    links.push({ source: sankeyLabel(from), target: sankeyLabel(to), value: Math.round(val * 0.85) });
  }

  // Last pre-lit → first lit
  const lastPreLit = preLitSubStageOrder[preLitSubStageOrder.length - 1];
  links.push({
    source: sankeyLabel(lastPreLit),
    target: sankeyLabel('lit-case-opening'),
    value: stageCounts.get(lastPreLit) || 100,
  });

  // Sequential lit flow
  for (let i = 0; i < litSubStageOrder.length - 1; i++) {
    const from = litSubStageOrder[i];
    const to = litSubStageOrder[i + 1];
    const val = stageCounts.get(from) || 100;
    links.push({ source: sankeyLabel(from), target: sankeyLabel(to), value: Math.round(val * 0.8) });
  }

  return { nodes, links };
}

function buildSunburstData(activeCases: ReturnType<typeof getActiveCases>) {
  const parentStages: ParentStage[] = ['intake', 'pre-lit', 'lit'];
  return {
    name: 'Cases',
    children: parentStages.map(ps => {
      const psCases = activeCases.filter(c => c.parentStage === ps);
      const subMap = new Map<string, Map<string, number>>();
      psCases.forEach(c => {
        const sub = c.subStage ? stageLabels[c.subStage] : 'Direct';
        if (!subMap.has(sub)) subMap.set(sub, new Map());
        const typeMap = subMap.get(sub)!;
        typeMap.set(c.caseType, (typeMap.get(c.caseType) || 0) + 1);
      });
      return {
        name: parentStageLabels[ps],
        children: Array.from(subMap.entries()).map(([sub, typeMap]) => ({
          name: sub,
          children: Array.from(typeMap.entries()).map(([type, count]) => ({
            name: type,
            value: count,
          })),
        })),
      };
    }),
  };
}

function buildRadarData(activeCases: ReturnType<typeof getActiveCases>) {
  const officeList = ['Hartford', 'NYC', 'Chicago'] as const;
  const metrics = ['SLA %', 'Avg Age', 'Stall Rate', 'Throughput', 'Coverage'];

  return metrics.map(metric => {
    const row: Record<string, string | number> = { metric };
    officeList.forEach(office => {
      const officeCases = activeCases.filter(c => c.office === office);
      const officeAtts = attorneys.filter(a => a.office === office);
      let val = 0;
      switch (metric) {
        case 'SLA %':
          val = Math.round((1 - officeCases.filter(c => c.riskFlags.includes('Over SLA')).length / officeCases.length) * 100);
          break;
        case 'Avg Age': {
          const avgAge = officeCases.reduce((s, c) => s + getDaysInStage(c), 0) / officeCases.length;
          val = Math.max(0, 100 - Math.round(avgAge / 3)); // invert so higher = better
          break;
        }
        case 'Stall Rate':
          val = Math.round((1 - officeCases.filter(c => c.riskFlags.includes('Silent stall')).length / officeCases.length) * 100);
          break;
        case 'Throughput':
          val = Math.round(officeAtts.reduce((s, a) => s + a.throughputWeekly, 0) / officeAtts.length * 40);
          break;
        case 'Coverage':
          val = Math.round(officeAtts.reduce((s, a) => s + a.nextActionCoverage, 0) / officeAtts.length * 100);
          break;
      }
      row[office] = val;
    });
    return row;
  });
}

function buildHeatmapData(activeCases: ReturnType<typeof getActiveCases>) {
  const stageList = stageOrder.filter(s => s !== 'intake' && s !== 'pre-lit' && s !== 'lit') as SubStage[];
  return attorneys.map(att => {
    const attCases = activeCases.filter(c => c.attorney === att.name);
    const data = stageList.map(stage => ({
      x: stageLabels[stage],
      y: attCases.filter(c => c.stage === stage).length,
    }));
    return { id: att.name.split(' ')[1] || att.name, data };
  });
}

function buildTreemapData(activeCases: ReturnType<typeof getActiveCases>) {
  const attEV = new Map<string, { ev: number; risk: string }>();
  activeCases.forEach(c => {
    const prev = attEV.get(c.attorney) || { ev: 0, risk: 'low' };
    prev.ev += c.expectedValue;
    if (c.riskFlags.length >= 2) prev.risk = 'high';
    else if (c.riskFlags.length >= 1 && prev.risk !== 'high') prev.risk = 'medium';
    attEV.set(c.attorney, prev);
  });
  return {
    name: 'Portfolio',
    children: Array.from(attEV.entries()).map(([name, { ev, risk }]) => ({
      name: name.split(' ')[1] || name,
      fullName: name,
      value: ev,
      risk,
      color: risk === 'high' ? '#f87171' : risk === 'medium' ? '#fb923c' : '#34d399',
    })),
  };
}

function buildAgingBarData(activeCases: ReturnType<typeof getActiveCases>) {
  const parentStages: ParentStage[] = ['intake', 'pre-lit', 'lit'];
  return parentStages.map(ps => {
    const psCases = activeCases.filter(c => c.parentStage === ps);
    const dist = getAgingDistribution(psCases);
    return { stage: parentStageLabels[ps], ...dist };
  });
}

// ── Radial Gauge Component ─────────────────────────────────────────────
function RadialGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const data = [{ id: label, data: [{ x: label, y: value }] }];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-24 w-24">
        <ResponsiveRadialBar
          data={data}
          theme={nivoTheme}
          maxValue={100}
          startAngle={-130}
          endAngle={130}
          innerRadius={0.65}
          padding={0.3}
          colors={[color]}
          enableRadialGrid={false}
          enableCircularGrid={false}
          radialAxisStart={null}
          circularAxisOuter={null}
          tracksColor="rgba(255,255,255,0.05)"
          isInteractive={true}
        />
      </div>
      <span className="text-[10px] text-slate-400 text-center leading-tight">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function AltControlTower() {
  const [tab, setTab] = useState('overview');
  const controlData = useMemo(() => getControlTowerData(), []);
  const activeCases = useMemo(() => getActiveCases(), []);

  const networkData = useMemo(() => buildNetworkData(activeCases), [activeCases]);
  const gauges = useMemo(() => buildRadialGauges(controlData, activeCases), [controlData, activeCases]);
  const sankeyData = useMemo(() => buildSankeyData(activeCases), [activeCases]);
  const sunburstData = useMemo(() => buildSunburstData(activeCases), [activeCases]);
  const radarData = useMemo(() => buildRadarData(activeCases), [activeCases]);
  const heatmapData = useMemo(() => buildHeatmapData(activeCases), [activeCases]);
  const treemapData = useMemo(() => buildTreemapData(activeCases), [activeCases]);
  const agingBarData = useMemo(() => buildAgingBarData(activeCases), [activeCases]);

  const formattedEV = fmt$(controlData.totalEV);

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-lg font-bold text-white tracking-tight">Alt Control Tower</h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Command Center — Real-Time Litigation Intelligence</p>
      </div>

      {/* Dense stat bar */}
      <div className="grid grid-cols-5 gap-3 mb-3">
        {[
          { label: 'Active Cases', value: controlData.totalActive.toLocaleString(), accent: 'text-sky-400' },
          { label: 'New / Closed (30d)', value: `${controlData.newIn30d} / ${controlData.closedOut30d}`, accent: 'text-emerald-400' },
          { label: 'Over-SLA', value: `${controlData.overSlaPct}%`, accent: controlData.overSlaPct > 15 ? 'text-red-400' : 'text-amber-400' },
          { label: 'Silent Stall', value: `${controlData.stallPct}%`, accent: controlData.stallPct > 10 ? 'text-red-400' : 'text-amber-400' },
          { label: 'Realizable EV', value: formattedEV, accent: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className={`text-lg font-bold ${s.accent} mt-0.5`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-800/60 border border-slate-700/50 mb-3">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-slate-700">Overview</TabsTrigger>
          <TabsTrigger value="flow" className="text-xs data-[state=active]:bg-slate-700">Flow Analysis</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-slate-700">Performance</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs data-[state=active]:bg-slate-700">Inventory</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ─────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-3 mt-0">
          {/* Network Graph */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
            <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Attorney ↔ Stage Network</h2>
            <div className="h-[420px]">
              <ResponsiveNetwork
                data={networkData}
                theme={nivoTheme}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                linkDistance={(e: any) => e.distance || 80}
                centeringStrength={0.4}
                repulsivity={12}
                nodeSize={(n: any) => n.radius || 8}
                activeNodeSize={(n: any) => (n.radius || 8) * 1.4}
                nodeColor={(n: any) => n.color || '#64748b'}
                nodeBorderWidth={1}
                nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.6]] }}
                linkThickness={(l: any) => Math.max(1, Math.sqrt(l.value || 1))}
                linkBlendMode="screen"
                motionConfig="gentle"
                isInteractive={true}
              />
            </div>
          </div>

          {/* Radial Gauges */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
            <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Key Metrics</h2>
            <div className="flex justify-around items-center">
              {gauges.map(g => (
                <RadialGauge key={g.label} label={g.label} value={g.value} color={g.color} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Flow Analysis ────────────────────────────────────── */}
        <TabsContent value="flow" className="mt-0">
          <div className="grid grid-cols-5 gap-3">
            {/* Sankey */}
            <div className="col-span-3 bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
              <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Case Flow — Intake → Resolution</h2>
              <div className="h-[500px]">
                <ResponsiveSankey
                  data={sankeyData}
                  theme={nivoTheme}
                  margin={{ top: 20, right: 120, bottom: 20, left: 20 }}
                  align="justify"
                  colors={chartColors}
                  nodeOpacity={1}
                  nodeHoverOthersOpacity={0.35}
                  nodeThickness={14}
                  nodeSpacing={16}
                  nodeBorderWidth={0}
                  nodeBorderRadius={3}
                  linkOpacity={0.4}
                  linkHoverOthersOpacity={0.1}
                  linkContract={2}
                  enableLinkGradient={true}
                  labelPosition="outside"
                  labelOrientation="horizontal"
                  labelPadding={12}
                  labelTextColor={{ from: 'color', modifiers: [['brighter', 1]] }}
                  isInteractive={true}
                />
              </div>
            </div>

            {/* Sunburst */}
            <div className="col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
              <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Stage → Sub-Stage → Case Type</h2>
              <div className="h-[500px]">
                <ResponsiveSunburst
                  data={sunburstData}
                  theme={nivoTheme}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  id="name"
                  value="value"
                  cornerRadius={3}
                  borderWidth={1}
                  borderColor={{ theme: 'grid.line.stroke' }}
                  colors={chartColors}
                  childColor={{ from: 'color', modifiers: [['brighter', 0.3]] }}
                  enableArcLabels={true}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor="#e2e8f0"
                  isInteractive={true}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Performance ──────────────────────────────────────── */}
        <TabsContent value="performance" className="mt-0">
          <div className="grid grid-cols-2 gap-3">
            {/* Radar */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
              <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Office Comparison — Multi-Axis</h2>
              <div className="h-[460px]">
                <ResponsiveRadar
                  data={radarData}
                  theme={nivoTheme}
                  keys={['Hartford', 'NYC', 'Chicago']}
                  indexBy="metric"
                  maxValue={100}
                  margin={{ top: 50, right: 80, bottom: 40, left: 80 }}
                  curve="linearClosed"
                  borderWidth={2}
                  borderColor={{ from: 'color' }}
                  gridLevels={5}
                  gridShape="circular"
                  gridLabelOffset={24}
                  enableDots={true}
                  dotSize={8}
                  dotColor={{ theme: 'background' }}
                  dotBorderWidth={2}
                  dotBorderColor={{ from: 'color' }}
                  colors={['#38bdf8', '#f472b6', '#34d399']}
                  fillOpacity={0.15}
                  blendMode="screen"
                  motionConfig="wobbly"
                  isInteractive={true}
                  legends={[
                    {
                      anchor: 'top-left',
                      direction: 'column',
                      translateX: -60,
                      translateY: -40,
                      itemWidth: 80,
                      itemHeight: 20,
                      itemTextColor: '#94a3b8',
                      symbolSize: 10,
                      symbolShape: 'circle',
                    },
                  ]}
                />
              </div>
            </div>

            {/* Heatmap */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
              <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Attorney × Stage — Case Distribution</h2>
              <div className="h-[460px]">
                <ResponsiveHeatMap
                  data={heatmapData}
                  theme={nivoTheme}
                  margin={{ top: 40, right: 20, bottom: 60, left: 70 }}
                  valueFormat=">-.0f"
                  axisTop={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                  }}
                  colors={{
                    type: 'sequential',
                    scheme: 'blues',
                  }}
                  emptyColor="#1e293b"
                  borderWidth={1}
                  borderColor="#0f172a"
                  labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
                  isInteractive={true}
                  hoverTarget="cell"
                  animate={true}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Inventory ────────────────────────────────────────── */}
        <TabsContent value="inventory" className="space-y-3 mt-0">
          {/* Treemap */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
            <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Exposure by Attorney — Expected Value</h2>
            <div className="h-[340px]">
              <ResponsiveTreeMap
                data={treemapData}
                theme={nivoTheme}
                identity="name"
                value="value"
                valueFormat=">-$,.0f"
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                labelSkipSize={40}
                labelTextColor="#fff"
                parentLabelSize={0}
                colors={(node: any) => node.data?.color || '#64748b'}
                borderWidth={2}
                borderColor="#0f172a"
                nodeOpacity={0.9}
                isInteractive={true}
                animate={true}
              />
            </div>
          </div>

          {/* Aging Bar Chart (Recharts) */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
            <h2 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Aging Distribution by Parent Stage</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingBarData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  <Bar dataKey="0-30d" stackId="a" fill="#34d399" name="0-30d" />
                  <Bar dataKey="31-60d" stackId="a" fill="#38bdf8" name="31-60d" />
                  <Bar dataKey="61-90d" stackId="a" fill="#facc15" name="61-90d" />
                  <Bar dataKey="91-120d" stackId="a" fill="#fb923c" name="91-120d" />
                  <Bar dataKey="120d+" stackId="a" fill="#f87171" name="120d+" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
