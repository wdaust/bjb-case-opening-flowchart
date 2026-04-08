import { cn } from '../../utils/cn';
import type { StageAggregate } from '../../utils/litProgMetrics';

interface Props {
  aggregate: StageAggregate;
  isExpanded: boolean;
  onClick: () => void;
}

const RAG_COLORS = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function StageCard({ aggregate, isExpanded, onClick }: Props) {
  const { label, totalItems, pctTimely, greenCount, amberCount, redCount } = aggregate;
  const total = greenCount + amberCount + redCount;
  const greenPct = total ? (greenCount / total) * 100 : 100;
  const amberPct = total ? (amberCount / total) * 100 : 0;
  const redPct = total ? (redCount / total) * 100 : 0;

  // Worst color determines card accent
  const worstColor = redCount > 0 ? 'red' : amberCount > 0 ? 'amber' : 'green';
  const borderColor = {
    green: 'border-green-500/30',
    amber: 'border-amber-500/30',
    red: 'border-red-500/30',
  }[worstColor];

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative bg-card rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] cursor-pointer',
        borderColor,
        isExpanded && 'ring-2 ring-white/20 scale-[1.02]',
      )}
    >
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">
        {totalItems.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5 mb-3">
        {pctTimely}% on track
      </div>

      {/* Stacked progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
        {greenPct > 0 && (
          <div className={cn(RAG_COLORS.green, 'transition-all')} style={{ width: `${greenPct}%` }} />
        )}
        {amberPct > 0 && (
          <div className={cn(RAG_COLORS.amber, 'transition-all')} style={{ width: `${amberPct}%` }} />
        )}
        {redPct > 0 && (
          <div className={cn(RAG_COLORS.red, 'transition-all')} style={{ width: `${redPct}%` }} />
        )}
      </div>

      {/* RAG legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{greenCount}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{amberCount}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{redCount}</span>
      </div>
    </button>
  );
}
