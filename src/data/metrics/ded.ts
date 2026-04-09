import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { mean, buildGauge, parseDate, daysFromToday, uniqueMatterCount } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeDED(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  // Box 1: Active Open Cases — all rows from openLit that have a DED set
  // (openLit already filters to active open litigation matters)
  const withDED = rows.filter(r => r['Discovery End Date'] && r['Discovery End Date'] !== '-');
  const parsed = withDED.map(r => {
    const d = parseDate(r['Discovery End Date']);
    return d ? { days: daysFromToday(d), row: r } : null;
  }).filter((d): d is { days: number; row: Row } => d != null);

  // Past-DED matters (days < 0 means DED is in the past)
  const past = parsed.filter(d => d.days < 0);
  const pastDays = past.map(d => Math.abs(d.days));

  // Box 2: Avg Days Past DED — mean of abs days for past-DED matters only
  const avgPast = mean(pastDays);

  // Box 3: 90+ Days Past DED
  const past90Rows = past.filter(d => Math.abs(d.days) >= 90);

  // Box 4: 180+ Days Past DED
  const past180Rows = past.filter(d => Math.abs(d.days) >= 180);

  const activeCount = uniqueMatterCount(withDED);
  const past90Count = uniqueMatterCount(past90Rows.map(d => d.row));
  const past180Count = uniqueMatterCount(past180Rows.map(d => d.row));

  let ragColor: RagColor = 'green';
  if (past180Count > 0) ragColor = 'red';
  else if (past90Count > 0) ragColor = 'amber';

  const agingValues = parsed.map(d => Math.abs(d.days));

  const cards: MetricCard[] = [
    { label: 'Active Open Cases', value: activeCount, rag: 'green' },
    { label: 'Avg Days Past DED', value: pastDays.length > 0 ? `${avgPast}d` : '-', rag: avgPast >= 180 ? 'red' : avgPast >= 90 ? 'amber' : 'green' },
    { label: '90+ Days Past', value: past90Count, rag: past90Count === 0 ? 'green' : 'amber' },
    { label: '180+ Days Past', value: past180Count, rag: past180Count === 0 ? 'green' : 'red' },
  ];

  const gauge = buildGauge('DED', agingValues, SLA_TARGETS.ded, uniqueMatterCount(rows));

  const seenDed = new Set<string>();
  const issues: ActionableIssue[] = past.reduce<ActionableIssue[]>((acc, { days, row }) => {
    const matter = String(row['Matter Name'] || row['Display Name'] || 'Unknown');
    if (seenDed.has(matter)) return acc;
    seenDed.add(matter);
    acc.push({
      stage: 'DED',
      description: `${matter} — ${Math.abs(days)} days past DED`,
      daysOverdue: Math.abs(days),
      priority: (Math.abs(days) >= 180 ? 'red' : 'amber') as RagColor,
      suggestedAction: 'File extension or close discovery',
    });
    return acc;
  }, []);

  return { metrics: { stage: 'ded', label: STAGE_LABELS.ded, cards, gauge, rag: ragColor }, issues };
}
