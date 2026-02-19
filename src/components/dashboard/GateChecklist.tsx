import { cn } from '../../utils/cn';
import { CheckCircle2, Circle } from 'lucide-react';
import type { GateItem } from '../../data/mockData';

interface Props {
  gates: GateItem[];
  interactive?: boolean;
  onToggle?: (index: number) => void;
  className?: string;
}

export function GateChecklist({ gates, interactive = false, onToggle, className }: Props) {
  const completed = gates.filter(g => g.completed).length;
  const total = gates.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground shrink-0">{completed}/{total} ({pct}%)</span>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {gates.map((gate, i) => (
          <div
            key={i}
            onClick={interactive ? () => onToggle?.(i) : undefined}
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded text-sm",
              interactive && "cursor-pointer hover:bg-accent/50",
            )}
          >
            {gate.completed ? (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            ) : (
              <Circle size={16} className="text-muted-foreground shrink-0" />
            )}
            <span className={cn(
              "text-sm",
              gate.completed ? "text-muted-foreground line-through" : "text-foreground",
            )}>
              {gate.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
