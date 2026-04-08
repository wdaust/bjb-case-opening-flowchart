/**
 * Lit Progression — attorney-centric metrics engine.
 * Computes per-stage metrics for each attorney and composite risk scores.
 */

import type { ReportSummaryResponse } from '../types/salesforce';
import { buildAttorneyLookup, filterRowsByAttorney } from './attorneyLookup';

// ─── Types ──────────────────────────────────────────────────────────────────

export type StageName = 'complaints' | 'service' | 'answers' | 'formA' | 'formC' | 'depositions' | 'ded';

export type RagColor = 'green' | 'amber' | 'red';

export interface StageMetrics {
  stage: StageName;
  label: string;
  primary: number;
  overdue: number;
  subMetrics: Record<string, number>;
  pctTimely: number;       // 0-100
  rag: RagColor;
}

export interface AttorneyStageData {
  attorney: string;
  stages: Record<StageName, StageMetrics>;
}

export interface AttorneyScore {
  attorney: string;
  redCount: number;
  amberCount: number;
  greenCount: number;
  riskScore: number;
  totalIssues: number;
  stages: Record<StageName, StageMetrics>;
  actionableText: string;
}

export interface StageAggregate {
  stage: StageName;
  label: string;
  totalItems: number;
  pctTimely: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
}

