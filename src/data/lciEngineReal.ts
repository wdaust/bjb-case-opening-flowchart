// ── Real-Data LCI Engine ─────────────────────────────────────────────────
// 4 weighted layers, ~14 metrics computed from live Salesforce data only.
// No mock data, no seeded PRNG.

import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce';
import { getDashMetric, getDashRows, getTimingCompliance, compliancePct } from '../utils/sfHelpers';

// ── Types (compatible with lciEngine.ts originals) ──────────────────────

export type LCIBand = 'green' | 'amber' | 'red';

export interface LayerMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  band: LCIBand;
}

export interface LayerScore {
  layerId: number;
  name: string;
  weight: number;
  score: number;
  band: LCIBand;
  metrics: LayerMetric[];
}

export interface LCIResult {
  score: number;
  band: LCIBand;
  layers: LayerScore[];
}

export interface AttorneyLCIRow {
  name: string;
  cases: number;
  settlement: number;
  avgPerCase: number;
  netFee: number;
  feeRatio: number;
}

export interface AlertMetric {
  metricName: string;
  layerName: string;
  value: number;
  target: number;
  unit: string;
  band: LCIBand;
}

// ── Layer Definitions ───────────────────────────────────────────────────

export const REAL_LAYER_DEFINITIONS = [
  { id: 0, name: 'Revenue Performance', weight: 0.30 },
  { id: 1, name: 'Timing Compliance', weight: 0.30 },
  { id: 2, name: 'Inventory Health', weight: 0.25 },
  { id: 3, name: 'Workload Balance', weight: 0.15 },
];

// ── Metric RAG Thresholds ───────────────────────────────────────────────

interface MetricDef {
  id: string;
  name: string;
  unit: string;
  target: number;
  greenMin: number;
  greenMax: number;
  amberMin: number;
  amberMax: number;
  redMin: number;
  redMax: number;
  higherIsBetter: boolean;
}

export interface EscalationItem {
  id: string;
  metricName: string;
  layerName: string;
  currentValue: number;
  target: number;
  unit: string;
  weeksInRed: number;
  escalationLevel: 'unit-review' | 'manager' | 'vp' | 'executive';
  owner: string;
  office: string;
}

