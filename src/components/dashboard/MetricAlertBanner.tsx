import { useState } from 'react';
import { cn } from '../../utils/cn';
import { AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import type { AlertMetric } from '../../data/metrics/lci';

interface MetricAlertBannerProps {
  alerts: AlertMetric[];
  className?: string;
}

const REMEDIATION_MAP: Record<string, string[]> = {
  'Revenue Performance': [
    'Audit settlement pipeline and identify stalled negotiations',
    'Review attorney performance outliers and schedule coaching sessions',
    'Recalibrate fee structures to improve net fee ratio',
  ],
  'Timing Compliance': [
    'Generate breach report by attorney and stage for management review',
    'Assign dedicated paralegals to highest-breach sub-stages',
    'Institute weekly SLA compliance reviews with unit leads',
  ],
  'Inventory Health': [
    'Contact all cases with no service 35+ days for status update',
    'Assign discovery tracker updates to responsible attorneys',
    'Review missing answers and prioritize by deadline proximity',
  ],
  'Workload Balance': [
    'Redistribute discovery trackers across under-utilized attorneys',
    'Prioritize expert service for cases closest to trial dates',
    'Review workload distribution in weekly team meetings',
  ],
};

function formatValue(value: number, unit: string): string {
  if (unit === '$') return `$${value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${(value / 1e3).toFixed(0)}K` : value.toLocaleString()}`;
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'days') return `${value} days`;
  if (unit === 'count') return value.toLocaleString();
  return `${value}`;
}

function formatTarget(target: number, unit: string): string {
  return formatValue(target, unit);
}

export function MetricAlertBanner({ alerts, className }: MetricAlertBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (alerts.length === 0) return null;

  const redCount = alerts.filter(a => a.band === 'red').length;
  const amberCount = alerts.filter(a => a.band === 'amber').length;

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn('rounded-lg border border-red-500/30 bg-red-500/10 dark:bg-red-500/5', className)}>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <AlertTriangle size={16} className="shrink-0 text-red-500" />
        <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400">
          {alerts.length} metric{alerts.length !== 1 ? 's' : ''} need attention
          <span className="ml-2 text-xs font-normal text-red-500/80 dark:text-red-400/70">
            ({redCount} red, {amberCount} amber)
          </span>
        </span>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-red-500/70" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-red-500/70" />
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="border-t border-red-500/20 px-4 py-2 space-y-1">
          {alerts.map(alert => {
            const itemKey = `${alert.layerName}-${alert.metricName}`;
            const isItemExpanded = expandedItems.has(itemKey);
            const steps = REMEDIATION_MAP[alert.layerName] ?? [
              'Review metric details and identify root cause',
              'Assign corrective action owner',
              'Schedule follow-up review within 7 days',
            ];

            return (
              <div key={itemKey}>
                <button
                  type="button"
                  onClick={() => toggleItem(itemKey)}
                  className="flex w-full items-center gap-3 text-sm text-foreground py-1.5 hover:bg-red-500/5 rounded px-1 -mx-1 transition-colors"
                >
                  <ChevronRight
                    size={14}
                    className={cn(
                      'shrink-0 text-muted-foreground transition-transform duration-200',
                      isItemExpanded && 'rotate-90',
                    )}
                  />
                  <span className="font-medium truncate min-w-0 flex-1 text-left">
                    {alert.metricName}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {alert.layerName}
                  </span>
                  <span
                    className={cn(
                      'inline-block w-2.5 h-2.5 rounded-full shrink-0',
                      alert.band === 'red' ? 'bg-red-500' : 'bg-amber-500',
                    )}
                  />
                </button>

                {isItemExpanded && (
                  <div className="ml-6 mt-1 mb-2 rounded-lg border border-border/50 bg-card/80 p-3 space-y-3 text-sm animate-fade-in-up">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-xs text-muted-foreground">Current</span>
                        <div className="font-semibold text-foreground">{formatValue(alert.value, alert.unit)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Target</span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatTarget(alert.target, alert.unit)}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remediation Steps</span>
                      <ol className="mt-1.5 space-y-1">
                        {steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                            <span className="shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
