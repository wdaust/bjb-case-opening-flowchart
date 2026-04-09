import type { RagColor, MetricCard, ActionableIssue } from './shared';
import { buildGauge, parseDate, daysSinceToday } from './shared';
import { SLA_TARGETS, STAGE_LABELS, type LdnStageMetrics } from './types';

type Row = Record<string, unknown>;

const noFormC = (r: Row) => {
  const v = r['Form C Received'];
  return v == null || v === '' || v === '-';
};

const hasFormAServed = (r: Row) => {
  const v = r['Form A Served'];
  return v != null && v !== '' && v !== '-';
};

const has10DayLetter = (r: Row) => {
  const v = r['10 Day Letter Sent'];
  return v != null && v !== '' && v !== '-';
};

const noMotionFiled = (r: Row) => {
  const v = r['Date Motion Filed'];
  return v == null || v === '' || v === '-';
};

const motionFiled = (r: Row) => {
  const v = r['Date Motion Filed'];
  return v != null && v !== '' && v !== '-';
};

/** Parse Answer Date to Today as a number of days */
const answerDays = (r: Row): number => {
  const v = r['Answer Date to Today'];
  const num = typeof v === 'number' ? v : Number(v);
  return isNaN(num) ? 0 : num;
};

/** Check if 10-day letter was sent 10+ days ago (letter expired) */
const letterExpired = (r: Row): boolean => {
  const d = parseDate(r['10 Day Letter Sent']);
  if (!d) return false;
  return daysSinceToday(d) >= 10;
};

export function computeFormC(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  // Box 1: Missing Form C (30d+) — answer filed 30+ days ago, no Form C received
  const missingRows = rows.filter(r => noFormC(r) && answerDays(r) >= 30);

  // Box 2: Ready for Motion — Form A served, 10-day letter sent 10+ days ago, no motion filed
  const readyMotionRows = rows.filter(r =>
    noFormC(r) && hasFormAServed(r) && has10DayLetter(r) && letterExpired(r) && noMotionFiled(r),
  );

  // Box 3: Motions Late — same criteria as Box 2 (all qualify but no motion filed yet)
  const motionsLateRows = readyMotionRows;

  // Box 4: Filed Timely — motions that have been filed
  const filedRows = rows.filter(r => motionFiled(r));

  const daysArr = missingRows.map(r => answerDays(r)).filter(d => d > 0);

  const cards: MetricCard[] = [
    { label: 'Missing Form C (30d+)', value: missingRows.length, rag: missingRows.length === 0 ? 'green' : missingRows.length <= 10 ? 'amber' : 'red' },
    { label: 'Ready for Motion', value: readyMotionRows.length, rag: readyMotionRows.length === 0 ? 'green' : readyMotionRows.length <= 5 ? 'amber' : 'red' },
    { label: 'Motions Late', value: motionsLateRows.length, rag: motionsLateRows.length === 0 ? 'green' : 'red' },
    { label: 'Filed Timely', value: filedRows.length, rag: 'green' },
  ];

  const worstRag: RagColor = readyMotionRows.length > 5 ? 'red' : readyMotionRows.length > 0 ? 'amber' : 'green';
  const gauge = buildGauge('Form C', daysArr, SLA_TARGETS.formC);

  const issues: ActionableIssue[] = readyMotionRows.map(r => ({
    stage: 'Form C',
    description: `${r['Matter Name'] || r['Display Name'] || 'Unknown'} — ready for motion to compel`,
    daysOverdue: answerDays(r),
    priority: 'red' as RagColor,
    suggestedAction: 'File motion to compel Form C (R. 4:23-1)',
  }));

  return { metrics: { stage: 'formC', label: STAGE_LABELS.formC, cards, gauge, rag: worstRag }, issues };
}
