import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { buildGauge, formCBucket, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

const hasFormAServed = (r: Row) => {
  const v = r['Form A Served'];
  return v != null && v !== '' && v !== '-';
};

export function computeFormC(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  // Rows SF says need motion or 10-day letter, but split by whether we've served Form A
  const sfNeedMotionRows = rows.filter(r => formCBucket(String(r._groupingLabel ?? '')) === 'Need to File Motion');
  const sfNeed10DayRows = rows.filter(r => formCBucket(String(r._groupingLabel ?? '')) === 'Need a 10-Day Letter');

  // Only actionable if Form A was served
  const needMotionRows = sfNeedMotionRows.filter(hasFormAServed);
  const need10DayRows = sfNeed10DayRows.filter(hasFormAServed);

  // Not actionable yet — we haven't served Form A
  const awaitingFormARows = [
    ...sfNeedMotionRows.filter(r => !hasFormAServed(r)),
    ...sfNeed10DayRows.filter(r => !hasFormAServed(r)),
  ];

  const pendingRows = rows.filter(r => {
    const b = formCBucket(String(r._groupingLabel ?? ''));
    return b.startsWith('10-Day Letter Out') || b.startsWith('60 Days');
  });
  const withinTimeRows = rows.filter(r => formCBucket(String(r._groupingLabel ?? '')) === 'Within Time');

  const needMotion = uniqueMatterCount(needMotionRows);
  const need10Day = uniqueMatterCount(need10DayRows);
  const awaitingFormA = uniqueMatterCount(awaitingFormARows);
  const pending = uniqueMatterCount(pendingRows);
  const withinTime = uniqueMatterCount(withinTimeRows);

  const overdueRows = [...needMotionRows, ...need10DayRows];
  const daysArr = overdueRows.map(r => {
    const v = r['Answer Date to Today'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  }).filter((d): d is number => d != null);

  const cards: MetricCard[] = [
    { label: 'File Motion to Compel', value: needMotion, rag: needMotion === 0 ? 'green' : needMotion <= 5 ? 'amber' : 'red' },
    { label: 'Send 10-Day Letter', value: need10Day, rag: need10Day === 0 ? 'green' : 'amber' },
    { label: 'Awaiting Our Form A', value: awaitingFormA, rag: awaitingFormA === 0 ? 'green' : 'amber' },
    { label: 'Pending Response', value: pending, rag: 'green' },
    { label: 'Within Time', value: withinTime, rag: 'green' },
  ];

  const worstRag: RagColor = needMotion > 5 ? 'red' : needMotion > 0 ? 'amber' : 'green';
  const gauge = buildGauge('Form C', daysArr, SLA_TARGETS.formC);

  const issues: ActionableIssue[] = [
    ...needMotionRows.map(r => ({
      stage: 'Form C',
      description: `${r['Matter Name'] || r['Display Name'] || 'Unknown'} — needs motion to compel`,
      daysOverdue: Number(r['Answer Date to Today']) || 0,
      priority: 'red' as RagColor,
      suggestedAction: 'File motion to compel Form C',
    })),
    ...need10DayRows.map(r => ({
      stage: 'Form C',
      description: `${r['Matter Name'] || r['Display Name'] || 'Unknown'} — needs 10-day letter`,
      daysOverdue: Number(r['Answer Date to Today']) || 0,
      priority: 'amber' as RagColor,
      suggestedAction: 'Send 10-day demand letter',
    })),
  ];

  return { metrics: { stage: 'formC', label: STAGE_LABELS.formC, cards, gauge, rag: worstRag }, issues };
}
