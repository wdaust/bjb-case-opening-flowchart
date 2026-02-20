import { ScoreGauge } from '../scoring/ScoreGauge.tsx';
import type { TrackerTask, Phase } from '../../data/taskTrackerData.ts';
import type { ScoringSystem } from '../../data/scoringData.ts';

// ── Types ──────────────────────────────────────────────────────────────

interface OverviewTabProps {
  tasks: TrackerTask[];
  phases: Phase[];
  statuses: Record<string, string>;
  scoringSystems: ScoringSystem[];
  scores: Record<string, number>;
}

// ── Helpers ────────────────────────────────────────────────────────────

function calculateTotalScore(system: ScoringSystem, scores: Record<string, number>): number {
  let total = 0;
  for (const category of system.categories) {
    for (const factor of category.factors) {
      const score = scores[factor.id];
      if (score == null) continue;
      total += (score / 5) * factor.weight * category.weight * system.maxScore;
    }
  }
  return total;
}

// ── Component ──────────────────────────────────────────────────────────

export function OverviewTab({ tasks, phases, statuses, scoringSystems, scores }: OverviewTabProps) {
  const completedCount = tasks.filter((t) => statuses[t.id] === 'complete').length;
  const inProgressCount = tasks.filter((t) => statuses[t.id] === 'active' || statuses[t.id] === 'in-progress').length;
  const totalCount = tasks.length;
  const phaseCount = phases.length;

  // Phase progress
  const phaseProgress = phases
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((phase) => {
      const phaseTasks = tasks.filter((t) => t.phase === phase.id);
      const phaseCompleted = phaseTasks.filter((t) => statuses[t.id] === 'complete').length;
      return {
        ...phase,
        total: phaseTasks.length,
        completed: phaseCompleted,
        pct: phaseTasks.length > 0 ? Math.round((phaseCompleted / phaseTasks.length) * 100) : 0,
      };
    })
    .filter((p) => p.total > 0);

  return (
    <div className="space-y-6 py-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Tasks" value={totalCount} />
        <SummaryCard label="Completed" value={completedCount} accent="text-green-600" />
        <SummaryCard label="In Progress" value={inProgressCount} accent="text-blue-600" />
        <SummaryCard label="Phases" value={phaseCount} />
      </div>

      {/* Phase progress */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Phase Progress</h3>
        <div className="space-y-3">
          {phaseProgress.map((p) => (
            <div key={p.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{p.label}</span>
                <span className="text-muted-foreground">
                  {p.completed}/{p.total} ({p.pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring gauge summary */}
      {scoringSystems.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Scoring Summary</h3>
          <div className="flex flex-wrap items-end justify-center gap-6">
            {scoringSystems.map((system) => {
              const totalScore = calculateTotalScore(system, scores);
              return (
                <ScoreGauge
                  key={system.id}
                  score={totalScore}
                  maxScore={system.maxScore}
                  size={90}
                  label={system.shortLabel}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Internal ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-2xl font-bold text-foreground">
        <span className={accent}>{value}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
