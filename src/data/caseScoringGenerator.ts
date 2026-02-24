// ── Case Scoring Generator ───────────────────────────────────────────────
// Generates deterministic per-case scores for all 5 scoring systems
// Uses seeded PRNG from case IDs for consistent results

import { cases, getCasesByAttorney, type LitCase } from './mockData';
import { scoringSystems, type ScoringSystem } from './scoringData';

// ── Types ────────────────────────────────────────────────────────────────

export interface CaseScoreResult {
  systemId: string;
  systemLabel: string;
  shortLabel: string;
  score: number;
  maxScore: number;
  percentage: number; // 0-100
  band: string; // Prime Asset, Strong Performer, Manage Closely, At Risk, Intervention
  bandColor: string;
}

export interface CaseScoresBundle {
  caseId: string;
  scores: CaseScoreResult[];
  compositeHealth: number; // 0-100 weighted average
  compositeBand: string;
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

// ── Band Definitions ─────────────────────────────────────────────────────
// Bands: Prime Asset (>=86%), Strong Performer (68-85%), Manage Closely (50-67%),
// At Risk (32-49%), Intervention (<32%)

interface BandDef {
  name: string;
  color: string;
  minPct: number;
  maxPct: number;
}

const BANDS: BandDef[] = [
  { name: 'Prime Asset', color: '#22c55e', minPct: 86, maxPct: 100 },
  { name: 'Strong Performer', color: '#3b82f6', minPct: 68, maxPct: 85 },
  { name: 'Manage Closely', color: '#f59e0b', minPct: 50, maxPct: 67 },
  { name: 'At Risk', color: '#f97316', minPct: 32, maxPct: 49 },
  { name: 'Intervention', color: '#ef4444', minPct: 0, maxPct: 31 },
];

function getBand(percentage: number): { name: string; color: string } {
  for (const band of BANDS) {
    if (percentage >= band.minPct) {
      return { name: band.name, color: band.color };
    }
  }
  return { name: 'Intervention', color: '#ef4444' };
}

// ── Composite Weights ────────────────────────────────────────────────────
// UCIS MCHS: LSM 25%, TQM 25%, CRM 20%, CCM 15%, CPM 15%

const COMPOSITE_WEIGHTS: Record<string, number> = {
  'lsm': 0.25,
  'tqm': 0.25,
  'crm': 0.20,
  'ccm': 0.15,
  'cpm': 0.15,
};

// ── Score Generation ─────────────────────────────────────────────────────

function generateCaseScore(caseId: string, system: ScoringSystem, litCase: LitCase | undefined): number {
  const rng = seededRandom(hashCode(`${caseId}-${system.id}`));
  const maxScore = system.maxScore;

  // Base score distribution: most cases are in the 50-85% range
  let basePercentage = 0.45 + rng() * 0.45; // 45% to 90%

  // Adjust based on case properties if available
  if (litCase) {
    // Boost for high EV confidence
    basePercentage += (litCase.evConfidence - 0.5) * 0.1;

    // Penalty for risk flags
    basePercentage -= litCase.riskFlags.length * 0.03;

    // Boost for gate completion
    const gateTotal = litCase.gateChecklist.length || 1;
    const gateComplete = litCase.gateChecklist.filter(g => g.completed).length;
    basePercentage += (gateComplete / gateTotal - 0.5) * 0.08;

    // System-specific adjustments (UCIS modules)
    switch (system.id) {
      case 'lsm':
        // Liability Strength — cases in lit generally have decent liability
        if (litCase.parentStage === 'lit') basePercentage += 0.08;
        if (litCase.stage === 'lit-arb-mediation' || litCase.stage === 'lit-trial') basePercentage += 0.05;
        break;
      case 'tqm':
        // Treatment Quality — strength grows over time
        if (litCase.stage === 'lit-treatment-monitoring' || litCase.stage === 'pre-treatment-monitoring') {
          basePercentage -= 0.05; // Still in treatment, not yet complete
        }
        if (litCase.stage === 'lit-expert-depo' || litCase.stage === 'lit-arb-mediation') {
          basePercentage += 0.07; // Treatment more complete
        }
        break;
      case 'crm':
        // Coverage & Recovery — more defined in later stages
        if (litCase.parentStage !== 'intake') basePercentage += 0.03;
        break;
      case 'ccm':
        // Client Cooperation — established relationship in lit
        if (litCase.parentStage === 'lit') basePercentage += 0.05;
        break;
      case 'cpm':
        // Case Performance — penalty for SLA breach
        if (litCase.riskFlags.includes('Over SLA')) basePercentage -= 0.10;
        if (litCase.riskFlags.includes('Silent stall')) basePercentage -= 0.08;
        break;
    }

    // Add deterministic jitter based on case index
    const jitter = (rng() - 0.5) * 0.1;
    basePercentage += jitter;
  }

  // Clamp to 0.1-0.98 range
  basePercentage = Math.max(0.1, Math.min(0.98, basePercentage));

  return Math.round(basePercentage * maxScore);
}

// ── Public API ───────────────────────────────────────────────────────────

export function getCaseScores(caseId: string): CaseScoresBundle {
  const litCase = cases.find(c => c.id === caseId);

  const scores: CaseScoreResult[] = scoringSystems.map(system => {
    const score = generateCaseScore(caseId, system, litCase);
    const percentage = Math.round((score / system.maxScore) * 100);
    const band = getBand(percentage);

    return {
      systemId: system.id,
      systemLabel: system.label,
      shortLabel: system.shortLabel,
      score,
      maxScore: system.maxScore,
      percentage,
      band: band.name,
      bandColor: band.color,
    };
  });

  // Compute composite health as weighted average of percentages
  let compositeHealth = 0;
  let totalWeight = 0;
  for (const scoreResult of scores) {
    const weight = COMPOSITE_WEIGHTS[scoreResult.systemId] || 0.2;
    compositeHealth += scoreResult.percentage * weight;
    totalWeight += weight;
  }
  compositeHealth = Math.round(compositeHealth / totalWeight);

  const compositeBandResult = getBand(compositeHealth);

  return {
    caseId,
    scores,
    compositeHealth,
    compositeBand: compositeBandResult.name,
  };
}

export function getAttorneyCaseScoreAverages(attorneyName: string): CaseScoreResult[] {
  const attCases = getCasesByAttorney(attorneyName);
  if (attCases.length === 0) {
    // Return zero scores for unknown attorneys
    return scoringSystems.map(system => ({
      systemId: system.id,
      systemLabel: system.label,
      shortLabel: system.shortLabel,
      score: 0,
      maxScore: system.maxScore,
      percentage: 0,
      band: 'Intervention',
      bandColor: '#ef4444',
    }));
  }

  // Compute average scores across all of the attorney's cases
  const totals: Record<string, { totalScore: number; count: number }> = {};
  for (const system of scoringSystems) {
    totals[system.id] = { totalScore: 0, count: 0 };
  }

  for (const litCase of attCases) {
    const bundle = getCaseScores(litCase.id);
    for (const scoreResult of bundle.scores) {
      totals[scoreResult.systemId].totalScore += scoreResult.score;
      totals[scoreResult.systemId].count += 1;
    }
  }

  return scoringSystems.map(system => {
    const t = totals[system.id];
    const avgScore = t.count > 0 ? Math.round(t.totalScore / t.count) : 0;
    const percentage = Math.round((avgScore / system.maxScore) * 100);
    const band = getBand(percentage);

    return {
      systemId: system.id,
      systemLabel: system.label,
      shortLabel: system.shortLabel,
      score: avgScore,
      maxScore: system.maxScore,
      percentage,
      band: band.name,
      bandColor: band.color,
    };
  });
}
