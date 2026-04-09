import type { RagColor, MetricCard, ActionableIssue, BulletGauge } from './shared';
import { buildGauge, rag, parseDate, daysSinceToday } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

export function computeService(rows: Row[], service30DayRows?: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = rows.length;
  const cards: MetricCard[] = [
    { label: 'Past-Due Items', value: total, rag: total === 0 ? 'green' : total <= 3 ? 'amber' : 'red' },
  ];

  const svcDays: number[] = [];
  if (service30DayRows && service30DayRows.length > 0) {
    for (const r of service30DayRows) {
      const raw = r['Days to Service'];
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (!isNaN(num) && num >= 0) svcDays.push(num);
    }
    const avgDays = svcDays.length ? Math.round(svcDays.reduce((a, b) => a + b, 0) / svcDays.length) : 0;
    cards.push(
      { label: 'Avg Days to Service', value: `${avgDays}d`, rag: avgDays <= 30 ? 'green' : avgDays <= 60 ? 'amber' : 'red' },
    );
  }

  cards.push({ label: 'Culpable Defendants Not Served', value: '—', rag: 'green', disabled: true, badge: '2.0' });

  const worstRag = rag(total);
  let gauge: BulletGauge;
  if (svcDays.length > 0) {
    gauge = buildGauge('Service', svcDays, SLA_TARGETS.service);
  } else {
    gauge = { label: 'Service', count: total, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.service, noAgingData: true };
  }

  const issues: ActionableIssue[] = rows.map(r => {
    const d = parseDate(r['Open Date'] as string);
    const days = d ? daysSinceToday(d) : 0;
    return {
      stage: 'Service',
      description: `${r['Matter Name'] || 'Unknown'} — past-due service`,
      daysOverdue: days,
      priority: (days >= 60 ? 'red' : 'amber') as RagColor,
      suggestedAction: 'Complete service or request extension',
    };
  });

  if (service30DayRows) {
    for (const r of service30DayRows) {
      const raw = r['Days to Service'];
      const num = typeof raw === 'number' ? raw : Number(raw);
      if (!isNaN(num) && num > 30) {
        issues.push({
          stage: 'Service',
          description: `${r['Display Name'] || 'Unknown'} — ${num} days to service`,
          daysOverdue: num - 30,
          priority: (num >= 60 ? 'red' : 'amber') as RagColor,
          suggestedAction: 'Review service delay',
        });
      }
    }
  }

  return { metrics: { stage: 'service', label: STAGE_LABELS.service, cards, gauge, rag: worstRag }, issues };
}
