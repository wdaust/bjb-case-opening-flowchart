import { getTopStageAgeMetrics, type StageAgeMetric } from '../data/mockData';

/* ── shared types ──────────────────────────────────────────────── */
interface VizProps {
  metrics: StageAgeMetric[];
}

/* ================================================================
   OPTION A — Bullet Chart
   Compact horizontal bar: qualitative ranges (green/yellow/red),
   dark bar for median, thin line marker for P90, vertical SLA line
   ================================================================ */
function BulletChart({ metrics }: VizProps) {
  const barH = 24;
  const labelW = 130;
  const chartW = 320;
  const rowH = 48;

  return (
    <div className="space-y-1">
      {metrics.map(m => {
        const max = m.slaTarget * 2;
        const scale = (v: number) => Math.min((v / max) * chartW, chartW);
        return (
          <div key={m.stage} className="flex items-center gap-2">
            {/* label */}
            <div className="shrink-0" style={{ width: labelW }}>
              <div className="text-xs font-semibold text-foreground truncate">{m.label}</div>
              <div className="text-[10px] text-muted-foreground">{m.count} cases</div>
            </div>
            {/* chart */}
            <svg width={chartW} height={rowH} className="shrink-0">
              {/* qualitative ranges */}
              <rect x={0} y={(rowH - barH) / 2} width={scale(m.slaTarget * 0.5)} height={barH} rx={3} fill="#22c55e" opacity={0.18} />
              <rect x={scale(m.slaTarget * 0.5)} y={(rowH - barH) / 2} width={scale(m.slaTarget * 0.8) - scale(m.slaTarget * 0.5)} height={barH} fill="#eab308" opacity={0.18} />
              <rect x={scale(m.slaTarget * 0.8)} y={(rowH - barH) / 2} width={chartW - scale(m.slaTarget * 0.8)} height={barH} fill="#ef4444" opacity={0.18} />

              {/* median bar */}
              <rect x={0} y={(rowH - 10) / 2} width={scale(m.medianAge)} height={10} rx={2} fill="#3b82f6" opacity={0.85} />

              {/* P90 marker line */}
              <line x1={scale(m.p90Age)} y1={(rowH - barH) / 2 - 2} x2={scale(m.p90Age)} y2={(rowH + barH) / 2 + 2} stroke="#f97316" strokeWidth={2.5} />

              {/* SLA target line */}
              <line x1={scale(m.slaTarget)} y1={(rowH - barH) / 2 - 4} x2={scale(m.slaTarget)} y2={(rowH + barH) / 2 + 4} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="3,2" />
              <text x={scale(m.slaTarget)} y={(rowH - barH) / 2 - 6} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">SLA {m.slaTarget}d</text>
            </svg>
          </div>
        );
      })}
      {/* legend */}
      <div className="flex items-center gap-4 pt-2 pl-1 text-[10px] text-muted-foreground" style={{ marginLeft: labelW }}>
        <span className="flex items-center gap-1"><span className="inline-block w-6 h-2 rounded bg-blue-500 opacity-85" /> Median</span>
        <span className="flex items-center gap-1"><span className="inline-block w-0.5 h-3 bg-orange-500" style={{ width: 3 }} /> P90</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-foreground" /> SLA Target</span>
      </div>
    </div>
  );
}

/* ================================================================
   OPTION B — Horizontal Bar + Target Marker
   Paired median/P90 bars with vertical SLA target line
   ================================================================ */
