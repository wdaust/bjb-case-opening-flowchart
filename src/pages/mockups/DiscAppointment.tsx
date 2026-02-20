import { useState, useEffect } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { discoveryAppointmentAgenda } from '../../data/discAppointmentData.ts';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import { ChevronDown, ChevronRight, Clock, CheckCircle2, FileText } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

// ── Helpers ─────────────────────────────────────────────────────────────

function countChecked(
  sectionId: string,
  checkItems: { id: string; label: string }[],
  checkedItems: Record<string, boolean>,
): number {
  return checkItems.filter((item) => checkedItems[`${sectionId}::${item.id}`]).length;
}

function isSectionComplete(
  sectionId: string,
  checkItems: { id: string; label: string }[],
  checkedItems: Record<string, boolean>,
): boolean {
  return checkItems.length > 0 && checkItems.every((item) => checkedItems[`${sectionId}::${item.id}`]);
}

// ── Component ───────────────────────────────────────────────────────────

export default function DiscAppointment() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([discoveryAppointmentAgenda[0]?.id]),
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState('00:00');

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Derived progress
  const completedSections = discoveryAppointmentAgenda.filter((section) =>
    isSectionComplete(section.id, section.checkItems, checkedItems),
  ).length;

  const totalSections = discoveryAppointmentAgenda.length;
  const allComplete = completedSections === totalSections;
  const progressPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  // Handlers
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleCheckItem = (sectionId: string, itemId: string) => {
    const key = `${sectionId}::${itemId}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateNote = (sectionId: string, value: string) => {
    setSectionNotes((prev) => ({ ...prev, [sectionId]: value }));
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Discovery — Appointment Protocol
        </h1>
        <MockupNav active="disc-appointment" group="discovery" />
      </div>

      {/* Case info bar */}
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
            <p className="text-sm">Discovery</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Assigned To</span>
            <p className="text-sm">Maria Santos</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div>
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left column — agenda sections */}
          <div className="space-y-4 lg:col-span-3">
            {discoveryAppointmentAgenda.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              const checked = countChecked(section.id, section.checkItems, checkedItems);
              const total = section.checkItems.length;
              const complete = isSectionComplete(section.id, section.checkItems, checkedItems);

              return (
                <div
                  key={section.id}
                  className={cn(
                    'rounded-lg border border-border bg-card shadow-sm',
                    'border-l-4 border-l-blue-800',
                  )}
                >
                  {/* Section header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    {/* Number circle */}
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        complete
                          ? 'bg-blue-800 text-white'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {section.order}
                    </span>

                    {/* Title */}
                    <span className="flex-1 font-medium text-foreground">
                      {section.title}
                    </span>

                    {/* Completion badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 text-xs',
                        complete
                          ? 'border-blue-300/40 bg-blue-800/30 text-white'
                          : 'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {checked}/{total} items checked
                    </Badge>

                    {/* Expand/collapse icon */}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="space-y-5 border-t border-border px-4 py-4">
                      {/* Purpose */}
                      <p className="text-sm italic text-muted-foreground">
                        {section.purpose}
                      </p>

                      {/* Checklist */}
                      {section.checkItems.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Checklist
                          </h4>
                          <div className="space-y-1.5">
                            {section.checkItems.map((item) => {
                              const key = `${section.id}::${item.id}`;
                              const isChecked = !!checkedItems[key];
                              return (
                                <label
                                  key={item.id}
                                  className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 transition-colors hover:bg-muted/50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCheckItem(section.id, item.id)}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-blue-800"
                                  />
                                  <span
                                    className={cn(
                                      'text-sm',
                                      isChecked
                                        ? 'text-muted-foreground line-through'
                                        : 'text-foreground',
                                    )}
                                  >
                                    {item.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sample Questions */}
                      {section.sampleQuestions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Sample Questions
                          </h4>
                          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
                            {section.sampleQuestions.map((q, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-0.5 shrink-0 text-blue-800">&#x1F4AC;</span>
                                <span className="italic">{q}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Litify Fields */}
                      {section.litifyFields.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Litify Fields
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {section.litifyFields.map((field, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="border-blue-800/30 bg-blue-800/5 text-xs text-blue-700"
                              >
                                <FileText className="mr-1 h-3 w-3" />
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes textarea */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Notes
                        </h4>
                        <textarea
                          value={sectionNotes[section.id] ?? ''}
                          onChange={(e) => updateNote(section.id, e.target.value)}
                          placeholder="Add notes for this section..."
                          rows={3}
                          className={cn(
                            'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground',
                            'placeholder:text-muted-foreground/60',
                            'focus:outline-none focus:ring-2 focus:ring-blue-800/40',
                            'resize-y',
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right column — progress sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Progress card */}
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Appointment Progress
                </h3>

                {/* Completion count */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    <span className="text-lg font-bold text-blue-800">{completedSections}</span>
                    {' '}of {totalSections} sections complete
                  </span>
                  <CheckCircle2
                    className={cn(
                      'h-5 w-5',
                      allComplete ? 'text-blue-800' : 'text-muted-foreground/40',
                    )}
                  />
                </div>

                {/* Progress bar */}
                <div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      allComplete ? 'bg-blue-700' : 'bg-blue-800',
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Section mini-list */}
                <div className="mb-6 space-y-1.5">
                  {discoveryAppointmentAgenda.map((section) => {
                    const done = isSectionComplete(section.id, section.checkItems, checkedItems);
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                          setExpandedSections((prev) => {
                            const next = new Set(prev);
                            next.add(section.id);
                            return next;
                          });
                          document.getElementById(`section-${section.id}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors hover:bg-muted/70',
                          done ? 'text-blue-800' : 'text-muted-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            done
                              ? 'bg-blue-800 text-white'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {section.order}
                        </span>
                        <span className="truncate">{section.title}</span>
                        {done && <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-blue-800" />}
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Timer */}
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Appointment Duration</span>
                </div>
                <p className="mt-1 font-mono text-2xl font-bold text-foreground">{elapsed}</p>
              </div>

              {/* Complete button */}
              <Button
                disabled={!allComplete}
                className={cn(
                  'w-full',
                  allComplete
                    ? 'bg-blue-800 text-white hover:bg-blue-900'
                    : 'cursor-not-allowed opacity-50',
                )}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
