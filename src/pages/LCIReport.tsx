import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { fmt$ } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { ScoreGauge } from '../components/scoring/ScoreGauge';
import { LCIBadge } from '../components/dashboard/LCIBadge';
import { MiniSparkline } from '../components/dashboard/MiniSparkline';
import { Skeleton } from '../components/ui/skeleton';
import { saveMetricSnapshots, useMetricHistory } from '../hooks/useMetricHistory';
import { useLdnBundle } from '../data/queries/bundles';
import {
  computeAllLdnMetrics,
  computeAttorneyMetrics,
  computeStageLCI,
  STAGE_ORDER,
  type StageName,
  type LdnReportBundle,
  type LdnStageMetrics,
} from '../data/metrics';
import type { LCIBand } from '../data/metrics/lci';
import type { ReportSummaryResponse } from '../types/salesforce';
import { RESOLUTIONS_ID } from '../data/sfReportIds';
import { useSalesforceReport } from '../hooks/useSalesforceReport';

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

const RAG_DOT: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

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
        {Array.from({ length: 7 }).map((_, i) => (
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
  const [expandedStages, setExpandedStages] = useState<Set<StageName>>(new Set());

  // ── LDN bundle (7 stages) ────────────────────────────────────────────
  const {
    complaints, service, answers, formA, formC, deps, openLit, service30Day,
    loading: ldnLoading,
  } = useLdnBundle();

  const bundle: LdnReportBundle = useMemo(() => ({
    complaints, service, answers, formA, formC, deps, tenDay: null, motions: null, openLit, service30Day,
  }), [complaints, service, answers, formA, formC, deps, openLit, service30Day]);

  // ── Attorney Leaderboard (from Resolutions) ───────────────────────────
  const { data: resData, loading: resLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report' });

  const allLoading = ldnLoading || resLoading;

  // ── Metric history ──────────────────────────────────────────────────
  const histComposite = useMetricHistory('lci-composite');

  // ── Compute LDN metrics + stage LCI ──────────────────────────────────
  const scores = useMemo(() => computeAllLdnMetrics(bundle), [bundle]);

  // Build firm-wide stage metrics from all rows (not per-attorney)
  const firmStageMetrics = useMemo((): Record<StageName, LdnStageMetrics> | null => {
    if (ldnLoading || scores.length === 0) return null;
    // Aggregate: use the first attorney's stage keys, but sum across all
    const result = {} as Record<StageName, LdnStageMetrics>;
    for (const sn of STAGE_ORDER) {
      // Count RAG distribution across attorneys
      let redCount = 0, amberCount = 0, greenCount = 0;
      for (const s of scores) {
        const m = s.stages[sn];
        if (m.rag === 'red') redCount++;
        else if (m.rag === 'amber') amberCount++;
        else greenCount++;
      }
      // Use the portfolio-level view: stage from first score as template, override RAG
      const template = scores[0].stages[sn];
      const totalPrimary = scores.reduce((sum, s) => {
        const v = s.stages[sn].cards[0]?.value;
        return sum + (typeof v === 'number' ? v : 0);
      }, 0);

      // Firm-wide RAG
      const firmRag = redCount > 0 ? 'red' as const : amberCount > 0 ? 'amber' as const : 'green' as const;

      result[sn] = {
        ...template,
        rag: firmRag,
        cards: template.cards.map((c, i) => i === 0 ? { ...c, value: totalPrimary, rag: firmRag } : c),
        gauge: { ...template.gauge, count: totalPrimary },
      };
    }
    return result;
  }, [ldnLoading, scores]);

  const stageLCI = useMemo(() => {
    if (!firmStageMetrics) return null;
    return computeStageLCI(firmStageMetrics);
  }, [firmStageMetrics]);

  const attorneys = useMemo(() => computeAttorneyMetrics(resData), [resData]);
  const topPerformers = useMemo(() => attorneys.slice(0, 10), [attorneys]);
  const needsAttention = useMemo(
    () => [...attorneys].reverse().filter(a => a.cases > 0).slice(0, 10),
    [attorneys],
  );

  // ── Alerts from stages with red/amber ──────────────────────────────
  const alerts = useMemo(() => {
    if (!stageLCI) return [];
    return stageLCI.stages.filter(s => s.band === 'red' || s.band === 'amber');
  }, [stageLCI]);

  // ── Save metric snapshots ──────────────────────────────────────────
  useEffect(() => {
    if (!stageLCI) return;
    const snapshots: Record<string, number> = {
      'lci-composite': stageLCI.score,
    };
    for (const s of stageLCI.stages) {
      snapshots[`lci-${s.stage}`] = s.score;
    }
    saveMetricSnapshots(snapshots);
  }, [stageLCI]);

  // ── Stage health counts ────────────────────────────────────────────
  const greenStages = stageLCI?.stages.filter(s => s.band === 'green').length ?? 0;
  const amberStages = stageLCI?.stages.filter(s => s.band === 'amber').length ?? 0;
  const redStages = stageLCI?.stages.filter(s => s.band === 'red').length ?? 0;

  const toggleStage = (stage: StageName) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedStages.size === STAGE_ORDER.length) {
      setExpandedStages(new Set());
    } else {
      setExpandedStages(new Set(STAGE_ORDER));
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (allLoading || !stageLCI) {
    return <LCISkeleton />;
  }

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
        <p className="text-xs text-muted-foreground mt-1">7-stage composite score derived from LDM litigation metrics</p>
      </div>

      {/* Section 2: Composite Score Summary */}
      <SectionHeader
        title="Composite Score"
        info="Overall Litigation Control Index combining seven LDM stages into a single 0-100 score. Each stage contributes equally."
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Gauge + Band */}
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={stageLCI.score} maxScore={100} size={140} label="Firm LCI" />
            <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', bandBadgeClasses(stageLCI.band))}>
              {bandLabel(stageLCI.band)}
            </span>
          </div>

          {/* Center: Trend */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">Composite Trend</p>
            {hasTrend ? (
              <MiniSparkline data={histComposite} color={bandColor(stageLCI.band)} height={60} />
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">Collecting trend data...</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {histComposite.length}/3 snapshots
                </p>
              </div>
            )}
          </div>

          {/* Right: Stage Health Summary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Stage Health</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {greenStages} Green
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {amberStages} Amber
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                {redStages} Red
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              7 stages across {scores.length} attorneys
            </div>
            <div className="text-sm text-muted-foreground">
              {alerts.length} stage{alerts.length !== 1 ? 's' : ''} needing attention
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: 7-Stage Breakdown */}
      <div>
        <SectionHeader
          title="7-Stage Breakdown"
          subtitle="Expand each stage to view per-attorney distribution"
          info="Individual stage scores derived from LDM metrics. Expand to see on-track %, stuck count, and RAG status."
          actions={
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded border border-border hover:bg-accent/50"
            >
              <ChevronsUpDown size={14} />
              {expandedStages.size === STAGE_ORDER.length ? 'Collapse All' : 'Expand All'}
            </button>
          }
        />
        <div className="space-y-2">
          {stageLCI.stages.map(stageRow => {
            const isExpanded = expandedStages.has(stageRow.stage);
            return (
              <div key={stageRow.stage} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Collapsed Row */}
                <button
                  type="button"
                  onClick={() => toggleStage(stageRow.stage)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <span className={cn(
                    'w-3 h-3 rounded-full shrink-0',
                    RAG_DOT[stageRow.band],
                  )} />
                  <span className="text-sm font-medium text-foreground text-left flex-1 min-w-0 truncate">
                    {stageRow.label}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {stageRow.onTrackPct}% on-track
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums w-20 text-right">
                    {stageRow.stuckCount} stuck
                  </span>
                  <ScoreGauge score={stageRow.score} maxScore={100} size={50} />
                  <LCIBadge score={Math.round(stageRow.score)} size="sm" />
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Expanded Panel — per-attorney breakdown for this stage */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 animate-fade-in-up">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium">Attorney</th>
                            <th className="text-center py-2 px-3 font-medium">Status</th>
                            <th className="text-right py-2 px-3 font-medium">Primary</th>
                            {firmStageMetrics?.[stageRow.stage]?.cards.slice(1).map(c => (
                              <th key={c.label} className="text-right py-2 px-3 font-medium">{c.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scores
                            .map(s => ({ attorney: s.attorney, metrics: s.stages[stageRow.stage] }))
                            .sort((a, b) => {
                              const pri = { red: 0, amber: 1, green: 2 } as const;
                              return (pri[a.metrics.rag] ?? 2) - (pri[b.metrics.rag] ?? 2);
                            })
                            .slice(0, 20)
                            .map(({ attorney, metrics }) => (
                              <tr key={attorney} className="border-b border-border/50 last:border-b-0">
                                <td className="py-2 pr-4">
                                  <button
                                    onClick={() => navigate(`/attorney/${encodeURIComponent(attorney)}`)}
                                    className="text-blue-400 hover:text-blue-300 hover:underline text-left text-sm"
                                  >
                                    {attorney}
                                  </button>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={cn('inline-block w-3 h-3 rounded-full', RAG_DOT[metrics.rag])} />
                                </td>
                                <td className="py-2 px-3 text-right tabular-nums">
                                  {String(metrics.cards[0]?.value ?? '-')}
                                </td>
                                {metrics.cards.slice(1).map(c => (
                                  <td key={c.label} className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                                    {String(c.value ?? '-')}
                                  </td>
                                ))}
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

      {/* Section 4: Stages Needing Attention */}
      {alerts.length > 0 && (
        <div>
          <SectionHeader title="Stages Needing Attention" info="Stages with red or amber status that are dragging down the composite score." />
          <DashboardGrid cols={Math.min(alerts.length, 4) as 1 | 2 | 3 | 4}>
            {alerts.map(a => (
              <StatCard
                key={a.stage}
                label={a.label}
                value={`${a.stuckCount} stuck`}
                deltaType={a.band === 'red' ? 'negative' : 'neutral'}
              />
            ))}
          </DashboardGrid>
        </div>
      )}

      {/* Section 5: Attorney Leaderboard */}
      <div>
        <SectionHeader title="Attorney Leaderboard" subtitle="From Resolutions report — settlement performance" info="Attorneys ranked by settlement volume. Top and bottom performers highlighted." />
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
