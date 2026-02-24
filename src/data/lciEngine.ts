// ── LCI Engine: Litigation Control Index ─────────────────────────────────
// 7 weighted layers, composite 0-100 score
// Deterministic calculations using seeded PRNG from case/entity IDs

import {
  cases,
  attorneys,
  getCasesByStage,
  getCasesByAttorney,
  getDaysInStage,
  type LitCase,
  type Stage,
} from './mockData';

// ── Types ────────────────────────────────────────────────────────────────

export type LCIBand = 'green' | 'amber' | 'red';

export interface LayerMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  band: LCIBand;
  trend: number[]; // 12 data points
}

export interface LayerScore {
  layerId: number;
  name: string;
  weight: number;
  score: number; // 0-100
  band: LCIBand;
  metrics: LayerMetric[];
}

export interface LCIResult {
  score: number; // 0-100
  band: LCIBand; // green >=85, amber 70-84, red <70
  layers: LayerScore[];
  trend: number[]; // 12 data points
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

// ── Layer Definitions ────────────────────────────────────────────────────

export const LAYER_DEFINITIONS: { id: number; name: string; weight: number }[] = [
  { id: 0, name: 'Predictive Monetization', weight: 0.15 },
  { id: 1, name: 'Revenue & Outcome Control', weight: 0.20 },
  { id: 2, name: 'Throughput Speed', weight: 0.15 },
  { id: 3, name: 'SLA Compliance', weight: 0.15 },
  { id: 4, name: 'Pressure & Enforcement', weight: 0.15 },
  { id: 5, name: 'Inventory Health & Risk', weight: 0.10 },
  { id: 6, name: 'Quality & Margin Protection', weight: 0.10 },
];

// ── Metric Definitions with RAG Thresholds ───────────────────────────────

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

const LAYER_METRICS: MetricDef[][] = [
  // Layer 0: Predictive Monetization
  [
    { id: '0.1', name: '90-Day Settlement Forecast % of Goal', unit: '%', target: 105, greenMin: 105, greenMax: 200, amberMin: 90, amberMax: 104, redMin: 0, redMax: 89, higherIsBetter: true },
    { id: '0.2', name: 'Modeled Value vs Offer Delta', unit: '%', target: 15, greenMin: 0, greenMax: 15, amberMin: 16, amberMax: 25, redMin: 26, redMax: 100, higherIsBetter: false },
    { id: '0.3', name: 'Early Low-Value Settlement Rate', unit: '%', target: 5, greenMin: 0, greenMax: 5, amberMin: 6, amberMax: 10, redMin: 11, redMax: 100, higherIsBetter: false },
  ],
  // Layer 1: Revenue & Outcome Control
  [
    { id: '1.1', name: 'Weekly Settlement $ vs Goal %', unit: '%', target: 100, greenMin: 100, greenMax: 200, amberMin: 80, amberMax: 99, redMin: 0, redMax: 79, higherIsBetter: true },
    { id: '1.2', name: 'Settlement Cycle Time', unit: 'days', target: 270, greenMin: 0, greenMax: 270, amberMin: 271, amberMax: 330, redMin: 331, redMax: 999, higherIsBetter: false },
    { id: '1.3', name: 'Median Settlement Value vs Rolling 12mo', unit: '%', target: 100, greenMin: 100, greenMax: 200, amberMin: 90, amberMax: 99, redMin: 0, redMax: 89, higherIsBetter: true },
    { id: '1.4', name: 'Mediation Yield %', unit: '%', target: 65, greenMin: 65, greenMax: 100, amberMin: 50, amberMax: 64, redMin: 0, redMax: 49, higherIsBetter: true },
  ],
  // Layer 2: Throughput Speed
  [
    { id: '2.1', name: 'Median Days to Complaint Filed', unit: 'days', target: 22, greenMin: 0, greenMax: 22, amberMin: 23, amberMax: 28, redMin: 29, redMax: 999, higherIsBetter: false },
    { id: '2.2', name: 'Median Days Filing to Service', unit: 'days', target: 20, greenMin: 0, greenMax: 20, amberMin: 21, amberMax: 28, redMin: 29, redMax: 999, higherIsBetter: false },
    { id: '2.3', name: 'Median Days Answer to Discovery Served', unit: 'days', target: 7, greenMin: 0, greenMax: 7, amberMin: 8, amberMax: 12, redMin: 13, redMax: 999, higherIsBetter: false },
    { id: '2.4', name: 'Median Days Discovery to Expert Retained', unit: 'days', target: 12, greenMin: 0, greenMax: 12, amberMin: 13, amberMax: 18, redMin: 19, redMax: 999, higherIsBetter: false },
  ],
  // Layer 3: SLA Compliance
  [
    { id: '3.1', name: 'Complaint Filed ≤30 Days %', unit: '%', target: 85, greenMin: 85, greenMax: 100, amberMin: 75, amberMax: 84, redMin: 0, redMax: 74, higherIsBetter: true },
    { id: '3.2', name: 'Service ≤30 Days %', unit: '%', target: 90, greenMin: 90, greenMax: 100, amberMin: 80, amberMax: 89, redMin: 0, redMax: 79, higherIsBetter: true },
    { id: '3.3', name: 'Discovery Served ≤10 Days %', unit: '%', target: 90, greenMin: 90, greenMax: 100, amberMin: 80, amberMax: 89, redMin: 0, redMax: 79, higherIsBetter: true },
    { id: '3.4', name: 'Expert Report ≤45 Days %', unit: '%', target: 80, greenMin: 80, greenMax: 100, amberMin: 65, amberMax: 79, redMin: 0, redMax: 64, higherIsBetter: true },
  ],
  // Layer 4: Pressure & Enforcement
  [
    { id: '4.1', name: 'Enforcement When Defense >10 Days Overdue %', unit: '%', target: 95, greenMin: 95, greenMax: 100, amberMin: 85, amberMax: 94, redMin: 0, redMax: 84, higherIsBetter: true },
    { id: '4.2', name: 'Avg Days Past Due to Motion Filed', unit: 'days', target: 15, greenMin: 0, greenMax: 15, amberMin: 16, amberMax: 25, redMin: 26, redMax: 999, higherIsBetter: false },
    { id: '4.3', name: 'Good Faith Cure Rate %', unit: '%', target: 70, greenMin: 70, greenMax: 100, amberMin: 55, amberMax: 69, redMin: 0, redMax: 54, higherIsBetter: true },
    { id: '4.4', name: 'Litigation Pressure Index', unit: 'score', target: 85, greenMin: 85, greenMax: 100, amberMin: 70, amberMax: 84, redMin: 0, redMax: 69, higherIsBetter: true },
  ],
  // Layer 5: Inventory Health & Risk
  [
    { id: '5.1', name: '% No Activity >21 Days', unit: '%', target: 8, greenMin: 0, greenMax: 8, amberMin: 9, amberMax: 15, redMin: 16, redMax: 100, higherIsBetter: false },
    { id: '5.2', name: '% Non-Service >45 Days', unit: '%', target: 5, greenMin: 0, greenMax: 5, amberMin: 6, amberMax: 10, redMin: 11, redMax: 100, higherIsBetter: false },
    { id: '5.3', name: '% Mediation Eligible Scheduled in 14 Days', unit: '%', target: 90, greenMin: 90, greenMax: 100, amberMin: 75, amberMax: 89, redMin: 0, redMax: 74, higherIsBetter: true },
    { id: '5.4', name: 'Trial Readiness Risk %', unit: '%', target: 3, greenMin: 0, greenMax: 3, amberMin: 4, amberMax: 7, redMin: 8, redMax: 100, higherIsBetter: false },
    { id: '5.5', name: 'Deadline Compression Risk %', unit: '%', target: 2, greenMin: 0, greenMax: 2, amberMin: 3, amberMax: 5, redMin: 6, redMax: 100, higherIsBetter: false },
  ],
  // Layer 6: Quality & Margin Protection
  [
    { id: '6.1', name: 'Pleading Defect Rate', unit: '%', target: 3, greenMin: 0, greenMax: 3, amberMin: 4, amberMax: 6, redMin: 7, redMax: 100, higherIsBetter: false },
    { id: '6.2', name: 'Discovery Rework Rate', unit: '%', target: 5, greenMin: 0, greenMax: 5, amberMin: 6, amberMax: 10, redMin: 11, redMax: 100, higherIsBetter: false },
    { id: '6.3', name: 'Staff Hours Variance', unit: '%', target: 0, greenMin: 0, greenMax: 5, amberMin: 6, amberMax: 10, redMin: 11, redMax: 100, higherIsBetter: false },
    { id: '6.4', name: 'Cost of Delay Index', unit: 'index', target: 1.0, greenMin: 0, greenMax: 1.0, amberMin: 1.01, amberMax: 1.3, redMin: 1.31, redMax: 5, higherIsBetter: false },
  ],
];

// ── Seeded PRNG ──────────────────────────────────────────────────────────

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ── Helper: Compute band from metric definition ──────────────────────────

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

// ── Helper: Compute metric score 0-100 based on position in RAG range ────

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

// ── Helper: Generate trend data ──────────────────────────────────────────

function generateTrend(baseSeed: number, baseValue: number, variance: number): number[] {
  const rng = seededRandom(baseSeed);
  const trend: number[] = [];
  let current = baseValue - variance * 0.5;
  for (let i = 0; i < 12; i++) {
    const drift = (rng() - 0.45) * variance * 0.3;
    current = Math.max(0, current + drift);
    trend.push(Math.round(current * 100) / 100);
  }
  // Ensure the last point is close to the base value
  trend[11] = Math.round(baseValue * 100) / 100;
  return trend;
}

// ── Helper: Generate metric value from case data or seeded random ────────

function generateMetricValue(
  def: MetricDef,
  seedStr: string,
  filteredCases: LitCase[],
): number {
  const rng = seededRandom(hashCode(seedStr + def.id));
  const active = filteredCases.filter(c => c.status === 'active');
  const total = active.length || 1;

  // Data-driven metrics where possible
  switch (def.id) {
    case '5.1': {
      // % No Activity >21 Days - use stalled cases
      const stalled = active.filter(c => c.riskFlags.includes('Silent stall'));
      return Math.round((stalled.length / total) * 1000) / 10;
    }
    case '5.2': {
      // % Non-Service >45 Days - approximate from case opening stage cases
      const caseOpening = active.filter(c => c.stage === 'lit-case-opening');
      const nonService = caseOpening.filter(c => getDaysInStage(c) > 45);
      const denominator = caseOpening.length || 1;
      return Math.round((nonService.length / denominator) * 1000) / 10;
    }
    case '3.1': {
      // Complaint Filed <=30 Days % - use lit-case-opening stage data
      const coCases = active.filter(c => c.stage === 'lit-case-opening');
      const inSla = coCases.filter(c => getDaysInStage(c) <= 30);
      const denom = coCases.length || 1;
      return Math.round((inSla.length / denom) * 1000) / 10;
    }
    case '3.2': {
      // Service <=30 Days % - approximate from discovery stage
      const overSla = active.filter(c => c.riskFlags.includes('Over SLA'));
      return Math.round((1 - overSla.length / total) * 1000) / 10;
    }
    default:
      break;
  }

  // For other metrics, generate realistic seeded values
  // Bias towards amber-green range (realistic firm operating at decent level)
  const r = rng();
  if (def.higherIsBetter) {
    // 60% chance green, 30% amber, 10% red
    if (r < 0.6) {
      const innerR = rng();
      return Math.round((def.greenMin + innerR * (def.greenMax - def.greenMin) * 0.3) * 10) / 10;
    } else if (r < 0.9) {
      const innerR = rng();
      return Math.round((def.amberMin + innerR * (def.amberMax - def.amberMin)) * 10) / 10;
    } else {
      const innerR = rng();
      return Math.round((def.redMin + (def.redMax - def.redMin) * 0.5 + innerR * (def.redMax - def.redMin) * 0.5) * 10) / 10;
    }
  } else {
    if (r < 0.6) {
      const innerR = rng();
      return Math.round((def.greenMin + innerR * (def.greenMax - def.greenMin)) * 10) / 10;
    } else if (r < 0.9) {
      const innerR = rng();
      return Math.round((def.amberMin + innerR * (def.amberMax - def.amberMin)) * 10) / 10;
    } else {
      const innerR = rng();
      return Math.round((def.redMin + innerR * (def.redMax - def.redMin) * 0.4) * 10) / 10;
    }
  }
}

// ── Core LCI Calculation ─────────────────────────────────────────────────

function calculateLCI(seedStr: string, filteredCases: LitCase[]): LCIResult {
  const layers: LayerScore[] = LAYER_DEFINITIONS.map((layerDef, layerIdx) => {
    const metricDefs = LAYER_METRICS[layerIdx];
    const metrics: LayerMetric[] = metricDefs.map(def => {
      const value = generateMetricValue(def, seedStr, filteredCases);
      const band = computeBand(value, def);
      const trendSeed = hashCode(seedStr + def.id + 'trend');
      const variance = def.higherIsBetter
        ? (def.greenMax - def.redMin) * 0.15
        : (def.redMax - def.greenMin) * 0.15;
      return {
        id: def.id,
        name: def.name,
        value,
        target: def.target,
        unit: def.unit,
        band,
        trend: generateTrend(trendSeed, value, variance),
      };
    });

    // Layer score = average of metric scores
    const avgScore = metrics.reduce((sum, m) => {
      const def = metricDefs.find(d => d.id === m.id)!;
      return sum + metricScore(m.value, def);
    }, 0) / metrics.length;

    const score = Math.round(avgScore * 10) / 10;
    const band: LCIBand = score >= 85 ? 'green' : score >= 70 ? 'amber' : 'red';

    return {
      layerId: layerDef.id,
      name: layerDef.name,
      weight: layerDef.weight,
      score,
      band,
      metrics,
    };
  });

  // Composite score = weighted sum of layer scores
  const composite = layers.reduce((sum, l) => sum + l.score * l.weight, 0);
  const score = Math.round(composite * 10) / 10;
  const band: LCIBand = score >= 85 ? 'green' : score >= 70 ? 'amber' : 'red';

  // Generate overall trend
  const trendSeed = hashCode(seedStr + 'overall-trend');
  const trend = generateTrend(trendSeed, score, 8);

  return { score, band, layers, trend };
}

// ── Public API ───────────────────────────────────────────────────────────

export function calculateFirmLCI(): LCIResult {
  return calculateLCI('firm-lci', cases);
}

export function calculateOfficeLCI(office: string): LCIResult {
  const officeCases = cases.filter(c => c.office === office);
  return calculateLCI(`office-lci-${office}`, officeCases);
}

export function calculateAttorneyLCI(attorneyId: string): LCIResult {
  const att = attorneys.find(a => a.id === attorneyId);
  const attCases = att ? getCasesByAttorney(att.name) : [];
  return calculateLCI(`attorney-lci-${attorneyId}`, attCases);
}

export function calculateStageLCI(stageId: string): LCIResult {
  const stageCases = getCasesByStage(stageId as Stage);
  return calculateLCI(`stage-lci-${stageId}`, stageCases);
}

export function calculateCaseLCI(caseId: string): number {
  const c = cases.find(cc => cc.id === caseId);
  if (!c) return 50;

  const rng = seededRandom(hashCode(caseId + 'case-lci'));

  // Base score from case properties
  let score = 75;

  // Adjust for SLA status
  const daysInStage = getDaysInStage(c);
  if (daysInStage > c.slaTarget) {
    score -= 15;
  } else if (daysInStage > c.slaTarget * 0.8) {
    score -= 7;
  }

  // Adjust for stall
  if (c.riskFlags.includes('Silent stall')) score -= 10;

  // Adjust for risk flags
  score -= c.riskFlags.length * 3;

  // Adjust for gate completion
  const gateTotal = c.gateChecklist.length || 1;
  const gateComplete = c.gateChecklist.filter(g => g.completed).length;
  score += (gateComplete / gateTotal) * 10;

  // Adjust for EV confidence
  score += (c.evConfidence - 0.5) * 15;

  // Add deterministic jitter
  score += (rng() - 0.5) * 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function getOffices(): string[] {
  const officeSet = new Set<string>();
  cases.forEach(c => officeSet.add(c.office));
  return Array.from(officeSet).sort();
}

// ── Escalations ──────────────────────────────────────────────────────────

export function getEscalations(): EscalationItem[] {
  const firmLCI = calculateFirmLCI();
  const escalations: EscalationItem[] = [];
  const officeList = getOffices();
  const rng = seededRandom(hashCode('escalations-seed'));
  let escId = 1;

  for (const layer of firmLCI.layers) {
    for (const metric of layer.metrics) {
      if (metric.band === 'red') {
        const weeksInRed = 1 + Math.floor(rng() * 4);
        const officeIdx = Math.floor(rng() * officeList.length);
        const attIdx = Math.floor(rng() * attorneys.length);
        const escalationLevel: EscalationItem['escalationLevel'] =
          weeksInRed >= 4 ? 'executive' :
          weeksInRed >= 3 ? 'vp' :
          weeksInRed >= 2 ? 'manager' : 'unit-review';

        escalations.push({
          id: `esc-${String(escId++).padStart(3, '0')}`,
          metricName: metric.name,
          layerName: layer.name,
          currentValue: metric.value,
          target: metric.target,
          unit: metric.unit,
          weeksInRed,
          escalationLevel,
          owner: attorneys[attIdx].name,
          office: officeList[officeIdx],
        });
      }
    }
  }

  // Ensure we have at least 8 escalations by adding amber metrics that are close to red
  if (escalations.length < 8) {
    for (const layer of firmLCI.layers) {
      if (escalations.length >= 12) break;
      for (const metric of layer.metrics) {
        if (escalations.length >= 12) break;
        if (metric.band === 'amber') {
          const weeksInRed = 1;
          const officeIdx = Math.floor(rng() * officeList.length);
          const attIdx = Math.floor(rng() * attorneys.length);
          escalations.push({
            id: `esc-${String(escId++).padStart(3, '0')}`,
            metricName: metric.name,
            layerName: layer.name,
            currentValue: metric.value,
            target: metric.target,
            unit: metric.unit,
            weeksInRed,
            escalationLevel: 'unit-review',
            owner: attorneys[attIdx].name,
            office: officeList[officeIdx],
          });
        }
      }
    }
  }

  return escalations.slice(0, 12);
}
