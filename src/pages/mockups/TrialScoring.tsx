import { useState, useMemo } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { scoringSystems, type ScoringSystem } from '../../data/scoringData.ts';
import { ScoreGauge } from '../../components/scoring/ScoreGauge.tsx';
import { ScoringSystemPage } from '../../components/scoring/ScoringSystemPage.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.tsx';
import { Button } from '../../components/ui/button.tsx';
import { cn } from '../../utils/cn.ts';

// ── Helpers ─────────────────────────────────────────────────────────────

function computeTotal(
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

function countScored(
  system: ScoringSystem,
  scores: Record<string, number>
): number {
  let count = 0;
  for (const category of system.categories) {
    for (const factor of category.factors) {
      if (scores[factor.id] != null) count++;
    }
  }
  return count;
}

function totalFactors(system: ScoringSystem): number {
  return system.categories.reduce((sum, cat) => sum + cat.factors.length, 0);
}

// ── Component ───────────────────────────────────────────────────────────

export default function TrialScoring() {
  const [allScores, setAllScores] = useState<Record<string, number>>({});
  const [allHygiene, setAllHygiene] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState(scoringSystems[0].id);
  const [noChangeFlags, setNoChangeFlags] = useState<Record<string, boolean>>({});

  const handleScoreChange = (factorId: string, value: number) => {
    setAllScores((prev) => ({ ...prev, [factorId]: value }));
  };

  const handleHygieneChange = (id: string, val: boolean) => {
    setAllHygiene((prev) => ({ ...prev, [id]: val }));
  };

  // Count systems started
  const systemsStarted = useMemo(() => {
    return scoringSystems.filter((sys) => countScored(sys, allScores) > 0).length;
  }, [allScores]);

  // Active system for recommendation
  const activeSystem = scoringSystems.find((s) => s.id === activeTab);
  const activeTotal = activeSystem ? computeTotal(activeSystem, allScores) : 0;
  const activeRecommendation = useMemo(() => {
    if (!activeSystem) return null;
    const score = activeTotal;
    return activeSystem.actionTriggers.find(
      (t) => score >= t.min && score <= t.max
    ) ?? null;
  }, [activeSystem, activeTotal]);

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-3">Trial — Scoring Dashboard</h1>
        <MockupNav active="trial-scoring" group="trial" />
      </div>

      {/* Trial info banner */}
      <div className="mb-6 rounded-lg border border-violet-700/30 bg-violet-700/5 p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Re-score or confirm &quot;No Change&quot;</span>{' '}
          <span className="text-muted-foreground">
            — After each trial-related communication, all 5 scoring systems must be re-scored or have &quot;No Change&quot; entered within 1 hour. Trial context: scores inform trial strategy, witness preparation, and settlement positioning.
          </span>
        </p>
      </div>

      {/* Dashboard overview: gauge cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {scoringSystems.map((sys) => {
          const score = computeTotal(sys, allScores);
          const scored = countScored(sys, allScores);
          const total = totalFactors(sys);
          const isActive = activeTab === sys.id;

          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => setActiveTab(sys.id)}
              className={cn(
                'rounded-lg border bg-card p-4 text-left transition-all hover:shadow-sm',
                isActive
                  ? 'ring-2 ring-primary border-primary/50'
                  : 'border-border'
              )}
            >
              <div className="flex justify-center mb-2">
                <ScoreGauge score={score} maxScore={sys.maxScore} size={80} />
              </div>
              <p className="text-center text-sm font-medium text-foreground truncate">
                {sys.shortLabel}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {scored}/{total} scored
              </p>
              {noChangeFlags[sys.id] && (
                <p className="text-center text-xs text-violet-700 font-medium">No Change</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {systemsStarted} of {scoringSystems.length} systems started
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${(systemsStarted / scoringSystems.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Action recommendation box */}
      {activeRecommendation && (
        <div
          className={cn(
            'mb-6 rounded-lg border p-4',
            activeRecommendation.color === 'green' && 'border-green-500/30 bg-green-500/5',
            activeRecommendation.color === 'blue' && 'border-blue-500/30 bg-blue-500/5',
            activeRecommendation.color === 'yellow' && 'border-yellow-500/30 bg-yellow-500/5',
            activeRecommendation.color === 'orange' && 'border-orange-500/30 bg-orange-500/5',
            activeRecommendation.color === 'red' && 'border-red-500/30 bg-red-500/5'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                activeRecommendation.color === 'green' && 'bg-green-500',
                activeRecommendation.color === 'blue' && 'bg-blue-500',
                activeRecommendation.color === 'yellow' && 'bg-yellow-500',
                activeRecommendation.color === 'orange' && 'bg-orange-500',
                activeRecommendation.color === 'red' && 'bg-red-500'
              )}
            />
            <div>
              <span className="text-sm font-semibold text-foreground">
                {activeRecommendation.label}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                &mdash; {activeRecommendation.action}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed detail view */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          {scoringSystems.map((sys) => (
            <TabsTrigger key={sys.id} value={sys.id}>
              {sys.shortLabel}
            </TabsTrigger>
          ))}
        </TabsList>

        {scoringSystems.map((sys) => (
          <TabsContent key={sys.id} value={sys.id}>
            <ScoringSystemPage
              system={sys}
              scores={allScores}
              onScoreChange={handleScoreChange}
              hygieneChecked={allHygiene}
              onHygieneChange={handleHygieneChange}
            />
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <Button
                variant={noChangeFlags[activeTab] ? "default" : "outline"}
                size="sm"
                className={noChangeFlags[activeTab] ? "bg-violet-700 hover:bg-violet-800 text-white" : ""}
                onClick={() => setNoChangeFlags(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
              >
                {noChangeFlags[activeTab] ? '\u2713 No Change Confirmed' : 'Confirm No Change'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Mark if no scoring changes needed after this communication
              </span>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
