/**
 * Shared helpers for computing stage detail rows and metrics from drill-down data.
 * Used by both LDN.tsx (LDM page) and LCIReport.tsx.
 */

import type { LdnReportBundle, StageName, LdnStageMetrics, DrillRow } from './types';
import { topAttorney, filterLitOnlyRaw as filterLitOnly } from './shared';
import { computeComplaints } from './complaints';
import { computeService } from './service';
import { computeAnswers } from './answers';
import { computeFormA } from './formA';
import { computeFormC } from './formC';
import { computeDepositions } from './depositions';
import { computeDED } from './ded';

/** Deduplicate rows to one per matter. Keeps the first row encountered per matter key. */
export function dedupeByMatter(rows: DrillRow[]): DrillRow[] {
  const seen = new Map<string, DrillRow>();
  for (const r of rows) {
    let key: string | undefined;
    for (const k of ['Matter Name', 'Matter: Matter Name']) {
      const v = r[k];
      if (typeof v === 'string' && v && v !== '-') { key = v; break; }
    }
    if (!key) {
      const dn = r['Display Name'];
      if (typeof dn === 'string' && dn && dn !== '-') key = dn;
    }
    if (!key) { seen.set(`_u${seen.size}`, r); continue; }
    if (!seen.has(key)) seen.set(key, r);
  }
  return Array.from(seen.values());
}

/** Map stage name to the right detail rows from the bundle, filtered & deduped. */
export function getStageDetailRows(
  bundle: LdnReportBundle,
  stage: StageName,
  complaintsMode: 'excludeBlockers' | 'includeBlockers',
  scores: { attorney: string }[],
  lookup: Map<string, string>,
): { rows: DrillRow[] } {
  const attorneySet = new Set(scores.map(s => s.attorney));

  function filterByGrouping(rows: DrillRow[]): DrillRow[] {
    return rows.filter(r => {
      const atty = topAttorney(r._groupingLabel);
      return atty && attorneySet.has(atty);
    });
  }

  function filterByCrossref(rows: DrillRow[]): DrillRow[] {
    return rows.filter(r => {
      const atty = topAttorney(r._groupingLabel);
      if (atty && attorneySet.has(atty)) return true;
      const dn = String(r['Display Name'] ?? r['Matter Name'] ?? '');
      const mapped = lookup.get(dn);
      return mapped ? attorneySet.has(mapped) : false;
    });
  }

  switch (stage) {
    case 'complaints': {
      const allRows = (bundle.complaints?.detailRows ?? []) as DrillRow[];
      const attorneyRows = filterByCrossref(allRows);
      const preLitRows = attorneyRows.filter(r => r['PI Status'] === 'Pre-Lit' || r['PI Status'] == null);
      if (complaintsMode === 'includeBlockers') return { rows: dedupeByMatter(preLitRows) };
      return { rows: dedupeByMatter(preLitRows.filter(r => {
        const b = r['Blocker to Filing Complaint'] ?? r['Blocker'];
        return !b || b === '-';
      })) };
    }
    case 'service':
      return { rows: dedupeByMatter(filterByGrouping((bundle.service?.detailRows ?? []) as DrillRow[])) };
    case 'answers':
      return { rows: dedupeByMatter(filterByGrouping((bundle.answers?.detailRows ?? []) as DrillRow[])) };
    case 'formA':
      return { rows: dedupeByMatter(filterByCrossref(filterLitOnly(bundle.formA?.detailRows ?? []) as DrillRow[])) };
    case 'formC':
      return { rows: dedupeByMatter(filterByCrossref(filterLitOnly(bundle.formC?.detailRows ?? []) as DrillRow[])) };
    case 'depositions':
      return { rows: dedupeByMatter(filterByCrossref(filterLitOnly(bundle.deps?.detailRows ?? []) as DrillRow[])) };
    case 'ded':
      return { rows: dedupeByMatter(filterByGrouping(filterLitOnly(bundle.openLit?.detailRows ?? []) as DrillRow[])) };
  }
}

/** Compute stage metrics from the same rows used for drill-down. */
export function computeMetricsFromRows(stage: StageName, rows: DrillRow[], svc30Rows: DrillRow[]): LdnStageMetrics {
  switch (stage) {
    case 'complaints': return computeComplaints(rows).metrics;
    case 'service': return computeService(rows, svc30Rows).metrics;
    case 'answers': return computeAnswers(rows).metrics;
    case 'formA': return computeFormA(rows).metrics;
    case 'formC': return computeFormC(rows).metrics;
    case 'depositions': return computeDepositions(rows).metrics;
    case 'ded': return computeDED(rows).metrics;
  }
}
