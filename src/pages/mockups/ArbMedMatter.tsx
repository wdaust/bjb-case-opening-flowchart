import { useState, useMemo, useEffect, useCallback } from 'react';
import { ClipboardList, Search, BarChart3, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import { cn } from '../../utils/cn.ts';
import { LitifyMatterLayout } from '../../components/litify/LitifyMatterLayout.tsx';
import { OverviewTab } from '../../components/litify/OverviewTab.tsx';
import { ScoringSystemPage } from '../../components/scoring/ScoringSystemPage.tsx';
import { ScoreGauge } from '../../components/scoring/ScoreGauge.tsx';
import { scoringSystems, type ScoringSystem } from '../../data/scoringData.ts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.tsx';
import type { PathBarStage } from '../../components/litify/LitifyPathBar.tsx';
import {
  arbMedPhases,
  arbMedTasks,
  ARBMED_PATH_STAGES,
  getArbMedTasksForStage,
} from '../../data/arbMedTaskData.ts';

// ── localStorage ──────────────────────────────────────────────────────

const STORAGE_KEY = 'bjb-arbmed-matter-statuses';

type TrackerStatus = 'pending' | 'in-progress' | 'complete';

function loadTrackerStatuses(): Record<string, TrackerStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const init: Record<string, TrackerStatus> = {};
  arbMedTasks.forEach((t) => { init[t.id] = 'pending'; });
  return init;
}

// ── Phase border colors ────────────────────────────────────────────────

const phaseBorderColors: Record<string, string> = {
  blue: 'border-l-blue-500', purple: 'border-l-purple-500', indigo: 'border-l-indigo-500',
  cyan: 'border-l-cyan-500', teal: 'border-l-teal-500', green: 'border-l-green-500',
  lime: 'border-l-lime-500', amber: 'border-l-amber-500', orange: 'border-l-orange-500',
  rose: 'border-l-rose-500', pink: 'border-l-pink-500', violet: 'border-l-violet-500',
  slate: 'border-l-slate-500',
  'blue-800': 'border-l-blue-800', 'blue-700': 'border-l-blue-700', 'blue-500': 'border-l-blue-500',
  'red-700': 'border-l-red-700', 'indigo-900': 'border-l-indigo-900', 'purple-700': 'border-l-purple-700',
  'pink-700': 'border-l-pink-700', 'slate-700': 'border-l-slate-700', 'stone-700': 'border-l-stone-700',
  'orange-700': 'border-l-orange-700', 'teal-700': 'border-l-teal-700', 'green-700': 'border-l-green-700',
  'slate-600': 'border-l-slate-600',
  'amber-700': 'border-l-amber-700', 'indigo-700': 'border-l-indigo-700', 'rose-700': 'border-l-rose-700',
};

const statusBadgeStyles: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  complete: 'bg-green-500/10 text-green-600 border-green-500/30',
};

// ── Scoring helpers ────────────────────────────────────────────────────

