
import type { ScoringSystem } from '../../data/scoringData.ts';
import { ScoreGauge } from './ScoreGauge.tsx';
import { ScoringCategoryCard } from './ScoringCategoryCard.tsx';
import { ActionTriggersPanel } from './ActionTriggersPanel.tsx';
import { DataHygieneGate } from './DataHygieneGate.tsx';
import { GovernanceTable } from './GovernanceTable.tsx';

interface ScoringSystemPageProps {
  system: ScoringSystem;
  scores: Record<string, number>;
  onScoreChange: (factorId: string, value: number) => void;
  hygieneChecked: Record<string, boolean>;
  onHygieneChange: (id: string, val: boolean) => void;
}

function calculateTotalScore(
  system: ScoringSystem,
  scores: Record<string, number>
): number {
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

export function ScoringSystemPage({
  system,
  scores,
  onScoreChange,
  hygieneChecked,
  onHygieneChange,
}: ScoringSystemPageProps) {
  const totalScore = calculateTotalScore(system, scores);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6">
        <ScoreGauge
          score={totalScore}
          maxScore={system.maxScore}
          size={160}
          label="Total Score"
        />
        <h2 className="text-xl font-bold text-foreground">{system.label}</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xl">
          {system.description}
        </p>
      </div>

      {/* Scoring Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {system.categories.map((category) => (
          <ScoringCategoryCard
            key={category.id}
            category={category}
            scores={scores}
            onScoreChange={onScoreChange}
          />
        ))}
      </div>

      {/* Action Triggers */}
      <ActionTriggersPanel
        triggers={system.actionTriggers}
        currentScore={totalScore}
      />

      {/* Data Hygiene Gate */}
      <DataHygieneGate
        items={system.hygieneGate}
        checked={hygieneChecked}
        onChange={onHygieneChange}
      />

      {/* Governance Table */}
      <GovernanceTable rows={system.governance} />
    </div>
  );
}
