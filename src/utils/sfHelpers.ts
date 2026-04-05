import type { DashboardResponse, DashboardRow } from '../types/salesforce';

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

/** Return Tailwind classes for compliance percentage (green/amber/red). */
export function complianceColor(p: number): string {
  if (p >= 60) return 'text-green-400 border-green-500/30 bg-green-500/10';
  if (p >= 30) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}
