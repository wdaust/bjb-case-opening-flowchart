/**
 * Complaint stage metrics — extracted from ldnMetrics.ts.
 * Accepts raw SF rows; uses clean property names where possible.
 */
import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { mean, buildGauge, parseDate, daysSinceToday, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeComplaints(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = uniqueMatterCount(rows);
  const daysArr = rows.map(r => {
    const v = r['Date Assigned to Team to Today'];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    if (!isNaN(num)) return num;
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d ? daysSinceToday(d) : null;
  }).filter((d): d is number => d != null);

  const overdueRows = rows.filter(r => {
    const v = r['Date Assigned to Team to Today'];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    if (!isNaN(num)) return num > 14;
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d ? daysSinceToday(d) > 14 : false;
  });
  const overdue = uniqueMatterCount(overdueRows);

  const blockerRows = rows.filter(r => {
    const b = r['Blocker to Filing Complaint'] ?? r['Blocker'];
    return b && b !== '-';
  });
  const blockers = uniqueMatterCount(blockerRows);

  const avgDays = mean(daysArr);

  const b0_14 = daysArr.filter(d => d <= 14).length;
  const b15_29 = daysArr.filter(d => d > 14 && d <= 29).length;
  const b30_59 = daysArr.filter(d => d >= 30 && d <= 59).length;
  const b60_89 = daysArr.filter(d => d >= 60 && d <= 89).length;
  const b90plus = daysArr.filter(d => d >= 90).length;

  const cards: MetricCard[] = [
    { label: 'Total Unfiled', value: total, rag: total === 0 ? 'green' : total <= 5 ? 'amber' : 'red' },
    { label: 'Overdue >14d', value: overdue, rag: overdue === 0 ? 'green' : overdue <= 3 ? 'amber' : 'red' },
    { label: 'Avg Days Assigned', value: `${avgDays}d`, rag: avgDays < 15 ? 'green' : avgDays < 30 ? 'amber' : 'red' },
    {
      label: 'Blockers', value: blockers, rag: blockers === 0 ? 'green' : blockers <= 2 ? 'amber' : 'red',
      subMetrics: [
        { label: '0-14d', value: b0_14 },
        { label: '15-29d', value: b15_29 },
        { label: '30-59d', value: b30_59 },
        { label: '60-89d', value: b60_89 },
        { label: '90+d', value: b90plus },
      ],
    },
  ];

  const worstRag: RagColor = overdue >= 4 ? 'red' : overdue >= 1 ? 'amber' : 'green';
  const gauge = buildGauge('Complaints', daysArr, SLA_TARGETS.complaints);

  const seenComplaints = new Set<string>();
  const issues: ActionableIssue[] = rows
    .filter(r => {
      const v = r['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      if (!isNaN(num)) return num > 14;
      const d = parseDate(r['Date Assigned To Litigation Unit']);
      return d ? daysSinceToday(d) > 14 : false;
    })
    .reduce<ActionableIssue[]>((acc, r) => {
      const matter = String(r['Matter Name'] || r['Display Name'] || 'Unknown');
      if (seenComplaints.has(matter)) return acc;
      seenComplaints.add(matter);
      const v = r['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      const days = !isNaN(num) ? num : (() => {
        const d = parseDate(r['Date Assigned To Litigation Unit']);
        return d ? daysSinceToday(d) : 0;
      })();
      acc.push({
        stage: 'Complaints',
        description: `${matter} — unfiled complaint`,
        daysOverdue: days,
        priority: (days >= 30 ? 'red' : 'amber') as RagColor,
        suggestedAction: 'File complaint or escalate blocker',
      });
      return acc;
    }, []);

  return {
    metrics: { stage: 'complaints', label: STAGE_LABELS.complaints, cards, gauge, rag: worstRag },
    issues,
  };
}