export const LAYER_METRICS: MetricDef[][] = [
  // Layer 0: Revenue Performance
  [
    { id: '0.1', name: 'Total Settlement $', unit: '$', target: 5_000_000, greenMin: 5_000_000, greenMax: 100_000_000, amberMin: 2_000_000, amberMax: 4_999_999, redMin: 0, redMax: 1_999_999, higherIsBetter: true },
    { id: '0.2', name: 'Resolved Cases', unit: 'count', target: 100, greenMin: 100, greenMax: 10_000, amberMin: 50, amberMax: 99, redMin: 0, redMax: 49, higherIsBetter: true },
    { id: '0.3', name: 'Avg Settlement / Case', unit: '$', target: 40_000, greenMin: 40_000, greenMax: 500_000, amberMin: 25_000, amberMax: 39_999, redMin: 0, redMax: 24_999, higherIsBetter: true },
    { id: '0.4', name: 'Net Fee Ratio', unit: '%', target: 30, greenMin: 30, greenMax: 100, amberMin: 20, amberMax: 29, redMin: 0, redMax: 19, higherIsBetter: true },
  ],
  // Layer 1: Timing Compliance
  [
    { id: '1.1', name: 'Complaint Compliance %', unit: '%', target: 70, greenMin: 70, greenMax: 100, amberMin: 50, amberMax: 69, redMin: 0, redMax: 49, higherIsBetter: true },
    { id: '1.2', name: 'Form A Compliance %', unit: '%', target: 70, greenMin: 70, greenMax: 100, amberMin: 50, amberMax: 69, redMin: 0, redMax: 49, higherIsBetter: true },
    { id: '1.3', name: 'Form C Compliance %', unit: '%', target: 70, greenMin: 70, greenMax: 100, amberMin: 50, amberMax: 69, redMin: 0, redMax: 49, higherIsBetter: true },
    { id: '1.4', name: 'Deposition Compliance %', unit: '%', target: 70, greenMin: 70, greenMax: 100, amberMin: 50, amberMax: 69, redMin: 0, redMax: 49, higherIsBetter: true },
    { id: '1.5', name: 'Complaint Avg Days', unit: 'days', target: 25, greenMin: 0, greenMax: 25, amberMin: 26, amberMax: 35, redMin: 36, redMax: 999, higherIsBetter: false },
  ],
  // Layer 2: Inventory Health
  [
    { id: '2.1', name: 'NJ Lit Inventory', unit: 'count', target: 500, greenMin: 100, greenMax: 1_500, amberMin: 1_501, amberMax: 2_500, redMin: 2_501, redMax: 10_000, higherIsBetter: false },
    { id: '2.2', name: 'No Service 35+ Days %', unit: '%', target: 5, greenMin: 0, greenMax: 5, amberMin: 6, amberMax: 12, redMin: 13, redMax: 100, higherIsBetter: false },
    { id: '2.3', name: 'Missing Disc. Trackers %', unit: '%', target: 5, greenMin: 0, greenMax: 5, amberMin: 6, amberMax: 12, redMin: 13, redMax: 100, higherIsBetter: false },
    { id: '2.4', name: 'Missing Answers %', unit: '%', target: 3, greenMin: 0, greenMax: 3, amberMin: 4, amberMax: 8, redMin: 9, redMax: 100, higherIsBetter: false },
  ],
  // Layer 3: Workload Balance
  [
    { id: '3.1', name: 'Discovery Trackers Total', unit: 'count', target: 200, greenMin: 0, greenMax: 200, amberMin: 201, amberMax: 400, redMin: 401, redMax: 10_000, higherIsBetter: false },
    { id: '3.2', name: 'Experts Unserved Total', unit: 'count', target: 50, greenMin: 0, greenMax: 50, amberMin: 51, amberMax: 100, redMin: 101, redMax: 10_000, higherIsBetter: false },
  ],
];

// ── Scoring Helpers ─────────────────────────────────────────────────────

function computeBand(value: number, def: MetricDef): LCIBand {
  if (def.higherIsBetter) {
    if (value >= def.greenMin) return 'green';
    if (value >= def.amberMin) return 'amber';
    return 'red';
  } else {
    if (value <= def.greenMax) return 'green';
    if (value <= def.amberMax) return 'amber';
    return 'red';
  }
}

function metricScore(value: number, def: MetricDef): number {
  if (def.higherIsBetter) {
    if (value >= def.greenMin) {
      const range = def.greenMax - def.greenMin;
      const pos = range > 0 ? Math.min((value - def.greenMin) / range, 1) : 1;
      return 85 + pos * 15;
    }
    if (value >= def.amberMin) {
      const range = def.amberMax - def.amberMin;
      const pos = range > 0 ? (value - def.amberMin) / range : 0.5;
      return 70 + pos * 15;
    }
    const range = def.redMax - def.redMin;
    const pos = range > 0 ? Math.min((value - def.redMin) / range, 1) : 0;
    return pos * 70;
  } else {
    if (value <= def.greenMax) {
      const range = def.greenMax - def.greenMin;
      const pos = range > 0 ? 1 - ((value - def.greenMin) / range) : 1;
      return 85 + pos * 15;
    }
    if (value <= def.amberMax) {
      const range = def.amberMax - def.amberMin;
      const pos = range > 0 ? 1 - ((value - def.amberMin) / range) : 0.5;
      return 70 + pos * 15;
    }
    const range = def.redMax - def.redMin;
    const pos = range > 0 ? Math.max(1 - ((value - def.redMin) / range), 0) : 0;
    return pos * 70;
  }
}

