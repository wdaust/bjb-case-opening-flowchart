import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn.ts';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ReportGrouping } from '../../types/salesforce.ts';

interface Props {
  groupings: ReportGrouping[];
  className?: string;
}

interface GroupRow {
  _key: string;
  label: string;
  [aggKey: string]: string | number | null;
}

function getPercentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function ReportSummaryTable({ groupings, className }: Props) {
  if (groupings.length === 0) return null;

  const aggLabels = groupings[0]?.aggregates.map(a => a.label) ?? [];

  // Build data rows
  const data: GroupRow[] = groupings.map(g => {
    const row: GroupRow = { _key: g.key, label: g.label };
    g.aggregates.forEach((a, i) => {
      row[`agg_${i}`] = a.value;
    });
    return row;
  });

  // Compute column max values for inline bars
  const columnMaxes: Record<string, number> = {};
  aggLabels.forEach((_, i) => {
    const key = `agg_${i}`;
    const vals = data.map(r => (typeof r[key] === 'number' ? (r[key] as number) : 0));
    columnMaxes[key] = Math.max(...vals, 1);
  });

  // Compute percentile thresholds based on first numeric column
  const firstAggKey = 'agg_0';
  const firstColValues = data
    .map(r => (typeof r[firstAggKey] === 'number' ? (r[firstAggKey] as number) : 0))
    .filter(v => v > 0);
  const p75 = firstColValues.length > 0 ? getPercentile(firstColValues, 75) : Infinity;
  const p90 = firstColValues.length > 0 ? getPercentile(firstColValues, 90) : Infinity;

  // Default sort: descending by first numeric column
  const [sortKey, setSortKey] = useState<string>(firstAggKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function getRowBorder(row: GroupRow): string {
    const v = typeof row[firstAggKey] === 'number' ? (row[firstAggKey] as number) : 0;
    if (v >= p90) return 'border-l-2 border-l-red-500';
    if (v >= p75) return 'border-l-2 border-l-amber-500';
    return '';
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th
              onClick={() => handleSort('label')}
              className="text-left py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
            >
              <span className="inline-flex items-center gap-1">
                Group
                {sortKey === 'label' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </span>
            </th>
            {aggLabels.map((label, i) => (
              <th
                key={i}
                onClick={() => handleSort(`agg_${i}`)}
                className="text-left py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  {sortKey === `agg_${i}` && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row._key ?? i}
              className={cn(
                'border-b border-border last:border-0 transition-colors',
                i % 2 === 0 ? 'bg-card' : 'bg-table-stripe',
                getRowBorder(row),
              )}
            >
              <td className="py-2 px-3 text-foreground whitespace-nowrap">{row.label}</td>
              {aggLabels.map((_, ai) => {
                const key = `agg_${ai}`;
                const v = row[key];
                const numVal = typeof v === 'number' ? v : 0;
                const pct = (numVal / columnMaxes[key]) * 100;
                const barColor = numVal >= p90 ? '#ef4444' : numVal >= p75 ? '#f59e0b' : '#3b82f6';
                return (
                  <td key={key} className="py-2 px-3 text-foreground whitespace-nowrap">
                    <div className="relative">
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm opacity-15"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                      <span className="relative">
                        {v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString() : String(v)}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={1 + aggLabels.length} className="py-8 text-center text-muted-foreground">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
