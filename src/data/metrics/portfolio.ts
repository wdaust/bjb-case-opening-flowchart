/**
 * Portfolio-level aggregates — computePortfolioGauges, computePortfolioStages, computePortfolioFromScores.
 * Extracted from ldnMetrics.ts.
 */
import type { BulletGauge } from './shared';
import { buildGauge, parseDate, daysSinceToday, daysFromToday, filterLitOnlyRaw, topAttorney, level2Attorney } from './shared';
import { computeComplaints } from './complaints';
import { computeService } from './service';
import { computeAnswers } from './answers';
import { computeFormA } from './formA';
import { computeFormC } from './formC';
import { computeDepositions } from './depositions';
import { computeDED } from './ded';
import { buildFixedAttorneyLookup } from './attorney';
import type { StageName, LdnStageMetrics, LdnReportBundle, LdnAttorneyScore } from './types';
import { SLA_TARGETS } from './types';

type Row = Record<string, unknown>;

export function computePortfolioGauges(bundle: LdnReportBundle): Record<StageName, BulletGauge> {
  const complaintDays = filterLitOnlyRaw(bundle.complaints?.detailRows ?? []).map(r => {
    const v = r['Date Assigned to Team to Today'];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    if (!isNaN(num)) return num;
    const d = parseDate(r['Date Assigned To Litigation Unit']);
    return d ? daysSinceToday(d) : null;
  }).filter((d): d is number => d != null);

  const serviceCount = (bundle.service?.detailRows ?? []).length;
  const serviceDays = (bundle.service30Day?.detailRows ?? []).map(r => {
    const raw = r['Days to Service'];
    const num = typeof raw === 'number' ? raw : Number(raw);
    return isNaN(num) ? null : num;
  }).filter((d): d is number => d != null);
  const answerCount = (bundle.answers?.detailRows ?? []).length;

  const formADays = filterLitOnlyRaw(bundle.formA?.detailRows ?? []).map(r => {
    const v = r['Answer Date to Today'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  }).filter((d): d is number => d != null);

  const formCDays = filterLitOnlyRaw(bundle.formC?.detailRows ?? []).map(r => {
    const v = r['Answer Date to Today'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  }).filter((d): d is number => d != null);

  const depDays = filterLitOnlyRaw(bundle.deps?.detailRows ?? []).map(r => {
    const v = r['Time from Filed Date'] ?? r['Time from Filed'];
    const num = typeof v === 'number' ? v : Number(v);
    return isNaN(num) ? null : num;
  }).filter((d): d is number => d != null);

  const dedDays = filterLitOnlyRaw(bundle.openLit?.detailRows ?? [])
    .filter(r => r['Discovery End Date'] && r['Discovery End Date'] !== '-')
    .map(r => {
      const d = parseDate(r['Discovery End Date']);
      return d ? Math.abs(daysFromToday(d)) : null;
    }).filter((d): d is number => d != null);

  return {
    complaints: buildGauge('Complaints', complaintDays, SLA_TARGETS.complaints),
    service: serviceDays.length > 0
      ? buildGauge('Service', serviceDays, SLA_TARGETS.service)
      : { label: 'Service', count: serviceCount, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.service, noAgingData: true },
    answers: { label: 'Answers', count: answerCount, medianAge: 0, p90Age: 0, slaTarget: SLA_TARGETS.answers, noAgingData: true },
    formA: buildGauge('Form A Overdue', formADays, SLA_TARGETS.formA),
    formC: buildGauge('Form C', formCDays, SLA_TARGETS.formC),
    depositions: buildGauge('Depositions', depDays, SLA_TARGETS.depositions),
    ded: buildGauge('DED', dedDays, SLA_TARGETS.ded),
  };
}

export function computePortfolioStages(bundle: LdnReportBundle): Record<StageName, LdnStageMetrics> {
  const lookup = buildFixedAttorneyLookup(bundle.openLit?.detailRows ?? []);
  void lookup;

  const allComplaint = bundle.complaints?.detailRows ?? [];
  const allService = bundle.service?.detailRows ?? [];
  const allAnswers = bundle.answers?.detailRows ?? [];
  const allFormA = filterLitOnlyRaw(bundle.formA?.detailRows ?? []);
  const allFormC = filterLitOnlyRaw(bundle.formC?.detailRows ?? []);
  const allDeps = filterLitOnlyRaw(bundle.deps?.detailRows ?? []);
  const allOpenLit = filterLitOnlyRaw(bundle.openLit?.detailRows ?? []);
  const allSvc30 = bundle.service30Day?.detailRows ?? [];

  return {
    complaints: computeComplaints(allComplaint).metrics,
    service: computeService(allService, allSvc30).metrics,
    answers: computeAnswers(allAnswers).metrics,
    formA: computeFormA(allFormA).metrics,
    formC: computeFormC(allFormC).metrics,
    depositions: computeDepositions(allDeps).metrics,
    ded: computeDED(allOpenLit).metrics,
  };
}

export function computePortfolioFromScores(scores: LdnAttorneyScore[], bundle: LdnReportBundle): Record<StageName, LdnStageMetrics> {
  const attorneySet = new Set(scores.map(s => s.attorney));
  const lookup = buildFixedAttorneyLookup(bundle.openLit?.detailRows ?? []);

  function filterToAttorneys(rows: Row[], mode: 'grouping' | 'crossref' | 'level2'): Row[] {
    if (mode === 'grouping') {
      return rows.filter(r => {
        const atty = topAttorney(r._groupingLabel);
        return atty && attorneySet.has(atty);
      });
    }
    if (mode === 'level2') {
      return rows.filter(r => {
        const atty = level2Attorney(r._groupingLabel);
        return atty && attorneySet.has(atty);
      });
    }
    return rows.filter(r => {
      const atty = topAttorney(r._groupingLabel);
      if (atty && attorneySet.has(atty)) return true;
      const dn = String(r['Display Name'] ?? r['Matter Name'] ?? '');
      const mapped = lookup.get(dn);
      return mapped ? attorneySet.has(mapped) : false;
    });
  }

  const attyComplaints = filterToAttorneys(bundle.complaints?.detailRows ?? [], 'crossref');
  const attyService = filterToAttorneys(bundle.service?.detailRows ?? [], 'grouping');
  const attyAnswers = filterToAttorneys(bundle.answers?.detailRows ?? [], 'grouping');
  const attyFormA = filterToAttorneys(filterLitOnlyRaw(bundle.formA?.detailRows ?? []), 'crossref');
  const attyFormC = filterToAttorneys(filterLitOnlyRaw(bundle.formC?.detailRows ?? []), 'crossref');
  const attyDeps = filterToAttorneys(filterLitOnlyRaw(bundle.deps?.detailRows ?? []), 'crossref');
  const attyOpenLit = filterToAttorneys(filterLitOnlyRaw(bundle.openLit?.detailRows ?? []), 'grouping');
  const attySvc30 = filterToAttorneys(bundle.service30Day?.detailRows ?? [], 'crossref');

  return {
    complaints: computeComplaints(attyComplaints).metrics,
    service: computeService(attyService, attySvc30).metrics,
    answers: computeAnswers(attyAnswers).metrics,
    formA: computeFormA(attyFormA).metrics,
    formC: computeFormC(attyFormC).metrics,
    depositions: computeDepositions(attyDeps).metrics,
    ded: computeDED(attyOpenLit).metrics,
  };
}
