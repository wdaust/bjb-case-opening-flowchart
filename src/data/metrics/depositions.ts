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
  // Use 120d from answer date as SLA (not filed date)
  const daysArr = rows.map(r => answerDays(r)).filter(d => d > 0);

  // Box 1: Undone 120d+ — depositions past 120 days from answer, not completed
  const undone120Rows = rows.filter(r => noDepo(r) && answerDays(r) >= 120);
  const undone120 = uniqueMatterCount(undone120Rows);

  // Box 2: Completed Timely — disabled (no completed depo report)
  // Box 3: Completed Untimely — disabled (no completed depo report)

  // Box 4: Within Time — undone but under 120 days from answer (still on track)
  const withinTimeRows = rows.filter(r => noDepo(r) && answerDays(r) < 120);
  const withinTime = uniqueMatterCount(withinTimeRows);

  const cards: MetricCard[] = [
    { label: 'Undone 120d+', value: undone120, rag: undone120 === 0 ? 'green' : undone120 <= 3 ? 'amber' : 'red' },
    { label: 'Completed Timely', value: '-', rag: 'green', disabled: true, badge: 'Needs Report' },
    { label: 'Completed Untimely', value: '-', rag: 'green', disabled: true, badge: 'Needs Report' },
    { label: 'Within Time', value: withinTime, rag: 'green' },
  ];

  const worstRag = rag(undone120, [1, 3]);
  const gauge = buildGauge('Depositions', daysArr, SLA_TARGETS.depositions, rows.length);

  const issues: ActionableIssue[] = undone120Rows
    .map(r => ({
      stage: 'Depositions',
      description: `${r['Matter Name'] || r['Display Name'] || 'Unknown'} — deposition overdue (${answerDays(r)}d from answer)`,
      daysOverdue: answerDays(r),
      priority: 'red' as RagColor,
      suggestedAction: 'Schedule deposition or file motion to compel',
    }));

  return { metrics: { stage: 'depositions', label: STAGE_LABELS.depositions, cards, gauge, rag: worstRag }, issues };
}