function computeTotal(system: ScoringSystem, scores: Record<string, number>): number {
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

function countScored(system: ScoringSystem, scores: Record<string, number>): number {
  let count = 0;
  for (const cat of system.categories) {
    for (const f of cat.factors) {
      if (scores[f.id] != null) count++;
    }
  }
  return count;
}

function totalFactors(system: ScoringSystem): number {
  return system.categories.reduce((sum, cat) => sum + cat.factors.length, 0);
}

// ── Component ──────────────────────────────────────────────────────────

export default function ArbMedMatter() {
  // ── State ──────────────────────────────────────────────────────────
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TrackerStatus>>(loadTrackerStatuses);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [hygieneChecked, setHygieneChecked] = useState<Record<string, boolean>>({});
  const [activeScoringTab, setActiveScoringTab] = useState(scoringSystems[0].id);

  // Tracker filters
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => new Set(arbMedPhases.map((p) => p.id)));

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(taskStatuses)); } catch { /* ignore */ }
  }, [taskStatuses]);

  // ── Derived ────────────────────────────────────────────────────────
  const completedCount = arbMedTasks.filter((t) => taskStatuses[t.id] === 'complete').length;
  const totalCount = arbMedTasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const uniqueAssignees = useMemo(() => {
    const set = new Set(arbMedTasks.map((t) => t.assignedTo));
    return Array.from(set).sort();
  }, []);

  // Path bar stages
  const stageProgress: PathBarStage[] = useMemo(() => {
    return ARBMED_PATH_STAGES.map((stage) => {
      const tasks = getArbMedTasksForStage(stage);
      const total = tasks.length;
      const done = tasks.filter((t) => taskStatuses[t.id] === 'complete').length;
      const isComplete = total > 0 && done === total;
      const isActive = tasks.some((t) => taskStatuses[t.id] === 'in-progress');
      return { label: stage.label, done, total, isComplete, isActive };
    });
  }, [taskStatuses]);

  // Filtered tasks for tracker
  const filteredTasks = useMemo(() => {
    return arbMedTasks.filter((t) => {
      if (filterPhase !== 'all' && t.phase !== filterPhase) return false;
      if (filterAssignee !== 'all' && t.assignedTo !== filterAssignee) return false;
      if (filterStatus !== 'all' && taskStatuses[t.id] !== filterStatus) return false;
      return true;
    });
  }, [filterPhase, filterAssignee, filterStatus, taskStatuses]);

  const tasksByPhase = useMemo(() => {
    const map = new Map<string, typeof arbMedTasks>();
    for (const t of filteredTasks) {
      const arr = map.get(t.phase) || [];
      arr.push(t);
      map.set(t.phase, arr);
    }
    return map;
  }, [filteredTasks]);

  const visiblePhases = arbMedPhases.filter((p) => {
    if (filterPhase !== 'all' && p.id !== filterPhase) return false;
    return (tasksByPhase.get(p.id)?.length ?? 0) > 0;
  });

  // ── Handlers ──────────────────────────────────────────────────────

  const cycleStatus = useCallback((taskId: string) => {
    setTaskStatuses((prev) => {
      const current = prev[taskId];
      let next: TrackerStatus;
      if (current === 'pending') next = 'in-progress';
      else if (current === 'in-progress') next = 'complete';
      else next = 'pending';
      return { ...prev, [taskId]: next };
    });
  }, []);

  const togglePhase = useCallback((phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    const init: Record<string, TrackerStatus> = {};
    arbMedTasks.forEach((t) => { init[t.id] = 'pending'; });
    setTaskStatuses(init);
    setScores({});
    setHygieneChecked({});
    setFilterPhase('all');
    setFilterAssignee('all');
    setFilterStatus('all');
    setExpandedPhases(new Set(arbMedPhases.map((p) => p.id)));
  }, []);

  const handleScoreChange = useCallback((factorId: string, value: number) => {
    setScores((prev) => ({ ...prev, [factorId]: value }));
  }, []);

  const handleHygieneChange = useCallback((id: string, val: boolean) => {
    setHygieneChecked((prev) => ({ ...prev, [id]: val }));
  }, []);

  // ── Tab content ──────────────────────────────────────────────────

  const overviewContent = (
    <OverviewTab
      tasks={arbMedTasks}
      phases={arbMedPhases}
      statuses={taskStatuses}
      scoringSystems={scoringSystems}
      scores={scores}
    />
  );

  const matterPlanContent = (
    <div className="py-4 space-y-4">
      {/* Progress bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{completedCount}/{totalCount} complete</span>
          <span className="text-sm font-bold text-foreground">{progressPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Phases</option>
          {arbMedPhases.map((p) => <option key={p.id} value={p.id}>{p.order}. {p.label}</option>)}
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Assignees</option>
          {uniqueAssignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => { setFilterPhase('all'); setFilterAssignee('all'); setFilterStatus('all'); }}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Filters
        </Button>
      </div>

      {/* Phase sections */}
      <div className="space-y-4">
        {visiblePhases.map((phase) => {
          const phaseTasks = tasksByPhase.get(phase.id) || [];
          const allPhaseTasks = arbMedTasks.filter((t) => t.phase === phase.id);
          const phaseCompleted = allPhaseTasks.filter((t) => taskStatuses[t.id] === 'complete').length;
          const phaseTotal = allPhaseTasks.length;
          const phasePct = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
          const isExpanded = expandedPhases.has(phase.id);
          const borderClass = phaseBorderColors[phase.color] || 'border-l-gray-500';

          return (
            <div key={phase.id} className={cn('rounded-lg border border-border bg-card border-l-4', borderClass)}>
              <button type="button" onClick={() => togglePhase(phase.id)}
                className="flex w-full items-center gap-3 p-4 text-left">
                {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className="text-xs font-bold text-muted-foreground">Phase {phase.order}</span>
                <span className="font-semibold text-foreground">{phase.label}</span>
                <Badge variant="secondary" className="text-xs ml-1">{phaseTotal} tasks</Badge>
                <div className="ml-auto flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${phasePct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{phasePct}%</span>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border">
                  {phaseTasks.map((task) => {
                    const status = taskStatuses[task.id];
                    const isComplete = status === 'complete';
                    return (
                      <div key={task.id} className={cn('flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0', isComplete && 'bg-green-500/5')}>
                        <input type="checkbox" checked={isComplete} onChange={() => cycleStatus(task.id)}
                          className="h-4 w-4 rounded border-border accent-green-600 cursor-pointer" />
                        <Badge variant="outline" className="font-mono text-xs shrink-0">{task.id}</Badge>
                        <span className={cn('flex-1 text-sm', isComplete ? 'line-through text-muted-foreground' : 'text-foreground')}>{task.label}</span>
                        <span className="hidden md:block text-xs text-muted-foreground w-28 truncate">{task.assignedTo}</span>
                        <span className="hidden lg:block text-xs text-muted-foreground w-40 truncate text-right">{task.sla}</span>
                        <Badge className={cn('text-xs capitalize shrink-0', statusBadgeStyles[status])}>{status}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Active scoring system
  const activeSystem = scoringSystems.find((s) => s.id === activeScoringTab);
  const activeTotal = activeSystem ? computeTotal(activeSystem, scores) : 0;
  const activeRecommendation = useMemo(() => {
    if (!activeSystem) return null;
    return activeSystem.actionTriggers.find((t) => activeTotal >= t.min && activeTotal <= t.max) ?? null;
  }, [activeSystem, activeTotal]);

  const scoringContent = (
    <div className="py-4 space-y-6">
      {/* Gauge overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {scoringSystems.map((sys) => {
          const score = computeTotal(sys, scores);
          const scored = countScored(sys, scores);
          const total = totalFactors(sys);
          const isActive = activeScoringTab === sys.id;
          return (
            <button key={sys.id} type="button" onClick={() => setActiveScoringTab(sys.id)}
              className={cn('rounded-lg border bg-card p-4 text-left transition-all hover:shadow-sm',
                isActive ? 'ring-2 ring-primary border-primary/50' : 'border-border')}>
              <div className="flex justify-center mb-2">
                <ScoreGauge score={score} maxScore={sys.maxScore} size={80} />
              </div>
              <p className="text-center text-sm font-medium text-foreground truncate">{sys.shortLabel}</p>
              <p className="text-center text-xs text-muted-foreground">{scored}/{total} scored</p>
            </button>
          );
        })}
      </div>

      {/* Action recommendation */}
      {activeRecommendation && (
        <div className={cn('rounded-lg border p-4',
          activeRecommendation.color === 'green' && 'border-green-500/30 bg-green-500/5',
          activeRecommendation.color === 'blue' && 'border-blue-500/30 bg-blue-500/5',
          activeRecommendation.color === 'yellow' && 'border-yellow-500/30 bg-yellow-500/5',
          activeRecommendation.color === 'orange' && 'border-orange-500/30 bg-orange-500/5',
          activeRecommendation.color === 'red' && 'border-red-500/30 bg-red-500/5',
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('h-3 w-3 rounded-full',
              activeRecommendation.color === 'green' && 'bg-green-500',
              activeRecommendation.color === 'blue' && 'bg-blue-500',
              activeRecommendation.color === 'yellow' && 'bg-yellow-500',
              activeRecommendation.color === 'orange' && 'bg-orange-500',
              activeRecommendation.color === 'red' && 'bg-red-500',
            )} />
            <div>
              <span className="text-sm font-semibold text-foreground">{activeRecommendation.label}</span>
              <span className="text-sm text-muted-foreground ml-2">&mdash; {activeRecommendation.action}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed detail */}
      <Tabs value={activeScoringTab} onValueChange={setActiveScoringTab}>
        <TabsList className="flex-wrap">
          {scoringSystems.map((sys) => (
            <TabsTrigger key={sys.id} value={sys.id}>{sys.shortLabel}</TabsTrigger>
          ))}
        </TabsList>
        {scoringSystems.map((sys) => (
          <TabsContent key={sys.id} value={sys.id}>
            <ScoringSystemPage
              system={sys}
              scores={scores}
              onScoreChange={handleScoreChange}
              hygieneChecked={hygieneChecked}
              onHygieneChange={handleHygieneChange}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  const metricsContent = (
    <div className="py-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Tasks Completed</p>
          <p className="text-2xl font-bold text-foreground">{completedCount}<span className="text-sm text-muted-foreground font-normal">/{totalCount}</span></p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Overall Progress</p>
          <p className="text-2xl font-bold text-foreground">{progressPct}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Phases Active</p>
          <p className="text-2xl font-bold text-foreground">{arbMedPhases.filter((p) => arbMedTasks.filter((t) => t.phase === p.id && taskStatuses[t.id] === 'in-progress').length > 0).length}</p>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Full KPI library, scorecard, and SLA tables available on the dedicated metrics pages.
        </p>
      </div>
    </div>
  );

  // ── Render via layout ─────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto">
      <LitifyMatterLayout
        title="Lit / Arbitration/Mediation &mdash; Matter Record"
        activeMatterId="arbmed-matter"
        recordHeaderProps={{
          title: 'Martinez, Roberto | MVA Rear-End | 2024-0847',
          icon: ClipboardList,
          fields: [
            { label: 'Active Stage', value: stageProgress.find((s) => s.isActive)?.label ?? 'N/A' },
            { label: 'Client', value: 'Roberto M.' },
            { label: 'SOL', value: '2026-11-15' },
            { label: 'Owner', value: 'S. Chen' },
          ],
          statusBadge: {
            label: completedCount === totalCount ? 'Complete' : 'In Progress',
            variant: completedCount === totalCount ? 'success' : 'info',
          },
        }}
        pathBarProps={{
          stages: stageProgress,
          onStageClick: () => {},
          currentTaskLabel: undefined,
        }}
        tabs={[
          { id: 'overview', label: 'Overview', content: overviewContent },
          { id: 'matter-plan', label: 'Matter Plan', content: matterPlanContent },
          { id: 'scoring', label: 'Scoring', content: scoringContent },
          { id: 'metrics', label: 'Metrics', content: metricsContent },
        ]}
        utilityBarItems={[
          { icon: ClipboardList, label: 'Matter Plan', onClick: () => {} },
          { icon: Search, label: 'Quick Search', onClick: () => {} },
          { icon: BarChart3, label: 'Progress:', value: <span className="font-semibold text-foreground">{completedCount}/{totalCount}</span> },
        ]}
        onReset={handleReset}
      />
    </div>
  );
}