// ── Data Extraction ─────────────────────────────────────────────────────

export interface RealLCIInput {
  resData: ReportSummaryResponse | null;
  statsData: DashboardResponse | null;
  timingData: DashboardResponse | null;
  discData: ReportSummaryResponse | null;
  expertsData: ReportSummaryResponse | null;
}

function extractMetricValues(input: RealLCIInput): number[][] {
  const { resData, statsData, timingData, discData, expertsData } = input;

  // Layer 0: Revenue Performance
  const totalSettlement = (resData?.grandTotals.find(g => g.label.includes('Settlement'))?.value ?? 0) as number;
  const resolvedCases = (resData?.grandTotals.find(g => g.label === 'Record Count')?.value ?? 0) as number;
  const avgPerCase = resolvedCases ? totalSettlement / resolvedCases : 0;
  const totalNetFee = (resData?.grandTotals.find(g => g.label.includes('Fee'))?.value ?? 0) as number;
  const feeRatio = totalSettlement ? (totalNetFee / totalSettlement) * 100 : 0;

  // Layer 1: Timing Compliance
  const complaint = getTimingCompliance(timingData, 'Complaint Timing NJ');
  const formA = getTimingCompliance(timingData, 'Form A Timing NJ in Days from Answer');
  const formC = getTimingCompliance(timingData, 'Form C Timing NJ in Days from Answer');
  const deps = getTimingCompliance(timingData, 'Dep Timing NJ in Days from Form A');
  const complaintDaysRows = getDashRows(timingData, 'Complaint Timing NJ in Days');
  const complaintTimelyDays = complaintDaysRows.find(r => r.label.toLowerCase().includes('timely'))?.values[0]?.value ?? 0;

  // Layer 2: Inventory Health
  const njInventory = getDashMetric(statsData, 'NJ Lit Inventory') ?? 0;
  const noService35 = getDashMetric(statsData, 'No Service 35+ Days (NJ)') ?? 0;
  const missingTrackers = getDashMetric(statsData, 'Missing Discovery Trackers (NJ)') ?? 0;
  const missingAnswers = getDashMetric(statsData, 'Missing All Ans, No Default (NJ)') ?? 0;
  const noServicePct = njInventory ? (noService35 / njInventory) * 100 : 0;
  const missingTrackersPct = njInventory ? (missingTrackers / njInventory) * 100 : 0;
  const missingAnswersPct = njInventory ? (missingAnswers / njInventory) * 100 : 0;

  // Layer 3: Workload Balance
  const discTotal = (discData?.grandTotals[0]?.value ?? 0) as number;
  const expertsTotal = (expertsData?.grandTotals[0]?.value ?? 0) as number;

  return [
    [totalSettlement, resolvedCases, avgPerCase, feeRatio],
    [compliancePct(complaint), compliancePct(formA), compliancePct(formC), compliancePct(deps), complaintTimelyDays],
    [njInventory, noServicePct, missingTrackersPct, missingAnswersPct],
    [discTotal, expertsTotal],
  ];
}

// ── Main Computation ────────────────────────────────────────────────────

export function computeRealLCI(input: RealLCIInput): LCIResult {
  const allValues = extractMetricValues(input);

  const layers: LayerScore[] = REAL_LAYER_DEFINITIONS.map((layerDef, layerIdx) => {
    const metricDefs = LAYER_METRICS[layerIdx];
    const values = allValues[layerIdx];

    const metrics: LayerMetric[] = metricDefs.map((def, i) => {
      const value = values[i] ?? 0;
      const band = computeBand(value, def);
      return { id: def.id, name: def.name, value, target: def.target, unit: def.unit, band };
    });

    const avgScore = metrics.reduce((sum, m) => {
      const def = metricDefs.find(d => d.id === m.id)!;
      return sum + metricScore(m.value, def);
    }, 0) / metrics.length;

    const score = Math.round(avgScore * 10) / 10;
    const band: LCIBand = score >= 85 ? 'green' : score >= 70 ? 'amber' : 'red';

    return { layerId: layerDef.id, name: layerDef.name, weight: layerDef.weight, score, band, metrics };
  });

  const composite = layers.reduce((sum, l) => sum + l.score * l.weight, 0);
  const score = Math.round(composite * 10) / 10;
  const band: LCIBand = score >= 85 ? 'green' : score >= 70 ? 'amber' : 'red';

  return { score, band, layers };
}

