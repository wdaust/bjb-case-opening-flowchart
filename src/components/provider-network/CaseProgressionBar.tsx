import { cn } from '../../utils/cn.ts';
import { CASE_STAGES, type CaseStage } from '../../data/providerNetworkData.ts';

interface Props {
  currentStage: CaseStage;
  compact?: boolean;
}

export function CaseProgressionBar({ currentStage, compact }: Props) {
  const currentIdx = CASE_STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center gap-0.5">
      {CASE_STAGES.map((stage, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={stage} className="flex items-center gap-0.5">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'rounded-full flex items-center justify-center transition-colors',
                  compact ? 'w-4 h-4' : 'w-5 h-5',
                  isActive
                    ? isCurrent
                      ? 'bg-primary ring-2 ring-primary/30'
                      : 'bg-primary/60'
                    : 'bg-muted/50'
                )}
              >
                {isActive && (
                  <span className={cn('text-primary-foreground font-bold', compact ? 'text-[7px]' : 'text-[8px]')}>
                    {i + 1}
                  </span>
                )}
              </div>
              {!compact && (
                <span className={cn(
                  'text-[8px] mt-0.5 max-w-[60px] text-center leading-tight',
                  isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {stage}
                </span>
              )}
            </div>
            {i < CASE_STAGES.length - 1 && (
              <div className={cn(
                'h-0.5 transition-colors',
                compact ? 'w-3' : 'w-6',
                i < currentIdx ? 'bg-primary/60' : 'bg-muted/50'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
