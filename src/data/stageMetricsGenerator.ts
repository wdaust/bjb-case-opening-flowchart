// ── Stage Metrics Generator ──────────────────────────────────────────────
// Generates realistic metric values for each stage from case data
// Deterministic via seeded PRNG

import {
  getCasesByStage,
  stageLabels,
  type Stage,
  type LitCase,
} from './mockData';
import { tmMetrics, type Metric, type RAGThreshold } from './tmMetricsData';

// ── Types ────────────────────────────────────────────────────────────────

export interface StageMetricValue {
  id: string;
  name: string;
  description: string;
  value: number;
  target: number;
  unit: string;
  band: 'green' | 'amber' | 'red';
  trend: number[]; // 12 data points
}

export interface StageMetricsResult {
  stageId: string;
  stageName: string;
  metrics: StageMetricValue[];
  overallHealth: number; // 0-100
  greenCount: number;
  amberCount: number;
  redCount: number;
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

// ── RAG Band Computation ─────────────────────────────────────────────────

function computeRAGBand(value: number, rag: RAGThreshold): 'green' | 'amber' | 'red' {
  if (value >= rag.green.min && value <= rag.green.max) return 'green';
  if (value >= rag.amber.min && value <= rag.amber.max) return 'amber';
  return 'red';
}

// ── Determine if higher is better from RAG thresholds ────────────────────

function isHigherBetter(rag: RAGThreshold): boolean {
  return rag.green.min > rag.red.max || rag.green.min > rag.red.min;
}

// ── Generate trend data ──────────────────────────────────────────────────

function generateTrend(seed: number, baseValue: number, variance: number): number[] {
  const rng = seededRandom(seed);
  const trend: number[] = [];
  let current = baseValue - variance * 0.3;
  for (let i = 0; i < 12; i++) {
    const drift = (rng() - 0.45) * variance * 0.25;
    current = Math.max(0, current + drift);
    trend.push(Math.round(current * 100) / 100);
  }
  trend[11] = Math.round(baseValue * 100) / 100;
  return trend;
}

// ── Generate a metric value based on case data and metric definition ─────

function generateMetricValue(
  metric: Metric,
  _stageId: string,
  stageCases: LitCase[],
  rng: () => number,
): number {
  const active = stageCases.filter(c => c.status === 'active');
  const activeTotal = active.length || 1;
  const higherBetter = isHigherBetter(metric.rag);

  // Try to derive some values from case data
  if (metric.id.includes('task-sla') || metric.name.toLowerCase().includes('sla compliance')) {
    const overSla = active.filter(c => c.riskFlags.includes('Over SLA'));
    return Math.round((1 - overSla.length / activeTotal) * 1000) / 10;
  }

  if (metric.name.toLowerCase().includes('portfolio touch') || metric.name.toLowerCase().includes('contact')) {
    const recentContact = active.filter(c => {
      const lastActivity = new Date(c.lastActivityDate);
      const now = new Date('2026-02-19');
      const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= 30;
    });
    return Math.round((recentContact.length / activeTotal) * 1000) / 10;
  }

  // For other metrics, generate a realistic value using seeded random
  // Bias toward green/amber range for realistic look
  const r = rng();
  if (higherBetter) {
    const greenRange = metric.rag.green.max - metric.rag.green.min;
    const amberRange = metric.rag.amber.max - metric.rag.amber.min;
    if (r < 0.55) {
      return Math.round((metric.rag.green.min + rng() * greenRange * 0.5) * 10) / 10;
    } else if (r < 0.85) {
      return Math.round((metric.rag.amber.min + rng() * amberRange) * 10) / 10;
    } else {
      const redRange = metric.rag.red.max - metric.rag.red.min;
      return Math.round((metric.rag.red.min + redRange * 0.4 + rng() * redRange * 0.5) * 10) / 10;
    }
  } else {
    const greenRange = metric.rag.green.max - metric.rag.green.min;
    const amberRange = metric.rag.amber.max - metric.rag.amber.min;
    if (r < 0.55) {
      return Math.round((metric.rag.green.min + rng() * greenRange) * 10) / 10;
    } else if (r < 0.85) {
      return Math.round((metric.rag.amber.min + rng() * amberRange) * 10) / 10;
    } else {
      const redRange = metric.rag.red.max - metric.rag.red.min;
      return Math.round((metric.rag.red.min + rng() * redRange * 0.3) * 10) / 10;
    }
  }
}

// ── Resolve which metrics apply to a stage ───────────────────────────────

function getMetricsForStage(_stageId: string): Metric[] {
  // Case opening stages use case opening metrics (imported dynamically)
  // All other stages use TM metrics
  // We use the TM metrics as the baseline for all stages
  // The caseOpeningMetricsData will be used by consumers directly for case-opening stages
  return tmMetrics;
}

// ── Public API ───────────────────────────────────────────────────────────

export function getStageMetrics(stageId: string): StageMetricsResult {
  const stageName = stageLabels[stageId as Stage] || stageId;
  const stageCases = getCasesByStage(stageId as Stage);
  const metrics = getMetricsForStage(stageId);
  const rng = seededRandom(hashCode(`stage-metrics-${stageId}`));

  const metricValues: StageMetricValue[] = metrics.map(metric => {
    const value = generateMetricValue(metric, stageId, stageCases, rng);
    const band = computeRAGBand(value, metric.rag);
    const trendSeed = hashCode(`${stageId}-${metric.id}-trend`);
    const higherBetter = isHigherBetter(metric.rag);
    const variance = higherBetter
      ? (metric.rag.green.max - metric.rag.red.min) * 0.1
      : (metric.rag.red.max - metric.rag.green.min) * 0.1;

    return {
      id: metric.id,
      name: metric.name,
      description: metric.description,
      value,
      target: metric.target,
      unit: metric.unit,
      band,
      trend: generateTrend(trendSeed, value, variance),
    };
  });

  const greenCount = metricValues.filter(m => m.band === 'green').length;
  const amberCount = metricValues.filter(m => m.band === 'amber').length;
  const redCount = metricValues.filter(m => m.band === 'red').length;

  // Overall health: weighted by band (green=100, amber=65, red=25)
  const totalMetrics = metricValues.length || 1;
  const overallHealth = Math.round(
    (greenCount * 100 + amberCount * 65 + redCount * 25) / totalMetrics
  );

  return {
    stageId,
    stageName,
    metrics: metricValues,
    overallHealth,
    greenCount,
    amberCount,
    redCount,
  };
}
