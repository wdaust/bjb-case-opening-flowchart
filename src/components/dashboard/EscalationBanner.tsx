import { useState } from 'react';
import { cn } from '../../utils/cn';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Escalation {
  id: string;
  metricName: string;
  layerName: string;
  weeksInRed: number;
  escalationLevel: 'unit-review' | 'manager' | 'vp' | 'executive';
}

interface EscalationBannerProps {
  escalations: Escalation[];
  className?: string;
}

const LEVEL_LABELS: Record<Escalation['escalationLevel'], string> = {
  'unit-review': 'Unit Review',
  'manager': 'Manager',
  'vp': 'VP',
  'executive': 'Executive',
};

const LEVEL_CLASSES: Record<Escalation['escalationLevel'], string> = {
  'unit-review': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'manager': 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  'vp': 'bg-red-500/15 text-red-600 dark:text-red-400',
  'executive': 'bg-red-600/20 text-red-700 dark:text-red-300',
};

function countByLevel(escalations: Escalation[]): string {
  const counts: Partial<Record<Escalation['escalationLevel'], number>> = {};
  for (const e of escalations) {
    counts[e.escalationLevel] = (counts[e.escalationLevel] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([level, count]) => `${count} ${LEVEL_LABELS[level as Escalation['escalationLevel']]}`)
    .join(', ');
}

export function EscalationBanner({ escalations, className }: EscalationBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (escalations.length === 0) return null;

  const visibleItems = escalations.slice(0, 5);
  const remaining = escalations.length - 5;

  return (
    <div
      className={cn(
        'rounded-lg border border-red-500/30 bg-red-500/10 dark:bg-red-500/5',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <AlertTriangle size={16} className="shrink-0 text-red-500" />
        <span className="flex-1 text-sm font-medium text-red-600 dark:text-red-400">
          {escalations.length} active escalation{escalations.length !== 1 ? 's' : ''}
          <span className="ml-2 text-xs font-normal text-red-500/80 dark:text-red-400/70">
            ({countByLevel(escalations)})
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
          expanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="border-t border-red-500/20 px-4 py-2 space-y-1.5">
          {visibleItems.map(esc => (
            <div
              key={esc.id}
              className="flex items-center gap-3 text-sm text-foreground"
            >
              <span className="font-medium truncate min-w-0 flex-1">
                {esc.metricName}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {esc.layerName}
              </span>
              <span className="text-xs text-red-500 shrink-0">
                {esc.weeksInRed}w in red
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0',
                  LEVEL_CLASSES[esc.escalationLevel],
                )}
              >
                {LEVEL_LABELS[esc.escalationLevel]}
              </span>
            </div>
          ))}
          {remaining > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              and {remaining} more...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
