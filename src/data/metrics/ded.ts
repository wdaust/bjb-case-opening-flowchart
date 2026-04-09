import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { buildGauge, parseDate, daysFromToday } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeDED(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const noDedSet = rows.filter(r => !r['Discovery End Date'] || r['Discovery End Date'] === '-').length;
  const withDED = rows.filter(r => r['Discovery End Date'] && r['Discovery End Date'] !== '-');
  const parsed = withDED.map(r => {
    const d = parseDate(r['Discovery End Date']);
    return d ? { days: daysFromToday(d), row: r } : null;
  }).filter((d): d is { days: number; row: Row } => d != null);

  const past = parsed.filter(d => d.days < 0);
  const within30 = parsed.filter(d => d.days >= 0 && d.days <= 30);
  const within60 = parsed.filter(d => d.days > 30 && d.days <= 60);
  const atRisk = past.length + within30.length + within60.length;

  let ragColor: RagColor = 'green';
  if (past.length > 0) ragColor = 'red';
  else if (within30.length > 0) ragColor = 'amber';

  const agingValues = parsed.map(d => Math.abs(d.days));

  const cards: MetricCard[] = [
    { label: 'At-Risk Cases', value: atRisk, rag: past.length > 0 ? 'red' : within30.length > 0 ? 'amber' : 'green' },
    { label: 'Past DED', value: past.length, rag: past.length === 0 ? 'green' : 'red' },
    { label: 'Within 30d', value: within30.length, rag: within30.length === 0 ? 'green' : 'amber' },
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
