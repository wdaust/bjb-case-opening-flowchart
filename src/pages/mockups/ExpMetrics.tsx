import { useState } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import {
  expMetrics, expKPICategories, expSLARules, expEscalationTriggers,
  expertPerformanceIndex, defensePressureIndex, expertLeverageIndex,
  defenseResistanceSignals, expertRiskFlags, trialReadinessIndex,
  trialReadinessMetrics, trialCountdownSLA, trialRiskFlags,
  caseTheoryIntegrityChecks, clientTrialStabilityFactors, expertTrialDurabilityFactors,
} from '../../data/expMetricsData.ts';
import type { Metric } from '../../data/tmMetricsData.ts';
import type { IndexConfig } from '../../data/expMetricsData.ts';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.tsx';
import {
  ChevronDown, ChevronRight, AlertTriangle, Target, Clock,
  TrendingUp, Activity, CheckCircle2, XCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn.ts';

// ── Category border color map ──────────────────────────────────────────

const categoryBorderColors: Record<string, string> = {
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  emerald: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
  slate: 'border-l-slate-500',
  red: 'border-l-red-500',
  teal: 'border-l-teal-500',
  indigo: 'border-l-indigo-500',
};

// ── RAG Status Helpers ─────────────────────────────────────────────────

type RAGStatus = 'green' | 'amber' | 'red' | 'none';

function getRAGStatus(metric: Metric, value: number): RAGStatus {
  if (value === 0) return 'none';
  if (value >= metric.rag.green.min && value <= metric.rag.green.max) return 'green';
  if (value >= metric.rag.amber.min && value <= metric.rag.amber.max) return 'amber';
  return 'red';
}

const ragDotColors: Record<RAGStatus, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  none: 'bg-muted',
};

const ragLabels: Record<RAGStatus, string> = {
  green: 'On Track',
  amber: 'At Risk',
  red: 'Off Track',
  none: 'No Data',
};

const ragBarColors: Record<RAGStatus, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  none: 'bg-muted',
};

// ── Sort Helpers ───────────────────────────────────────────────────────

type SLASortField = 'task' | 'slaTarget' | 'escalationTrigger' | 'escalateTo';
type SortDir = 'asc' | 'desc';

// ── IndexGauge Component ───────────────────────────────────────────────

