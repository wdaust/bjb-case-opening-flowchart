
import { cn } from '../../utils/cn.ts';
import type { ActionTrigger } from '../../data/scoringData.ts';

interface ActionTriggersPanelProps {
  triggers: ActionTrigger[];
  currentScore: number;
}

const colorMap: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
};

export function ActionTriggersPanel({
  triggers,
  currentScore,
}: ActionTriggersPanelProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Action Triggers</h3>
      <div className="space-y-2">
        {triggers.map((trigger, idx) => {
          const isActive =
            currentScore >= trigger.min && currentScore <= trigger.max;
          return (
            <div
              key={idx}
              className={cn(
                'rounded-lg border border-border bg-card p-3 transition-all duration-200',
                isActive
                  ? 'ring-2 ring-primary scale-[1.02]'
                  : 'opacity-50'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-1 h-3 w-3 shrink-0 rounded-full',
                    colorMap[trigger.color] ?? 'bg-gray-500'
                  )}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {trigger.min}–{trigger.max}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {trigger.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {trigger.action}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
