/**
 * Attorney lookup and scoring — consolidated from attorneyLookup.ts + ldnMetrics.ts.
 */
import { topAttorney, filterLitOnlyRaw } from './shared';
import { computeComplaints } from './complaints';
import { computeService } from './service';
import { computeAnswers } from './answers';
import { computeFormA } from './formA';
import { computeFormC } from './formC';
import { computeDepositions } from './depositions';
import { computeDED } from './ded';
import type { StageName, LdnStageMetrics, LdnAttorneyScore, LdnReportBundle, LdnStageAggregate } from './types';
import { STAGE_ORDER, STAGE_LABELS } from './types';

type Row = Record<string, unknown>;

// ── Attorney lookup ──────────────────────────────────────────────────

interface DetailRow extends Record<string, unknown> {
  _groupingLabel?: string;
}

/** Build a Map of Display Name → attorney name from Open Lit detail rows. */
export function buildAttorneyLookup(openLitRows: DetailRow[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const row of openLitRows) {
    const attorney = row._groupingLabel;
    const displayName = row['Display Name'] as string | undefined;
    if (typeof attorney === 'string' && typeof displayName === 'string' && displayName) {
      if (!lookup.has(displayName)) {
        lookup.set(displayName, attorney);
      }
    }
  }
  return lookup;
}

/** Filter detail rows to only those belonging to the given attorney. */
export function filterRowsByAttorney(
  rows: DetailRow[],
  lookup: Map<string, string>,
  attorney: string,
  displayNameKey = 'Display Name',
): DetailRow[] {
  return rows.filter(row => {
    const dn = row[displayNameKey];
    return typeof dn === 'string' && lookup.get(dn) === attorney;
  });
}

/** Build attorney lookup with topAttorney() fix for cross-ref. */
export function buildFixedAttorneyLookup(openLitRows: Row[]): Map<string, string> {
  const raw = buildAttorneyLookup(openLitRows as DetailRow[]);
  const fixed = new Map<string, string>();
  for (const [dn, atty] of raw) {
    fixed.set(dn, topAttorney(atty));
  }
  return fixed;
}

function _filterRowsByAttorney(rows: Row[], lookup: Map<string, string>, attorney: string): Row[] {
  return filterRowsByAttorney(rows as DetailRow[], lookup, attorney);
}

// ── Attorney list ────────────────────────────────────────────────────

export function buildAttorneyList(bundle: LdnReportBundle): string[] {
  const set = new Set<string>();
  bundle.openLit?.groupings.forEach(g => { if (g.label) set.add(topAttorney(g.label)); });
  bundle.answers?.groupings.forEach(g => { if (g.label) set.add(topAttorney(g.label)); });
  bundle.service?.groupings.forEach(g => { if (g.label) set.add(topAttorney(g.label)); });
  set.delete('');
  set.delete('Micronetbd User');
  return Array.from(set).sort();
}

// ── Main computation: all attorneys ──────────────────────────────────

export function computeAllLdnMetrics(bundle: LdnReportBundle): LdnAttorneyScore[] {
  const attorneys = buildAttorneyList(bundle);
  const lookup = buildFixedAttorneyLookup(bundle.openLit?.detailRows ?? []);

  const allComplaints = bundle.complaints?.detailRows ?? [];
  const litFormA = filterLitOnlyRaw(bundle.formA?.detailRows ?? []);
  const litFormC = filterLitOnlyRaw(bundle.formC?.detailRows ?? []);
  const litDeps = filterLitOnlyRaw(bundle.deps?.detailRows ?? []);
  const litOpenLit = filterLitOnlyRaw(bundle.openLit?.detailRows ?? []);

  return attorneys.map(attorney => {
    const complaintRows = _filterRowsByAttorney(allComplaints, lookup, attorney);
    const serviceRows = (bundle.service?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);
    const answerRows = (bundle.answers?.detailRows ?? []).filter(r => topAttorney(r._groupingLabel) === attorney);
    const formARows = _filterRowsByAttorney(litFormA, lookup, attorney);
    const formCRows = _filterRowsByAttorney(litFormC, lookup, attorney);
    const depRows = _filterRowsByAttorney(litDeps, lookup, attorney);
    const openLitRows = litOpenLit.filter(r => topAttorney(r._groupingLabel) === attorney);

    const svc30Rows = (bundle.service30Day?.detailRows ?? []).filter(r => {
      const dn = String(r['Display Name'] ?? '');
      return lookup.get(dn) === attorney;
    });

    const c = computeComplaints(complaintRows);
    const s = computeService(serviceRows, svc30Rows);
    const a = computeAnswers(answerRows);
    const fa = computeFormA(formARows);
    const fc = computeFormC(formCRows);
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

// ── Portfolio-level gauges ────────────────────────────────────────────

export { computePortfolioGauges } from './portfolio';

// ── Stage aggregates from attorney scores ────────────────────────────

export function computeStageAggregatesFromLdn(scores: LdnAttorneyScore[]): LdnStageAggregate[] {
  return STAGE_ORDER.map(stage => {
    let totalItems = 0;
    let greenCount = 0;
    let amberCount = 0;
    let redCount = 0;

    for (const s of scores) {
      const m = s.stages[stage];
      const primary = typeof m.cards[0]?.value === 'number' ? m.cards[0].value : 0;
      totalItems += primary;
      if (m.rag === 'green') greenCount++;
      else if (m.rag === 'amber') amberCount++;
      else redCount++;
    }

    const total = greenCount + amberCount + redCount;
    const pctTimely = total ? Math.round((greenCount / total) * 100) : 100;

    return {
      stage,
      label: STAGE_LABELS[stage],
      totalItems,
      pctTimely,
      greenCount,
      amberCount,
      redCount,
    };
  });
}
