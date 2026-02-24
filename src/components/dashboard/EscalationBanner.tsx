import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { AlertTriangle, ChevronDown, ChevronUp, ChevronRight, ExternalLink } from 'lucide-react';
import { attorneys } from '../../data/mockData';
import type { EscalationItem } from '../../data/lciEngine';

interface EscalationBannerProps {
  escalations: EscalationItem[];
  className?: string;
}

const LEVEL_LABELS: Record<EscalationItem['escalationLevel'], string> = {
  'unit-review': 'Unit Review',
  'manager': 'Manager',
  'vp': 'VP',
  'executive': 'Executive',
};

const LEVEL_CLASSES: Record<EscalationItem['escalationLevel'], string> = {
  'unit-review': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'manager': 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  'vp': 'bg-red-500/15 text-red-600 dark:text-red-400',
  'executive': 'bg-red-600/20 text-red-700 dark:text-red-300',
};

const REMEDIATION_MAP: Record<string, string[]> = {
  'Predictive Monetization': [
    'Review 90-day settlement forecast and recalibrate case valuations',
    'Audit low-value early settlements and flag for senior review',
    'Recalibrate modeled value vs. offer deltas with updated comps',
  ],
  'Revenue & Outcome Control': [
    'Audit weekly settlement targets against rolling 12-month baseline',
    'Review cycle time outliers and schedule accelerated mediations',
    'Assess mediation yield and escalate stalled negotiations',
  ],
  'Throughput Speed': [
    'Triage SLA breaches by sub-stage and assign corrective owners',
    'Reduce handoff delays between filing, service, and discovery',
    'Escalate service-of-process delays to operations lead',
  ],
  'SLA Compliance': [
    'Generate breach report by attorney and stage for management review',
    'Assign dedicated paralegals to highest-breach sub-stages',
    'Institute weekly SLA compliance reviews with unit leads',
  ],
  'Pressure & Enforcement': [
    'File overdue motions to compel on all 10+ day delinquent responses',
    'Audit enforcement action rate and assign follow-up deadlines',
    'Review litigation pressure index scores by attorney',
  ],
  'Inventory Health & Risk': [
    'Contact all cases with no activity >21 days for status update',
    'Schedule mediations for eligible cases within 14 days',
    'Review trial readiness risk and deadline compression flags',
  ],
  'Quality & Margin Protection': [
    'Audit recent pleadings for defect patterns and retrain staff',
    'Review discovery rework rate and identify root causes',
    'Monitor staff hours variance against budget and flag overruns',
  ],
};

function countByLevel(escalations: EscalationItem[]): string {
  const counts: Partial<Record<EscalationItem['escalationLevel'], number>> = {};
  for (const e of escalations) {
    counts[e.escalationLevel] = (counts[e.escalationLevel] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([level, count]) => `${count} ${LEVEL_LABELS[level as EscalationItem['escalationLevel']]}`)
    .join(', ');
}

export function EscalationBanner({ escalations, className }: EscalationBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  if (escalations.length === 0) return null;

  const visibleItems = escalations.slice(0, 5);
  const remaining = escalations.length - 5;

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const findAttorneyId = (ownerName: string): string | null => {
    const att = attorneys.find(a => a.name === ownerName);
    return att ? att.id : null;
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value}%`;
    if (unit === 'days') return `${value} days`;
    if (unit === 'score') return value.toFixed(1);
    if (unit === 'index') return value.toFixed(2);
    return `${value}`;
  };

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
          expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="border-t border-red-500/20 px-4 py-2 space-y-1">
          {visibleItems.map(esc => {
            const isItemExpanded = expandedItems.has(esc.id);
            const attId = findAttorneyId(esc.owner);
            const steps = REMEDIATION_MAP[esc.layerName] ?? [
              'Review metric details and identify root cause',
              'Assign corrective action owner',
              'Schedule follow-up review within 7 days',
            ];

            return (
              <div key={esc.id}>
                <button
                  type="button"
                  onClick={() => toggleItem(esc.id)}
                  className="flex w-full items-center gap-3 text-sm text-foreground py-1.5 hover:bg-red-500/5 rounded px-1 -mx-1 transition-colors"
                >
                  <ChevronRight
                    size={14}
                    className={cn(
                      'shrink-0 text-muted-foreground transition-transform duration-200',
                      isItemExpanded && 'rotate-90',
                    )}
                  />
                  <span className="font-medium truncate min-w-0 flex-1 text-left">
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
                </button>

                {isItemExpanded && (
                  <div className="ml-6 mt-1 mb-2 rounded-lg border border-border/50 bg-card/80 p-3 space-y-3 text-sm animate-fade-in-up">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-xs text-muted-foreground">Current</span>
                        <div className="font-semibold text-foreground">{formatValue(esc.currentValue, esc.unit)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Target</span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatValue(esc.target, esc.unit)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Owner</span>
                        <div className="font-medium text-foreground">{esc.owner}</div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Office</span>
                        <div className="font-medium text-foreground">{esc.office}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remediation Steps</span>
                      <ol className="mt-1.5 space-y-1">
                        {steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                            <span className="shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {attId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/attorney/${attId}`);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink size={12} />
                        Go to {esc.owner}'s Dashboard
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
