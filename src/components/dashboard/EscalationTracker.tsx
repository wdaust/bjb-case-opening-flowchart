import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface EscalationItem {
  id: string;
  metricName: string;
  layerName: string;
  currentValue: number;
  target: number;
  unit: string;
  weeksInRed: number;
  escalationLevel: 'unit-review' | 'manager' | 'vp' | 'executive';
  owner: string;
  office: string;
}

interface EscalationTrackerProps {
  escalations: EscalationItem[];
  className?: string;
}

const STEPS: { key: EscalationItem['escalationLevel']; label: string; week: string }[] = [
  { key: 'unit-review', label: 'Unit Review', week: 'Wk 1' },
  { key: 'manager', label: 'Manager', week: 'Wk 2' },
  { key: 'vp', label: 'VP Review', week: 'Wk 3' },
  { key: 'executive', label: 'Executive', week: 'Wk 4+' },
];

const LEVEL_INDEX: Record<EscalationItem['escalationLevel'], number> = {
  'unit-review': 0,
  'manager': 1,
  'vp': 2,
  'executive': 3,
};

function StepIndicator({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isPast = i < activeIndex;
        const isActive = i === activeIndex;
        const isFuture = i > activeIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-3 h-3 rounded-full border-2 transition-colors',
                  isPast && 'bg-red-500 border-red-500',
                  isActive && 'bg-red-500 border-red-500 ring-2 ring-red-500/30',
                  isFuture && 'bg-transparent border-muted-foreground/40',
                )}
              />
              <span
                className={cn(
                  'text-[9px] mt-0.5 whitespace-nowrap',
                  (isPast || isActive) ? 'text-red-500 font-medium' : 'text-muted-foreground/60',
                )}
              >
                {step.week}
              </span>
            </div>
            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-5 h-0.5 -mt-3',
                  i < activeIndex ? 'bg-red-500' : 'bg-muted-foreground/20',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EscalationTracker({ escalations, className }: EscalationTrackerProps) {
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...escalations].sort((a, b) => {
      const cmp = a.weeksInRed - b.weeksInRed;
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [escalations, sortDir]);

  function toggleSort() {
    setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Escalation Tracker</h3>
        <span className="text-xs text-muted-foreground">{escalations.length} item{escalations.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Step legend */}
      <div className="flex items-center gap-4 mb-4 text-[10px] text-muted-foreground">
        {STEPS.map(step => (
          <span key={step.key}>{step.week}: {step.label}</span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Metric</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Layer</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Current vs Target</th>
              <th
                onClick={toggleSort}
                className="text-left py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
              >
                <span className="inline-flex items-center gap-1">
                  Weeks in Red
                  {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Escalation</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Owner</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Office</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <tr
                key={item.id}
                className={cn(
                  'border-b border-border last:border-0',
                  i % 2 === 0 ? 'bg-card' : 'bg-table-stripe',
                )}
              >
                <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">
                  {item.metricName}
                </td>
                <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                  {item.layerName}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span className="text-red-500 font-medium">{item.currentValue}{item.unit}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-muted-foreground">{item.target}{item.unit}</span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center gap-1.5 text-red-500 font-semibold">
                    {item.weeksInRed}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <StepIndicator activeIndex={LEVEL_INDEX[item.escalationLevel]} />
                </td>
                <td className="py-2.5 px-3 text-foreground whitespace-nowrap">{item.owner}</td>
                <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{item.office}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No active escalations
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