// ── Attorney Metrics ────────────────────────────────────────────────────

export function computeAttorneyMetrics(resData: ReportSummaryResponse | null): AttorneyLCIRow[] {
  if (!resData) return [];
  return resData.groupings.map(g => {
    const cases = (g.aggregates.find(a => a.label === 'Record Count')?.value ?? 0) as number;
    const settlement = (g.aggregates.find(a => a.label.includes('Settlement'))?.value ?? 0) as number;
    const netFee = (g.aggregates.find(a => a.label.includes('Fee'))?.value ?? 0) as number;
    return {
      name: g.label,
      cases,
      settlement,
      avgPerCase: cases ? settlement / cases : 0,
      netFee,
      feeRatio: settlement ? (netFee / settlement) * 100 : 0,
    };
  }).sort((a, b) => b.settlement - a.settlement);
}

// ── Escalation Engine ─────────────────────────────────────────────────────

const METRIC_HISTORY_KEY: Record<string, string> = {
  'Complaint Compliance %': 'complaintPct',
  'Form A Compliance %': 'formAPct',
  'Form C Compliance %': 'formCPct',
  'Deposition Compliance %': 'depsPct',
  'NJ Lit Inventory': 'njInventory',
  'No Service 35+ Days %': 'noService35',
  'Missing Disc. Trackers %': 'missingTrackers',
  'Missing Answers %': 'missingAnswers',
  'Total Settlement $': 'totalSettlement',
  'Resolved Cases': 'totalResolved',
};

function isInRedRange(value: number, def: MetricDef): boolean {
  return computeBand(value, def) === 'red';
}

function weeksToLevel(weeks: number): EscalationItem['escalationLevel'] {
  if (weeks <= 1) return 'unit-review';
  if (weeks === 2) return 'manager';
  if (weeks === 3) return 'vp';
  return 'executive';
}

export function getRealEscalations(
  lci: LCIResult,
  snapshots: { date: string; metrics: Record<string, number> }[],
): EscalationItem[] {
  const escalations: EscalationItem[] = [];

  // Build a flat lookup of MetricDef by metric name
  const defByName = new Map<string, MetricDef>();
  for (const layer of LAYER_METRICS) {
    for (const def of layer) {
      defByName.set(def.name, def);
    }
  }

  for (const layer of lci.layers) {
    for (const metric of layer.metrics) {
      if (metric.band !== 'red') continue;

      const def = defByName.get(metric.name);
      if (!def) continue;

      const histKey = METRIC_HISTORY_KEY[metric.name];

      let weeksInRed = 1; // minimum 1 for currently-red

      if (histKey && snapshots.length > 0) {
        // Sort snapshots oldest-first
        const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

        // Group snapshots into calendar weeks (ending at the most recent snapshot)
        // Walk backwards through weeks and count consecutive red weeks
        const now = new Date(sorted[sorted.length - 1].date);
        let weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)

        let consecutiveRedWeeks = 0;
        let checking = true;

        while (checking && weekStart.getTime() >= new Date(sorted[0].date).getTime()) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekStartStr = weekStart.toISOString().slice(0, 10);
          const weekEndStr = weekEnd.toISOString().slice(0, 10);

          // Find snapshots in this week
          const weekSnapshots = sorted.filter(
            s => s.date >= weekStartStr && s.date <= weekEndStr && s.metrics[histKey] !== undefined,
          );

          if (weekSnapshots.length === 0) {
            // No data for this week — stop counting
            break;
          }

          // Use the latest snapshot in the week
          const latest = weekSnapshots[weekSnapshots.length - 1];
          const val = latest.metrics[histKey];

          if (isInRedRange(val, def)) {
            consecutiveRedWeeks++;
          } else {
            checking = false;
          }

          // Move to previous week
          weekStart.setDate(weekStart.getDate() - 7);
        }

        weeksInRed = Math.max(consecutiveRedWeeks, 1);
      }

      escalations.push({
        id: `esc-${metric.id}`,
        metricName: metric.name,
        layerName: layer.name,
        currentValue: metric.value,
        target: metric.target,
        unit: metric.unit,
        weeksInRed,
        escalationLevel: weeksToLevel(weeksInRed),
        owner: 'Firm-wide',
        office: 'NJ',
      });
    }
  }

  // Sort by weeksInRed descending (highest escalation first)
  return escalations.sort((a, b) => b.weeksInRed - a.weeksInRed);
}

