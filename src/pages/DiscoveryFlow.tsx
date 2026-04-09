import { useMemo, useState, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ResponsiveSankey } from '@nivo/sankey';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { useLdnBundle } from '../data/queries/bundles';
import { computeDiscoveryFlow, type BlockedMatter, type PipelineStage } from '../data/metrics/discoveryFlow';
import type { LdnReportBundle } from '../data/metrics/types';
import { cn } from '../utils/cn';

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
  // Sort by most stuck first
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

  const flow = useMemo(() => computeDiscoveryFlow(bundle), [bundle]);

  const needsAttention = useMemo(() => flow.pipeline.filter(s => s.stuck > 0), [flow.pipeline]);
  const onTrack = useMemo(() => flow.pipeline.filter(s => s.stuck === 0), [flow.pipeline]);

  const worstStage = useMemo(() => {
    if (flow.pipeline.length === 0) return null;
    return flow.pipeline.reduce((worst, s) => s.onTrackPct < worst.onTrackPct ? s : worst);
  }, [flow.pipeline]);

  const stuckPct = flow.totalOpen > 0 ? Math.round((flow.totalStuck / flow.totalOpen) * 100) : 0;

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
        <HeroTitle title="Discovery Flow" subtitle="Pipeline visualization of case progression through litigation stages" />
      </HeroSection>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Open Lit" value={flow.totalOpen.toLocaleString()} />
        <StatCard
          label="Stuck Matters"
          value={flow.totalStuck.toLocaleString()}
          sub={`${stuckPct}% of portfolio`}
          tint={stuckPct > 20 ? 'red' : undefined}
        />
        <StatCard label="Median Days in Pipeline" value={`${flow.medianPipeDays}d`} />
        <StatCard
          label="Worst Stage"
          value={worstStage?.stage ?? '—'}
          sub={worstStage ? `${worstStage.onTrackPct}% on track` : undefined}
          tint={worstStage && worstStage.onTrackPct < 40 ? 'red' : worstStage && worstStage.onTrackPct < 70 ? 'amber' : undefined}
        />
      </div>

      {/* Sankey diagram */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Case Flow by Stage</h2>
        <div style={{ height: 350 }}>
          {flow.sankey.links.length > 0 ? (
            <ResponsiveSankey
              data={flow.sankey}
              margin={{ top: 20, right: 160, bottom: 20, left: 20 }}
              align="justify"
              colors={(node: { id: string; nodeColor?: string }) => node.nodeColor ?? '#666'}
              nodeOpacity={1}
              nodeHoverOthersOpacity={0.35}
              nodeThickness={18}
              nodeSpacing={24}
              nodeBorderWidth={0}
              nodeBorderRadius={3}
              linkOpacity={0.4}
              linkHoverOthersOpacity={0.1}
              linkContract={3}
              enableLinkGradient
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={16}
              labelTextColor={{ from: 'color', modifiers: [['brighter', 1]] }}
              theme={{
                text: { fill: '#999', fontSize: 12 },
                tooltip: {
                  container: { background: '#1a1a1a', color: '#fff', fontSize: 12, border: '1px solid #2a2a2a' },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <AlertTriangle size={16} className="mr-2" /> No flow data available
            </div>
          )}
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
