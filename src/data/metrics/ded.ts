import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { buildGauge, parseDate, daysFromToday, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeDED(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const noDedSetRows = rows.filter(r => !r['Discovery End Date'] || r['Discovery End Date'] === '-');
  const noDedSet = uniqueMatterCount(noDedSetRows);
  const withDED = rows.filter(r => r['Discovery End Date'] && r['Discovery End Date'] !== '-');
  const parsed = withDED.map(r => {
    const d = parseDate(r['Discovery End Date']);
    return d ? { days: daysFromToday(d), row: r } : null;
  }).filter((d): d is { days: number; row: Row } => d != null);

  const past = parsed.filter(d => d.days < 0);
  const within30 = parsed.filter(d => d.days >= 0 && d.days <= 30);
  const within60 = parsed.filter(d => d.days > 30 && d.days <= 60);
  const pastCount = uniqueMatterCount(past.map(d => d.row));
  const within30Count = uniqueMatterCount(within30.map(d => d.row));
  const within60Count = uniqueMatterCount(within60.map(d => d.row));
  const atRisk = pastCount + within30Count + within60Count;

  let ragColor: RagColor = 'green';
  if (pastCount > 0) ragColor = 'red';
  else if (within30Count > 0) ragColor = 'amber';

  const agingValues = parsed.map(d => Math.abs(d.days));

  const cards: MetricCard[] = [
    { label: 'At-Risk Cases', value: atRisk, rag: pastCount > 0 ? 'red' : within30Count > 0 ? 'amber' : 'green' },
    { label: 'Past DED', value: pastCount, rag: pastCount === 0 ? 'green' : 'red' },
    { label: 'Within 30d', value: within30Count, rag: within30Count === 0 ? 'green' : 'amber' },
    { label: 'No DED Set', value: noDedSet, rag: noDedSet === 0 ? 'green' : noDedSet <= 50 ? 'amber' : 'red' },
  ];

  const gauge = buildGauge('DED', agingValues, SLA_TARGETS.ded);

  const issues: ActionableIssue[] = past.map(({ days, row }) => ({
    stage: 'DED',
    description: `${row['Matter Name'] || 'Unknown'} — past discovery end date`,
    daysOverdue: Math.abs(days),
    priority: 'red' as RagColor,
    suggestedAction: 'File extension or close discovery',
  }));

  return { metrics: { stage: 'ded', label: STAGE_LABELS.ded, cards, gauge, rag: ragColor }, issues };
}
