// ── Forecast Utilities ───────────────────────────────────────────────────
// Lightweight settlement forecast engine
// Deterministic via seeded PRNG

import {
  getActiveCases,
  getDaysInStage,
  type LitCase,
} from './mockData';

// ── Types ────────────────────────────────────────────────────────────────

export interface SettlementForecast {
  caseId: string;
  caseTitle: string;
  attorney: string;
  office: string;
  stage: string;
  expectedValue: number;
  probability: number; // 0-1
  weightedValue: number;
  estimatedWeek: number; // weeks from now (1-13)
}

export interface WeeklyForecast {
  week: number;
  weekLabel: string;
  count: number;
  totalValue: number;
  weightedValue: number;
  cumulative: number;
}

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

// ── Stage-Based Settlement Probability ───────────────────────────────────

const STAGE_PROBABILITY: Record<string, number> = {
  // Intake - very unlikely to settle soon
  'intake': 0.02,
  // Pre-lit stages - increasing probability
  'pre-account-opening': 0.03,
  'pre-treatment-monitoring': 0.05,
  'pre-value-development': 0.08,
  'pre-demand-readiness': 0.15,
  'pre-negotiation': 0.35,
  'pre-resolution-pending': 0.70,
  // Lit stages - higher probability in later stages
  'lit-case-opening': 0.04,
  'lit-treatment-monitoring': 0.06,
  'lit-discovery': 0.12,
  'lit-expert-depo': 0.20,
  'lit-arb-mediation': 0.55,
  'lit-trial': 0.40,
};

// ── Estimated Weeks to Settlement by Stage ───────────────────────────────

const STAGE_WEEKS: Record<string, { min: number; max: number }> = {
  'intake': { min: 10, max: 13 },
  'pre-account-opening': { min: 9, max: 13 },
  'pre-treatment-monitoring': { min: 8, max: 13 },
  'pre-value-development': { min: 6, max: 12 },
  'pre-demand-readiness': { min: 4, max: 10 },
  'pre-negotiation': { min: 2, max: 8 },
  'pre-resolution-pending': { min: 1, max: 4 },
  'lit-case-opening': { min: 8, max: 13 },
  'lit-treatment-monitoring': { min: 7, max: 13 },
  'lit-discovery': { min: 5, max: 11 },
  'lit-expert-depo': { min: 3, max: 9 },
  'lit-arb-mediation': { min: 1, max: 6 },
  'lit-trial': { min: 1, max: 4 },
};

// ── Compute Settlement Probability for a Case ────────────────────────────

function computeProbability(c: LitCase): number {
  const baseProbability = STAGE_PROBABILITY[c.stage] || 0.05;
  let probability = baseProbability;

  // Adjust for EV confidence
  probability *= (0.5 + c.evConfidence * 0.5);

  // Adjust for case age (older cases in late stages more likely)
  const daysInStage = getDaysInStage(c);
  const slaRatio = daysInStage / Math.max(c.slaTarget, 1);
  if (slaRatio > 0.7) {
    probability *= 1.15; // approaching stage transition
  }

  // Cases in resolution-pending or arb-mediation are particularly likely
  if (c.stage === 'pre-resolution-pending') probability = Math.max(probability, 0.60);
  if (c.stage === 'lit-arb-mediation') probability = Math.max(probability, 0.45);

  // Reduce for risk flags
  if (c.riskFlags.includes('Silent stall')) probability *= 0.7;
  if (c.riskFlags.includes('Coverage issue')) probability *= 0.6;

  return Math.min(0.95, Math.max(0.01, probability));
}

// ── Compute Estimated Settlement Week ────────────────────────────────────

function computeEstimatedWeek(c: LitCase, rng: () => number): number {
  const weeks = STAGE_WEEKS[c.stage] || { min: 5, max: 13 };
  const range = weeks.max - weeks.min;
  const week = weeks.min + Math.floor(rng() * range);
  return Math.max(1, Math.min(13, week));
}

// ── Public API ───────────────────────────────────────────────────────────

export function getSettlementForecasts(): SettlementForecast[] {
  const active = getActiveCases();

  return active.map(c => {
    const rng = seededRandom(hashCode(c.id + 'forecast'));
    const probability = computeProbability(c);
    const estimatedWeek = computeEstimatedWeek(c, rng);
    const weightedValue = Math.round(c.expectedValue * probability);

    return {
      caseId: c.id,
      caseTitle: c.title,
      attorney: c.attorney,
      office: c.office,
      stage: c.stage,
      expectedValue: c.expectedValue,
      probability: Math.round(probability * 1000) / 1000,
      weightedValue,
      estimatedWeek,
    };
  }).filter(f => f.probability >= 0.05); // Only include cases with meaningful probability
}

export function getWeeklyForecastPipeline(): WeeklyForecast[] {
  const forecasts = getSettlementForecasts();

  // Bucket into 13 weeks
  const weekBuckets: Map<number, { count: number; totalValue: number; weightedValue: number }> = new Map();
  for (let w = 1; w <= 13; w++) {
    weekBuckets.set(w, { count: 0, totalValue: 0, weightedValue: 0 });
  }

  for (const f of forecasts) {
    const bucket = weekBuckets.get(f.estimatedWeek);
    if (bucket) {
      bucket.count += 1;
      bucket.totalValue += f.expectedValue;
      bucket.weightedValue += f.weightedValue;
    }
  }

  // Build weekly forecast array with cumulative
  const result: WeeklyForecast[] = [];
  let cumulative = 0;

  for (let w = 1; w <= 13; w++) {
    const bucket = weekBuckets.get(w)!;
    cumulative += bucket.weightedValue;

    // Generate week label relative to today (2026-02-19)
    const weekStart = new Date('2026-02-19');
    weekStart.setDate(weekStart.getDate() + (w - 1) * 7);
    const month = weekStart.toLocaleString('en-US', { month: 'short' });
    const day = weekStart.getDate();

    result.push({
      week: w,
      weekLabel: `W${w} (${month} ${day})`,
      count: bucket.count,
      totalValue: bucket.totalValue,
      weightedValue: bucket.weightedValue,
      cumulative,
    });
  }

  return result;
}

export function getTop20MostLikely(): SettlementForecast[] {
  const forecasts = getSettlementForecasts();

  return forecasts
    .sort((a, b) => {
      // Primary sort: probability descending
      // Secondary sort: weighted value descending
      if (b.probability !== a.probability) return b.probability - a.probability;
      return b.weightedValue - a.weightedValue;
    })
    .slice(0, 20);
}
