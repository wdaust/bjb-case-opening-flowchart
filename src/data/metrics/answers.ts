import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { buildGauge, parseDate, daysSinceToday, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

/** Compute days since Service Date Complete for an answer row */
const daysSinceService = (r: Row): number => {
  const d = parseDate(r['Service Date Complete']);
  return d ? daysSinceToday(d) : 0;
};

const hasAnswer = (r: Row): boolean => {
  const v = r['Answer Filed'];
  return v != null && v !== '' && v !== '-';
};

const hasDefault = (r: Row): boolean => {
  const v = r['Default Entered Date'];
  return v != null && v !== '' && v !== '-';
};

export function computeAnswers(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  // Box 1: Untimely Answers — 35d+ from service, no answer filed, no default entered
  const untimelyRows = rows.filter(r => !hasAnswer(r) && !hasDefault(r) && daysSinceService(r) >= 35);
  const untimelyCount = uniqueMatterCount(untimelyRows, 'Matter Name');

  // Box 2: Defaults Filed Timely — default entered AND days from service <= 40
  const defaultTimelyRows = rows.filter(r => hasDefault(r) && daysSinceService(r) <= 40);
  const defaultTimelyCount = uniqueMatterCount(defaultTimelyRows, 'Matter Name');

  // Box 3: Defaults Remaining Untimely — no answer, no default, days from service > 40
  const defaultsRemainingRows = rows.filter(r => !hasAnswer(r) && !hasDefault(r) && daysSinceService(r) > 40);
  const defaultsRemainingCount = uniqueMatterCount(defaultsRemainingRows, 'Matter Name');

  const cards: MetricCard[] = [
    { label: 'Untimely Answers', value: untimelyCount, rag: untimelyCount === 0 ? 'green' : untimelyCount <= 3 ? 'amber' : 'red' },
    { label: 'Defaults Filed Timely', value: defaultTimelyCount, rag: 'green' },
    { label: 'Defaults Remaining Untimely', value: defaultsRemainingCount, rag: defaultsRemainingCount === 0 ? 'green' : 'red' },
  ];

  // Build gauge from days-since-service for untimely rows
  const daysArr = untimelyRows.map(r => daysSinceService(r)).filter(d => d > 0);
  const gauge = buildGauge('Defendant Answers', daysArr, SLA_TARGETS.answers, rows.length);

  const worstRag: RagColor = untimelyCount > 3 ? 'red' : untimelyCount > 0 ? 'amber' : 'green';

  const seenAnswers = new Set<string>();
  const issues: ActionableIssue[] = untimelyRows.reduce<ActionableIssue[]>((acc, r) => {
    const matter = String(r['Matter Name'] || 'Unknown');
    if (seenAnswers.has(matter)) return acc;
    seenAnswers.add(matter);
    acc.push({
      stage: 'Defendant Answers',
      description: `${matter} — untimely answer (${daysSinceService(r)}d from service)`,
      daysOverdue: daysSinceService(r),
      priority: 'red' as RagColor,
      suggestedAction: 'File motion for default or follow up on answer',
    });
    return acc;
  }, []);

  return { metrics: { stage: 'answers', label: STAGE_LABELS.answers, cards, gauge, rag: worstRag }, issues };
}
