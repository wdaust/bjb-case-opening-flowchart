import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { mean, buildGauge, formABucket } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeFormA(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const overdueRows = rows.filter(r => {
    if (!formABucket(String(r._groupingLabel ?? '')).startsWith('Form A Overdue')) return false;
    const v = r['Answer Date to Today'];
    const num = typeof v === 'number' ? v : Number(v);
    return !isNaN(num) && num >= 60;
  });
  const approachingRows = rows.filter(r => {
    const b = formABucket(String(r._groupingLabel ?? ''));
    if (b.includes('Days to Due Date')) return true;
    if (b.startsWith('Form A Overdue')) {
      const v = r['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num < 60;
    }
    return false;
  });
  const atReviewRows = rows.filter(r => formABucket(String(r._groupingLabel ?? '')) === 'With Attorney for Review');

  const overdue = overdueRows.length;
  const approaching = approachingRows.length;
  const atReview = atReviewRows.length;

  const overdueDaysArr = overdueRows.map(r => {
    const v = r['Answer Date to Today'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  }).filter((d): d is number => d != null);

  const avgOverdue = mean(overdueDaysArr);

  const cards: MetricCard[] = [
    { label: 'Overdue', value: overdue, rag: overdue === 0 ? 'green' : overdue <= 5 ? 'amber' : 'red' },
    { label: 'Approaching Due', value: approaching, rag: approaching === 0 ? 'green' : approaching <= 10 ? 'amber' : 'red' },
    { label: 'At Attorney Review', value: atReview, rag: atReview === 0 ? 'green' : 'amber' },
    { label: 'Avg Days Overdue', value: `${avgOverdue}d`, rag: avgOverdue < 60 ? 'green' : avgOverdue < 90 ? 'amber' : 'red' },
  ];

  const worstRag: RagColor = overdue > 5 ? 'red' : overdue > 0 ? 'amber' : 'green';
  const gauge = buildGauge('Form A Overdue', overdueDaysArr, SLA_TARGETS.formA);

  const issues: ActionableIssue[] = overdueRows
    .filter(r => {
      const v = r['Answer Date to Today'];
      const num = typeof v === 'number' ? v : Number(v);
      return !isNaN(num) && num > 60;
    })
    .map(r => ({
      stage: 'Form A Overdue',
      description: `${r['Matter Name'] || r['Display Name'] || 'Unknown'} — Form A overdue`,
      daysOverdue: Number(r['Answer Date to Today']) || 0,
      priority: ((Number(r['Answer Date to Today']) || 0) >= 90 ? 'red' : 'amber') as RagColor,
      suggestedAction: 'Serve Form A or follow up on attorney review',
    }));

  return { metrics: { stage: 'formA', label: STAGE_LABELS.formA, cards, gauge, rag: worstRag }, issues };
}