export interface ReportBundle {
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

function topAttorney(label: unknown): string {
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

const STAGE_LABELS: Record<StageName, string> = {
  complaints: 'Complaints',
  service: 'Service',
  answers: 'Answers',
  formA: 'Form A',
  formC: 'Form C',
  depositions: 'Depositions',
  ded: 'DED',
};

export { STAGE_LABELS };

export const STAGE_ORDER: StageName[] = ['complaints', 'service', 'answers', 'formA', 'formC', 'depositions', 'ded'];

// ─── Per-stage computation for one attorney ─────────────────────────────────

function computeComplaints(rows: Row[]): StageMetrics {
  const total = rows.length;
  const overdue = rows.filter(r => {
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d && daysSinceToday(d) > 14;
  }).length;
  const daysArr = rows.map(r => {
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d ? daysSinceToday(d) : null;
  }).filter((d): d is number => d != null);
  const blockers = rows.filter(r => r['Blocker'] && r['Blocker'] !== '-').length;
  const pctTimely = total ? Math.round(((total - overdue) / total) * 100) : 100;
  return {
    stage: 'complaints', label: STAGE_LABELS.complaints,
    primary: total, overdue, pctTimely,
    rag: rag(overdue),
    subMetrics: { 'Avg Days': mean(daysArr), 'Blockers': blockers },
  };
}

function computeService(rows: Row[]): StageMetrics {
  const total = rows.length;
  const matters = new Set(rows.map(r => String(r['Matter Name'] ?? ''))).size;
  return {
    stage: 'service', label: STAGE_LABELS.service,
    primary: total, overdue: total, pctTimely: total === 0 ? 100 : 0,
    rag: rag(total),
    subMetrics: { 'Matters': matters },
  };
}

function computeAnswers(rows: Row[]): StageMetrics {
  const total = rows.length;
  const defendants = new Set(rows.map(r => String(r['Defendant'] ?? ''))).size;
  const defaults = rows.filter(r => r['Default Entered Date'] && r['Default Entered Date'] !== '-').length;
  return {
    stage: 'answers', label: STAGE_LABELS.answers,
    primary: total, overdue: total, pctTimely: total === 0 ? 100 : 0,
    rag: rag(total),
    subMetrics: { 'Defendants': defendants, 'Defaults': defaults },
  };
}

function computeFormA(rows: Row[]): StageMetrics {
  const total = rows.length;
  const attyReview = rows.filter(r => String(r['Active Stage'] ?? '').toLowerCase().includes('attorney')).length;
  const daysArr = rows.map(r => {
    const d = parseDate(r['Answer Filed']);
    return d ? daysSinceToday(d) : null;
  }).filter((d): d is number => d != null);
  const served = rows.filter(r => r['Form A Served'] && r['Form A Served'] !== '-').length;
  const pctServed = total ? Math.round((served / total) * 100) : 100;
  return {
    stage: 'formA', label: STAGE_LABELS.formA,
    primary: total, overdue: total, pctTimely: pctServed,
    rag: rag(total),
    subMetrics: { 'Atty Review': attyReview, 'Avg Days': mean(daysArr), '% Served': pctServed },
  };
}

function computeFormC(crossRefRows: Row[], tenDayRows: Row[], motionRows: Row[]): StageMetrics {
  const primary = crossRefRows.length;
  const need10Day = tenDayRows.length;
  const needMotion = motionRows.length;
  const total = primary + need10Day + needMotion;
  return {
    stage: 'formC', label: STAGE_LABELS.formC,
    primary: total, overdue: total, pctTimely: total === 0 ? 100 : 0,
    rag: rag(total),
    subMetrics: { 'Past Due': primary, '10-Day': need10Day, 'Motions': needMotion },
  };
}

function computeDepositions(rows: Row[]): StageMetrics {
  const total = rows.length;
  const overdue180 = rows.filter(r => {
    const tf = r['Time from Filed'];
    return typeof tf === 'number' && tf >= 180;
  }).length;
  const daysArr = rows.map(r => r['Time from Filed']).filter((v): v is number => typeof v === 'number');
  const scheduled = rows.filter(r => r['Client Depo Date'] && r['Client Depo Date'] !== '-').length;
  const pctScheduled = total ? Math.round((scheduled / total) * 100) : 100;
  return {
    stage: 'depositions', label: STAGE_LABELS.depositions,
    primary: total, overdue: overdue180, pctTimely: pctScheduled,
    rag: rag(overdue180, [1, 3]),
    subMetrics: { 'Overdue 180+': overdue180, 'Avg Days': mean(daysArr), '% Scheduled': pctScheduled },
  };
}

function computeDED(rows: Row[]): StageMetrics {
  // Filter to rows with DED
  const withDED = rows.filter(r => r['Discovery End Date'] && r['Discovery End Date'] !== '-');
  const parsed = withDED.map(r => {
    const d = parseDate(r['Discovery End Date']);
    return d ? daysFromToday(d) : null;
  }).filter((d): d is number => d != null);

  const past = parsed.filter(d => d < 0).length;
  const within30 = parsed.filter(d => d >= 0 && d <= 30).length;
  const within60 = parsed.filter(d => d > 30 && d <= 60).length;
  const atRisk = past + within60 + within30;

  let ragColor: RagColor = 'green';
  if (past > 0) ragColor = 'red';
  else if (within30 > 0) ragColor = 'amber';

  return {
    stage: 'ded', label: STAGE_LABELS.ded,
    primary: atRisk, overdue: past, pctTimely: parsed.length ? Math.round(((parsed.length - past - within30) / parsed.length) * 100) : 100,
    rag: ragColor,
    subMetrics: { 'Past DED': past, 'Within 30d': within30, 'Within 60d': within60 },
  };
}

// ─── Main computation ───────────────────────────────────────────────────────

export function buildAttorneyList(bundle: ReportBundle): string[] {
  const set = new Set<string>();
  bundle.openLit?.groupings.forEach(g => { if (g.label) set.add(g.label); });
  bundle.answers?.groupings.forEach(g => { if (g.label) set.add(g.label); });
  bundle.service?.groupings.forEach(g => { if (g.label) set.add(g.label); });
  return Array.from(set).sort();
}

export function computeAllAttorneyStageMetrics(bundle: ReportBundle): AttorneyScore[] {
  const attorneys = buildAttorneyList(bundle);
  const lookup = buildAttorneyLookup(bundle.openLit?.detailRows ?? []);

  return attorneys.map(attorney => {
    // Filter rows per report for this attorney
    const complaintRows = filterRowsByAttorney(bundle.complaints?.detailRows ?? [], lookup, attorney);
    const serviceRows = (bundle.service?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);
    const answerRows = (bundle.answers?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);
    const formARows = filterRowsByAttorney(bundle.formA?.detailRows ?? [], lookup, attorney);
    const formCCrossRef = filterRowsByAttorney(bundle.formC?.detailRows ?? [], lookup, attorney);
    const tenDayRows = (bundle.tenDay?.detailRows ?? []).filter(r => level2Attorney(r._groupingLabel) === attorney);
    const motionRows = (bundle.motions?.detailRows ?? []).filter(r => level2Attorney(r._groupingLabel) === attorney);
    const depRows = filterRowsByAttorney(bundle.deps?.detailRows ?? [], lookup, attorney);
    const openLitRows = (bundle.openLit?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);

    const stages: Record<StageName, StageMetrics> = {
      complaints: computeComplaints(complaintRows),
      service: computeService(serviceRows),
      answers: computeAnswers(answerRows),
      formA: computeFormA(formARows),
      formC: computeFormC(formCCrossRef, tenDayRows, motionRows),
      depositions: computeDepositions(depRows),
      ded: computeDED(openLitRows),
    };

    let redCount = 0;
    let amberCount = 0;
    let greenCount = 0;
    let totalIssues = 0;
    const actionParts: string[] = [];

    for (const s of STAGE_ORDER) {
      const m = stages[s];
      if (m.rag === 'red') {
        redCount++;
        // Build actionable text for red stages
        if (s === 'complaints') actionParts.push(`${m.overdue} complaints overdue`);
        else if (s === 'service') actionParts.push(`${m.primary} past-due service`);
        else if (s === 'answers') actionParts.push(`${m.primary} missing answers`);
        else if (s === 'formA') actionParts.push(`${m.primary} Form A past due`);
        else if (s === 'formC') actionParts.push(`${m.primary} Form C items`);
        else if (s === 'depositions') actionParts.push(`${m.overdue} deps overdue 180+`);
        else if (s === 'ded') actionParts.push(`${m.overdue} past DED`);
      } else if (m.rag === 'amber') {
        amberCount++;
      } else {
        greenCount++;
      }
      totalIssues += m.primary;
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
    };
  });
}

export function computeStageAggregates(scores: AttorneyScore[]): StageAggregate[] {
  return STAGE_ORDER.map(stage => {
    let totalItems = 0;
    let greenCount = 0;
    let amberCount = 0;
    let redCount = 0;
    const pctArr: number[] = [];

    for (const s of scores) {
      const m = s.stages[stage];
      totalItems += m.primary;
      pctArr.push(m.pctTimely);
      if (m.rag === 'green') greenCount++;
      else if (m.rag === 'amber') amberCount++;
      else redCount++;
    }

    return {
      stage,
      label: STAGE_LABELS[stage],
      totalItems,
      pctTimely: mean(pctArr),
      greenCount,
      amberCount,
      redCount,
    };
  });
}
