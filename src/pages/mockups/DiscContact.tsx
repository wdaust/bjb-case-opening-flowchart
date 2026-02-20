import { useState, useEffect, useRef, useCallback } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import {
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  PhoneOff,
  Send,
  FileText,
  AlertTriangle,
  Gavel,
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
  { id: 'A', letter: 'A', label: 'Draft Discovery Responses', icon: FileText, slaLabel: 'Day 30 from complaint filed', slaDurationMs: 30*24*60*60*1000, isCall: false },
  { id: 'B', letter: 'B', label: 'Call Discovery Appt Attempt 1', icon: Phone, slaLabel: 'Day 31 by 10am', slaDurationMs: 24*60*60*1000, isCall: true, autoTriggers: ['Voicemail 1', 'SMS 1', 'Email 1'] },
  { id: 'C', letter: 'C', label: 'Call Discovery Appt Attempt 2', icon: Phone, slaLabel: 'Day 32 by 1pm', slaDurationMs: 27*60*60*1000, isCall: true, autoTriggers: ['Voicemail 2', 'SMS 2', 'Email 2'] },
  { id: 'D', letter: 'D', label: 'Call Discovery Appt Attempt 3', icon: Phone, slaLabel: 'Day 33 by 4pm', slaDurationMs: 27*60*60*1000, isCall: true, autoTriggers: ['Voicemail 3', 'SMS 3', 'Email 3'] },
  { id: 'E', letter: 'E', label: 'Send Contact Letter 1', icon: Mail, slaLabel: 'Day 16 (auto)', slaDurationMs: 24*60*60*1000, isCall: false, autoTriggers: ['Letter sent automatically'] },
  { id: 'F', letter: 'F', label: 'Call Discovery Appt Attempt 4', icon: Phone, slaLabel: 'Day 45 by 10am', slaDurationMs: 12*24*60*60*1000, isCall: true, autoTriggers: ['Voicemail 4', 'SMS 4', 'Email 4'] },
  { id: 'G', letter: 'G', label: 'Call Discovery Appt Attempt 5', icon: Phone, slaLabel: 'Day 46 by 1pm', slaDurationMs: 27*60*60*1000, isCall: true, autoTriggers: ['Voicemail 5', 'SMS 5', 'Email 5'] },
  { id: 'H', letter: 'H', label: 'Call Discovery Appt Attempt 6', icon: Phone, slaLabel: 'Day 47 by 4pm', slaDurationMs: 27*60*60*1000, isCall: true, autoTriggers: ['Voicemail 6', 'SMS 6', 'Email 6'] },
  { id: 'I', letter: 'I', label: 'Send Contact Letter 2', icon: Mail, slaLabel: 'Day 47 (auto)', slaDurationMs: 24*60*60*1000, isCall: false, autoTriggers: ['Letter sent automatically'] },
  { id: 'J', letter: 'J', label: 'Management Escalation', icon: AlertTriangle, slaLabel: 'Day 49', slaDurationMs: 2*24*60*60*1000, isCall: false },
  { id: 'K', letter: 'K', label: 'Attorney Discovery Appointment', icon: Gavel, slaLabel: '≤5 days from conversation', slaDurationMs: 5*24*60*60*1000, isCall: false },
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

export default function DiscContact() {
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

  const handleEscalate = useCallback(
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
        <h1 className="text-2xl font-bold text-foreground mb-3">Discovery &mdash; Contact Pursuit</h1>
        <MockupNav active="disc-contact" group="discovery" />
      </div>

      {/* Case header bar */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-800 to-blue-900 p-4 text-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-xs text-blue-200">Case #</span>
            <p className="font-mono font-bold">2024-1203</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Client</span>
            <p className="font-semibold">Johnson, Keisha &mdash; MVA Intersection</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Stage</span>
            <Badge className="bg-blue-500/30 text-white border-blue-300/40">
              Discovery
            </Badge>
          </div>
          <div>
            <span className="text-xs text-blue-200">Status</span>
            <Badge className="bg-blue-500/30 text-white border-blue-300/40">
              {completedCount === TASKS.length ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
          <div>
            <span className="text-xs text-blue-200">Assigned To</span>
            <p className="text-sm">Maria Santos</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Complaint Filed</span>
            <p className="text-sm">2024-11-01</p>
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
            const isEscalation = task.id === 'J';
            const isAttorneyAppt = task.id === 'K';
            const isDraftResponses = task.id === 'A';

            return (
              <div key={task.id} className="flex gap-4">
                {/* Vertical timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      isComplete && 'border-green-500 bg-green-500 text-white',
                      isActive && 'border-blue-800 bg-blue-800/10 text-blue-800 ring-2 ring-blue-800/30',
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
                    isActive && 'border-blue-800/50 bg-blue-800/5 shadow-sm',
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
                          <span className="text-blue-700">
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
                        <Badge className="bg-blue-800/10 text-blue-700 border-blue-800/30">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* SLA countdown for active task */}
                  {isActive && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-700" />
                      <span className="font-mono text-blue-700 font-semibold">{countdown}</span>
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
                      {isEscalation ? (
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleEscalate(task.id)}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Escalate to Management
                        </Button>
                      ) : isAttorneyAppt ? (
                        <Button
                          size="sm"
                          className="bg-blue-800 hover:bg-blue-900 text-white"
                          onClick={() => handleMarkComplete(task.id)}
                        >
                          <Gavel className="h-3.5 w-3.5 mr-1" />
                          Mark Appointment Complete
                        </Button>
                      ) : isDraftResponses ? (
                        <Button
                          size="sm"
                          className="bg-blue-800 hover:bg-blue-900 text-white"
                          onClick={() => handleMarkComplete(task.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Mark Complete
                        </Button>
                      ) : task.isCall ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-blue-800 hover:bg-blue-900 text-white"
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
              The discovery contact pursuit follows a 6-call + 2-letter pattern. When a call attempt
              results in &ldquo;Not Connected,&rdquo; the system automatically drops a voicemail,
              sends an SMS, and sends an email before advancing. Two contact letters are sent
              automatically at key intervals.
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
                { color: 'bg-blue-800', label: 'Active' },
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
