import { DashboardGrid } from './DashboardGrid';
import type { StageAgeMetric } from '../../data/mockData';

interface Props {
  metrics: StageAgeMetric[];
}

/** Bullet chart card: qualitative ranges, median bar, P90 tick, SLA target line. */
function BulletCard({ m }: { m: StageAgeMetric }) {
  const barH = 22;
  const chartH = 40;
  const max = m.slaTarget * 2;
  const pct = (v: number) => `${Math.min((v / max) * 100, 100)}%`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-semibold text-foreground truncate">{m.label}</div>
        <div className="text-[10px] text-muted-foreground shrink-0 ml-2">{m.count} cases</div>
      </div>

      {/* bullet chart */}
      <div className="relative w-full" style={{ height: chartH }}>
        {/* qualitative ranges */}
        <div className="absolute inset-0 flex rounded" style={{ top: (chartH - barH) / 2, height: barH }}>
          <div className="rounded-l" style={{ width: pct(m.slaTarget * 0.5), background: 'rgba(34,197,94,0.18)' }} />
          <div style={{ width: pct(m.slaTarget * 0.3), background: 'rgba(234,179,8,0.18)' }} />
          <div className="flex-1 rounded-r" style={{ background: 'rgba(239,68,68,0.18)' }} />
        </div>

        {/* median bar */}
        <div
          className="absolute rounded"
          style={{
            top: (chartH - 10) / 2,
            height: 10,
            width: pct(m.medianAge),
            background: '#3b82f6',
            opacity: 0.85,
          }}
        />

        {/* P90 marker */}
        <div
          className="absolute bg-orange-500"
          style={{
            left: pct(m.p90Age),
            top: (chartH - barH) / 2 - 2,
            height: barH + 4,
            width: 2.5,
          }}
        />

        {/* SLA target line */}
        <div
          className="absolute border-l border-dashed border-foreground/50"
          style={{
            left: pct(m.slaTarget),
            top: (chartH - barH) / 2 - 4,
            height: barH + 8,
          }}
        />
      </div>

      {/* values row */}
      <div className="flex items-center gap-3 mt-1 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 h-1.5 rounded bg-blue-500 opacity-85" />
          <span className="text-muted-foreground">Med</span>
          <span className="font-semibold text-blue-500">{m.medianAge}d</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0.5 h-2.5 bg-orange-500" style={{ width: 2.5 }} />
          <span className="text-muted-foreground">P90</span>
          <span className="font-semibold text-orange-500">{m.p90Age}d</span>
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <span className="inline-block w-3 border-t border-dashed border-foreground/50" />
          <span className="text-muted-foreground">SLA {m.slaTarget}d</span>
        </span>
      </div>
    </div>
  );
}

export function StageAgeGauges({ metrics }: Props) {
  return (
    <DashboardGrid cols={2}>
      {metrics.map(m => (
        <BulletCard key={m.stage} m={m} />
      ))}
    </DashboardGrid>
  );
}
