import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { ScoreGauge } from '../components/scoring/ScoreGauge';
import { LCIBadge } from '../components/dashboard/LCIBadge';
import { MiniSparkline } from '../components/dashboard/MiniSparkline';
import { EscalationBanner } from '../components/dashboard/EscalationBanner';
import {
  calculateFirmLCI,
  calculateOfficeLCI,
  calculateAttorneyLCI,
  getEscalations,
  getOffices,
  LAYER_DEFINITIONS,
  type LCIBand,
} from '../data/lciEngine';
import { attorneys } from '../data/mockData';

function bandColor(band: LCIBand): string {
  if (band === 'green') return '#22c55e';
  if (band === 'amber') return '#eab308';
  return '#ef4444';
}

function bandLabel(band: LCIBand): string {
  if (band === 'green') return 'Healthy';
  if (band === 'amber') return 'Watch';
  return 'Critical';
}

function bandBadgeClasses(band: LCIBand): string {
  if (band === 'green') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  if (band === 'amber') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-red-500/15 text-red-600 dark:text-red-400';
}

export default function LCIReport() {
  const navigate = useNavigate();
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set());

  const firmLCI = useMemo(() => calculateFirmLCI(), []);
  const escalations = useMemo(() => getEscalations(), []);
  const offices = useMemo(() => getOffices(), []);

  const officeLCIs = useMemo(
    () => offices.map(office => ({ office, lci: calculateOfficeLCI(office) })),
    [offices],
  );

  const attorneyLCIs = useMemo(() => {
    return attorneys.map(att => ({
      ...att,
      lci: calculateAttorneyLCI(att.id),
    }));
  }, []);

  const sortedByScore = useMemo(
    () => [...attorneyLCIs].sort((a, b) => b.lci.score - a.lci.score),
    [attorneyLCIs],
  );

  const topPerformers = sortedByScore.slice(0, 10);
  const needsAttention = [...sortedByScore].reverse().slice(0, 10);

  const toggleLayer = (layerId: number) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedLayers.size === LAYER_DEFINITIONS.length) {
      setExpandedLayers(new Set());
    } else {
      setExpandedLayers(new Set(LAYER_DEFINITIONS.map(l => l.id)));
    }
  };

  // Layer health counts
  const greenLayers = firmLCI.layers.filter(l => l.band === 'green').length;
  const amberLayers = firmLCI.layers.filter(l => l.band === 'amber').length;
  const redLayers = firmLCI.layers.filter(l => l.band === 'red').length;
  const totalMetrics = firmLCI.layers.reduce((sum, l) => sum + l.metrics.length, 0);

  // Escalation stats
  const execEscalations = escalations.filter(e => e.escalationLevel === 'executive').length;
  const avgWeeksInRed = escalations.length > 0
    ? (escalations.reduce((s, e) => s + e.weeksInRed, 0) / escalations.length).toFixed(1)
    : '0';
  const layerEscCounts = escalations.reduce<Record<string, number>>((acc, e) => {
    acc[e.layerName] = (acc[e.layerName] || 0) + 1;
    return acc;
  }, {});
  const mostAffectedLayer = Object.entries(layerEscCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  // Trend chart data
  const trendData = firmLCI.trend.map((value, i) => ({ month: i + 1, value }));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Section 1: Header + Breadcrumbs */}
      <div>
        <Breadcrumbs crumbs={[
          { label: 'Control Tower', path: '/control-tower' },
          { label: 'LCI Report' },
        ]} />
        <h1 className="text-2xl font-bold text-foreground mt-2">Litigation Control Index Report</h1>
      </div>

      {/* Section 2: Composite Score Summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Gauge + Band */}
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={firmLCI.score} maxScore={100} size={140} label="Firm LCI" />
            <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', bandBadgeClasses(firmLCI.band))}>
              {bandLabel(firmLCI.band)}
            </span>
          </div>

          {/* Center: Trend Line */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">12-Month Trend</p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" hide />
                <YAxis domain={[60, 100]} hide />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={bandColor(firmLCI.band)}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground">Past 12 months</p>
          </div>

          {/* Right: Layer Health Summary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Layer Health</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {greenLayers} Green
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {amberLayers} Amber
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                {redLayers} Red
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalMetrics} total metrics across 7 layers
            </div>
            <div className="text-sm text-muted-foreground">
              {escalations.length} active escalation{escalations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: 7-Layer Breakdown */}
      <div>
        <SectionHeader
          title="7-Layer Breakdown"
          subtitle="Expand each layer to view individual metrics"
          actions={
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded border border-border hover:bg-accent/50"
            >
              <ChevronsUpDown size={14} />
              {expandedLayers.size === LAYER_DEFINITIONS.length ? 'Collapse All' : 'Expand All'}
            </button>
          }
        />
        <div className="space-y-2">
          {firmLCI.layers.map(layer => {
            const isExpanded = expandedLayers.has(layer.layerId);
            const weightedContribution = (layer.score * layer.weight).toFixed(1);

            return (
              <div key={layer.layerId} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Collapsed Row */}
                <button
                  type="button"
                  onClick={() => toggleLayer(layer.layerId)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <span className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    bandBadgeClasses(layer.band),
                  )}>
                    {layer.layerId + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground text-left flex-1 min-w-0 truncate">
                    {layer.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(layer.weight * 100).toFixed(0)}%
                  </span>
                  <ScoreGauge score={layer.score} maxScore={100} size={50} />
                  <LCIBadge score={Math.round(layer.score)} size="sm" />
                  <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">
                    +{weightedContribution}
                  </span>
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 animate-fade-in-up">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium">Metric Name</th>
                            <th className="text-right py-2 px-3 font-medium">Current</th>
                            <th className="text-right py-2 px-3 font-medium">Target</th>
                            <th className="text-left py-2 px-3 font-medium">Unit</th>
                            <th className="text-center py-2 px-3 font-medium">Band</th>
                            <th className="py-2 pl-3 font-medium w-24">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {layer.metrics.map(metric => (
                            <tr key={metric.id} className="border-b border-border/50 last:border-b-0">
                              <td className="py-2 pr-4 text-foreground font-medium">{metric.name}</td>
                              <td className="py-2 px-3 text-right tabular-nums">
                                {metric.unit === '%' ? `${metric.value.toFixed(1)}%` : metric.value.toFixed(1)}
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                                {metric.unit === '%' ? `${metric.target.toFixed(1)}%` : metric.target.toFixed(1)}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">{metric.unit}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={cn(
                                  'inline-block w-3 h-3 rounded-full',
                                  metric.band === 'green' && 'bg-emerald-500',
                                  metric.band === 'amber' && 'bg-amber-500',
                                  metric.band === 'red' && 'bg-red-500',
                                )} />
                              </td>
                              <td className="py-2 pl-3 w-24">
                                <MiniSparkline
                                  data={metric.trend}
                                  color={bandColor(metric.band)}
                                  height={24}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Active Escalations */}
      <div>
        <SectionHeader title="Active Escalations" />
        <EscalationBanner escalations={escalations} />
        <div className="mt-4">
          <DashboardGrid cols={4}>
            <StatCard label="Total Escalations" value={escalations.length} />
            <StatCard label="Executive-Level" value={execEscalations} deltaType={execEscalations > 0 ? 'negative' : 'neutral'} />
            <StatCard label="Avg Weeks in Red" value={avgWeeksInRed} />
            <StatCard label="Most Affected Layer" value={mostAffectedLayer} />
          </DashboardGrid>
        </div>
      </div>

      {/* Section 5: Office-Level Comparison */}
      <div>
        <SectionHeader title="Office-Level Comparison" subtitle="LCI scores and layer breakdown by office" />
        <DashboardGrid cols={offices.length <= 4 ? (offices.length as 1 | 2 | 3 | 4) : 4}>
          {officeLCIs.map(({ office, lci }) => (
            <div key={office} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{office}</h3>
              <div className="flex items-center gap-3">
                <ScoreGauge score={lci.score} maxScore={100} size={70} />
                <div className="space-y-1">
                  <LCIBadge score={Math.round(lci.score)} />
                  <MiniSparkline data={lci.trend} color={bandColor(lci.band)} height={28} />
                </div>
              </div>
              <div className="space-y-1">
                {lci.layers.map(layer => (
                  <div key={layer.layerId} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-28 truncate shrink-0">
                      {layer.name}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          layer.band === 'green' && 'bg-emerald-500',
                          layer.band === 'amber' && 'bg-amber-500',
                          layer.band === 'red' && 'bg-red-500',
                        )}
                        style={{ width: `${layer.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right">
                      {Math.round(layer.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DashboardGrid>
      </div>

      {/* Section 6: Attorney Leaderboard */}
      <div>
        <SectionHeader title="Attorney Leaderboard" />
        <DashboardGrid cols={2}>
          {/* Top Performers */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Top Performers</h3>
            <div className="space-y-1">
              {topPerformers.map((att, i) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => navigate(`/attorney/${att.id}`)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{att.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{att.office}</span>
                  <div className="w-16 shrink-0">
                    <MiniSparkline data={att.lci.trend} color={bandColor(att.lci.band)} height={20} />
                  </div>
                  <LCIBadge score={Math.round(att.lci.score)} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Needs Attention</h3>
            <div className="space-y-1">
              {needsAttention.map((att, i) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => navigate(`/attorney/${att.id}`)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{att.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{att.office}</span>
                  <div className="w-16 shrink-0">
                    <MiniSparkline data={att.lci.trend} color={bandColor(att.lci.band)} height={20} />
                  </div>
                  <LCIBadge score={Math.round(att.lci.score)} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </DashboardGrid>
      </div>
    </div>
  );
}
