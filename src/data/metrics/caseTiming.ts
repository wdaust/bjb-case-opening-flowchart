/**
 * Case Timing Standards — bucketing logic for NJ litigation compliance.
 * Pure function: bundle rows + thresholds → stage-level green/amber/red counts.
 */
import type { LdnReportBundle, StageName } from './types';
import { STAGE_ORDER, STAGE_LABELS } from './types';
import { parseDate, daysFromToday } from './shared';
import { filterLitOnlyRaw } from './shared';

export interface TimingThresholds {
  green: number;   // ≤ this = green
  amber: number;   // ≤ this = amber, > = red
}

export const DEFAULT_THRESHOLDS: Record<StageName, TimingThresholds> = {
  complaints:  { green: 14,  amber: 21  },
  service:     { green: 30,  amber: 45  },
  answers:     { green: 45,  amber: 60  },
  formA:       { green: 60,  amber: 90  },
  formC:       { green: 90,  amber: 120 },
  depositions: { green: 120, amber: 180 },
  ded:         { green: 60,  amber: 90  },
};

export type DrillRow = Record<string, unknown>;

export interface TimingStageResult {
  stage: StageName;
  label: string;
  green: number;
  amber: number;
  red: number;
  total: number;
  greenRows: DrillRow[];
  amberRows: DrillRow[];
  redRows: DrillRow[];
}

function extractDays(row: DrillRow, field: string): number | null {
  const v = row[field];
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
  return null;
}

function bucketRow(
  days: number,
  thresholds: TimingThresholds,
): 'green' | 'amber' | 'red' {
  if (days <= thresholds.green) return 'green';
  if (days <= thresholds.amber) return 'amber';
  return 'red';
}

function getDedDays(row: DrillRow): number | null {
  const raw = row['Discovery End Date'];
  const d = parseDate(raw);
  if (!d) return null;
  return Math.abs(daysFromToday(d));
}

function getServiceDays(row: DrillRow): number | null {
  // Try 'Days to Service' first, then 'Time from Filed Date', then 'Time from Filed'
  let days = extractDays(row, 'Days to Service');
  if (days !== null) return days;
  days = extractDays(row, 'Time from Filed Date');
  if (days !== null) return days;
  days = extractDays(row, 'Time from Filed');
  if (days !== null) return days;
  return null;
}

interface StageExtractor {
  getRows: (bundle: LdnReportBundle) => DrillRow[];
  getDays: (row: DrillRow) => number | null;
}

const STAGE_EXTRACTORS: Record<StageName, StageExtractor> = {
  complaints: {
    getRows: (b) => (b.complaints?.detailRows ?? []) as DrillRow[],
    getDays: (r) => extractDays(r, 'Date Assigned to Team to Today'),
  },
  service: {
    getRows: (b) => (b.service?.detailRows ?? []) as DrillRow[],
    getDays: getServiceDays,
  },
  answers: {
    getRows: (b) => (b.answers?.detailRows ?? []) as DrillRow[],
    getDays: (r) => extractDays(r, 'Answer Date to Today'),
  },
  formA: {
    getRows: (b) => filterLitOnlyRaw(b.formA?.detailRows ?? []) as DrillRow[],
    getDays: (r) => extractDays(r, 'Answer Date to Today'),
  },
  formC: {
    getRows: (b) => filterLitOnlyRaw(b.formC?.detailRows ?? []) as DrillRow[],
    getDays: (r) => extractDays(r, 'Answer Date to Today'),
  },
  depositions: {
    getRows: (b) => filterLitOnlyRaw(b.deps?.detailRows ?? []) as DrillRow[],
    getDays: (r) => extractDays(r, 'Answer Date to Today'),
  },
  ded: {
    getRows: (b) => filterLitOnlyRaw(b.openLit?.detailRows ?? []) as DrillRow[],
    getDays: getDedDays,
  },
};

/** Get a matter-level key from a row. Tries Matter Name first, then Display Name. */
function matterKey(row: DrillRow): string {
  const mn = row['Matter Name'];
  if (typeof mn === 'string' && mn && mn !== '-') return mn;
  const dn = row['Display Name'];
  if (typeof dn === 'string' && dn && dn !== '-') return dn;
  // Fallback: use the row reference itself (no dedup possible)
  return `_unknown_${Math.random()}`;
}

/**
 * Deduplicate rows to one per matter, keeping the row with the WORST (max) days.
 * This ensures each matter is counted once, classified by its slowest defendant.
 */
function dedupeByMatter(
  rows: DrillRow[],
  getDays: (row: DrillRow) => number | null,
): DrillRow[] {
  const best = new Map<string, { row: DrillRow; days: number }>();
  for (const row of rows) {
    const days = getDays(row);
    if (days === null) continue;
    const key = matterKey(row);
    const existing = best.get(key);
    if (!existing || days > existing.days) {
      best.set(key, { row, days });
    }
  }
  return Array.from(best.values()).map(e => e.row);
}

export function computeCaseTimingStages(
  bundle: LdnReportBundle,
  thresholds: Record<StageName, TimingThresholds>,
): TimingStageResult[] {
  return STAGE_ORDER.map((stage) => {
    const extractor = STAGE_EXTRACTORS[stage];
    const rawRows = extractor.getRows(bundle);
    const t = thresholds[stage];

    // Deduplicate to one row per matter (worst defendant wins)
    const rows = dedupeByMatter(rawRows, extractor.getDays);

    const greenRows: DrillRow[] = [];
    const amberRows: DrillRow[] = [];
    const redRows: DrillRow[] = [];

    for (const row of rows) {
      const days = extractor.getDays(row);
      if (days === null) continue;
      const bucket = bucketRow(days, t);
      if (bucket === 'green') greenRows.push(row);
      else if (bucket === 'amber') amberRows.push(row);
      else redRows.push(row);
    }

    return {
      stage,
      label: STAGE_LABELS[stage],
      green: greenRows.length,
      amber: amberRows.length,
      red: redRows.length,
      total: greenRows.length + amberRows.length + redRows.length,
      greenRows,
      amberRows,
      redRows,
    };
  });
}
