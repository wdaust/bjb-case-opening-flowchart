import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { mean, buildGauge, rag, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeDepositions(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = uniqueMatterCount(rows);
  const daysArr = rows.map(r => {
    const v = r['Time from Filed Date'] ?? r['Time from Filed'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  }).filter((d): d is number => d != null);
  const overdue180Rows = rows.filter(r => {
    const v = r['Time from Filed Date'] ?? r['Time from Filed'];
    const num = typeof v === 'number' ? v : Number(v);
    return !isNaN(num) && num >= 180;
  });
  const overdue180 = uniqueMatterCount(overdue180Rows);
  const notComplete = rows.filter(r => {
    const cd = r['Client Deposition'] ?? r['Client Depo Date'];
    return !cd || cd === '-';
  }).length;

  const cards: MetricCard[] = [
    { label: 'Outstanding', value: total, rag: total === 0 ? 'green' : total <= 3 ? 'amber' : 'red' },
    { label: 'Overdue 180+', value: overdue180, rag: overdue180 === 0 ? 'green' : overdue180 <= 2 ? 'amber' : 'red' },
    { label: 'Avg Days from Filed', value: `${mean(daysArr)}d`, rag: mean(daysArr) < 180 ? 'green' : 'red' },
    { label: 'Not Marked Complete', value: notComplete, rag: notComplete === 0 ? 'green' : notComplete <= 5 ? 'amber' : 'red' },
  ];

  const worstRag = rag(overdue180, [1, 3]);
  const gauge = buildGauge('Depositions', daysArr, SLA_TARGETS.depositions, total);

  const issues: ActionableIssue[] = rows
    .filter(r => {
      const tf = r['Time from Filed Date'] ?? r['Time from Filed'];
      return typeof tf === 'number' && tf >= 180;
    })
    .map(r => ({
      stage: 'Depositions',
      description: `${r['Matter Name'] || 'Unknown'} — deposition overdue`,
      daysOverdue: (r['Time from Filed Date'] ?? r['Time from Filed']) as number,
      priority: 'red' as RagColor,
      suggestedAction: 'Schedule deposition or file motion to compel',
    }));

  return { metrics: { stage: 'depositions', label: STAGE_LABELS.depositions, cards, gauge, rag: worstRag }, issues };
}