function HorizontalBars({ metrics }: VizProps) {
  const labelW = 130;
  const chartW = 320;
  const barH = 8;
  const rowH = 52;

  return (
    <div className="space-y-1">
      {metrics.map(m => {
        const max = m.slaTarget * 2;
        const scale = (v: number) => Math.min((v / max) * chartW, chartW);
        return (
          <div key={m.stage} className="flex items-center gap-2">
            <div className="shrink-0" style={{ width: labelW }}>
              <div className="text-xs font-semibold text-foreground truncate">{m.label}</div>
              <div className="text-[10px] text-muted-foreground">{m.count} cases</div>
            </div>
            <svg width={chartW} height={rowH} className="shrink-0">
              {/* background */}
              <rect x={0} y={0} width={chartW} height={rowH} rx={4} fill="hsl(var(--muted))" opacity={0.1} />

              {/* median bar */}
              <rect x={0} y={14} width={scale(m.medianAge)} height={barH} rx={4} fill="#3b82f6" />
              <text x={scale(m.medianAge) + 4} y={14 + barH - 1} fontSize="9" fill="#3b82f6" fontWeight="600">{m.medianAge}d</text>

              {/* P90 bar */}
              <rect x={0} y={28} width={scale(m.p90Age)} height={barH} rx={4} fill="#f97316" />
              <text x={scale(m.p90Age) + 4} y={28 + barH - 1} fontSize="9" fill="#f97316" fontWeight="600">{m.p90Age}d</text>

              {/* SLA target line */}
              <line x1={scale(m.slaTarget)} y1={8} x2={scale(m.slaTarget)} y2={42} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="4,2" opacity={0.5} />
            </svg>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-2 pl-1 text-[10px] text-muted-foreground" style={{ marginLeft: labelW }}>
        <span className="flex items-center gap-1"><span className="inline-block w-6 h-2 rounded bg-blue-500" /> Median</span>
        <span className="flex items-center gap-1"><span className="inline-block w-6 h-2 rounded bg-orange-500" /> P90</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-foreground opacity-50" /> SLA</span>
      </div>
    </div>
  );
}

/* ================================================================
   OPTION C — Spark Strip (compact table rows)
   Tiny inline progress bars in a tight table layout
   ================================================================ */
function SparkStrip({ metrics }: VizProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* header */}
      <div className="grid grid-cols-[1fr_60px_60px_60px_140px] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        <span>Stage</span>
        <span className="text-right">Median</span>
        <span className="text-right">P90</span>
        <span className="text-right">SLA</span>
        <span className="text-center">Distribution</span>
      </div>
      {metrics.map(m => {
        const max = m.slaTarget * 2;
        const medPct = Math.min((m.medianAge / max) * 100, 100);
        const p90Pct = Math.min((m.p90Age / max) * 100, 100);
        const slaPct = Math.min((m.slaTarget / max) * 100, 100);
        const medColor = m.medianAge > m.slaTarget ? '#ef4444' : m.medianAge > m.slaTarget * 0.8 ? '#eab308' : '#22c55e';
        const p90Color = m.p90Age > m.slaTarget ? '#ef4444' : m.p90Age > m.slaTarget * 0.8 ? '#eab308' : '#22c55e';
        return (
          <div key={m.stage} className="grid grid-cols-[1fr_60px_60px_60px_140px] gap-2 px-3 py-2.5 border-t border-border items-center">
            <div>
              <div className="text-xs font-semibold text-foreground truncate">{m.label}</div>
              <div className="text-[10px] text-muted-foreground">{m.count} cases</div>
            </div>
            <div className="text-right text-xs font-bold" style={{ color: medColor }}>{m.medianAge}d</div>
            <div className="text-right text-xs font-bold" style={{ color: p90Color }}>{m.p90Age}d</div>
            <div className="text-right text-xs text-muted-foreground">{m.slaTarget}d</div>
            <div className="relative h-5 bg-muted/30 rounded-full overflow-hidden">
              {/* median bar */}
              <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500 opacity-70" style={{ width: `${medPct}%` }} />
              {/* P90 tick */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-orange-500" style={{ left: `${p90Pct}%` }} />
              {/* SLA tick */}
              <div className="absolute top-0 bottom-0 w-px bg-foreground opacity-40" style={{ left: `${slaPct}%`, borderLeft: '1px dashed' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   OPTION D — Dot Plot / Lollipop
   Horizontal axis, median & P90 as dots connected by thin line
   ================================================================ */
function DotPlot({ metrics }: VizProps) {
  const labelW = 130;
  const chartW = 320;
  const rowH = 40;

  const globalMax = Math.max(...metrics.map(m => m.slaTarget * 2));
  const scale = (v: number) => Math.min((v / globalMax) * chartW, chartW);

  return (
    <div className="space-y-0">
      {metrics.map(m => (
        <div key={m.stage} className="flex items-center gap-2">
          <div className="shrink-0" style={{ width: labelW }}>
            <div className="text-xs font-semibold text-foreground truncate">{m.label}</div>
            <div className="text-[10px] text-muted-foreground">{m.count} cases · SLA {m.slaTarget}d</div>
          </div>
          <svg width={chartW} height={rowH} className="shrink-0">
            {/* axis line */}
            <line x1={0} y1={rowH / 2} x2={chartW} y2={rowH / 2} stroke="hsl(var(--muted))" strokeWidth={1} />

            {/* SLA marker */}
            <line x1={scale(m.slaTarget)} y1={6} x2={scale(m.slaTarget)} y2={rowH - 6} stroke="hsl(var(--foreground))" strokeWidth={1} strokeDasharray="3,2" opacity={0.35} />

            {/* connecting line between median and P90 */}
            <line x1={scale(m.medianAge)} y1={rowH / 2} x2={scale(m.p90Age)} y2={rowH / 2} stroke="hsl(var(--foreground))" strokeWidth={2} opacity={0.2} />

            {/* median dot */}
            <circle cx={scale(m.medianAge)} cy={rowH / 2} r={5} fill="#3b82f6" />
            <text x={scale(m.medianAge)} y={rowH / 2 - 9} textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">{m.medianAge}d</text>

            {/* P90 dot */}
            <circle cx={scale(m.p90Age)} cy={rowH / 2} r={5} fill="#f97316" />
            <text x={scale(m.p90Age)} y={rowH / 2 - 9} textAnchor="middle" fontSize="9" fill="#f97316" fontWeight="600">{m.p90Age}d</text>
          </svg>
        </div>
      ))}
      {/* axis labels */}
      <div className="flex items-center gap-4 pt-2 pl-1 text-[10px] text-muted-foreground" style={{ marginLeft: labelW }}>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Median</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" /> P90</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-foreground opacity-35" /> SLA</span>
      </div>
    </div>
  );
}

/* ================================================================
   OPTION E — Stacked KPI Cards
   Bold numbers, color-coded backgrounds, no chart
   ================================================================ */
function KpiCards({ metrics }: VizProps) {
  const statusColor = (value: number, sla: number) => {
    if (value > sla) return { bg: 'bg-red-500/15', text: 'text-red-500', border: 'border-red-500/30' };
    if (value > sla * 0.8) return { bg: 'bg-yellow-500/15', text: 'text-yellow-500', border: 'border-yellow-500/30' };
    return { bg: 'bg-green-500/15', text: 'text-green-500', border: 'border-green-500/30' };
  };

  return (
    <div className="space-y-3">
      {metrics.map(m => {
        const medStatus = statusColor(m.medianAge, m.slaTarget);
        const p90Status = statusColor(m.p90Age, m.slaTarget);
        return (
          <div key={m.stage} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-foreground">{m.label}</div>
                <div className="text-[10px] text-muted-foreground">{m.count} cases · SLA {m.slaTarget}d</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className={`flex-1 rounded-md border ${medStatus.border} ${medStatus.bg} p-2.5 text-center`}>
                <div className={`text-2xl font-bold ${medStatus.text}`}>{m.medianAge}d</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Median</div>
              </div>
              <div className={`flex-1 rounded-md border ${p90Status.border} ${p90Status.bg} p-2.5 text-center`}>
                <div className={`text-2xl font-bold ${p90Status.text}`}>{m.p90Age}d</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">P90</div>
              </div>
              <div className="flex-1 rounded-md border border-border bg-muted/20 p-2.5 text-center">
                <div className="text-2xl font-bold text-foreground">{m.slaTarget}d</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">SLA Target</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   PAGE
   ================================================================ */
const options: { key: string; name: string; desc: string; Component: React.FC<VizProps> }[] = [
  { key: 'A', name: 'Bullet Chart', desc: 'Compact bars with qualitative ranges + SLA target line', Component: BulletChart },
  { key: 'B', name: 'Horizontal Bars', desc: 'Paired median/P90 bars with SLA target marker', Component: HorizontalBars },
  { key: 'C', name: 'Spark Strip', desc: 'Compact table rows with inline mini-bars', Component: SparkStrip },
  { key: 'D', name: 'Dot Plot', desc: 'Median & P90 dots on a shared axis per stage', Component: DotPlot },
  { key: 'E', name: 'KPI Cards', desc: 'Bold color-coded numbers — no chart at all', Component: KpiCards },
];

export default function GaugeOptions() {
  const metrics = getTopStageAgeMetrics();

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Pick a Visualization Style</h1>
      <p className="text-sm text-muted-foreground mb-6">
        All options show the same 3 stages with real data. Pick your favorite.
      </p>

      <div className="space-y-8">
        {options.map(({ key, name, desc, Component }) => (
          <div key={key} className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-semibold text-foreground mb-0.5">
              Option {key} — {name}
            </div>
            <div className="text-[11px] text-muted-foreground mb-4">{desc}</div>
            <Component metrics={metrics} />
          </div>
        ))}
      </div>
    </div>
  );
}
