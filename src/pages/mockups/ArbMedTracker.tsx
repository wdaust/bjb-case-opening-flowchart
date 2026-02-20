import { useState, useMemo } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { arbMedPhases, arbMedTasks } from '../../data/arbMedTaskData.ts';
import type { TrackerTask } from '../../data/taskTrackerData.ts';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

// ── Phase border color map ──────────────────────────────────────────────

const phaseBorderColors: Record<string, string> = {
  'amber-700': 'border-l-amber-700',
  'indigo-700': 'border-l-indigo-700',
  'green-700': 'border-l-green-700',
  'rose-700': 'border-l-rose-700',
  'purple-700': 'border-l-purple-700',
  'teal-700': 'border-l-teal-700',
};

const statusBadgeStyles: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  complete: 'bg-green-500/10 text-green-600 border-green-500/30',
};

// ── Component ───────────────────────────────────────────────────────────

export default function ArbMedTracker() {
  const [statuses, setStatuses] = useState<Record<string, 'pending' | 'in-progress' | 'complete'>>(
    () => {
      const init: Record<string, 'pending' | 'in-progress' | 'complete'> = {};
      arbMedTasks.forEach((t) => {
        init[t.id] = 'pending';
      });
      return init;
    }
  );

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    () => new Set(arbMedPhases.map((p) => p.id))
  );

  const [filterPhase, setFilterPhase] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Unique assignees
  const assignees = useMemo(() => {
    const set = new Set(arbMedTasks.map((t) => t.assignedTo));
    return Array.from(set).sort();
  }, []);

  // Toggle phase expansion
  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  // Cycle status on checkbox click
  const cycleStatus = (taskId: string) => {
    setStatuses((prev) => {
      const current = prev[taskId];
      let next: 'pending' | 'in-progress' | 'complete';
      if (current === 'pending') next = 'in-progress';
      else if (current === 'in-progress') next = 'complete';
      else next = 'pending';
      return { ...prev, [taskId]: next };
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilterPhase('all');
    setFilterAssignee('all');
    setFilterStatus('all');
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return arbMedTasks.filter((t) => {
      if (filterPhase !== 'all' && t.phase !== filterPhase) return false;
      if (filterAssignee !== 'all' && t.assignedTo !== filterAssignee) return false;
      if (filterStatus !== 'all' && statuses[t.id] !== filterStatus) return false;
      return true;
    });
  }, [filterPhase, filterAssignee, filterStatus, statuses]);

  // Group by phase
  const tasksByPhase = useMemo(() => {
    const map = new Map<string, TrackerTask[]>();
    for (const t of filteredTasks) {
      const arr = map.get(t.phase) || [];
      arr.push(t);
      map.set(t.phase, arr);
    }
    return map;
  }, [filteredTasks]);

  // Progress
  const completedCount = arbMedTasks.filter((t) => statuses[t.id] === 'complete').length;
  const totalCount = arbMedTasks.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  // Filtered phases
  const visiblePhases = arbMedPhases.filter((p) => {
    if (filterPhase !== 'all' && p.id !== filterPhase) return false;
    return (tasksByPhase.get(p.id)?.length ?? 0) > 0;
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-3">18-Task Tracker</h1>
        <MockupNav active="arbmed-tracker" group="arbitration-mediation" />
      </div>

      {/* Progress header */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {completedCount}/{totalCount} complete
          </span>
          <span className="text-sm font-bold text-foreground">{progressPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Phases</option>
          {arbMedPhases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.order}. {p.label}
            </option>
          ))}
        </select>

        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>

        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </div>

      {/* Phase sections */}
      <div className="space-y-4">
        {visiblePhases.map((phase) => {
          const phaseTasks = tasksByPhase.get(phase.id) || [];
          const allPhaseTasks = arbMedTasks.filter((t) => t.phase === phase.id);
          const phaseCompleted = allPhaseTasks.filter(
            (t) => statuses[t.id] === 'complete'
          ).length;
          const phaseTotal = allPhaseTasks.length;
          const phasePct = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
          const isExpanded = expandedPhases.has(phase.id);
          const borderClass = phaseBorderColors[phase.color] || 'border-l-gray-500';

          return (
            <div
              key={phase.id}
              className={cn('rounded-lg border border-border bg-card border-l-4', borderClass)}
            >
              {/* Phase header */}
              <button
                type="button"
                onClick={() => togglePhase(phase.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="text-xs font-bold text-muted-foreground">
                  Phase {phase.order}
                </span>
                <span className="font-semibold text-foreground">{phase.label}</span>
                <Badge variant="secondary" className="text-xs ml-1">
                  {phaseTotal} tasks
                </Badge>
                <div className="ml-auto flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${phasePct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {phasePct}%
                    </span>
                  </div>
                </div>
              </button>

              {/* Task rows */}
              {isExpanded && (
                <div className="border-t border-border">
                  {phaseTasks.map((task) => {
                    const status = statuses[task.id];
                    const isComplete = status === 'complete';

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0',
                          isComplete && 'bg-green-500/5'
                        )}
                      >
                        {/* Native checkbox */}
                        <input
                          type="checkbox"
                          checked={isComplete}
                          onChange={() => cycleStatus(task.id)}
                          className="h-4 w-4 rounded border-border accent-green-600 cursor-pointer"
                        />

                        {/* Task ID */}
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {task.id}
                        </Badge>

                        {/* Label */}
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            isComplete
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          )}
                        >
                          {task.label}
                        </span>

                        {/* Assignee */}
                        <span className="hidden md:block text-xs text-muted-foreground w-28 truncate">
                          {task.assignedTo}
                        </span>

                        {/* SLA */}
                        <span className="hidden lg:block text-xs text-muted-foreground w-16 text-right">
                          {task.sla}
                        </span>

                        {/* Status badge */}
                        <Badge
                          className={cn('text-xs capitalize shrink-0', statusBadgeStyles[status])}
                        >
                          {status}
                        </Badge>
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
}
