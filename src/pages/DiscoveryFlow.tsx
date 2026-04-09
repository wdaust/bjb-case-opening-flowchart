import { useMemo, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ResponsiveSankey } from '@nivo/sankey';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { useLdnBundle } from '../data/queries/bundles';
import { computeDiscoveryFlow, type BlockedMatter } from '../data/metrics/discoveryFlow';
import type { LdnReportBundle } from '../data/metrics/types';
import { cn } from '../utils/cn';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function PipelineTable({ pipeline }: { pipeline: ReturnType<typeof computeDiscoveryFlow>['pipeline'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a2a2a] text-gray-500 text-xs uppercase tracking-wider">
            <th className="text-left py-2 px-3">Stage</th>
            <th className="text-right py-2 px-3">Count</th>
            <th className="text-right py-2 px-3">Median Days</th>
            <th className="text-right py-2 px-3">Stuck</th>
            <th className="text-right py-2 px-3">On Track</th>
          </tr>
        </thead>
        <tbody>
          {pipeline.map(s => (
            <tr key={s.stage} className="border-b border-[#2a2a2a]/50 hover:bg-white/5">
              <td className="py-2 px-3 text-white font-medium">{s.stage}</td>
              <td className="py-2 px-3 text-right text-gray-300">{s.count}</td>
              <td className="py-2 px-3 text-right text-gray-300">{s.medianDays}d</td>
              <td className="py-2 px-3 text-right">
                <span className={cn(
                  'font-medium',
                  s.stuck === 0 ? 'text-green-400' : s.stuck <= 5 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {s.stuck}
                </span>
              </td>
              <td className="py-2 px-3 text-right">
                <span className={cn(
                  'font-medium',
                  s.onTrackPct >= 70 ? 'text-green-400' : s.onTrackPct >= 40 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {s.onTrackPct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockedTable({ blocked, filter, onFilterChange }: {
  blocked: BlockedMatter[];
  filter: string;
  onFilterChange: (v: string) => void;
}) {
  const filtered = useMemo(() => {
    if (!filter) return blocked;
    const lf = filter.toLowerCase();
    return blocked.filter(b =>
      b.matter.toLowerCase().includes(lf) ||
      b.stage.toLowerCase().includes(lf) ||
      b.blocker.toLowerCase().includes(lf)
    );
  }, [blocked, filter]);

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
      <input
        type="text"
        placeholder="Filter by matter, stage, or blocker..."
        value={filter}
        onChange={e => onFilterChange(e.target.value)}
        className="mb-3 w-full md:w-72 bg-[#111] border border-[#2a2a2a] rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
      />
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
              <tr key={`${b.matter}-${i}`} className="border-b border-[#2a2a2a]/50 hover:bg-white/5">
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

  const {
    complaints, service, answers, formA, formC, deps, openLit, service30Day,
    loading,
  } = useLdnBundle();

  const bundle: LdnReportBundle = useMemo(() => ({
    complaints, service, answers, formA, formC, deps, tenDay: null, motions: null, openLit, service30Day,
  }), [complaints, service, answers, formA, formC, deps, openLit, service30Day]);

  const flow = useMemo(() => computeDiscoveryFlow(bundle), [bundle]);

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
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Open Lit" value={flow.totalOpen.toLocaleString()} />
        <StatCard label="Stuck Matters" value={flow.totalStuck.toLocaleString()} sub={`${flow.totalOpen > 0 ? Math.round((flow.totalStuck / flow.totalOpen) * 100) : 0}% of portfolio`} />
        <StatCard label="Median Days in Pipeline" value={`${flow.medianPipeDays}d`} />
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

      {/* Pipeline table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Pipeline by Stage</h2>
        <PipelineTable pipeline={flow.pipeline} />
      </div>

      {/* Blocked matters */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <h2 className="text-sm font-medium text-gray-400">Blocked Matters</h2>
          <span className="text-xs text-gray-600">({flow.blocked.length} total)</span>
        </div>
        <BlockedTable blocked={flow.blocked} filter={blockerFilter} onFilterChange={setBlockerFilter} />
      </div>
    </div>
  );
}
