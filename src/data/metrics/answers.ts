import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { rag, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeAnswers(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = uniqueMatterCount(rows, 'Matter Name');
  const defaultRows = rows.filter(r => r['Default Entered Date'] && r['Default Entered Date'] !== '-');
  const defaults = uniqueMatterCount(defaultRows, 'Matter Name');
  const activeDefRows = rows.filter(r => r['Active Defendant?'] && r['Active Defendant?'] !== '-');
  const activeDefendants = uniqueMatterCount(activeDefRows, 'Matter Name');

  const cards: MetricCard[] = [
    { label: 'Missing Answers', value: total, rag: total === 0 ? 'green' : total <= 3 ? 'amber' : 'red' },
    { label: 'Defaults Entered', value: defaults, rag: defaults === 0 ? 'green' : defaults === 1 ? 'amber' : 'red' },
    { label: 'Active Defendants', value: activeDefendants, rag: 'green' },
  ];

  const worstRag = rag(total);
  const gauge = { label: 'Answers', count: total, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.answers, noAgingData: true };

  const issues: ActionableIssue[] = rows
    .filter(r => r['Default Entered Date'] && r['Default Entered Date'] !== '-')
    .map(r => ({
      stage: 'Answers',
      description: `${r['Matter Name'] || 'Unknown'} — default entered`,
      daysOverdue: 0,
      priority: 'red' as RagColor,
      suggestedAction: 'Vacate default immediately',
    }));

  return { metrics: { stage: 'answers', label: STAGE_LABELS.answers, cards, gauge, rag: worstRag }, issues };
}
