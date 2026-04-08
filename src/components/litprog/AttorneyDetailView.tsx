import { cn } from '../../utils/cn';
import { StatCard } from '../dashboard/StatCard';
import type { AttorneyScore, StageName } from '../../utils/litProgMetrics';
import { STAGE_ORDER, STAGE_LABELS } from '../../utils/litProgMetrics';

interface Props {
  score: AttorneyScore;
}

const RAG_BAR_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const RAG_BORDER: Record<string, string> = {
  green: 'border-green-500/30',
  amber: 'border-amber-500/30',
  red: 'border-red-500/30',
};

function actionText(stage: StageName, m: { primary: number; overdue: number; subMetrics: Record<string, number>; rag: string }): string | null {
  if (m.rag === 'green') return null;
  switch (stage) {
    case 'complaints': return `${m.overdue} complaints overdue >14d${m.subMetrics['Blockers'] ? `, ${m.subMetrics['Blockers']} have blockers` : ''}`;
    case 'service': return `${m.primary} past-due service items`;
    case 'answers': return `${m.primary} missing answers${m.subMetrics['Defaults'] ? `, ${m.subMetrics['Defaults']} defaults entered` : ''}`;
    case 'formA': return `${m.primary} Form A past due, ${m.subMetrics['Atty Review'] ?? 0} at attorney review`;
    case 'formC': return `${m.subMetrics['Past Due'] ?? 0} past due, ${m.subMetrics['10-Day'] ?? 0} need 10-day, ${m.subMetrics['Motions'] ?? 0} need motion`;
    case 'depositions': return `${m.overdue} overdue 180+, avg ${m.subMetrics['Avg Days'] ?? 0} days`;
    case 'ded': return `${m.subMetrics['Past DED'] ?? 0} past DED, ${m.subMetrics['Within 30d'] ?? 0} within 30d`;
  }
}

export function AttorneyDetailView({ score }: Props) {
  const { attorney, redCount, amberCount, stages } = score;

  // Determine priority stage (first red, or first amber)
  const priorityStage = STAGE_ORDER.find(s => stages[s].rag === 'red')
    ?? STAGE_ORDER.find(s => stages[s].rag === 'amber');
  const priorityLabel = priorityStage ? STAGE_LABELS[priorityStage] : 'None';
  const priorityCount = priorityStage ? stages[priorityStage].overdue : 0;

  const heroSubtitle = redCount > 0
    ? `${redCount} stage${redCount > 1 ? 's' : ''} red, ${amberCount} amber — Priority: ${priorityLabel} (${priorityCount} overdue)`
    : amberCount > 0
      ? `${amberCount} amber stage${amberCount > 1 ? 's' : ''} — Priority: ${priorityLabel}`
      : 'All stages green — no action needed';

  return (
    <div className="space-y-6">
      {/* CTA Hero Card */}
      <StatCard
        variant="hero"
        label={attorney}
        value={heroSubtitle}
        deltaType={redCount > 0 ? 'negative' : amberCount > 0 ? 'neutral' : 'positive'}
      />

      {/* 7 Stage Rows */}
      <div className="space-y-3">
        {STAGE_ORDER.map(stage => {
          const m = stages[stage];
          const action = actionText(stage, m);
          return (
            <div
              key={stage}
              className={cn(
                'bg-card rounded-xl border-2 p-4 transition-all',
                RAG_BORDER[m.rag],
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-foreground">{m.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{m.primary} items</span>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-medium',
                  m.rag === 'red' && 'bg-red-500/20 text-red-400 border-red-500/30',
                  m.rag === 'amber' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  m.rag === 'green' && 'bg-green-500/20 text-green-400 border-green-500/30',
                )}>
                  {m.rag.toUpperCase()}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden bg-white/5 mb-2">
                <div
                  className={cn('h-full rounded-full transition-all', RAG_BAR_COLORS[m.rag])}
                  style={{ width: `${m.pctTimely}%` }}
                />
              </div>

              {/* Sub-metrics inline */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {Object.entries(m.subMetrics).map(([k, v]) => (
                  <span key={k}>{k}: <span className="text-foreground font-medium">{v}</span></span>
                ))}
                <span>{m.pctTimely}% timely</span>
              </div>

              {/* Action needed */}
              {action && (
                <div className="mt-2 text-xs text-amber-400">
                  Action needed: {action}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
