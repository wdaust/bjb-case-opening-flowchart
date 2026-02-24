import { cn } from '../../utils/cn';
import { Phone, MessageSquare, Mail, FileText, UserCircle } from 'lucide-react';

interface PursuitStep {
  step: number;
  label: string;
  owner: string;
  sla: string;
  method: 'call' | 'sms' | 'email' | 'letter' | 'attorney-call';
  timing: string;
}

interface PursuitLadderProps {
  steps: PursuitStep[];
  complianceRates?: number[];
  className?: string;
}

const METHOD_ICONS: Record<PursuitStep['method'], typeof Phone> = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  letter: FileText,
  'attorney-call': UserCircle,
};

const METHOD_LABELS: Record<PursuitStep['method'], string> = {
  call: 'Call',
  sms: 'SMS',
  email: 'Email',
  letter: 'Letter',
  'attorney-call': 'Attorney Call',
};

function complianceColor(rate: number): {
  bar: string;
  text: string;
  line: string;
} {
  if (rate >= 90)
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      line: 'bg-emerald-500',
    };
  if (rate >= 75)
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      line: 'bg-amber-500',
    };
  return {
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    line: 'bg-red-500',
  };
}

export function PursuitLadder({ steps, complianceRates, className }: PursuitLadderProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Pursuit Ladder</h3>

      <div className="relative">
        {steps.map((step, i) => {
          const Icon = METHOD_ICONS[step.method];
          const rate = complianceRates?.[i];
          const colors = rate != null ? complianceColor(rate) : null;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.step} className="flex gap-3">
              {/* Left column: circle + line */}
              <div className="flex flex-col items-center shrink-0">
                {/* Step circle */}
                <div className="w-8 h-8 rounded-full border-2 border-border bg-card flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                  {step.step}
                </div>
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-[24px]',
                      colors ? colors.line : 'bg-muted-foreground/20',
                    )}
                  />
                )}
              </div>

              {/* Right column: content */}
              <div className={cn('flex-1 min-w-0 pb-4', isLast && 'pb-0')}>
                {/* Top row: label + method */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {step.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 shrink-0">
                    <Icon size={10} />
                    {METHOD_LABELS[step.method]}
                  </span>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-2">
                  <span>Owner: <span className="text-foreground">{step.owner}</span></span>
                  <span>Timing: <span className="text-foreground">{step.timing}</span></span>
                  <span>SLA: <span className="text-foreground">{step.sla}</span></span>
                </div>

                {/* Compliance bar */}
                {rate != null && colors && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', colors.bar)}
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-semibold tabular-nums shrink-0', colors.text)}>
                      {rate}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
