import { useState, useEffect, useRef, useCallback } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import {
  Phone,
  CheckCircle2,
  Clock,
  PhoneOff,
  Send,
  FileText,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import { cn } from '../../utils/cn.ts';

// ── Task definitions ───────────────────────────────────────────────────

type TaskStatus = 'pending' | 'active' | 'connected' | 'not-connected' | 'complete';

interface TimelineTask {
  id: string;
  letter: string;
  label: string;
  phase: string;
  icon: React.ComponentType<{ className?: string }>;
  slaLabel: string;
  slaDurationMs: number;
  isCall: boolean;
  isApproval?: boolean;
  isAttorneyTask?: boolean;
  autoTriggers?: string[];
}

const TASKS: TimelineTask[] = [
  // Phase 1 — Non-Party Depo Setup
  { id: 'A', letter: 'A', label: 'Get approval to begin non-party depos', phase: 'Non-Party Depo Setup', icon: FileText, slaLabel: 'Day 75 from complaint filed', slaDurationMs: 75*24*60*60*1000, isCall: false, isApproval: true },
  { id: 'B', letter: 'B', label: 'Prepare notice, cover letter, send', phase: 'Non-Party Depo Setup', icon: FileText, slaLabel: '1hr after approval', slaDurationMs: 1*60*60*1000, isCall: false },
  { id: 'C', letter: 'C', label: 'Schedule court reporter', phase: 'Non-Party Depo Setup', icon: FileText, slaLabel: '1hr after approval', slaDurationMs: 1*60*60*1000, isCall: false },
  { id: 'D', letter: 'D', label: 'Prepare cross-notice, cover letter, send', phase: 'Non-Party Depo Setup', icon: FileText, slaLabel: 'Day 75 from complaint filed', slaDurationMs: 75*24*60*60*1000, isCall: false },
  { id: 'E', letter: 'E', label: 'Schedule court reporter & interpreter', phase: 'Non-Party Depo Setup', icon: FileText, slaLabel: 'Day 75 from complaint filed', slaDurationMs: 75*24*60*60*1000, isCall: false },
  { id: 'F', letter: 'F', label: 'Verify depo confirmed or reschedule', phase: 'Non-Party Depo Setup', icon: FileText, slaLabel: '1 day before depo', slaDurationMs: 24*60*60*1000, isCall: false },

  // Phase 2 — Expert Directive
  { id: 'G', letter: 'G', label: 'Confirm expert directive from Attorney', phase: 'Expert Directive', icon: FileText, slaLabel: '2 days after Discovery Appt', slaDurationMs: 2*24*60*60*1000, isCall: false },

  // Phase 3 — Retain Expert (3-call attempts)
  { id: 'H', letter: 'H', label: 'Retain Expert Attempt 1', phase: 'Retain Expert', icon: Phone, slaLabel: '10am day 10', slaDurationMs: 10*24*60*60*1000, isCall: true, autoTriggers: ['Voicemail 1', 'SMS 1', 'Email 1'] },
  { id: 'I', letter: 'I', label: 'Retain Expert Attempt 2', phase: 'Retain Expert', icon: Phone, slaLabel: '1pm day 11', slaDurationMs: 27*60*60*1000, isCall: true, autoTriggers: ['Voicemail 2', 'SMS 2', 'Email 2'] },
  { id: 'J', letter: 'J', label: 'Retain Expert Attempt 3', phase: 'Retain Expert', icon: Phone, slaLabel: '4pm day 11', slaDurationMs: 3*60*60*1000, isCall: true, autoTriggers: ['Voicemail 3', 'SMS 3', 'Email 3'] },
  { id: 'K', letter: 'K', label: 'Retain and schedule Expert', phase: 'Retain Expert', icon: CheckCircle2, slaLabel: '1hr after IME request', slaDurationMs: 1*60*60*1000, isCall: false },
  { id: 'L', letter: 'L', label: 'Replace Expert', phase: 'Retain Expert', icon: AlertTriangle, slaLabel: '5pm day 11', slaDurationMs: 1*60*60*1000, isCall: false },

  // Phase 4 — IME/Report Request
  { id: 'M', letter: 'M', label: 'IME/Report request to Expert', phase: 'IME/Report Request', icon: Send, slaLabel: '1hr after schedule confirmed', slaDurationMs: 1*60*60*1000, isCall: false },

  // Phase 5 — Report Follow-Up (4-call attempts)
  { id: 'N', letter: 'N', label: 'Follow up Expert Attempt 1', phase: 'Report Follow-Up', icon: Phone, slaLabel: '10 days after retention', slaDurationMs: 10*24*60*60*1000, isCall: true, autoTriggers: ['Voicemail 1', 'SMS 1', 'Email 1'] },
  { id: 'O', letter: 'O', label: 'Follow up Expert Attempt 2', phase: 'Report Follow-Up', icon: Phone, slaLabel: '48hrs after attempt 1', slaDurationMs: 48*60*60*1000, isCall: true, autoTriggers: ['Voicemail 2', 'SMS 2', 'Email 2'] },
  { id: 'P', letter: 'P', label: 'Follow up Expert Attempt 3', phase: 'Report Follow-Up', icon: Phone, slaLabel: '48hrs after attempt 2', slaDurationMs: 48*60*60*1000, isCall: true, autoTriggers: ['Voicemail 3', 'SMS 3', 'Email 3'] },
  { id: 'Q', letter: 'Q', label: 'Follow up Expert Attempt 4', phase: 'Report Follow-Up', icon: Phone, slaLabel: '48hrs after attempt 3', slaDurationMs: 48*60*60*1000, isCall: true, autoTriggers: ['Voicemail 4', 'SMS 4', 'Email 4'] },
  { id: 'R', letter: 'R', label: 'Upload expert report', phase: 'Report Follow-Up', icon: FileText, slaLabel: '1hr from receipt', slaDurationMs: 1*60*60*1000, isCall: false },
  { id: 'S', letter: 'S', label: 'Attorney Review Expert Report', phase: 'Report Follow-Up', icon: FileText, slaLabel: '7 days', slaDurationMs: 7*24*60*60*1000, isCall: false, isAttorneyTask: true },

  // Phase 6 — Supportive Admin
  { id: 'T', letter: 'T', label: 'Supportive Admin 1', phase: 'Supportive Admin', icon: FileText, slaLabel: '3hrs', slaDurationMs: 3*60*60*1000, isCall: false },

  // Phase 7 — Amended Report Follow-Up (3-call attempts)
  { id: 'U', letter: 'U', label: 'Amended Report Follow up Attempt 1', phase: 'Amended Report', icon: Phone, slaLabel: 'Day 19', slaDurationMs: 19*24*60*60*1000, isCall: true, autoTriggers: ['Voicemail 1', 'SMS 1', 'Email 1'] },
  { id: 'V', letter: 'V', label: 'Amended Report Follow up Attempt 2', phase: 'Amended Report', icon: Phone, slaLabel: 'Same day', slaDurationMs: 3*60*60*1000, isCall: true, autoTriggers: ['Voicemail 2', 'SMS 2', 'Email 2'] },
  { id: 'W', letter: 'W', label: 'Amended Report Follow up Attempt 3', phase: 'Amended Report', icon: Phone, slaLabel: 'Same day', slaDurationMs: 3*60*60*1000, isCall: true, autoTriggers: ['Voicemail 3', 'SMS 3', 'Email 3'] },
  { id: 'X', letter: 'X', label: 'Upload amended report', phase: 'Amended Report', icon: FileText, slaLabel: '1hr from receipt', slaDurationMs: 1*60*60*1000, isCall: false },
  { id: 'Y', letter: 'Y', label: 'Attorney Review Amended Report', phase: 'Amended Report', icon: FileText, slaLabel: '7 days', slaDurationMs: 7*24*60*60*1000, isCall: false, isAttorneyTask: true },

  // Phase 8 — Client Depo & IME
  { id: 'Z', letter: 'Z', label: 'Report client depo completed/rescheduled', phase: 'Client Depo & IME', icon: FileText, slaLabel: '1hr from event', slaDurationMs: 1*60*60*1000, isCall: false },
  { id: 'AA', letter: 'AA', label: 'Supportive Admin Post-Depo', phase: 'Client Depo & IME', icon: FileText, slaLabel: '3hrs', slaDurationMs: 3*60*60*1000, isCall: false },
  { id: 'AB', letter: 'AB', label: 'Plaintiff IME Notice to client', phase: 'Client Depo & IME', icon: Send, slaLabel: '1hr from notice', slaDurationMs: 1*60*60*1000, isCall: false },
  { id: 'AC', letter: 'AC', label: 'IME reminder 10 days', phase: 'Client Depo & IME', icon: Bell, slaLabel: '10 days before IME', slaDurationMs: 10*24*60*60*1000, isCall: false },
  { id: 'AD', letter: 'AD', label: 'IME reminder 1 day', phase: 'Client Depo & IME', icon: Bell, slaLabel: '1 day before IME', slaDurationMs: 24*60*60*1000, isCall: false },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Phase colors for legend ─────────────────────────────────────────────

const PHASE_LEGEND = [
  { label: 'Non-Party Depo Setup', color: 'bg-slate-600' },
  { label: 'Expert Directive', color: 'bg-orange-700' },
  { label: 'Retain Expert', color: 'bg-blue-800' },
  { label: 'IME/Report Request', color: 'bg-stone-700' },
  { label: 'Report Follow-Up', color: 'bg-slate-500' },
  { label: 'Supportive Admin', color: 'bg-teal-700' },
  { label: 'Amended Report', color: 'bg-orange-800' },
  { label: 'Client Depo & IME', color: 'bg-green-700' },
];

// ── Component ───────────────────────────────────────────────────────────

export default function ExpContact() {
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(() => {
    const init: Record<string, TaskStatus> = {};
    TASKS.forEach((t) => {
      init[t.id] = t.id === 'A' ? 'active' : 'pending';
    });
    return init;
  });

  const [animatingTriggers, setAnimatingTriggers] = useState<string[]>([]);
  const [slaStartTime, setSlaStartTime] = useState<number>(Date.now());
  const [countdown, setCountdown] = useState('');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Find current active task
  const activeTask = TASKS.find((t) => statuses[t.id] === 'active');

  // SLA countdown timer
  useEffect(() => {
    if (!activeTask) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - slaStartTime;
      const remaining = activeTask.slaDurationMs - elapsed;
      setCountdown(formatCountdown(Math.max(remaining, 0)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, slaStartTime]);

  const advanceToNext = useCallback(
    (currentId: string) => {
      const idx = TASKS.findIndex((t) => t.id === currentId);
      setStatuses((prev) => {
        const next = { ...prev, [currentId]: 'complete' as TaskStatus };
        if (idx + 1 < TASKS.length) {
          next[TASKS[idx + 1].id] = 'active';
        }
        return next;
      });
      setSlaStartTime(Date.now());
    },
    []
  );

  const handleConnected = useCallback(
    (taskId: string) => {
      advanceToNext(taskId);
    },
    [advanceToNext]
  );

  const handleNotConnected = useCallback(
    (taskId: string) => {
      const task = TASKS.find((t) => t.id === taskId);
      if (!task) return;

      setStatuses((prev) => ({ ...prev, [taskId]: 'not-connected' as TaskStatus }));

      // Simulate auto-triggered actions (voicemail + SMS + email)
      const triggers = task.autoTriggers || [];

      if (triggers.length > 0) {
        setAnimatingTriggers(triggers);
        animTimeoutRef.current = setTimeout(() => {
          setAnimatingTriggers([]);
          advanceToNext(taskId);
        }, 1500);
      } else {
        advanceToNext(taskId);
      }
    },
    [advanceToNext]
  );

  const handleMarkComplete = useCallback(
    (taskId: string) => {
      advanceToNext(taskId);
    },
    [advanceToNext]
  );

  const handleDisapprove = useCallback(
    (taskId: string) => {
      // Disapprove keeps it marked but advances
      advanceToNext(taskId);
    },
    [advanceToNext]
  );

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  // Progress
  const completedCount = TASKS.filter((t) => statuses[t.id] === 'complete').length;
  const progressPct = Math.round((completedCount / TASKS.length) * 100);

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-3">Expert &amp; Deposition &mdash; Expert Pursuit</h1>
        <MockupNav active="exp-contact" group="expert-deposition" />
      </div>

      {/* Case header bar */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-stone-700 to-stone-800 p-4 text-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-xs text-stone-200">Case #</span>
            <p className="font-mono font-bold">2024-1547</p>
          </div>
          <div>
            <span className="text-xs text-stone-200">Client</span>
            <p className="font-semibold">Ramirez, Ana &mdash; MVA Highway</p>
          </div>
          <div>
            <span className="text-xs text-stone-200">Stage</span>
            <Badge className="bg-stone-500/30 text-white border-stone-300/40">
              Expert &amp; Deposition
            </Badge>
          </div>
          <div>
            <span className="text-xs text-stone-200">Status</span>
            <Badge className="bg-stone-500/30 text-white border-stone-300/40">
              {completedCount === TASKS.length ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
          <div>
            <span className="text-xs text-stone-200">Assigned To</span>
            <p className="text-sm">David Kim</p>
          </div>
          <div>
            <span className="text-xs text-stone-200">Discovery Served</span>
            <p className="text-sm">2024-10-15</p>
          </div>
        </div>
      </div>

      {/* Main content: timeline + sidebar */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Timeline */}
        <div className="lg:col-span-3 space-y-0">
          {TASKS.map((task, idx) => {
            const status = statuses[task.id];
            const Icon = task.icon;
            const isComplete = status === 'complete';
            const isActive = status === 'active';
            const isNotConnected = status === 'not-connected';
            const isPending = status === 'pending';

            return (
              <div key={task.id} className="flex gap-4">
                {/* Vertical timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      isComplete && 'border-green-500 bg-green-500 text-white',
                      isActive && 'border-stone-700 bg-stone-700/10 text-stone-700 ring-2 ring-stone-700/30',
                      isNotConnected && 'border-amber-500 bg-amber-500/10 text-amber-500',
                      isPending && 'border-border bg-muted text-muted-foreground'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  {idx < TASKS.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 min-h-[24px]',
                        isComplete ? 'bg-green-500' : 'bg-border'
                      )}
                    />
                  )}
                </div>

                {/* Task card */}
                <div
                  className={cn(
                    'mb-4 flex-1 rounded-lg border p-4 transition-all',
                    isActive && 'border-stone-700/50 bg-stone-700/5 shadow-sm',
                    isComplete && 'border-green-500/30 bg-green-500/5',
                    isNotConnected && 'border-amber-500/30 bg-amber-500/5',
                    isPending && 'border-border bg-card opacity-60',
                    task.isAttorneyTask && isActive && 'border-amber-600/50 bg-amber-50 dark:bg-amber-900/10'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          {task.letter}
                        </span>
                        <h3
                          className={cn(
                            'font-semibold',
                            isComplete && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.label}
                        </h3>
                        {task.isAttorneyTask && (
                          <Badge variant="outline" className="text-xs text-amber-700 border-amber-500/40">
                            Attorney
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-stone-500 font-medium">{task.phase}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          SLA: {task.slaLabel}
                        </span>
                        {task.autoTriggers && (
                          <span className="text-stone-600">
                            Auto: {task.autoTriggers.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                          Complete
                        </Badge>
                      )}
                      {isNotConnected && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Not Connected
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {isActive && (
                        <Badge className="bg-stone-700/10 text-stone-700 border-stone-700/30">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* SLA countdown for active task */}
                  {isActive && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-stone-700" />
                      <span className="font-mono text-stone-700 font-semibold">{countdown}</span>
                      <span className="text-muted-foreground">remaining</span>
                    </div>
                  )}

                  {/* Animated triggers */}
                  {isNotConnected && animatingTriggers.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {animatingTriggers.map((trigger) => (
                        <div
                          key={trigger}
                          className="animate-pulse flex items-center gap-2 text-sm text-amber-600"
                        >
                          <Send className="h-3 w-3" />
                          {trigger}...
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  {isActive && (
                    <div className="mt-3 flex gap-2">
                      {task.isApproval ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-stone-700 hover:bg-stone-800 text-white"
                            onClick={() => handleMarkComplete(task.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            onClick={() => handleDisapprove(task.id)}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Disapprove
                          </Button>
                        </>
                      ) : task.isCall ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-stone-700 hover:bg-stone-800 text-white"
                            onClick={() => handleConnected(task.id)}
                          >
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            Connected
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                            onClick={() => handleNotConnected(task.id)}
                          >
                            <PhoneOff className="h-3.5 w-3.5 mr-1" />
                            Not Connected
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-stone-700 hover:bg-stone-800 text-white"
                          onClick={() => handleMarkComplete(task.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Progress card */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Progress</h3>
            <div className="text-3xl font-bold text-foreground">{progressPct}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {completedCount} of {TASKS.length} tasks complete
            </p>
          </div>

          {/* Automated triggers */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Automated Triggers</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The expert pursuit follows a 3-call retain + 4-call follow-up + 3-call amended report
              pattern. When a call attempt results in &ldquo;Not Connected,&rdquo; the system
              automatically drops a voicemail, sends an SMS, and sends an email before advancing
              to the next attempt.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Not Connected triggers auto-actions</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Connected advances directly</span>
              </div>
            </div>
          </div>

          {/* Status Legend */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Status Legend</h3>
            <div className="space-y-2">
              {[
                { color: 'bg-stone-700', label: 'Active' },
                { color: 'bg-green-500', label: 'Complete' },
                { color: 'bg-amber-500', label: 'Not Connected' },
                { color: 'bg-muted-foreground', label: 'Pending' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Legend */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Phase Legend</h3>
            <div className="space-y-2">
              {PHASE_LEGEND.map((item, i) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                  <span className="text-muted-foreground">
                    <span className="font-mono font-bold mr-1">{i + 1}.</span>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
