import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import {
  Phone,
  PhoneOff,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  BarChart3,
  ClipboardList,
  Timer,
  RotateCcw,
  Info,
} from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import {
  TASKS,
  PHASE_STYLES,
  PHASE_ORDER,
  PATH_STAGES,
  getTasksForStage,
  formatCountdown,
  type TaskStatus,
  type TimelineTask,
  type PathStage,
} from '../../data/caseOpeningContactData.ts';

// ── localStorage key ────────────────────────────────────────────────────

const STORAGE_KEY = 'bjb-client-contact-2-statuses';

function loadStatuses(): Record<string, TaskStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const init: Record<string, TaskStatus> = {};
  TASKS.forEach((t) => { init[t.id] = t.id === 'A' ? 'active' : 'pending'; });
  return init;
}

// ── Phase grouping helper ────────────────────────────────────────────────

interface PhaseGroup {
  phase: string;
  tasks: TimelineTask[];
}

function groupByPhase(tasks: TimelineTask[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  let current: PhaseGroup | null = null;
  for (const t of tasks) {
    if (!current || current.phase !== t.phase) {
      current = { phase: t.phase, tasks: [] };
      groups.push(current);
    }
    current.tasks.push(t);
  }
  return groups;
}

// ── Component ───────────────────────────────────────────────────────────

export default function ClientContact2() {
  // ── State ──────────────────────────────────────────────────────────
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(loadStatuses);
  const [animatingTaskId, setAnimatingTaskId] = useState<string | null>(null);
  const [animatingTriggers, setAnimatingTriggers] = useState<string[]>([]);
  const [slaStartTime, setSlaStartTime] = useState<number>(Date.now());
  const [countdown, setCountdown] = useState('');
  const [actionPanelTaskId, setActionPanelTaskId] = useState<string | null>(null);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'plan' | 'activity'>('plan');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [focusedRowIdx, setFocusedRowIdx] = useState(-1);

  const animTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Derived ────────────────────────────────────────────────────────

  const activeTask = TASKS.find((t) => statuses[t.id] === 'active');
  const isMIAEnd = statuses['L'] === 'complete' && statuses['M'] === 'pending';
  const allComplete = TASKS.every((t) => ['complete', 'not-connected', 'skipped'].includes(statuses[t.id]));

  const completedCount = TASKS.filter((t) =>
    ['complete', 'not-connected', 'skipped'].includes(statuses[t.id])
  ).length;

  // Contact pursuit progress
  const callTasks = TASKS.filter((t) => t.isCall && t.isContactPursuit);
  const callsDone = callTasks.filter((t) => ['complete', 'not-connected', 'skipped'].includes(statuses[t.id])).length;
  const callsRemaining = callTasks.length - callsDone;
  const isInContactPursuit = activeTask?.isContactPursuit ?? false;
  const wasConnected = statuses['M'] !== 'pending' && statuses['M'] !== undefined;

  // Phase progress map
  const phaseProgressMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    TASKS.forEach((t) => {
      if (!map.has(t.phase)) map.set(t.phase, { total: 0, done: 0 });
      const p = map.get(t.phase)!;
      p.total++;
      if (['complete', 'not-connected', 'skipped'].includes(statuses[t.id])) p.done++;
    });
    return map;
  }, [statuses]);

  // Stage progress (consolidated 7 stages for path bar)
  const stageProgress = useMemo(() => {
    return PATH_STAGES.map((stage) => {
      const tasks = getTasksForStage(stage);
      const total = tasks.length;
      const done = tasks.filter((t) =>
        ['complete', 'not-connected', 'skipped'].includes(statuses[t.id])
      ).length;
      const isComplete = total > 0 && done === total;
      const isActive = tasks.some((t) => statuses[t.id] === 'active');
      return { ...stage, total, done, isComplete, isActive };
    });
  }, [statuses]);

  // Active phase name
  const activePhase = activeTask?.phase ?? (allComplete ? PHASE_ORDER[PHASE_ORDER.length - 1] : isMIAEnd ? 'Client Orientation' : '');

  // Unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const set = new Set(TASKS.map((t) => t.assignedTo));
    return Array.from(set).sort();
  }, []);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return TASKS.filter((t) => {
      if (searchQuery && !t.label.toLowerCase().includes(searchQuery.toLowerCase()) && !t.letter.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPhase !== 'all' && t.phase !== filterPhase) return false;
      if (filterAssignee !== 'all' && t.assignedTo !== filterAssignee) return false;
      if (filterStatus !== 'all' && statuses[t.id] !== filterStatus) return false;
      return true;
    });
  }, [searchQuery, filterPhase, filterAssignee, filterStatus, statuses]);

  const phaseGroups = useMemo(() => groupByPhase(filteredTasks), [filteredTasks]);

  // Action panel task
  const actionPanelTask = actionPanelTaskId ? TASKS.find((t) => t.id === actionPanelTaskId) : null;

  // ── Persist to localStorage ────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses)); } catch { /* ignore */ }
  }, [statuses]);

  // ── SLA countdown timer ────────────────────────────────────────────
  useEffect(() => {
    if (!activeTask) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - slaStartTime;
      const remaining = activeTask.slaDurationMs - elapsed;
      setCountdown(formatCountdown(Math.max(remaining, 0)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, slaStartTime]);

  // ── Handlers ────────────────────────────────────────────────────────

  const advanceToNext = useCallback((taskId: string, isEnd: boolean) => {
    if (isEnd) return;
    const idx = TASKS.findIndex((t) => t.id === taskId);
    setStatuses((prev) => {
      const next = { ...prev };
      for (let i = idx + 1; i < TASKS.length; i++) {
        if (next[TASKS[i].id] !== 'skipped') {
          next[TASKS[i].id] = 'active' as TaskStatus;
          break;
        }
      }
      return next;
    });
    setSlaStartTime(Date.now());
  }, []);

  const handleConnected = useCallback((taskId: string) => {
    setStatuses((prev) => {
      const next = { ...prev, [taskId]: 'complete' as TaskStatus };
      TASKS.forEach((t) => {
        if (t.isContactPursuit && t.id !== taskId && next[t.id] === 'pending') {
          next[t.id] = 'skipped' as TaskStatus;
        }
      });
      next['M'] = 'active';
      return next;
    });
    setSlaStartTime(Date.now());
    setActionPanelTaskId(null);
  }, []);

  const handleNotConnected = useCallback((taskId: string) => {
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return;
    setStatuses((prev) => ({ ...prev, [taskId]: 'not-connected' as TaskStatus }));
    const triggers = task.autoTriggers || [];
    if (triggers.length > 0) {
      setAnimatingTaskId(taskId);
      setAnimatingTriggers(triggers);
      animTimeoutRef.current = setTimeout(() => {
        setAnimatingTriggers([]);
        setAnimatingTaskId(null);
        advanceToNext(taskId, false);
      }, 1500);
    } else {
      advanceToNext(taskId, false);
    }
    setActionPanelTaskId(null);
  }, [advanceToNext]);

  const handleMarkComplete = useCallback((taskId: string) => {
    const isEnd = taskId === 'L';
    setStatuses((prev) => ({ ...prev, [taskId]: 'complete' as TaskStatus }));
    if (!isEnd) advanceToNext(taskId, false);
    setActionPanelTaskId(null);
  }, [advanceToNext]);

  const handleRouteToIntake = useCallback((taskId: string) => {
    setStatuses((prev) => ({ ...prev, [taskId]: 'complete' as TaskStatus }));
    advanceToNext(taskId, false);
    setActionPanelTaskId(null);
  }, [advanceToNext]);

  const handleReset = useCallback(() => {
    const init: Record<string, TaskStatus> = {};
    TASKS.forEach((t) => { init[t.id] = t.id === 'A' ? 'active' : 'pending'; });
    setStatuses(init);
    setSlaStartTime(Date.now());
    setActionPanelTaskId(null);
    setAnimatingTaskId(null);
    setAnimatingTriggers([]);
    setCollapsedPhases(new Set());
    setSearchQuery('');
    setFilterPhase('all');
    setFilterAssignee('all');
    setFilterStatus('all');
  }, []);

  // Auto-advance for system automation tasks
  useEffect(() => {
    if (!activeTask?.isAutoAction) return;
    const taskId = activeTask.id;
    const triggers = activeTask.autoTriggers || ['Processing...'];
    setAnimatingTaskId(taskId);
    setAnimatingTriggers(triggers);
    const timeout = setTimeout(() => {
      setAnimatingTriggers([]);
      setAnimatingTaskId(null);
      const isEnd = taskId === 'L';
      setStatuses((prev) => ({ ...prev, [taskId]: 'complete' as TaskStatus }));
      if (!isEnd) advanceToNext(taskId, false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [activeTask?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => { if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current); };
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'Escape') {
        setActionPanelTaskId(null);
        return;
      }

      // When action panel is open on a call task
      if (actionPanelTask && statuses[actionPanelTask.id] === 'active') {
        if (e.key === 'c' || e.key === 'C') {
          if (actionPanelTask.isCall) { handleConnected(actionPanelTask.id); return; }
        }
        if (e.key === 'n' || e.key === 'N') {
          if (actionPanelTask.isCall) { handleNotConnected(actionPanelTask.id); return; }
        }
      }

      const flat = filteredTasks;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIdx((prev) => Math.min(prev + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedRowIdx >= 0 && focusedRowIdx < flat.length) {
        const task = flat[focusedRowIdx];
        if (statuses[task.id] === 'active' && !task.isAutoAction) {
          setActionPanelTaskId(task.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTasks, focusedRowIdx, actionPanelTask, statuses, handleConnected, handleNotConnected]);

  // ── Phase chevron click handler ────────────────────────────────────
  const scrollToPhase = useCallback((phase: string) => {
    const el = document.getElementById(`phase-${phase.replace(/\s+/g, '-')}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Expand if collapsed
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      next.delete(phase);
      return next;
    });
  }, []);

  // ── Stage chevron click handler ──────────────────────────────────
  const scrollToStage = useCallback((stage: PathStage) => {
    const tasks = getTasksForStage(stage);
    if (tasks.length === 0) return;
    const firstPhase = tasks[0].phase;
    const el = document.getElementById(`phase-${firstPhase.replace(/\s+/g, '-')}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Expand all phases within this stage if collapsed
    const phases = new Set(tasks.map((t) => t.phase));
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      phases.forEach((p) => next.delete(p));
      return next;
    });
  }, []);

  // ── Status dot color helper ────────────────────────────────────────
  function statusDotClass(status: TaskStatus): string {
    switch (status) {
      case 'active': return 'bg-blue-500 animate-pulse';
      case 'complete': return 'bg-green-500';
      case 'not-connected': return 'bg-amber-500';
      case 'skipped': return 'bg-gray-400';
      default: return 'bg-gray-300 dark:bg-gray-600';
    }
  }

  function statusLabel(status: TaskStatus): string {
    switch (status) {
      case 'active': return 'Active';
      case 'complete': return 'Complete';
      case 'not-connected': return 'Not Connected';
      case 'skipped': return 'Skipped';
      default: return 'Pending';
    }
  }

  function statusBadgeClass(status: TaskStatus): string {
    switch (status) {
      case 'active': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'complete': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'not-connected': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'skipped': return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
      default: return 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto bg-[#f3f3f3] dark:bg-background">
      {/* Page header */}
      <div className="px-6 pt-6 pb-3">
        <h1 className="text-2xl font-bold text-foreground mb-3">Lit / Case Opening &mdash; Contact Pursuit 2.0</h1>
        <MockupNav active="client-contact-2" />
      </div>

      {/* ── 1. Record Header / Highlights Panel ─────────────────────── */}
      <div className="mx-6 mt-4 rounded-lg border border-border bg-card shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Martinez, Roberto | MVA Rear-End | 2024-0847</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active Stage</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{activePhase || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Client</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">Roberto M.</p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">SOL</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">2026-11-15</p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Owner</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">S. Chen</p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</span>
              <div className="mt-0.5">
                <Badge className={cn(
                  'text-xs',
                  isMIAEnd ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                  allComplete ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                  'bg-blue-500/10 text-blue-600 border-blue-500/30'
                )}>
                  {isMIAEnd ? 'Routed to Intake' : allComplete ? 'Complete' : 'In Progress'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Path / Stage Progress Bar (7 consolidated stages) ────── */}
      <style>{`
        .chevron-arrow {
          width: 0;
          height: 0;
          border-top: 18px solid transparent;
          border-bottom: 18px solid transparent;
          border-left-width: 14px;
          border-left-style: solid;
          flex-shrink: 0;
        }
        .chevron-future-bg { background-color: #e5e7eb; color: #4b5563; }
        .dark .chevron-future-bg { background-color: #374151; color: #d1d5db; }
        .chevron-future-arrow { border-left-color: #e5e7eb; }
        .dark .chevron-future-arrow { border-left-color: #374151; }
      `}</style>
      <div className="mx-6 mt-4">
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <div className="flex items-center">
            {stageProgress.map((stage, idx) => {
              const activeStageIdx = stageProgress.findIndex((s) => s.isActive);
              const isPast = activeStageIdx >= 0 && idx < activeStageIdx && !stage.isComplete;
              const isFuture = !stage.isComplete && !stage.isActive && !isPast;

              const fillColor = stage.isComplete
                ? '#16a34a'
                : stage.isActive
                ? '#2563eb'
                : isPast
                ? '#15803d'
                : undefined;

              const textColorClass = isFuture ? '' : 'text-white';
              const isLast = idx === stageProgress.length - 1;

              return (
                <button
                  key={stage.label}
                  onClick={() => scrollToStage(stage)}
                  className="flex items-center hover:opacity-90 transition-opacity"
                  style={{
                    zIndex: stageProgress.length - idx,
                    marginLeft: idx > 0 ? '-14px' : 0,
                  }}
                  title={`${stage.label} (${stage.done}/${stage.total})`}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1.5 h-9 text-[11px] font-semibold whitespace-nowrap',
                      textColorClass,
                      isFuture && 'chevron-future-bg',
                      idx === 0 && 'rounded-l-md',
                      isLast && 'rounded-r-md',
                    )}
                    style={{
                      backgroundColor: fillColor || undefined,
                      paddingLeft: idx === 0 ? '12px' : '20px',
                      paddingRight: isLast ? '12px' : '8px',
                    }}
                  >
                    {stage.isComplete && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                    {stage.isActive && !stage.isComplete && (
                      <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse shrink-0" />
                    )}
                    <span>{stage.label}</span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn('chevron-arrow', isFuture && 'chevron-future-arrow')}
                      style={fillColor ? { borderLeftColor: fillColor } : undefined}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {activeTask && (
            <div className="mt-2 text-xs text-muted-foreground">
              Current: <span className="font-semibold text-foreground">{activeTask.label}</span> &mdash; {activeTask.assignedTo}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Tab Bar ────────────────────────────────────────────────── */}
      <div className="mx-6 mt-4 flex items-center gap-6 border-b border-border">
        <button
          onClick={() => setActiveTab('plan')}
          className={cn(
            'pb-2 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'plan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Matter Plan
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            'pb-2 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Activity
        </button>
        <div className="ml-auto pb-2">
          <Button size="sm" variant="outline" onClick={handleReset} className="text-xs gap-1.5">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {activeTab === 'activity' ? (
        <div className="mx-6 mt-6 rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          <p className="text-sm">Activity log would appear here (Chatter feed, status changes, notes).</p>
        </div>
      ) : (
        <div className="flex mx-6 mt-4 gap-0">
          {/* ── Main content area ───────────────────────────────────── */}
          <div className={cn('flex-1 min-w-0 transition-all', actionPanelTaskId ? 'mr-[400px]' : '')}>

            {/* ── 6. Contact Pursuit Banner ───────────────────────────── */}
            {isInContactPursuit && !isMIAEnd && (
              <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-semibold text-foreground">Contact Pursuit Active</span>
                  <span className="text-sm text-muted-foreground">&mdash; {callsRemaining} call attempts remaining</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Connect on any attempt to skip to Orientation</p>
                <div className="flex items-center gap-1.5 mt-2 ml-6">
                  <span className="text-xs text-muted-foreground mr-1">Call {callsDone + (activeTask?.isCall ? 0 : 0)} of {callTasks.length}</span>
                  {callTasks.map((t) => {
                    const s = statuses[t.id];
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          'h-2 w-2 rounded-full',
                          s === 'complete' ? 'bg-green-500' :
                          s === 'not-connected' ? 'bg-amber-500' :
                          s === 'active' ? 'bg-blue-500 animate-pulse' :
                          s === 'skipped' ? 'bg-gray-400' :
                          'bg-gray-300 dark:bg-gray-600'
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Connected success banner */}
            {wasConnected && !isInContactPursuit && !isMIAEnd && !allComplete && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">Connected! Post-connection workflow in progress.</span>
                </div>
              </div>
            )}

            {/* MIA End Banner */}
            {isMIAEnd && (
              <div className="mb-4 rounded-lg border-2 border-orange-500/50 bg-orange-500/10 p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <h3 className="font-bold text-orange-600 dark:text-orange-400">Case Routed to Intake</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Client could not be reached after 8 call attempts. Case routed back to Intake as MIA.
                </p>
              </div>
            )}

            {/* ── Filter Bar ──────────────────────────────────────────── */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <select
                value={filterPhase}
                onChange={(e) => setFilterPhase(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Phases</option>
                {PHASE_ORDER.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Assignees</option>
                {uniqueAssignees.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="complete">Complete</option>
                <option value="not-connected">Not Connected</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            {/* ── 4. Matter Plan Grid ─────────────────────────────────── */}
            <div ref={gridRef} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_140px_140px_110px_80px] gap-0 border-b border-border bg-gray-50 dark:bg-muted/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div>#</div>
                <div>Task</div>
                <div>Assigned To</div>
                <div>SLA</div>
                <div>Status</div>
                <div>Action</div>
              </div>

              {/* Phase groups */}
              {phaseGroups.map((group) => {
                const progress = phaseProgressMap.get(group.phase);
                const done = progress?.done ?? 0;
                const total = progress?.total ?? 0;
                const isCollapsed = collapsedPhases.has(group.phase);
                const phaseStyle = PHASE_STYLES[group.phase];
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={group.phase} id={`phase-${group.phase.replace(/\s+/g, '-')}`}>
                    {/* Phase group header */}
                    <button
                      onClick={() => setCollapsedPhases((prev) => {
                        const next = new Set(prev);
                        if (next.has(group.phase)) next.delete(group.phase);
                        else next.add(group.phase);
                        return next;
                      })}
                      className="w-full grid grid-cols-[40px_1fr_140px_140px_110px_80px] gap-0 items-center px-4 py-2.5 bg-gray-100/80 dark:bg-muted/50 border-b border-border hover:bg-gray-100 dark:hover:bg-muted/70 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', phaseStyle?.bg || 'bg-gray-500')} />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">{group.phase}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{done}/{total}</Badge>
                      </div>
                      <div className="col-span-3">
                        <div className="h-1.5 w-full max-w-[200px] rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', phaseStyle?.bg || 'bg-gray-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div />
                    </button>

                    {/* Task rows */}
                    {!isCollapsed && group.tasks.map((task) => {
                      const status = statuses[task.id];
                      const isActive = status === 'active';
                      const isComplete = status === 'complete';
                      const isSkipped = status === 'skipped';
                      const isNotConn = status === 'not-connected';
                      const globalIdx = filteredTasks.indexOf(task);
                      const isFocused = globalIdx === focusedRowIdx;
                      const isAnimating = animatingTaskId === task.id;
                      const slaOverdue = isActive && !task.isAutoAction && countdown === '00:00:00';

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'grid grid-cols-[40px_1fr_140px_140px_110px_80px] gap-0 items-center px-4 py-2 border-b border-border text-sm transition-colors',
                            isActive && 'bg-blue-500/5 border-l-2 border-l-blue-500',
                            !isActive && 'border-l-2 border-l-transparent',
                            isSkipped && 'opacity-40',
                            isFocused && 'ring-1 ring-inset ring-blue-400',
                            !isActive && !isSkipped && 'hover:bg-muted/50'
                          )}
                        >
                          {/* Letter */}
                          <div className="font-mono text-xs font-bold text-muted-foreground">{task.letter}</div>

                          {/* Task label + status dot */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn('h-2 w-2 rounded-full shrink-0', statusDotClass(status))} />
                            <span className={cn(
                              'truncate',
                              (isComplete || isSkipped) && 'line-through text-muted-foreground',
                              isActive && 'font-semibold text-foreground'
                            )}>
                              {task.label}
                            </span>
                            {task.isAutoAction && (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px] shrink-0">Auto</Badge>
                            )}
                            {(task.id === 'I' || task.id === 'J') && (
                              <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-[10px] shrink-0">Attorney</Badge>
                            )}
                            {/* Animating triggers inline */}
                            {isAnimating && animatingTriggers.length > 0 && (
                              <span className="animate-pulse text-xs text-amber-600 shrink-0 flex items-center gap-1">
                                <Send className="h-3 w-3" /> {animatingTriggers[0]}...
                              </span>
                            )}
                          </div>

                          {/* Assignee */}
                          <div className="text-xs text-muted-foreground truncate">{task.assignedTo}</div>

                          {/* SLA */}
                          <div className={cn(
                            'text-xs truncate',
                            slaOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                          )}>
                            {isActive && !task.isAutoAction ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {countdown}
                              </span>
                            ) : task.sla}
                          </div>

                          {/* Status badge */}
                          <div>
                            <Badge className={cn('text-[10px]', statusBadgeClass(status))}>
                              {isActive && task.isAutoAction ? 'Processing' : statusLabel(status)}
                            </Badge>
                          </div>

                          {/* Action */}
                          <div>
                            {isActive && !task.isAutoAction && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                                onClick={() => setActionPanelTaskId(task.id)}
                              >
                                Open
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Empty state */}
              {phaseGroups.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No tasks match the current filters.
                </div>
              )}
            </div>
          </div>

          {/* ── 5. Quick Action Panel (Right Slide-Out) ───────────────── */}
          {actionPanelTask && (
            <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-card border-l border-border shadow-xl z-50 overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Quick Action</h3>
                  <button
                    onClick={() => setActionPanelTaskId(null)}
                    className="rounded-md p-1 hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="h-px bg-border mb-4" />

                {/* Task details */}
                <h4 className="text-lg font-semibold text-foreground mb-3">{actionPanelTask.label}</h4>
                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phase</span>
                    <span className="font-medium text-foreground">{actionPanelTask.phase}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned</span>
                    <span className="font-medium text-foreground">{actionPanelTask.assignedTo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SLA</span>
                    <span className="font-medium text-foreground">{actionPanelTask.sla}</span>
                  </div>
                </div>

                {/* SLA countdown */}
                {statuses[actionPanelTask.id] === 'active' && (
                  <div className={cn(
                    'mb-6 rounded-lg p-4 text-center',
                    countdown === '00:00:00' ? 'bg-red-500/10 border border-red-500/30' : 'bg-blue-500/5 border border-blue-500/20'
                  )}>
                    <Timer className={cn('h-5 w-5 mx-auto mb-1', countdown === '00:00:00' ? 'text-red-500' : 'text-blue-500')} />
                    <div className={cn(
                      'text-2xl font-mono font-bold',
                      countdown === '00:00:00' ? 'text-red-600' : 'text-blue-600'
                    )}>{countdown}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {countdown === '00:00:00' ? 'SLA Overdue' : 'remaining'}
                    </div>
                  </div>
                )}

                {/* Action buttons by task type */}
                {statuses[actionPanelTask.id] === 'active' && (
                  <div className="space-y-3">
                    {actionPanelTask.isCall ? (
                      <>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white justify-center gap-2"
                          onClick={() => handleConnected(actionPanelTask.id)}
                        >
                          <Phone className="h-4 w-4" />
                          Connected
                          <kbd className="ml-2 text-[10px] opacity-70 bg-green-700 px-1 py-0.5 rounded">C</kbd>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 justify-center gap-2"
                          onClick={() => handleNotConnected(actionPanelTask.id)}
                        >
                          <PhoneOff className="h-4 w-4" />
                          Not Connected
                          <kbd className="ml-2 text-[10px] opacity-70 border border-amber-400 px-1 py-0.5 rounded">N</kbd>
                        </Button>

                        {/* Auto-triggers preview */}
                        {actionPanelTask.autoTriggers && actionPanelTask.autoTriggers.length > 0 && (
                          <div className="mt-4 rounded-lg bg-muted/50 p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Auto-triggers on disconnect:</p>
                            <ul className="space-y-1">
                              {actionPanelTask.autoTriggers.map((t) => (
                                <li key={t} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Send className="h-3 w-3 text-amber-500" />
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : actionPanelTask.isMIA ? (
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-center gap-2"
                        onClick={() => handleRouteToIntake(actionPanelTask.id)}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Route to Intake
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="w-full justify-center gap-2"
                          onClick={() => handleMarkComplete(actionPanelTask.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Complete
                        </Button>
                        {/* Scoring tasks link */}
                        {['N', 'O', 'P', 'Q', 'R'].includes(actionPanelTask.id) && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Opens scoring dashboard
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Already completed message */}
                {statuses[actionPanelTask.id] !== 'active' && (
                  <div className="text-center text-sm text-muted-foreground">
                    This task is {statusLabel(statuses[actionPanelTask.id]).toLowerCase()}.
                  </div>
                )}

                {/* Cancel */}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => setActionPanelTaskId(null)}
                  >
                    Cancel
                    <kbd className="ml-2 text-[10px] opacity-50 border px-1 py-0.5 rounded">Esc</kbd>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 7. Utility Bar (Bottom) ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-0 divide-x divide-border h-10">
          <button
            onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 h-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Matter Plan
          </button>
          <button
            onClick={() => document.querySelector<HTMLInputElement>('input[placeholder="Search tasks..."]')?.focus()}
            className="flex items-center gap-2 px-4 h-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            Quick Search
          </button>
          <div className="flex items-center gap-2 px-4 h-full text-xs">
            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">SLA:</span>
            {activeTask ? (
              <span className={cn('font-mono font-semibold', countdown === '00:00:00' ? 'text-red-600' : 'text-blue-600')}>{countdown}</span>
            ) : (
              <span className="text-muted-foreground">&mdash;</span>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 h-full text-xs">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Progress:</span>
            <span className="font-semibold text-foreground">{completedCount}/{TASKS.length}</span>
            <span className="text-muted-foreground">({Math.round((completedCount / TASKS.length) * 100)}%)</span>
          </div>
        </div>
      </div>

      {/* Bottom padding for utility bar */}
      <div className="h-14" />
    </div>
  );
}
