import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { fmt$, fmtNum } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { ScoreGauge } from '../components/scoring/ScoreGauge';
import { LCIBadge } from '../components/dashboard/LCIBadge';
import { MiniSparkline } from '../components/dashboard/MiniSparkline';
import { MetricAlertBanner } from '../components/dashboard/MetricAlertBanner';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { saveMetricSnapshots, useMetricHistory } from '../hooks/useMetricHistory';
import {
  computeRealLCI,
  computeAttorneyMetrics,
  getRedAmberMetrics,
  REAL_LAYER_DEFINITIONS,
  type LCIBand,
} from '../data/metrics/lci';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';

import { RESOLUTIONS_ID, STATS_ID, TIMING_ID, DISCOVERY_ID, EXPERTS_ID } from '../data/sfReportIds';

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

function formatMetricValue(value: number, unit: string): string {
  if (unit === '$') return fmt$(value);
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'days') return `${value}d`;
  if (unit === 'count') return fmtNum(value);
  return value.toFixed(1);
}

function formatTarget(target: number, unit: string): string {
  if (unit === '$') return fmt$(target);
  if (unit === '%') return `${target}%`;
  if (unit === 'days') return `${target}d`;
  if (unit === 'count') return fmtNum(target);
  return `${target}`;
}

// ── Loading Skeleton ────────────────────────────────────────────────────

function LCISkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div>
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-52 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function LCIReport() {
  const navigate = useNavigate();
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set());

  // ── Load 5 SF reports (no Matters needed for LCI) ────────────────────
  const { data: resData, loading: resLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report' });
  const { data: statsData, loading: statsLoading } =
    useSalesforceReport<DashboardResponse>({ id: STATS_ID, type: 'dashboard' });
  const { data: timingData, loading: timingLoading } =
    useSalesforceReport<DashboardResponse>({ id: TIMING_ID, type: 'dashboard' });
  const { data: discData, loading: discLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: DISCOVERY_ID, type: 'report' });
  const { data: expertsData, loading: expertsLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: EXPERTS_ID, type: 'report' });

  const allLoading = resLoading || statsLoading || timingLoading || discLoading || expertsLoading;

  // ── Metric history hooks (before early return) ─────────────────────
  const histComposite = useMetricHistory('lci-composite');

  // ── Compute LCI ─────────────────────────────────────────────────────
  const lci = useMemo(() => {
    if (allLoading) return null;
    return computeRealLCI({ resData, statsData, timingData, discData, expertsData });
  }, [allLoading, resData, statsData, timingData, discData, expertsData]);

  const alerts = useMemo(() => (lci ? getRedAmberMetrics(lci) : []), [lci]);

  const attorneys = useMemo(() => computeAttorneyMetrics(resData), [resData]);

  const topPerformers = useMemo(() => attorneys.slice(0, 10), [attorneys]);
  const needsAttention = useMemo(
    () => [...attorneys].reverse().filter(a => a.cases > 0).slice(0, 10),
    [attorneys],
  );

  // ── Save metric snapshots ──────────────────────────────────────────
  useEffect(() => {
    if (!lci) return;
    const snapshots: Record<string, number> = {
      'lci-composite': lci.score,
    };
    for (const layer of lci.layers) {
      const key = layer.name.toLowerCase().replace(/\s+/g, '-');
      snapshots[`lci-${key}`] = layer.score;
    }
    saveMetricSnapshots(snapshots);
  }, [lci]);

  // ── Layer health counts ────────────────────────────────────────────
  const greenLayers = lci?.layers.filter(l => l.band === 'green').length ?? 0;
  const amberLayers = lci?.layers.filter(l => l.band === 'amber').length ?? 0;
  const redLayers = lci?.layers.filter(l => l.band === 'red').length ?? 0;
  const totalMetrics = lci?.layers.reduce((sum, l) => sum + l.metrics.length, 0) ?? 0;

  // ── Escalation stats ──────────────────────────────────────────────
  const redAlerts = alerts.filter(a => a.band === 'red').length;
  const amberAlerts = alerts.filter(a => a.band === 'amber').length;
  const worstLayer = useMemo(() => {
    if (!lci) return 'N/A';
    return [...lci.layers].sort((a, b) => a.score - b.score)[0]?.name ?? 'N/A';
  }, [lci]);

  const toggleLayer = (layerId: number) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedLayers.size === REAL_LAYER_DEFINITIONS.length) {
      setExpandedLayers(new Set());
    } else {
      setExpandedLayers(new Set(REAL_LAYER_DEFINITIONS.map(l => l.id)));
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (allLoading || !lci) {
    return <LCISkeleton />;
  }

  // Trend sparkline data
  const hasTrend = histComposite.length >= 3;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Section 1: Header + Breadcrumbs */}
      <div>
        <Breadcrumbs crumbs={[
          { label: 'Control Tower', path: '/control-tower' },
          { label: 'LCI Report' },
        ]} />
        <h1 className="text-2xl font-bold text-foreground mt-2">Litigation Control Index Report</h1>
        <p className="text-xs text-muted-foreground mt-1">Real-time composite score from 5 Salesforce reports</p>
      </div>

      {/* Section 2: Composite Score Summary */}
      <SectionHeader
        title="Composite Score"
        info="Overall Litigation Control Index combining four weighted layers into a single 0-100 score."
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Gauge + Band */}
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={lci.score} maxScore={100} size={140} label="Firm LCI" />
            <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', bandBadgeClasses(lci.band))}>
              {bandLabel(lci.band)}
            </span>
          </div>

          {/* Center: Trend */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">Composite Trend</p>
            {hasTrend ? (
              <MiniSparkline data={histComposite} color={bandColor(lci.band)} height={60} />
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">Collecting trend data...</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {histComposite.length}/3 snapshots
                </p>
              </div>
            )}
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
              {totalMetrics} metrics across {REAL_LAYER_DEFINITIONS.length} layers
            </div>
            <div className="text-sm text-muted-foreground">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} active
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: 4-Layer Breakdown */}
      <div>
        <SectionHeader
          title="4-Layer Breakdown"
          subtitle="Expand each layer to view individual metrics"
          info="Individual layer scores with metric details. Expand to see current values vs targets."
          actions={
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded border border-border hover:bg-accent/50"
            >
              <ChevronsUpDown size={14} />
              {expandedLayers.size === REAL_LAYER_DEFINITIONS.length ? 'Collapse All' : 'Expand All'}
            </button>
          }
        />
        <div className="space-y-2">
          {lci.layers.map(layer => {
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
                          </tr>
                        </thead>
                        <tbody>
                          {layer.metrics.map(metric => (
                            <tr key={metric.id} className="border-b border-border/50 last:border-b-0">
                              <td className="py-2 pr-4 text-foreground font-medium">{metric.name}</td>
                              <td className="py-2 px-3 text-right tabular-nums">
                                {formatMetricValue(metric.value, metric.unit)}
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                                {formatTarget(metric.target, metric.unit)}
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

      {/* Section 4: Red/Amber Alerts */}
      <div>
        <SectionHeader title="Metrics Needing Attention" info="Red and amber metrics that are underperforming against their targets." />
        <MetricAlertBanner alerts={alerts} />
        <div className="mt-4">
          <DashboardGrid cols={4}>
            <StatCard label="Total Alerts" value={alerts.length} />
            <StatCard label="Red" value={redAlerts} deltaType={redAlerts > 0 ? 'negative' : 'neutral'} />
            <StatCard label="Amber" value={amberAlerts} deltaType={amberAlerts > 0 ? 'negative' : 'neutral'} />
            <StatCard label="Weakest Layer" value={worstLayer} />
          </DashboardGrid>
        </div>
      </div>

      {/* Section 5: Attorney Leaderboard */}
      <div>
        <SectionHeader title="Attorney Leaderboard" subtitle="From Resolutions report — settlement performance" info="Attorneys ranked by composite LCI score. Top and bottom performers highlighted." />
        <DashboardGrid cols={2}>
          {/* Top Performers */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Top Performers</h3>
            <div className="space-y-1">
              {topPerformers.map((att, i) => (
                <button
                  key={att.name}
                  type="button"
                  onClick={() => navigate(`/attorney/${encodeURIComponent(att.name)}`)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{att.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{att.cases} cases</span>
                  <span className="text-xs font-semibold text-foreground shrink-0">{fmt$(att.settlement)}</span>
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
                  key={att.name}
                  type="button"
                  onClick={() => navigate(`/attorney/${encodeURIComponent(att.name)}`)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{att.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{att.cases} cases</span>
                  <span className="text-xs font-semibold text-foreground shrink-0">{fmt$(att.settlement)}</span>
                </button>
              ))}
            </div>
          </div>
        </DashboardGrid>
      </div>
    </div>
  );
}
