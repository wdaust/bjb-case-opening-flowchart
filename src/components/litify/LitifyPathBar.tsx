import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

// ── Types ──────────────────────────────────────────────────────────────

export interface PathBarStage {
  label: string;
  done: number;
  total: number;
  isComplete: boolean;
  isActive: boolean;
}

interface LitifyPathBarProps {
  stages: PathBarStage[];
  onStageClick: (stage: PathBarStage) => void;
  /** Optional line shown below the chevrons, e.g. "Current: Task X - Assignee" */
  currentTaskLabel?: string;
}

// ── Component ──────────────────────────────────────────────────────────

export function LitifyPathBar({ stages, onStageClick, currentTaskLabel }: LitifyPathBarProps) {
  return (
    <>
      <style>{`
        .chevron-arrow {
          width: 0;
          height: 0;
          border-top: 18px solid transparent;
          border-bottom: 18px solid transparent;
          border-left-width: 14px;
          border-left-style: solid;
          flex-shrink: 0;
        }
        .chevron-future-bg { background-color: #e5e7eb; color: #4b5563; }
        .dark .chevron-future-bg { background-color: #374151; color: #d1d5db; }
        .chevron-future-arrow { border-left-color: #e5e7eb; }
        .dark .chevron-future-arrow { border-left-color: #374151; }
      `}</style>
      <div className="rounded-lg border border-border bg-card shadow-sm p-4">
        <div className="flex items-center">
          {stages.map((stage, idx) => {
            const activeStageIdx = stages.findIndex((s) => s.isActive);
            const isPast = activeStageIdx >= 0 && idx < activeStageIdx && !stage.isComplete;
            const isFuture = !stage.isComplete && !stage.isActive && !isPast;

            const fillColor = stage.isComplete
              ? '#16a34a'
              : stage.isActive
              ? '#2563eb'
              : isPast
              ? '#15803d'
              : undefined;

            const textColorClass = isFuture ? '' : 'text-white';
            const isLast = idx === stages.length - 1;

            return (
              <button
                key={stage.label}
                onClick={() => onStageClick(stage)}
                className="flex items-center hover:opacity-90 transition-opacity"
                style={{
                  zIndex: stages.length - idx,
                  marginLeft: idx > 0 ? '-14px' : 0,
                }}
                title={`${stage.label} (${stage.done}/${stage.total})`}
              >
                <div
                  className={cn(
                    'flex items-center gap-1.5 h-9 text-[11px] font-semibold whitespace-nowrap',
                    textColorClass,
                    isFuture && 'chevron-future-bg',
                    idx === 0 && 'rounded-l-md',
                    isLast && 'rounded-r-md',
                  )}
                  style={{
                    backgroundColor: fillColor || undefined,
                    paddingLeft: idx === 0 ? '12px' : '20px',
                    paddingRight: isLast ? '12px' : '8px',
                  }}
                >
                  {stage.isComplete && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                  {stage.isActive && !stage.isComplete && (
                    <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse shrink-0" />
                  )}
                  <span>{stage.label}</span>
                </div>
                {!isLast && (
                  <div
                    className={cn('chevron-arrow', isFuture && 'chevron-future-arrow')}
                    style={fillColor ? { borderLeftColor: fillColor } : undefined}
                  />
                )}
              </button>
            );
          })}
        </div>
        {currentTaskLabel && (
          <div className="mt-2 text-xs text-muted-foreground">
            Current: <span className="font-semibold text-foreground">{currentTaskLabel}</span>
          </div>
        )}
      </div>
    </>
  );
}
