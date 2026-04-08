/**
 * LDN — Enhanced metrics engine for the Litigation Dashboard Navigator.
 * Fixed cross-ref (topAttorney on lookup values), richer sub-metrics,
 * bullet gauge data (P50/P90/SLA), actionable issues builder, risk scoring.
 */

import type { ReportSummaryResponse } from '../types/salesforce';
import { buildAttorneyLookup as _buildAttorneyLookup, filterRowsByAttorney as _filterRowsByAttorney } from './attorneyLookup';

// ─── Types ──────────────────────────────────────────────────────────────────

export type StageName = 'complaints' | 'service' | 'answers' | 'formA' | 'formC' | 'depositions' | 'ded';
export type RagColor = 'green' | 'amber' | 'red';

export interface BulletGauge {
  label: string;
  count: number;
  medianAge: number;   // P50
  p90Age: number;      // P90
  slaTarget: number;   // days
  noAgingData?: boolean; // true when no usable date field exists
}

export interface LdnStageMetrics {
  stage: StageName;
  label: string;
  cards: MetricCard[];
  gauge: BulletGauge;
  rag: RagColor;
}

export interface MetricCard {
  label: string;
  value: number | string;
  rag: RagColor;
  subMetrics?: { label: string; value: number | string }[];
}

export interface ActionableIssue {
  stage: string;
  description: string;
  daysOverdue: number;
  priority: RagColor;
  suggestedAction: string;
}

export interface LdnAttorneyScore {
  attorney: string;
  redCount: number;
  amberCount: number;
  greenCount: number;
  riskScore: number;
  totalIssues: number;
  stages: Record<StageName, LdnStageMetrics>;
  actionableText: string;
  issues: ActionableIssue[];
}

