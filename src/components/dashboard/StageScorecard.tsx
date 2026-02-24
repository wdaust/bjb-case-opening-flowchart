import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { MiniSparkline } from './MiniSparkline';
import { Activity, ChevronUp, ChevronDown } from 'lucide-react';

interface StageMetricValue {
  id: string;
  name: string;
  description: string;
  value: number;
  target: number;
  unit: string;
  band: 'green' | 'amber' | 'red';
  trend: number[];
}

interface StageScorecardProps {
  stageId: string;
  stageName: string;
  metrics: StageMetricValue[];
  overallHealth: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
  className?: string;
}

const BAND_DOT: Record<StageMetricValue['band'], string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const BAND_TEXT: Record<StageMetricValue['band'], string> = {
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
};

const SPARKLINE_COLORS: Record<StageMetricValue['band'], string> = {
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
};

function healthColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function StageScorecard({
  stageId,
  stageName,
  metrics,
  overallHealth,
  greenCount,
  amberCount,
  redCount,
  className,
}: StageScorecardProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return metrics;
    return [...metrics].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'value') cmp = a.value - b.value;
      else if (sortKey === 'target') cmp = a.target - b.target;
      else if (sortKey === 'band') {
        const order = { red: 0, amber: 1, green: 2 };
        cmp = order[a.band] - order[b.band];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [metrics, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sortKey === colKey ? (
      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    ) : null;

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)} data-stage-id={stageId}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-sm font-semibold text-foreground">{stageName}</h3>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 px-4 pb-4">
        {/* Overall Health */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <Activity size={14} className="text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground leading-tight">Health</p>
            <p className={cn('text-sm font-bold leading-tight', healthColor(overallHealth))}>
              {overallHealth}%
            </p>
          </div>
        </div>

        {/* Green count */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground leading-tight">Green</p>
            <p className="text-sm font-bold text-foreground leading-tight">{greenCount}</p>
          </div>
        </div>

        {/* Amber count */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground leading-tight">Amber</p>
            <p className="text-sm font-bold text-foreground leading-tight">{amberCount}</p>
          </div>
        </div>

        {/* Red count */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground leading-tight">Red</p>
            <p className="text-sm font-bold text-foreground leading-tight">{redCount}</p>
          </div>
        </div>
      </div>

      {/* Metrics table */}
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-8 py-2 px-3" />
              <th
                onClick={() => handleSort('name')}
                className="text-left py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1">
                  Metric <SortIcon colKey="name" />
                </span>
              </th>
              <th
                onClick={() => handleSort('value')}
                className="text-left py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1">
                  Current <SortIcon colKey="value" />
                </span>
              </th>
              <th
                onClick={() => handleSort('target')}
                className="text-left py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1">
                  Target <SortIcon colKey="target" />
                </span>
              </th>
              <th
                onClick={() => handleSort('band')}
                className="text-left py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1">
                  Status <SortIcon colKey="band" />
                </span>
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                12-Week Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((metric, i) => (
              <tr
                key={metric.id}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  i % 2 === 0 ? 'bg-card' : 'bg-table-stripe',
                )}
              >
                {/* RAG dot */}
                <td className="py-2 px-3">
                  <div className={cn('w-2.5 h-2.5 rounded-full mx-auto', BAND_DOT[metric.band])} />
                </td>
                {/* Metric name */}
                <td className="py-2 px-3">
                  <p className="font-medium text-foreground whitespace-nowrap">{metric.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[200px]">
                    {metric.description}
                  </p>
                </td>
                {/* Current */}
                <td className="py-2 px-3 whitespace-nowrap text-foreground">
                  {metric.value}{metric.unit}
                </td>
                {/* Target */}
                <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                  {metric.target}{metric.unit}
                </td>
                {/* Status */}
                <td className="py-2 px-3">
                  <span className={cn('text-xs font-semibold capitalize', BAND_TEXT[metric.band])}>
                    {metric.band}
                  </span>
                </td>
                {/* Trend sparkline - hidden on mobile */}
                <td className="py-2 px-3 hidden md:table-cell">
                  {metric.trend.length > 1 && (
                    <div className="w-20">
                      <MiniSparkline
                        data={metric.trend}
                        color={SPARKLINE_COLORS[metric.band]}
                        height={24}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No metrics available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