// ── Stage-based LCI (7-stage scorecard) ────────────────────────────────

import type { LdnStageMetrics, StageName } from './metrics/types';
import { STAGE_ORDER, STAGE_LABELS } from './metrics/types';

export interface StageLCIRow {
  stage: StageName;
  label: string;
  score: number;
  onTrackPct: number;
  stuckCount: number;
  band: LCIBand;
}

export interface StageLCIResult {
  score: number;
  band: LCIBand;
  stages: StageLCIRow[];
}

/**
 * Compute LCI from LDN stage metrics (7 stages, equal weight).
 * Per-stage score = on-track percentage from card[0] value:
 *   - If card[0].value is 0 → 100% on-track
 *   - Otherwise compute from RAG: green=100, amber=75, red=50
 * Composite = average of 7 stage scores.
 */
export function computeStageLCI(stageMetrics: Record<StageName, LdnStageMetrics>): StageLCIResult {
  const stages: StageLCIRow[] = STAGE_ORDER.map(sn => {
    const m = stageMetrics[sn];
    const primaryVal = typeof m.cards[0]?.value === 'number' ? m.cards[0].value : 0;

    // Score based on RAG status
    let score: number;
    if (m.rag === 'green') score = 100;
    else if (m.rag === 'amber') score = 75;
    else score = 50;

    // on-track % — inverse: fewer issues = higher on-track
    const total = m.gauge.count || 1;
    const onTrackPct = total > 0 ? Math.round(Math.max(0, (1 - primaryVal / total)) * 100) : 100;

    const band: LCIBand = score >= 85 ? 'green' : score >= 70 ? 'amber' : 'red';

    return {
      stage: sn,
      label: STAGE_LABELS[sn],
      score,
      onTrackPct,
      stuckCount: primaryVal,
      band,
    };
  });

  const composite = stages.reduce((sum, s) => sum + s.score, 0) / stages.length;
  const score = Math.round(composite * 10) / 10;
  const band: LCIBand = score >= 85 ? 'green' : score >= 70 ? 'amber' : 'red';

  return { score, band, stages };
}

// ── Alert Metrics (red/amber) ───────────────────────────────────────────

export function getRedAmberMetrics(lci: LCIResult): AlertMetric[] {
  const alerts: AlertMetric[] = [];
  for (const layer of lci.layers) {
    for (const metric of layer.metrics) {
      if (metric.band === 'red' || metric.band === 'amber') {
        alerts.push({
          metricName: metric.name,
          layerName: layer.name,
          value: metric.value,
          target: metric.target,
          unit: metric.unit,
          band: metric.band,
        });
      }
    }
  }
  // Red first, then amber
  return alerts.sort((a, b) => (a.band === 'red' ? 0 : 1) - (b.band === 'red' ? 0 : 1));
}