export interface LdnReportBundle {
  complaints: ReportSummaryResponse | null;
  service: ReportSummaryResponse | null;
  answers: ReportSummaryResponse | null;
  formA: ReportSummaryResponse | null;
  formC: ReportSummaryResponse | null;
  deps: ReportSummaryResponse | null;
  tenDay: ReportSummaryResponse | null;
  motions: ReportSummaryResponse | null;
  openLit: ReportSummaryResponse | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<StageName, string> = {
  complaints: 'Complaints',
  service: 'Service',
  answers: 'Answers',
  formA: 'Form A',
  formC: 'Form C',
  depositions: 'Depositions',
  ded: 'DED',
};

export const STAGE_ORDER: StageName[] = ['complaints', 'service', 'answers', 'formA', 'formC', 'depositions', 'ded'];

const SLA_TARGETS: Record<StageName, number> = {
  complaints: 14,
  service: 30,
  answers: 45,
  formA: 60,
  formC: 90,
  depositions: 180,
  ded: 60,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function parseDate(s: unknown): Date | null {
  if (typeof s !== 'string' || s === '-' || !s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysSinceToday(d: Date): number {
  return Math.round((new Date().getTime() - d.getTime()) / 86_400_000);
}

function daysFromToday(d: Date): number {
  return Math.round((d.getTime() - new Date().getTime()) / 86_400_000);
}

export function topAttorney(label: unknown): string {
  if (typeof label !== 'string') return '';
  return label.split(' > ')[0].trim();
}

function level2Attorney(label: unknown): string {
  if (typeof label !== 'string') return '';
  const parts = label.split(' > ');
  return parts.length >= 2 ? parts[1].trim() : parts[0].trim();
}

function rag(overdue: number, thresholds: [number, number] = [1, 4]): RagColor {
  if (overdue >= thresholds[1]) return 'red';
  if (overdue >= thresholds[0]) return 'amber';
  return 'green';
}

function mean(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
}

function buildGauge(label: string, ages: number[], slaTarget: number): BulletGauge {
  const sorted = [...ages].sort((a, b) => a - b);
  return {
    label,
    count: sorted.length,
    medianAge: percentile(sorted, 50),
    p90Age: percentile(sorted, 90),
    slaTarget,
  };
}

// ─── Fixed cross-ref: apply topAttorney() to lookup values ──────────────────

/**
 * Build attorney lookup with the cross-ref fix:
 * Open Lit _groupingLabel stores "Lisa Lehrer > Litigation" but buildAttorneyList
 * uses "Lisa Lehrer" (the grouping label). We apply topAttorney() to the stored
 * value so the cross-ref lookup matches.
 */
function buildFixedAttorneyLookup(openLitRows: Row[]): Map<string, string> {
  const raw = _buildAttorneyLookup(openLitRows as Array<Record<string, unknown> & { _groupingLabel?: string }>);
  const fixed = new Map<string, string>();
  for (const [dn, atty] of raw) {
    fixed.set(dn, topAttorney(atty));
  }
  return fixed;
}

function filterRowsByAttorney(rows: Row[], lookup: Map<string, string>, attorney: string): Row[] {
  return _filterRowsByAttorney(
    rows as Array<Record<string, unknown> & { _groupingLabel?: string }>,
    lookup,
    attorney,
  );
}

// ─── Per-stage computation ──────────────────────────────────────────────────

function computeComplaints(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = rows.length;
  const daysArr = rows.map(r => {
    const v = r['Date Assigned to Team to Today'];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    if (!isNaN(num)) return num;
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d ? daysSinceToday(d) : null;
  }).filter((d): d is number => d != null);

  const overdue = rows.filter(r => {
    const v = r['Date Assigned to Team to Today'];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    if (!isNaN(num)) return num > 14;
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d ? daysSinceToday(d) > 14 : false;
  }).length;

  const blockers = rows.filter(r => {
    const b = r['Blocker to Filing Complaint'] ?? r['Blocker'];
    return b && b !== '-';
  }).length;

  const filed = rows.filter(r => r['Complaint Filed Date'] && r['Complaint Filed Date'] !== '-').length;
  const filingPct = total ? Math.round((filed / total) * 100) : 100;

  const avgDays = mean(daysArr);

  // Aging breakdown
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
    { label: 'Filing Rate', value: `${filingPct}%`, rag: filingPct >= 80 ? 'green' : filingPct >= 50 ? 'amber' : 'red' },
  ];

  const worstRag = overdue >= 4 ? 'red' : overdue >= 1 ? 'amber' : 'green';
  const gauge = buildGauge('Complaints', daysArr, SLA_TARGETS.complaints);

  const issues: ActionableIssue[] = rows
    .filter(r => {
      const v = r['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      if (!isNaN(num)) return num > 14;
      const d = parseDate(r['Date Assigned To Litigation Unit']);
      return d ? daysSinceToday(d) > 14 : false;
    })
    .map(r => {
      const v = r['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      const days = !isNaN(num) ? num : (() => {
        const d = parseDate(r['Date Assigned To Litigation Unit']);
        return d ? daysSinceToday(d) : 0;
      })();
      return {
        stage: 'Complaints',
        description: `${r['Matter Name'] || r['Display Name'] || 'Unknown'} — unfiled complaint`,
        daysOverdue: days,
        priority: days >= 30 ? 'red' as RagColor : 'amber' as RagColor,
        suggestedAction: 'File complaint or escalate blocker',
      };
    });

  return {
    metrics: { stage: 'complaints', label: STAGE_LABELS.complaints, cards, gauge, rag: worstRag },
    issues,
  };
}

function computeService(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = rows.length;
  const matters = new Set(rows.map(r => String(r['Matter Name'] ?? ''))).size;
  const activeDefendants = rows.filter(r => r['Active Defendant?'] && r['Active Defendant?'] !== '-').length;
  const hasFirstAnswer = rows.filter(r => r['Prim. Defendant First Answer Filed'] && r['Prim. Defendant First Answer Filed'] !== '-').length;

  const cards: MetricCard[] = [
    { label: 'Past-Due Items', value: total, rag: total === 0 ? 'green' : total <= 3 ? 'amber' : 'red' },
    { label: 'Matters Affected', value: matters, rag: matters === 0 ? 'green' : matters <= 2 ? 'amber' : 'red' },
    { label: 'Active Defendants', value: activeDefendants, rag: 'green' },
    { label: 'Has First Answer', value: hasFirstAnswer, rag: 'green' },
  ];

  const worstRag = rag(total);
  // Service report has no usable date field for aging
  const gauge: BulletGauge = { label: 'Service', count: total, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.service, noAgingData: true };

  const issues: ActionableIssue[] = rows.map(r => {
    const d = parseDate(r['Open Date'] as string);
    const days = d ? daysSinceToday(d) : 0;
    return {
      stage: 'Service',
      description: `${r['Matter Name'] || 'Unknown'} — past-due service`,
      daysOverdue: days,
      priority: days >= 60 ? 'red' as RagColor : 'amber' as RagColor,
      suggestedAction: 'Complete service or request extension',
    };
  });

  return { metrics: { stage: 'service', label: STAGE_LABELS.service, cards, gauge, rag: worstRag }, issues };
}

function computeAnswers(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = rows.length;
  const defendants = new Set(rows.map(r => String(r['Defendant'] ?? r['Defendant (Party Name)'] ?? ''))).size;
  const defaults = rows.filter(r => r['Default Entered Date'] && r['Default Entered Date'] !== '-').length;
  const activeDefendants = rows.filter(r => r['Active Defendant?'] && r['Active Defendant?'] !== '-').length;
  const hasDeposition = rows.filter(r => r['Defendant Deposition'] && r['Defendant Deposition'] !== '-').length;

  const cards: MetricCard[] = [
    { label: 'Missing Answers', value: total, rag: total === 0 ? 'green' : total <= 3 ? 'amber' : 'red' },
    { label: 'Defendants Affected', value: defendants, rag: 'green' },
    { label: 'Defaults Entered', value: defaults, rag: defaults === 0 ? 'green' : defaults === 1 ? 'amber' : 'red' },
    { label: 'Active Defendants', value: activeDefendants, rag: 'green' },
    { label: 'Has Deposition', value: hasDeposition, rag: 'green' },
  ];

  const worstRag = rag(total);
  // Answer Filed is always '-' in this report (missing answers by definition) — no usable aging data
  const gauge: BulletGauge = { label: 'Answers', count: total, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.answers, noAgingData: true };

  const issues: ActionableIssue[] = rows
    .filter(r => r['Default Entered Date'] && r['Default Entered Date'] !== '-')
    .map(r => ({
      stage: 'Answers',
      description: `${r['Matter Name'] || 'Unknown'} — default entered`,
      daysOverdue: 0,
      priority: 'red' as RagColor,
      suggestedAction: 'Vacate default immediately',
    }));

  return { metrics: { stage: 'answers', label: STAGE_LABELS.answers, cards, gauge, rag: worstRag }, issues };
}

function computeFormA(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = rows.length;
  const atReview = rows.filter(r => {
    const sent = r['Date Form A Sent to Attorney for Review'];
    const served = r['Form A Served'];
    return sent && sent !== '-' && (!served || served === '-');
  }).length;

  const daysArr = rows.map(r => {
    const v = r['Answer Date to Today'];
    if (typeof v === 'number') return v;
    const d = parseDate(r['Answer Filed'] as string);
    return d ? daysSinceToday(d) : null;
  }).filter((d): d is number => d != null);

  const served = rows.filter(r => r['Form A Served'] && r['Form A Served'] !== '-').length;
  const pctServed = total ? Math.round((served / total) * 100) : 100;

  const cards: MetricCard[] = [
    { label: 'Past-Due Count', value: total, rag: total === 0 ? 'green' : total <= 3 ? 'amber' : 'red' },
    { label: 'At Attorney Review', value: atReview, rag: atReview === 0 ? 'green' : 'amber' },
    { label: 'Avg Days Since Answer', value: `${mean(daysArr)}d`, rag: mean(daysArr) < 60 ? 'green' : mean(daysArr) < 90 ? 'amber' : 'red' },
    { label: '% Served', value: `${pctServed}%`, rag: pctServed >= 80 ? 'green' : pctServed >= 50 ? 'amber' : 'red' },
  ];

  const worstRag = rag(total);
  const gauge = buildGauge('Form A', daysArr, SLA_TARGETS.formA);

  const issues: ActionableIssue[] = rows
    .filter(r => {
      const v = r['Answer Date to Today'];
      return typeof v === 'number' ? v > 60 : false;
    })
    .map(r => ({
      stage: 'Form A',
      description: `${r['Matter Name'] || 'Unknown'} — Form A past due`,
      daysOverdue: (r['Answer Date to Today'] as number) ?? 0,
      priority: ((r['Answer Date to Today'] as number) ?? 0) >= 90 ? 'red' as RagColor : 'amber' as RagColor,
      suggestedAction: 'Serve Form A or follow up on attorney review',
    }));

  return { metrics: { stage: 'formA', label: STAGE_LABELS.formA, cards, gauge, rag: worstRag }, issues };
}

function computeFormC(crossRefRows: Row[], tenDayRows: Row[], motionRows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const primary = crossRefRows.length;
  const need10Day = tenDayRows.length;
  const needMotion = motionRows.length;
  const total = primary + need10Day + needMotion;

  const daysArr = crossRefRows.map(r => {
    const v = r['Answer Date to Today'];
    if (typeof v === 'number') return v;
    return null;
  }).filter((d): d is number => d != null);

  const cards: MetricCard[] = [
    { label: 'Past-Due Form C', value: primary, rag: primary === 0 ? 'green' : primary <= 3 ? 'amber' : 'red' },
    { label: 'Need 10-Day Letter', value: need10Day, rag: need10Day === 0 ? 'green' : 'amber' },
    { label: 'Need Motion', value: needMotion, rag: needMotion === 0 ? 'green' : 'red' },
  ];

  const worstRag = rag(total);
  const gauge = buildGauge('Form C', daysArr, SLA_TARGETS.formC);

  const issues: ActionableIssue[] = [
    ...motionRows.map(r => ({
      stage: 'Form C',
      description: `${r['Matter Name'] || 'Unknown'} — needs motion to compel`,
      daysOverdue: 0,
      priority: 'red' as RagColor,
      suggestedAction: 'File motion to compel Form C',
    })),
    ...tenDayRows.map(r => ({
      stage: 'Form C',
      description: `${r['Matter Name'] || 'Unknown'} — needs 10-day letter`,
      daysOverdue: 0,
      priority: 'amber' as RagColor,
      suggestedAction: 'Send 10-day demand letter',
    })),
  ];

  return { metrics: { stage: 'formC', label: STAGE_LABELS.formC, cards, gauge, rag: worstRag }, issues };
}

function computeDepositions(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
  const total = rows.length;
  const daysArr = rows.map(r => r['Time from Filed Date'] ?? r['Time from Filed']).filter((v): v is number => typeof v === 'number');
  const overdue180 = daysArr.filter(d => d >= 180).length;
  const scheduled = rows.filter(r => {
    const cd = r['Client Deposition'] ?? r['Client Depo Date'];
    return cd && cd !== '-';
  }).length;
  const pctScheduled = total ? Math.round((scheduled / total) * 100) : 100;

  const cards: MetricCard[] = [
    { label: 'Outstanding', value: total, rag: total === 0 ? 'green' : total <= 3 ? 'amber' : 'red' },
    { label: 'Overdue 180+', value: overdue180, rag: overdue180 === 0 ? 'green' : overdue180 <= 2 ? 'amber' : 'red' },
    { label: 'Avg Days from Filed', value: `${mean(daysArr)}d`, rag: mean(daysArr) < 180 ? 'green' : 'red' },
    { label: '% Scheduled', value: `${pctScheduled}%`, rag: pctScheduled >= 80 ? 'green' : pctScheduled >= 50 ? 'amber' : 'red' },
  ];

  const worstRag = rag(overdue180, [1, 3]);
  const gauge = buildGauge('Depositions', daysArr, SLA_TARGETS.depositions);

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

function computeDED(rows: Row[]): { metrics: LdnStageMetrics; issues: ActionableIssue[] } {
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

// ─── Attorney list (same as litProgMetrics but with topAttorney fix) ────────

export function buildAttorneyList(bundle: LdnReportBundle): string[] {
  const set = new Set<string>();
  bundle.openLit?.groupings.forEach(g => { if (g.label) set.add(topAttorney(g.label)); });
  bundle.answers?.groupings.forEach(g => { if (g.label) set.add(topAttorney(g.label)); });
  bundle.service?.groupings.forEach(g => { if (g.label) set.add(topAttorney(g.label)); });
  // Remove empty strings
  set.delete('');
  return Array.from(set).sort();
}

// ─── Main computation ───────────────────────────────────────────────────────

export function computeAllLdnMetrics(bundle: LdnReportBundle): LdnAttorneyScore[] {
  const attorneys = buildAttorneyList(bundle);
  const lookup = buildFixedAttorneyLookup(bundle.openLit?.detailRows ?? []);

  return attorneys.map(attorney => {
    const complaintRows = filterRowsByAttorney(bundle.complaints?.detailRows ?? [], lookup, attorney);
    const serviceRows = (bundle.service?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);
    const answerRows = (bundle.answers?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);
    const formARows = filterRowsByAttorney(bundle.formA?.detailRows ?? [], lookup, attorney);
    const formCCrossRef = filterRowsByAttorney(bundle.formC?.detailRows ?? [], lookup, attorney);
    const tenDayRows = (bundle.tenDay?.detailRows ?? []).filter(r => level2Attorney(r._groupingLabel) === attorney);
    const motionRows = (bundle.motions?.detailRows ?? []).filter(r => level2Attorney(r._groupingLabel) === attorney);
    const depRows = filterRowsByAttorney(bundle.deps?.detailRows ?? [], lookup, attorney);
    const openLitRows = (bundle.openLit?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);

    const c = computeComplaints(complaintRows);
    const s = computeService(serviceRows);
    const a = computeAnswers(answerRows);
    const fa = computeFormA(formARows);
    const fc = computeFormC(formCCrossRef, tenDayRows, motionRows);
    const dep = computeDepositions(depRows);
    const ded = computeDED(openLitRows);

    const stages: Record<StageName, LdnStageMetrics> = {
      complaints: c.metrics,
      service: s.metrics,
      answers: a.metrics,
      formA: fa.metrics,
      formC: fc.metrics,
      depositions: dep.metrics,
      ded: ded.metrics,
    };

    const allIssues = [...c.issues, ...s.issues, ...a.issues, ...fa.issues, ...fc.issues, ...dep.issues, ...ded.issues];

    let redCount = 0;
    let amberCount = 0;
    let greenCount = 0;
    let totalIssues = 0;
    const actionParts: string[] = [];

    for (const sn of STAGE_ORDER) {
      const m = stages[sn];
      if (m.rag === 'red') {
        redCount++;
        const primary = m.cards[0]?.value ?? 0;
        actionParts.push(`${primary} ${m.label}`);
      } else if (m.rag === 'amber') {
        amberCount++;
      } else {
        greenCount++;
      }
      totalIssues += typeof m.cards[0]?.value === 'number' ? m.cards[0].value : 0;
    }

    const riskScore = (redCount * 30) + (amberCount * 10) + Math.min(totalIssues, 10);

    return {
      attorney,
      redCount,
      amberCount,
      greenCount,
      riskScore,
      totalIssues,
      stages,
      actionableText: actionParts.join(', ') || 'No critical issues',
      issues: allIssues.sort((a, b) => {
        const pri = { red: 0, amber: 1, green: 2 };
        return (pri[a.priority] - pri[b.priority]) || (b.daysOverdue - a.daysOverdue);
      }),
    };
  });
}

// ─── Portfolio-level aggregates ─────────────────────────────────────────────

export function computePortfolioGauges(bundle: LdnReportBundle): Record<StageName, BulletGauge> {
  // Compute gauges from ALL rows (not per-attorney)
  const complaintDays = (bundle.complaints?.detailRows ?? []).map(r => {
    const v = r['Date Assigned to Team to Today'];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    if (!isNaN(num)) return num;
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d ? daysSinceToday(d) : null;
  }).filter((d): d is number => d != null);

  const serviceCount = (bundle.service?.detailRows ?? []).length;
  const answerCount = (bundle.answers?.detailRows ?? []).length;

  const formADays = (bundle.formA?.detailRows ?? []).map(r => {
    const v = r['Answer Date to Today'];
    return typeof v === 'number' ? v : null;
  }).filter((d): d is number => d != null);

  const formCDays = (bundle.formC?.detailRows ?? []).map(r => {
    const v = r['Answer Date to Today'];
    return typeof v === 'number' ? v : null;
  }).filter((d): d is number => d != null);

  const depDays = (bundle.deps?.detailRows ?? []).map(r => {
    const v = r['Time from Filed Date'] ?? r['Time from Filed'];
    return typeof v === 'number' ? v : null;
  }).filter((d): d is number => d != null);

  const dedDays = (bundle.openLit?.detailRows ?? [])
    .filter(r => r['Discovery End Date'] && r['Discovery End Date'] !== '-')
    .map(r => {
      const d = parseDate(r['Discovery End Date']);
      return d ? Math.abs(daysFromToday(d)) : null;
    }).filter((d): d is number => d != null);

  return {
    complaints: buildGauge('Complaints', complaintDays, SLA_TARGETS.complaints),
    service: { label: 'Service', count: serviceCount, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.service, noAgingData: true },
    answers: { label: 'Answers', count: answerCount, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.answers, noAgingData: true },
    formA: buildGauge('Form A', formADays, SLA_TARGETS.formA),
    formC: buildGauge('Form C', formCDays, SLA_TARGETS.formC),
    depositions: buildGauge('Depositions', depDays, SLA_TARGETS.depositions),
    ded: buildGauge('DED', dedDays, SLA_TARGETS.ded),
  };
}

// ─── Tooltip info maps ──────────────────────────────────────────────────────

export const STAGE_INFO: Record<StageName, string> = {
  complaints: 'Tracks unfiled complaints from the date they were assigned to the litigation unit. SLA target is 14 days.',
  service: 'Monitors past-due service items across matters. No reliable aging field exists in this report.',
  answers: 'Tracks missing answers/responses from defendants. Answer Filed is typically empty since this is a missing-answers report.',
  formA: 'Form A interrogatories tracking — measures time from answer date. Includes attorney review status and served percentage.',
  formC: 'Form C document requests — includes 10-day demand letters and motions to compel for non-responsive parties.',
  depositions: 'Outstanding depositions tracked from filing date. Monitors scheduling rate and 180-day overdue threshold.',
  ded: 'Discovery End Date tracking across the open litigation portfolio. Flags past-DED cases and those approaching within 30/60 days.',
};

// ─── Drill-down column definitions per stage ────────────────────────────────

export type DrillRow = Record<string, unknown>;

export interface DrillColumn {
  key: string;
  label: string;
}

export const STAGE_DRILL_COLUMNS: Record<StageName, DrillColumn[]> = {
  complaints: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Date Assigned to Team to Today', label: 'Days Assigned' },
    { key: 'Date Assigned To Litigation Unit', label: 'Assigned Date' },
    { key: 'Complaint Filed Date', label: 'Filed Date' },
    { key: 'Blocker to Filing Complaint', label: 'Blocker' },
    { key: 'PI Status', label: 'PI Status' },
  ],
  service: [
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Client Name', label: 'Client' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Case Type', label: 'Case Type' },
    { key: 'Active Defendant?', label: 'Active?' },
    { key: 'Service complete date', label: 'Service Date' },
    { key: 'Default Entered Date', label: 'Default Date' },
  ],
  answers: [
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Client Name', label: 'Client' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Default Entered Date', label: 'Default Date' },
    { key: 'Active Defendant?', label: 'Active?' },
    { key: 'Defendant Deposition', label: 'Deposition' },
  ],
  formA: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: 'Date Form A Sent to Attorney for Review', label: 'Sent to Review' },
    { key: 'Form A Served', label: 'Served' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  formC: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Answer Date to Today', label: 'Days Since Answer' },
    { key: 'Form C Received', label: 'Form C Received' },
    { key: '10 Day Letter Sent', label: '10-Day Letter' },
    { key: 'Date Motion Filed', label: 'Motion Filed' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  depositions: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Defendant', label: 'Defendant' },
    { key: 'Complaint Filed Date', label: 'Filed Date' },
    { key: 'Answer Filed', label: 'Answer Filed' },
    { key: 'Time from Filed Date', label: 'Days from Filed' },
    { key: 'Client Deposition', label: 'Client Depo' },
    { key: 'Active Stage', label: 'Stage' },
  ],
  ded: [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Case Type', label: 'Case Type' },
    { key: 'Active Stage', label: 'Stage' },
    { key: 'Discovery End Date', label: 'DED' },
    { key: 'Age in Litigation', label: 'Age (Lit)' },
    { key: 'Statute of Limitations', label: 'SOL' },
    { key: 'Matter State', label: 'State' },
  ],
};

// ─── Drill-down filter functions per stage+card ──────────────────────────────

type CardFilterFn = (row: DrillRow) => boolean;
const identity = () => true;
const hasVal = (key: string) => (row: DrillRow) => {
  const v = row[key];
  return v != null && v !== '' && v !== '-';
};

export const CARD_FILTERS: Record<StageName, Record<string, CardFilterFn>> = {
  complaints: {
    'Total Unfiled': identity,
    'Overdue >14d': (row) => {
      const v = row['Date Assigned to Team to Today'];
      const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
      if (!isNaN(num)) return num > 14;
      const d = parseDate(row['Date Assigned To Litigation Unit']);
      return d ? daysSinceToday(d) > 14 : false;
    },
    'Avg Days Assigned': identity,
    'Blockers': (row) => {
      const b = row['Blocker to Filing Complaint'] ?? row['Blocker'];
      return b != null && b !== '' && b !== '-';
    },
    'Filing Rate': hasVal('Complaint Filed Date'),
  },
  service: {
    'Past-Due Items': identity,
    'Matters Affected': identity,
    'Active Defendants': hasVal('Active Defendant?'),
    'Has First Answer': hasVal('Prim. Defendant First Answer Filed'),
  },
  answers: {
    'Missing Answers': identity,
    'Defendants Affected': identity,
    'Defaults Entered': hasVal('Default Entered Date'),
    'Active Defendants': hasVal('Active Defendant?'),
    'Has Deposition': hasVal('Defendant Deposition'),
  },
  formA: {
    'Past-Due Count': identity,
    'At Attorney Review': (row) => {
      const sent = row['Date Form A Sent to Attorney for Review'];
      const served = row['Form A Served'];
      return (sent != null && sent !== '' && sent !== '-') && (!served || served === '-');
    },
    'Avg Days Since Answer': identity,
    '% Served': hasVal('Form A Served'),
  },
  formC: {
    'Past-Due Form C': identity, // will use formC rows
    'Need 10-Day Letter': identity, // will use tenDay rows
    'Need Motion': identity, // will use motion rows
  },
  depositions: {
    'Outstanding': identity,
    'Overdue 180+': (row) => {
      const v = row['Time from Filed Date'] ?? row['Time from Filed'];
      return typeof v === 'number' && v >= 180;
    },
    'Avg Days from Filed': identity,
    '% Scheduled': (row) => {
      const cd = row['Client Deposition'] ?? row['Client Depo Date'];
      return cd != null && cd !== '' && cd !== '-';
    },
  },
  ded: {
    'At-Risk Cases': (row) => {
      const d = parseDate(row['Discovery End Date']);
      if (!d) return false;
      const days = daysFromToday(d);
      return days < 60;
    },
    'Past DED': (row) => {
      const d = parseDate(row['Discovery End Date']);
      return d ? daysFromToday(d) < 0 : false;
    },
    'Within 30d': (row) => {
      const d = parseDate(row['Discovery End Date']);
      if (!d) return false;
      const days = daysFromToday(d);
      return days >= 0 && days <= 30;
    },
    'No DED Set': (row) => !row['Discovery End Date'] || row['Discovery End Date'] === '-',
  },
};

export const CARD_INFO: Record<string, string> = {
  'Total Unfiled': 'Count of complaints assigned but not yet filed.',
  'Overdue >14d': 'Complaints past the 14-day SLA target.',
  'Avg Days Assigned': 'Average days since assignment to litigation unit.',
  'Blockers': 'Cases with a documented blocker preventing filing. Sub-metrics show aging breakdown.',
  'Filing Rate': 'Percentage of complaints that have a filed date vs total assigned.',
  'Past-Due Items': 'Service items that are past due for completion.',
  'Matters Affected': 'Unique matters with past-due service items.',
  'Active Defendants': 'Defendants marked as active in the case.',
  'Has First Answer': 'Cases where the primary defendant has filed a first answer.',
  'Missing Answers': 'Defendants who have not filed an answer.',
  'Defendants Affected': 'Unique defendants with missing answers.',
  'Defaults Entered': 'Cases where a default judgment has been entered against a defendant.',
  'Has Deposition': 'Defendants who have a deposition on file.',
  'Past-Due Count': 'Total past-due Form A interrogatories.',
  'At Attorney Review': 'Form A sent to attorney for review but not yet served.',
  'Avg Days Since Answer': 'Average days elapsed since the answer was filed.',
  '% Served': 'Percentage of Form A interrogatories that have been served.',
  'Past-Due Form C': 'Form C document requests that are past due.',
  'Need 10-Day Letter': 'Cases requiring a 10-day demand letter for Form C compliance.',
  'Need Motion': 'Cases requiring a motion to compel for Form C non-response.',
  'Outstanding': 'Total outstanding depositions not yet completed.',
  'Overdue 180+': 'Depositions more than 180 days from the filing date.',
  'Avg Days from Filed': 'Average days since the case was filed.',
  '% Scheduled': 'Percentage of depositions that have been scheduled.',
  'At-Risk Cases': 'Cases with DED that is past, within 30 days, or within 60 days.',
  'Past DED': 'Cases where the Discovery End Date has already passed.',
  'Within 30d': 'Cases with DED approaching within 30 days.',
  'No DED Set': 'Open litigation cases with no Discovery End Date set — a key management gap.',
};

/** Compute portfolio-level metric cards for each stage (all attorneys combined). */
export function computePortfolioStages(bundle: LdnReportBundle): Record<StageName, LdnStageMetrics> {
  const lookup = buildFixedAttorneyLookup(bundle.openLit?.detailRows ?? []);
  void lookup; // used implicitly through row counts

  const allComplaint = bundle.complaints?.detailRows ?? [];
  const allService = bundle.service?.detailRows ?? [];
  const allAnswers = bundle.answers?.detailRows ?? [];
  const allFormA = bundle.formA?.detailRows ?? [];
  const allFormC = bundle.formC?.detailRows ?? [];
  const allTenDay = bundle.tenDay?.detailRows ?? [];
  const allMotions = bundle.motions?.detailRows ?? [];
  const allDeps = bundle.deps?.detailRows ?? [];
  const allOpenLit = bundle.openLit?.detailRows ?? [];

  return {
    complaints: computeComplaints(allComplaint).metrics,
    service: computeService(allService).metrics,
    answers: computeAnswers(allAnswers).metrics,
    formA: computeFormA(allFormA).metrics,
    formC: computeFormC(allFormC, allTenDay, allMotions).metrics,
    depositions: computeDepositions(allDeps).metrics,
    ded: computeDED(allOpenLit).metrics,
  };
}
