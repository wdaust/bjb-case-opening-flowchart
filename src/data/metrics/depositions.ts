import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { buildGauge, rag, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

/** Parse Answer Date to Today as a number of days */
const answerDays = (r: Row): number => {
  const v = r['Answer Date to Today'];
  const num = typeof v === 'number' ? v : Number(v);
  return isNaN(num) ? 0 : num;
};

const noDepo = (r: Row): boolean => {
  const cd = r['Client Deposition'] ?? r['Client Depo Date'];
  return !cd || cd === '-';
};

export function computeDepositions(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  // Use 180d from answer date as SLA (not filed date)
  const daysArr = rows.map(r => answerDays(r)).filter(d => d > 0);

  // Box 1: Undone 180+ — depositions past 180 days from answer, not completed
  const undone180Rows = rows.filter(r => noDepo(r) && answerDays(r) >= 180);

  // Box 2: Completed Timely — disabled (no completed depo report)
  // Box 3: Completed Untimely — disabled (no completed depo report)

  const undone180Count = uniqueMatterCount(undone180Rows);

  const cards: MetricCard[] = [
    { label: 'Undone 180+', value: undone180Count, rag: undone180Count === 0 ? 'green' : undone180Count <= 3 ? 'amber' : 'red' },
    { label: 'Completed Timely', value: '-', rag: 'green', disabled: true, badge: 'Needs Report' },
    { label: 'Completed Untimely', value: '-', rag: 'green', disabled: true, badge: 'Needs Report' },
  ];

  const worstRag = rag(undone180Count, [1, 3]);
  const gauge = buildGauge('Depositions', daysArr, SLA_TARGETS.depositions, uniqueMatterCount(rows));

  const seenDepo = new Set<string>();
  const issues: ActionableIssue[] = undone180Rows.reduce<ActionableIssue[]>((acc, r) => {
    const matter = String(r['Matter Name'] || r['Display Name'] || 'Unknown');
    if (seenDepo.has(matter)) return acc;
    seenDepo.add(matter);
    acc.push({
      stage: 'Depositions',
      description: `${matter} — deposition overdue (${answerDays(r)}d from answer)`,
      daysOverdue: answerDays(r),
      priority: 'red' as RagColor,
      suggestedAction: 'Schedule deposition or file motion to compel',
    });
    return acc;
  }, []);

  return { metrics: { stage: 'depositions', label: STAGE_LABELS.depositions, cards, gauge, rag: worstRag }, issues };
}
