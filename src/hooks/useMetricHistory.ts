const STORAGE_KEY = 'optimus-metric-history';
const MAX_DAYS = 90;

interface DailySnapshot {
  date: string; // YYYY-MM-DD
  metrics: Record<string, number>;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadHistory(): DailySnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailySnapshot[];
  } catch {
    return [];
  }
}

function saveHistory(history: DailySnapshot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/** Save today's metric values (idempotent per day, retains 90 days). */
export function saveMetricSnapshots(metrics: Record<string, number>) {
  const today = getToday();
  const history = loadHistory();

  // If today already exists, update it
  const existing = history.find(s => s.date === today);
  if (existing) {
    existing.metrics = { ...existing.metrics, ...metrics };
  } else {
    history.push({ date: today, metrics });
  }

  // Trim to MAX_DAYS
  const trimmed = history
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_DAYS);

  saveHistory(trimmed);
}

/** Return historical values for a metric key, oldest-first. */
export function useMetricHistory(key: string): number[] {
  const history = loadHistory();
  return history
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => s.metrics[key])
    .filter((v): v is number => v !== undefined);
}

export interface AnomalyResult {
  direction: 'up' | 'down';
  pct: number;
  severity: 'amber' | 'red';
}

/** Flag >20% deviation from trailing average. */
export function detectAnomaly(
  history: number[],
  current: number,
  opts?: { windowSize?: number; threshold?: number }
): AnomalyResult | null {
  const windowSize = opts?.windowSize ?? 30;
  const threshold = opts?.threshold ?? 0.2;

  // Need at least 3 data points for meaningful average
  if (history.length < 3) return null;

  const window = history.slice(-windowSize);
  const avg = window.reduce((s, v) => s + v, 0) / window.length;
  if (avg === 0) return null;

  const deviation = (current - avg) / Math.abs(avg);

  if (Math.abs(deviation) < threshold) return null;

  return {
    direction: deviation > 0 ? 'up' : 'down',
    pct: Math.round(Math.abs(deviation) * 100),
    severity: Math.abs(deviation) >= 0.5 ? 'red' : 'amber',
  };
}
