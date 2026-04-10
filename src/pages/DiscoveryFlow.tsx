import { useMemo, useState, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { useLdnBundle } from '../data/queries/bundles';
import { computeDiscoveryFlow, type BlockedMatter, type PipelineStage } from '../data/metrics/discoveryFlow';
import { STAGE_ORDER, STAGE_LABELS, SLA_TARGETS, type StageName, type LdnReportBundle } from '../data/metrics/types';
import { cn } from '../utils/cn';

/* ── colours ── */
const GREEN = '#22c55e';
const RED = '#ef4444';

/* ── Summary stat card ── */
function StatCard({ label, value, sub, tint }: { label: string; value: string | number; sub?: string; tint?: 'red' | 'amber' }) {
  return (
    <div className={cn(
      'bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3',
      tint === 'red' && 'bg-red-950/30 border-red-900/40',
      tint === 'amber' && 'bg-amber-950/30 border-amber-900/40',
    )}>
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Pipeline helpers (kept from original) ── */
function MiniBar({ onTrack, stuck }: { onTrack: number; stuck: number }) {
  const total = onTrack + stuck;
  if (total === 0) return null;
  const greenPct = Math.round((onTrack / total) * 100);
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-[#2a2a2a] w-full min-w-[80px]">
      <div className="bg-green-500 transition-all" style={{ width: `${greenPct}%` }} />
      <div className="bg-red-500 transition-all" style={{ width: `${100 - greenPct}%` }} />
    </div>
  );
}

function NeedsAttentionSection({ stages, onStageClick }: {
  stages: PipelineStage[];
  onStageClick: (stage: string) => void;
}) {
  if (stages.length === 0) return null;
  const sorted = [...stages].sort((a, b) => b.stuck - a.stuck);

  return (
    <div>
      <h3 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Needs Attention</h3>
      <div className="space-y-2">
        {sorted.map(s => {
          const severity = s.stuck >= s.count * 0.5 ? 'red' : 'amber';
          return (
            <div
              key={s.stage}
              onClick={() => onStageClick(s.stage)}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-colors',
                severity === 'red'
                  ? 'border-l-4 border-l-red-500 border-[#2a2a2a]'
                  : 'border-l-4 border-l-amber-500 border-[#2a2a2a]',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">{s.stage}</div>
                <div className="text-xs text-gray-500 mt-0.5">Median {s.medianDays}d</div>
              </div>
              <div className="text-right shrink-0">
                <span className={cn(
                  'text-xl font-bold',
                  severity === 'red' ? 'text-red-400' : 'text-amber-400',
                )}>
                  {s.stuck}
                </span>
                <span className="text-gray-500 text-sm"> of {s.count}</span>
              </div>
              <div className="w-24 shrink-0">
                <MiniBar onTrack={s.count - s.stuck} stuck={s.stuck} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OnTrackSection({ stages }: { stages: PipelineStage[] }) {
  if (stages.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">On Track</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stages.map(s => (
          <div
            key={s.stage}
            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-l-4 border-l-green-500 border-[#2a2a2a]"
          >
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm">{s.stage}</div>
              <div className="text-xs text-gray-500">{s.count} matters</div>
            </div>
            <span className="text-green-400 text-xs font-medium">{s.onTrackPct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Blocked table (unchanged) ── */
function BlockedTable({ blocked, filter, onFilterChange, highlightStage }: {
  blocked: BlockedMatter[];
  filter: string;
  onFilterChange: (v: string) => void;
  highlightStage: string | null;
}) {
  const filtered = useMemo(() => {
    let rows = blocked;
    if (filter) {
      const lf = filter.toLowerCase();
      rows = rows.filter(b =>
        b.matter.toLowerCase().includes(lf) ||
        b.stage.toLowerCase().includes(lf) ||
        b.blocker.toLowerCase().includes(lf)
      );
    }
    if (highlightStage) {
      rows = rows.filter(b => b.stage === highlightStage);
    }
    return rows;
  }, [blocked, filter, highlightStage]);

  const [sortKey, setSortKey] = useState<'days' | 'stage' | 'matter'>('days');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'days') cmp = a.days - b.days;
      else if (sortKey === 'stage') cmp = a.stage.localeCompare(b.stage);
      else cmp = a.matter.localeCompare(b.matter);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          placeholder="Filter by matter, stage, or blocker..."
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
          className="w-full md:w-72 bg-[#111] border border-[#2a2a2a] rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
        {highlightStage && (
          <span className="text-xs text-amber-400 shrink-0">Filtered: {highlightStage}</span>
        )}
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#1a1a1a]">
            <tr className="border-b border-[#2a2a2a] text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left py-2 px-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('matter')}>
                Matter {sortKey === 'matter' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-2 px-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('stage')}>
                Stage {sortKey === 'stage' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right py-2 px-3 cursor-pointer hover:text-gray-300" onClick={() => toggleSort('days')}>
                Days {sortKey === 'days' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-2 px-3">Blocker</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 100).map((b, i) => (
              <tr
                key={`${b.matter}-${i}`}
                className={cn(
                  'border-b border-[#2a2a2a]/50 hover:bg-white/5',
                  b.days >= 90 ? 'bg-red-950/20' : b.days >= 30 ? 'bg-amber-950/15' : '',
                )}
              >
                <td className="py-2 px-3 text-white max-w-[300px] truncate">{b.matter}</td>
                <td className="py-2 px-3 text-gray-400">{b.stage}</td>
                <td className="py-2 px-3 text-right">
                  <span className={cn(
                    'font-medium',
                    b.days >= 90 ? 'text-red-400' : b.days >= 30 ? 'text-amber-400' : 'text-gray-300'
                  )}>
                    {b.days}
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-400">{b.blocker}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 100 && (
          <div className="text-xs text-gray-500 px-3 py-2">Showing first 100 of {sorted.length} blocked matters</div>
        )}
        {sorted.length === 0 && (
          <div className="text-sm text-gray-500 px-3 py-6 text-center">No blocked matters found</div>
        )}
      </div>
    </div>
  );
}

/* ── Custom bar-top label ── */
function renderTopLabel(props: any) {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={600}>
      {value}
    </text>
  );
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const pct = d.total ? Math.round((d.onTime / d.total) * 100) : 0;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className="text-white font-semibold mb-1">{label} — {d.total} cases</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        <span className="text-gray-300">On Time: {d.onTime} ({pct}%)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        <span className="text-gray-300">Out of Spec: {d.outOfSpec}</span>
      </div>
      <div className="text-gray-500 mt-1">SLA: ≤{d.sla}d</div>
    </div>
  );
}

/* ════════════════════════════════════════════════ */
/*  Main component                                  */
/* ════════════════════════════════════════════════ */

export default function DiscoveryFlow() {
  const [blockerFilter, setBlockerFilter] = useState('');
  const [highlightStage, setHighlightStage] = useState<string | null>(null);
  const blockedRef = useRef<HTMLDivElement>(null);

  const {
    complaints, service, answers, formA, formC, deps, openLit, service30Day,
    loading,
  } = useLdnBundle();

  const bundle: LdnReportBundle = useMemo(() => ({
    complaints, service, answers, formA, formC, deps, tenDay: null, motions: null, openLit, service30Day,
  }), [complaints, service, answers, formA, formC, deps, openLit, service30Day]);

  /* Pipeline data — single source of truth for chart + pipeline sections */
  const flow = useMemo(() => computeDiscoveryFlow(bundle), [bundle]);

  /* Chart data — built from pipeline (full active inventory per stage) */
  const chartData = useMemo(() =>
    flow.pipeline
      .filter((s): s is PipelineStage & { stageKey: StageName } => s.stageKey !== 'complete')
      .map(s => {
        const onTime = s.count - s.stuck;
        return {
          stage: s.stageKey,
          name: STAGE_LABELS[s.stageKey],
          onTime,
          outOfSpec: s.stuck,
          total: s.count,
          onTimePct: s.onTrackPct,
          sla: SLA_TARGETS[s.stageKey],
        };
      }),
  [flow.pipeline]);

  /* Summary stats — derived from pipeline totals */
  const summary = useMemo(() => {
    let worstPct = 101, worstStage = '';
    let atRisk = 0;

    for (const d of chartData) {
      if (d.onTimePct < worstPct) {
        worstPct = d.onTimePct;
        worstStage = d.name;
      }
      if (d.onTimePct < 75) atRisk++;
    }

    const totalOnTime = flow.totalOpen - flow.totalStuck;
    const overallPct = flow.totalOpen ? Math.round((totalOnTime / flow.totalOpen) * 100) : 0;

    return {
      overallPct,
      totalCases: flow.totalOpen,
      atRisk,
      worstStage: worstStage || 'N/A',
      worstPct: worstPct > 100 ? 0 : worstPct,
    };
  }, [chartData, flow.totalOpen, flow.totalStuck]);
  const needsAttention = useMemo(() => flow.pipeline.filter(s => s.stuck > 0), [flow.pipeline]);
  const onTrack = useMemo(() => flow.pipeline.filter(s => s.stuck === 0), [flow.pipeline]);

  const handleStageClick = (stage: string) => {
    setHighlightStage(prev => prev === stage ? null : stage);
    blockedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <HeroSection>
        <HeroTitle title="Timing Compliance" subtitle="On-time vs out-of-spec case progression across litigation stages" />
      </HeroSection>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Overall On-Time"
          value={`${summary.overallPct}%`}
          tint={summary.overallPct < 50 ? 'red' : summary.overallPct < 70 ? 'amber' : undefined}
        />
        <StatCard label="Total Cases Tracked" value={summary.totalCases.toLocaleString()} />
        <StatCard
          label="Stages At Risk"
          value={summary.atRisk}
          sub="< 75% on-time"
          tint={summary.atRisk >= 3 ? 'red' : summary.atRisk >= 1 ? 'amber' : undefined}
        />
        <StatCard
          label="Worst Stage"
          value={summary.worstStage}
          sub={`${summary.worstPct}% on-time`}
          tint={summary.worstPct < 40 ? 'red' : summary.worstPct < 70 ? 'amber' : undefined}
        />
      </div>

      {/* Timing Standards strip */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Timing Standards</h2>
        <div className="flex flex-wrap gap-3">
          {STAGE_ORDER.map(sn => {
            const d = chartData.find(c => c.stage === sn);
            const pct = d?.onTimePct ?? 0;
            return (
              <div key={sn} className="flex flex-col items-center gap-1.5 min-w-[100px]">
                <span className="px-3 py-1 rounded-full bg-amber-900/40 text-amber-300 text-xs font-semibold">
                  {STAGE_LABELS[sn]}
                </span>
                <span className="text-white text-sm font-bold">≤{SLA_TARGETS[sn]}d</span>
                <span className={cn(
                  'text-xs font-medium',
                  pct >= 75 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400',
                )}>
                  {pct}% on-time
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Compliance by Stage</h2>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={chartData}
            margin={{ top: 25, right: 20, bottom: 5, left: 10 }}
            barCategoryGap="25%"
          >
            <XAxis
              dataKey="name"
              tick={{ fill: '#aaa', fontSize: 11 }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="onTime" stackId="compliance" name="On Time" radius={[0, 0, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={GREEN} />
              ))}
            </Bar>
            <Bar dataKey="outOfSpec" stackId="compliance" name="Out of Spec" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={RED} />
              ))}
              <LabelList dataKey="total" content={renderTopLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Bottom annotations per stage */}
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {chartData.map(d => (
            <div key={d.stage} className="flex items-center gap-1.5 text-xs">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold',
                d.onTimePct >= 75
                  ? 'bg-green-950/50 text-green-400'
                  : d.onTimePct >= 50
                    ? 'bg-amber-950/50 text-amber-400'
                    : 'bg-red-950/50 text-red-400',
              )}>
                {d.onTimePct}%
              </span>
              {d.outOfSpec > 0 && (
                <span className="text-red-400">
                  {d.outOfSpec} out of spec
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline — split into Attention / On Track */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-5">
        <h2 className="text-sm font-medium text-gray-400">Pipeline by Stage</h2>
        <NeedsAttentionSection stages={needsAttention} onStageClick={handleStageClick} />
        <OnTrackSection stages={onTrack} />
      </div>

      {/* Blocked matters */}
      <div ref={blockedRef} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <h2 className="text-sm font-medium text-gray-400">Blocked Matters</h2>
          <span className="text-xs text-gray-600">({flow.blocked.length} total)</span>
          {highlightStage && (
            <button
              onClick={() => setHighlightStage(null)}
              className="ml-auto text-xs text-gray-500 hover:text-gray-300"
            >
              Clear filter
            </button>
          )}
        </div>
        <BlockedTable
          blocked={flow.blocked}
          filter={blockerFilter}
          onFilterChange={setBlockerFilter}
          highlightStage={highlightStage}
        />
      </div>
    </div>
  );
}