function IndexGauge({ value, config }: { value: number; config: IndexConfig }) {
  const band = config.bands.find(b => value >= b.min && value <= b.max) || config.bands[config.bands.length - 1];
  const bandColorMap: Record<string, string> = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
  };
  const bandBgMap: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-1">{config.name}</h3>
      <p className="text-xs text-muted-foreground mb-4">{config.description}</p>
      {/* Big number + band label */}
      <div className="flex items-end gap-3 mb-3">
        <span className={cn('text-4xl font-bold', bandColorMap[band.color] || 'text-foreground')}>
          {value}
        </span>
        <span className="text-sm font-medium text-muted-foreground mb-1">/ 100</span>
      </div>
      <Badge
        className={cn(
          'mb-4',
          band.color === 'green' && 'bg-green-500/10 text-green-600 border-green-500/30',
          band.color === 'blue' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
          band.color === 'amber' && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
          band.color === 'red' && 'bg-red-500/10 text-red-600 border-red-500/30',
        )}
      >
        {band.label}
      </Badge>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all', bandBgMap[band.color] || 'bg-muted')}
          style={{ width: `${value}%` }}
        />
      </div>
      {/* Component breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Components</h4>
        {config.components.map(comp => (
          <div key={comp.name} className="flex items-center justify-between text-xs">
            <span className="text-foreground">{comp.name}</span>
            <span className="text-muted-foreground font-medium">{comp.weight}%</span>
          </div>
        ))}
      </div>
      {/* Bands legend */}
      <div className="mt-4 pt-3 border-t border-border space-y-1">
        {config.bands.map(b => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <div className={cn('h-2 w-2 rounded-full', bandBgMap[b.color])} />
            <span className="text-muted-foreground">{b.min}-{b.max}: {b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export default function ExpMetrics() {
  // Tab state
  const [mainTab, setMainTab] = useState('scorecard');

  // Scorecard state
  const [metricValues, setMetricValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    expMetrics.forEach((m) => {
      init[m.id] = 0;
    });
    return init;
  });

  // KPI Library state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState(true);

  // SLA table sort state
  const [slaSortField, setSlaSortField] = useState<SLASortField>('task');
  const [slaSortDir, setSlaSortDir] = useState<SortDir>('asc');

  // Index values (sliders)
  const [epiValue, setEpiValue] = useState(82);
  const [dpiValue, setDpiValue] = useState(75);
  const [eliValue, setEliValue] = useState(78);
  const [triValue, setTriValue] = useState(71);

  // Defense resistance signals (R/Y/G)
  const [signalStatuses, setSignalStatuses] = useState<Record<string, 'red' | 'yellow' | 'green'>>(() => {
    const init: Record<string, 'red' | 'yellow' | 'green'> = {};
    defenseResistanceSignals.forEach(s => {
      init[s] = 'green';
    });
    return init;
  });

  // Trial readiness checklist
  const [theoryChecks, setTheoryChecks] = useState<Record<string, boolean>>({});

  // ── Handlers ────────────────────────────────────────────────────────

  function handleMetricChange(id: string, value: string) {
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) {
      setMetricValues((prev) => ({ ...prev, [id]: num }));
    }
  }

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSortClick(field: SLASortField) {
    if (slaSortField === field) {
      setSlaSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSlaSortField(field);
      setSlaSortDir('asc');
    }
  }

  // ── Sorted SLA rules ───────────────────────────────────────────────

  const sortedSLARules = [...expSLARules].sort((a, b) => {
    const aVal = a[slaSortField];
    const bVal = b[slaSortField];
    const cmp = aVal.localeCompare(bVal);
    return slaSortDir === 'asc' ? cmp : -cmp;
  });

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Expert &amp; Deposition — Scorecard &amp; Intelligence
        </h1>
        <MockupNav active="exp-metrics" group="expert-deposition" />
      </div>

      {/* Main tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="kpi-sla">KPI &amp; SLA</TabsTrigger>
          <TabsTrigger value="defense-pressure">Defense Pressure</TabsTrigger>
          <TabsTrigger value="trial-readiness">Trial Readiness</TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Scorecard ──────────────────────────────────────── */}
        <TabsContent value="scorecard">
          <section className="mb-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Weekly Scorecard</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                15 performance metrics with RAG status
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expMetrics.map((metric) => {
                const value = metricValues[metric.id] ?? 0;
                const rag = getRAGStatus(metric, value);
                const progress = metric.target > 0
                  ? Math.min((value / metric.target) * 100, 100)
                  : 0;

                return (
                  <div
                    key={metric.id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3"
                  >
                    {/* Metric name */}
                    <h3 className="font-semibold text-sm leading-tight">
                      {metric.name}
                    </h3>

                    {/* Value input + RAG indicator */}
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={value === 0 ? '' : value}
                        onChange={(e) => handleMetricChange(metric.id, e.target.value)}
                        placeholder="0"
                        className="w-24 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-block h-2.5 w-2.5 rounded-full',
                            ragDotColors[rag]
                          )}
                        />
                        <span className="text-xs text-muted-foreground">
                          {ragLabels[rag]}
                        </span>
                      </div>
                    </div>

                    {/* Target + SLA */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Target: {metric.target}
                        {metric.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SLA: {metric.sla}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          ragBarColors[rag]
                        )}
                        style={{ width: `${value === 0 ? 0 : progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Expert Performance Index section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Expert Performance Index</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <IndexGauge value={epiValue} config={expertPerformanceIndex} />
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-4">Adjust Score</h3>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={epiValue}
                  onChange={e => setEpiValue(Number(e.target.value))}
                  className="w-full accent-stone-700"
                />
                <p className="text-xs text-muted-foreground mt-2">Score: {epiValue}/100</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab 2: KPI & SLA ──────────────────────────────────────── */}
        <TabsContent value="kpi-sla">
          {/* KPI Library */}
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">KPI Library</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comprehensive KPI definitions across {expKPICategories.length} categories
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInactive((v) => !v)}
              >
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            </div>

            <div className="space-y-3">
              {expKPICategories.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                const borderClass = categoryBorderColors[category.color] ?? 'border-l-gray-500';
                const visibleKPIs = showInactive
                  ? category.kpis
                  : category.kpis.filter((k) => k.active);

                return (
                  <div
                    key={category.id}
                    className={cn(
                      'rounded-lg border border-border bg-card overflow-hidden border-l-4',
                      borderClass
                    )}
                  >
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-semibold text-sm">{category.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.kpis.length} KPIs
                        </Badge>
                      </div>
                    </button>

                    {/* KPI list */}
                    {isExpanded && (
                      <div className="border-t border-border divide-y divide-border">
                        {visibleKPIs.map((kpi) => (
                          <div key={kpi.id} className="px-6 py-3 flex items-start justify-between gap-4">
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-medium text-sm">{kpi.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {kpi.definition}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'shrink-0 text-xs',
                                kpi.active
                                  ? 'border-green-500/40 bg-green-500/10 text-green-600'
                                  : 'border-border bg-muted text-muted-foreground'
                              )}
                            >
                              {kpi.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                        {visibleKPIs.length === 0 && (
                          <div className="px-6 py-4 text-sm text-muted-foreground">
                            No active KPIs in this category.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SLA Enforcement Ladder */}
          <section className="mb-12">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">SLA Enforcement Ladder</h2>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    {(
                      [
                        { field: 'task' as SLASortField, label: 'Task' },
                        { field: 'slaTarget' as SLASortField, label: 'SLA Target' },
                        { field: 'escalationTrigger' as SLASortField, label: 'Escalation Trigger' },
                        { field: 'escalateTo' as SLASortField, label: 'Escalate To' },
                      ] as const
                    ).map((col) => (
                      <th
                        key={col.field}
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handleSortClick(col.field)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {slaSortField === col.field && (
                            <span className="text-xs">
                              {slaSortDir === 'asc' ? '\u2191' : '\u2193'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSLARules.map((rule, idx) => (
                    <tr
                      key={rule.id}
                      className={cn(
                        'border-t border-border',
                        idx % 2 === 1 && 'bg-muted/30'
                      )}
                    >
                      <td className="px-4 py-3 font-medium">{rule.task}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.slaTarget}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.escalationTrigger}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {rule.escalateTo}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Escalation Triggers Panel */}
          <section className="mb-12">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Escalation Triggers</h2>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {expEscalationTriggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-medium',
                        trigger.severity === 'critical'
                          ? 'border-red-500/40 bg-red-500/10 text-red-600'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                      )}
                    >
                      {trigger.severity === 'critical' ? 'Critical' : 'Warning'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{trigger.condition}</p>
                  <p className="text-xs text-muted-foreground">{trigger.action}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Risk Flags */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Risk Flags</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {expertRiskFlags.map(flag => (
                <div key={flag.id} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                  <AlertTriangle className={cn('h-4 w-4', flag.severity === 'critical' ? 'text-red-500' : 'text-amber-500')} />
                  <span className="text-sm">{flag.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-auto text-xs',
                      flag.severity === 'critical'
                        ? 'border-red-500/40 text-red-600'
                        : 'border-amber-500/40 text-amber-600'
                    )}
                  >
                    {flag.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        {/* ─── Tab 3: Defense Pressure ────────────────────────────────── */}
        <TabsContent value="defense-pressure">
          {/* DPI + ELI gauges side by side */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <div>
              <IndexGauge value={dpiValue} config={defensePressureIndex} />
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={dpiValue}
                  onChange={e => setDpiValue(Number(e.target.value))}
                  className="w-full accent-stone-700"
                />
              </div>
            </div>
            <div>
              <IndexGauge value={eliValue} config={expertLeverageIndex} />
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={eliValue}
                  onChange={e => setEliValue(Number(e.target.value))}
                  className="w-full accent-stone-700"
                />
              </div>
            </div>
          </div>

          {/* Pressure Gap Indicator */}
          <div className="mb-8 rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold text-sm mb-3">Pressure Gap Indicator</h3>
            <p className="text-sm text-muted-foreground mb-3">
              DPI vs Carrier Offer Behavior — measures gap between case strength and carrier response
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{dpiValue}</p>
                <p className="text-xs text-muted-foreground">DPI Score</p>
              </div>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-stone-600"
                  style={{ width: `${dpiValue}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{Math.max(0, dpiValue - 15)}</p>
                <p className="text-xs text-muted-foreground">Carrier Response</p>
              </div>
            </div>
          </div>

          {/* Defense Resistance Signals Panel */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Defense Resistance Signals</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {defenseResistanceSignals.map(signal => {
                const status = signalStatuses[signal];
                return (
                  <div key={signal} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                    <span className="text-sm">{signal}</span>
                    <div className="flex gap-1">
                      {(['red', 'yellow', 'green'] as const).map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSignalStatuses(prev => ({ ...prev, [signal]: color }))}
                          className={cn(
                            'h-5 w-5 rounded-full border-2 transition-all',
                            color === 'red' && (status === 'red' ? 'bg-red-500 border-red-500' : 'bg-red-500/20 border-red-500/40'),
                            color === 'yellow' && (status === 'yellow' ? 'bg-amber-500 border-amber-500' : 'bg-amber-500/20 border-amber-500/40'),
                            color === 'green' && (status === 'green' ? 'bg-green-500 border-green-500' : 'bg-green-500/20 border-green-500/40'),
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expert Risk Flags */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Expert Risk Flags</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {expertRiskFlags.map(flag => (
                <div key={flag.id} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                  <AlertTriangle className={cn('h-4 w-4 shrink-0', flag.severity === 'critical' ? 'text-red-500' : 'text-amber-500')} />
                  <span className="text-sm">{flag.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settlement Prediction Engine */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold text-sm mb-3">Settlement Prediction Engine</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Expected Range</p>
                <p className="text-lg font-bold">$125K–$185K</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pre-Trial Probability</p>
                <p className="text-lg font-bold">{Math.min(95, 50 + Math.round(dpiValue * 0.4))}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Days to Resolution</p>
                <p className="text-lg font-bold">{Math.max(30, 180 - dpiValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence Score</p>
                <p className="text-lg font-bold">{Math.min(95, 40 + Math.round((dpiValue + eliValue) * 0.3))}%</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab 4: Trial Readiness ────────────────────────────────── */}
        <TabsContent value="trial-readiness">
          {/* TRI Gauge + slider */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <IndexGauge value={triValue} config={trialReadinessIndex} />
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold text-sm mb-4">Adjust Score</h3>
              <input
                type="range"
                min={0}
                max={100}
                value={triValue}
                onChange={e => setTriValue(Number(e.target.value))}
                className="w-full accent-stone-700"
              />
              <p className="text-xs text-muted-foreground mt-2">Score: {triValue}/100</p>
            </div>
          </div>

          {/* 10 Trial Readiness Metrics */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Trial Readiness Weekly Scorecard</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {trialReadinessMetrics.map((metric, idx) => (
                <div key={metric.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-700/10 text-xs font-bold text-stone-700">
                      {idx + 1}
                    </span>
                    <span className="text-sm">{metric.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{metric.target}</Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Client Trial Stability Score */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Client Trial Stability Factors (Score 1-5)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Score &le;3 triggers automatic additional preparation
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {clientTrialStabilityFactors.map((factor, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-3">
                  <span className="text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Expert Trial Durability Score */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Expert Trial Durability Factors</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {expertTrialDurabilityFactors.map((factor, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-3">
                  <span className="text-sm">{factor}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Case Theory Integrity Test */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Case Theory Integrity Test</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Any &quot;No&quot; answer means TRI cannot exceed 80
            </p>
            <div className="space-y-2">
              {caseTheoryIntegrityChecks.map((check, idx) => {
                const isChecked = !!theoryChecks[check];
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setTheoryChecks(prev => ({ ...prev, [check]: !prev[check] }))}
                      className="h-4 w-4 accent-stone-700"
                    />
                    <span className={cn('text-sm', isChecked ? 'text-foreground' : 'text-muted-foreground')}>
                      {check}
                    </span>
                    {isChecked ? (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="ml-auto h-4 w-4 text-muted-foreground/30" />
                    )}
                  </label>
                );
              })}
            </div>
          </section>

          {/* Trial Countdown SLA Ladder */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Trial Countdown SLA Ladder</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Task</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">SLA Target</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Escalation Trigger</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Escalate To</th>
                  </tr>
                </thead>
                <tbody>
                  {trialCountdownSLA.map((rule, idx) => (
                    <tr
                      key={rule.id}
                      className={cn('border-t border-border', idx % 2 === 1 && 'bg-muted/30')}
                    >
                      <td className="px-4 py-3 font-medium">{rule.task}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.slaTarget}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.escalationTrigger}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{rule.escalateTo}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Trial Risk Flags */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Trial Risk Flags</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {trialRiskFlags.map(flag => (
                <div key={flag.id} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                  <AlertTriangle className={cn('h-4 w-4 shrink-0', flag.severity === 'critical' ? 'text-red-500' : 'text-amber-500')} />
                  <span className="text-sm">{flag.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-auto text-xs',
                      flag.severity === 'critical'
                        ? 'border-red-500/40 text-red-600'
                        : 'border-amber-500/40 text-amber-600'
                    )}
                  >
                    {flag.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
