import { StatCard } from '../dashboard/StatCard.tsx';
import { DashboardGrid } from '../dashboard/DashboardGrid.tsx';
import type { ReportAggregate } from '../../types/salesforce.ts';

interface Props {
  totals: ReportAggregate[];
  className?: string;
}

function formatValue(val: number | null): string {
  if (val === null) return '—';
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString();
}

export function KpiStrip({ totals, className }: Props) {
  const cols = Math.min(totals.length, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  return (
    <DashboardGrid cols={cols} className={className}>
      {totals.map((t, i) => (
        <StatCard
          key={i}
          label={t.label}
          value={formatValue(t.value)}
          variant="glass"
        />
      ))}
    </DashboardGrid>
  );
}
