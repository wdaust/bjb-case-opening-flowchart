/**
 * Shared metric computation helpers — pure functions, no framework deps.
 * Extracted from ldnMetrics.ts.
 */

export type RagColor = 'green' | 'amber' | 'red';

export interface BulletGauge {
  label: string;
  count: number;
  medianAge: number;   // P50
  p90Age: number;      // P90
  slaTarget: number;   // days
  noAgingData?: boolean;
}

export interface MetricCard {
  label: string;
  value: number | string;
  rag: RagColor;
  subMetrics?: { label: string; value: number | string }[];
  disabled?: boolean;
  badge?: string;
}

export interface ActionableIssue {
  stage: string;
  description: string;
  daysOverdue: number;
  priority: RagColor;
  suggestedAction: string;
}

// ── Date helpers (re-exported from schemas/fields.ts for convenience) ──

export { parseDate, daysSinceToday, daysFromToday } from '../schemas/fields';

// ── Stats ──

export function mean(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
}

export function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return percentile(sorted, 50);
}

export function p90(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return percentile(sorted, 90);
}

export function minVal(arr: number[]): number { return arr.length ? Math.min(...arr) : 0; }
export function maxVal(arr: number[]): number { return arr.length ? Math.max(...arr) : 0; }

/** Count unique matters by a key field. Falls back to unique index for null keys. */
export function uniqueMatterCount(rows: Array<Record<string, unknown>>, key = 'Display Name'): number {
  const set = new Set<string>();
  for (const r of rows) set.add(String(r[key] ?? `_u${set.size}`));
  return set.size;
}

// ── RAG ──

export function rag(overdue: number, thresholds: [number, number] = [1, 4]): RagColor {
  if (overdue >= thresholds[1]) return 'red';
  if (overdue >= thresholds[0]) return 'amber';
  return 'green';
}

// ── Gauge builder ──

export function buildGauge(label: string, ages: number[], slaTarget: number, totalCount?: number): BulletGauge {
  const sorted = [...ages].sort((a, b) => a - b);
  return {
    label,
    count: totalCount ?? sorted.length,
    medianAge: percentile(sorted, 50),
    p90Age: percentile(sorted, 90),
    slaTarget,
  };
}

// ── Grouping label helpers ──

/** Extract top-level attorney name from _groupingLabel like "Lisa Lehrer > Litigation". */
export function topAttorney(label: unknown): string {
  if (typeof label !== 'string') return '';
  return label.split(' > ')[0].trim();
}

/** Extract second-level value from _groupingLabel. */
export function level2Attorney(label: unknown): string {
  if (typeof label !== 'string') return '';
  const parts = label.split(' > ');
  return parts.length >= 2 ? parts[1].trim() : parts[0].trim();
}

/** Extract Form A status bucket from _groupingLabel. */
export function formABucket(groupingLabel: string): string {
  return groupingLabel.split(' > ')[0].trim();
}

/** Extract Form C status bucket from _groupingLabel. */
export function formCBucket(groupingLabel: string): string {
  return groupingLabel.split(' > ')[0].trim();
}

// ── LIT-only filter ──

const PRE_LIT_STAGES = new Set(['Case Opening', 'Accounts Opening', 'Opening']);

/** Filter rows to LIT-only matters using raw row fields. */
export function filterLitOnlyRaw(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return rows.filter(r => {
    const piStatus = r['PI Status'];
    if (piStatus != null) return piStatus === 'Litigation';
    const stage = r['Active Stage'];
    if (typeof stage === 'string' && stage !== '') return !PRE_LIT_STAGES.has(stage);
    return true;
  });
}

// ── SF Helpers (from sfHelpers.ts) ──

import type { DashboardResponse, DashboardRow } from '../../types/salesforce';

/** Format number as currency with K/M/B suffixes. */
export function fmt$(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/** Locale-formatted number. */
export function fmtNum(n: number): string {
  return n.toLocaleString();
}

/** Extract a single numeric value from a dashboard component by title. */
export function getDashMetric(dash: DashboardResponse | null, title: string): number | null {
  if (!dash) return null;
  const comp = dash.components.find(c => c.title === title);
  if (!comp || !comp.rows[0]) return null;
  return comp.rows[0].values[0]?.value ?? null;
}

/** Return all rows from a dashboard component by title. */
export function getDashRows(dash: DashboardResponse | null, title: string): DashboardRow[] {
  if (!dash) return [];
  const comp = dash.components.find(c => c.title === title);
  return comp?.rows ?? [];
}

/** Aggregate dashboard rows into timely/late counts based on label keywords. */
export function getTimingCompliance(
  dash: DashboardResponse | null,
  title: string,
): { timely: number; late: number } {
  const rows = getDashRows(dash, title);
  let timely = 0;
  let late = 0;
  for (const r of rows) {
    const v = r.values[0]?.value ?? 0;
    const lbl = r.label.toLowerCase();
    if (lbl.includes('timely') || lbl.includes('compliant') || lbl.includes('under')) {
      timely += v;
    } else {
      late += v;
    }
  }
  return { timely, late };
}

/** Compute compliance percentage from timely/late counts. */
export function compliancePct(c: { timely: number; late: number }): number {
  const total = c.timely + c.late;
  return total ? Math.round((c.timely / total) * 100) : 0;
}

/** Get the source report ID for a dashboard component by title. */
export function getDashSourceReportId(dash: DashboardResponse | null, title: string): string | null {
  if (!dash) return null;
  const comp = dash.components.find(c => c.title === title);
  return comp?.sourceReportId ?? null;
}

/** Return Tailwind classes for compliance percentage (green/amber/red). */
export function complianceColor(p: number): string {
  if (p >= 60) return 'text-green-400 border-green-500/30 bg-green-500/10';
  if (p >= 30) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}
