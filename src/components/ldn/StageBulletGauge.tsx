import type { BulletGauge } from '../../utils/ldnMetrics';

interface Props {
  gauge: BulletGauge;
  className?: string;
}

/** Bullet chart gauge: qualitative range bands, median bar, P90 tick, SLA dashed line. */
export function StageBulletGauge({ gauge, className }: Props) {
  // When no aging data exists, show a compact message instead of misleading 0d values
  if (gauge.noAgingData) {
    return (
      <div className={className}>
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-sm font-semibold text-foreground truncate">{gauge.label}</div>
          <div className="text-[10px] text-muted-foreground shrink-0 ml-2">{gauge.count} items</div>
        </div>
        <div className="flex items-center h-10 px-3 rounded bg-muted/30 border border-border/50">
          <span className="text-xs text-muted-foreground">
            {gauge.label === 'Service'
              ? 'All items in this report are past due'
              : 'No aging data available for this stage'}
          </span>
        </div>
      </div>
    );
  }

  const barH = 22;
  const chartH = 40;
  const max = gauge.slaTarget * 2;
  const pct = (v: number) => `${Math.min((v / max) * 100, 100)}%`;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-semibold text-foreground truncate">{gauge.label}</div>
        <div className="text-[10px] text-muted-foreground shrink-0 ml-2">{gauge.count} items</div>
      </div>

      {/* bullet chart */}
      <div className="relative w-full" style={{ height: chartH }}>
        {/* qualitative ranges */}
        <div className="absolute inset-0 flex rounded" style={{ top: (chartH - barH) / 2, height: barH }}>
          <div className="rounded-l" style={{ width: pct(gauge.slaTarget * 0.8), background: 'rgba(34,197,94,0.18)' }} />
          <div style={{ width: pct(gauge.slaTarget * 0.2), background: 'rgba(234,179,8,0.18)' }} />
          <div className="flex-1 rounded-r" style={{ background: 'rgba(239,68,68,0.18)' }} />
        </div>

        {/* median bar */}
        <div
          className="absolute rounded"
          style={{
            top: (chartH - 10) / 2,
            height: 10,
            width: pct(gauge.medianAge),
            background: '#3b82f6',
            opacity: 0.85,
          }}
        />

        {/* P90 marker */}
        <div
          className="absolute bg-orange-500"
          style={{
            left: pct(gauge.p90Age),
            top: (chartH - barH) / 2 - 2,
            height: barH + 4,
            width: 2.5,
          }}
        />

        {/* SLA target line */}
        <div
          className="absolute border-l border-dashed border-foreground/50"
          style={{
            left: pct(gauge.slaTarget),
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
          <span className="font-semibold text-blue-500">{gauge.medianAge}d</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0.5 h-2.5 bg-orange-500" style={{ width: 2.5 }} />
          <span className="text-muted-foreground">P90</span>
          <span className="font-semibold text-orange-500">{gauge.p90Age}d</span>
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <span className="inline-block w-3 border-t border-dashed border-foreground/50" />
          <span className="text-muted-foreground">SLA {gauge.slaTarget}d</span>
        </span>
      </div>
    </div>
  );
}
