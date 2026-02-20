import { useState } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { tmMetrics, tmKPICategories, tmSLARules, tmEscalationTriggers } from '../../data/tmMetricsData.ts';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import { ChevronDown, ChevronRight, AlertTriangle, Target, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import type { Metric } from '../../data/tmMetricsData.ts';

// ── Category border color map ──────────────────────────────────────────

const categoryBorderColors: Record<string, string> = {
  teal: 'border-l-teal-500',
  red: 'border-l-red-500',
  emerald: 'border-l-emerald-500',
  blue: 'border-l-blue-500',
  amber: 'border-l-amber-500',
  slate: 'border-l-slate-500',
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

// ── Component ─────────────────────────────────────────────────────────

export default function TMMetrics() {
  // Scorecard state
  const [metricValues, setMetricValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    tmMetrics.forEach((m) => {
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

  const sortedSLARules = [...tmSLARules].sort((a, b) => {
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
          Treatment Monitoring — Weekly Scorecard &amp; KPIs
        </h1>
        <MockupNav active="tm-metrics" group="treatment-monitoring" />
      </div>

        {/* ─── Scorecard Section ─────────────────────────────────────── */}
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Weekly Scorecard</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              12 performance metrics with RAG status
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tmMetrics.map((metric) => {
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

        {/* ─── KPI Library Section ───────────────────────────────────── */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">KPI Library</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprehensive KPI definitions across {tmKPICategories.length} categories
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
            {tmKPICategories.map((category) => {
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

        {/* ─── SLA Reference Table ───────────────────────────────────── */}
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">SLA Reference</h2>
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

        {/* ─── Escalation Triggers Panel ─────────────────────────────── */}
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Escalation Triggers</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {tmEscalationTriggers.map((trigger) => (
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
    </div>
  );
}
