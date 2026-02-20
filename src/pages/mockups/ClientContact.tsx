import { useState, useEffect, useRef, useCallback } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import {
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  PhoneOff,
  Send,
  FileText,
  Stethoscope,
  ShieldCheck,
  Users,
  Briefcase,
  Scale,
} from 'lucide-react';
import { cn } from '../../utils/cn.ts';

// ── Task definitions ───────────────────────────────────────────────────

type TaskStatus = 'pending' | 'active' | 'connected' | 'not-connected' | 'complete';

interface TimelineTask {
  id: string;
  letter: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  slaLabel: string;
  slaDurationMs: number;
  isCall: boolean;
  autoTriggers?: string[];
}

const TASKS: TimelineTask[] = [
  { id: 'A', letter: 'A', label: 'Initial Call Attempt', icon: Phone, slaLabel: '2 hours', slaDurationMs: 2 * 60 * 60 * 1000, isCall: true },
  { id: 'B', letter: 'B', label: 'Voicemail + SMS', icon: MessageSquare, slaLabel: '5 min', slaDurationMs: 5 * 60 * 1000, isCall: false, autoTriggers: ['Voicemail left', 'SMS sent'] },
  { id: 'C', letter: 'C', label: 'Introduction Email', icon: Mail, slaLabel: '10 min', slaDurationMs: 10 * 60 * 1000, isCall: false, autoTriggers: ['Email sent'] },
  { id: 'D', letter: 'D', label: 'Second Call Attempt', icon: Phone, slaLabel: '4 hours', slaDurationMs: 4 * 60 * 60 * 1000, isCall: true },
  { id: 'E', letter: 'E', label: 'Third Call Attempt', icon: Phone, slaLabel: '24 hours', slaDurationMs: 24 * 60 * 60 * 1000, isCall: true },
  { id: 'F', letter: 'F', label: 'Engagement Package Sent', icon: Send, slaLabel: 'After connection', slaDurationMs: 60 * 60 * 1000, isCall: false },
  { id: 'G', letter: 'G', label: 'Retainer Signed', icon: FileText, slaLabel: '48 hours', slaDurationMs: 48 * 60 * 60 * 1000, isCall: false },
  { id: 'H', letter: 'H', label: 'Medical Authorization', icon: Stethoscope, slaLabel: '48 hours', slaDurationMs: 48 * 60 * 60 * 1000, isCall: false },
  { id: 'I', letter: 'I', label: 'Insurance Info Collected', icon: ShieldCheck, slaLabel: '72 hours', slaDurationMs: 72 * 60 * 60 * 1000, isCall: false },
  { id: 'J', letter: 'J', label: 'Client Interview', icon: Users, slaLabel: '5 days', slaDurationMs: 5 * 24 * 60 * 60 * 1000, isCall: false },
  { id: 'K', letter: 'K', label: 'Case Assignment', icon: Briefcase, slaLabel: '24 hours', slaDurationMs: 24 * 60 * 60 * 1000, isCall: false },
  { id: 'L', letter: 'L', label: 'Case Opening Complete', icon: Scale, slaLabel: '7 days', slaDurationMs: 7 * 24 * 60 * 60 * 1000, isCall: false },
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

// ── Component ───────────────────────────────────────────────────────────

export default function ClientContact() {
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

      // Simulate auto-triggered actions
      const nextTask = TASKS[TASKS.findIndex((t) => t.id === taskId) + 1];
      const triggers = nextTask?.autoTriggers || [];

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
        <h1 className="text-2xl font-bold text-foreground mb-3">Client Contact Pursuit</h1>
        <MockupNav active="client-contact" />
      </div>

      {/* Case header bar */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-xs text-blue-200">Case #</span>
            <p className="font-mono font-bold">2024-0847</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Client</span>
            <p className="font-semibold">Martinez, Roberto &mdash; MVA Rear-End</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Status</span>
            <Badge className="bg-blue-500/30 text-white border-blue-300/40">
              {completedCount === TASKS.length ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
          <div>
            <span className="text-xs text-blue-200">Assigned To</span>
            <p className="text-sm">Sarah Chen</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Date of Loss</span>
            <p className="text-sm">2024-11-15</p>
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
                      isActive && 'border-blue-500 bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/30',
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
                    isActive && 'border-blue-500/50 bg-blue-500/5 shadow-sm',
                    isComplete && 'border-green-500/30 bg-green-500/5',
                    isNotConnected && 'border-amber-500/30 bg-amber-500/5',
                    isPending && 'border-border bg-card opacity-60'
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
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          SLA: {task.slaLabel}
                        </span>
                        {task.autoTriggers && (
                          <span className="text-blue-500">
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
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* SLA countdown for active task */}
                  {isActive && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-mono text-blue-600 font-semibold">{countdown}</span>
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
                      {task.isCall ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
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
              When a call attempt results in "Not Connected," the system automatically triggers the
              next follow-up actions (voicemail, SMS, email) before advancing to the next task in
              the sequence.
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

          {/* Legend */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Status Legend</h3>
            <div className="space-y-2">
              {[
                { color: 'bg-blue-500', label: 'Active' },
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
        </div>
      </div>
    </div>
  );
}
