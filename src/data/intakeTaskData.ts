import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const intakePhases: Phase[] = [
  {
    id: "intake-call",
    label: "Intake Call & Screening",
    color: "blue-700",
    order: 1,
  },
  {
    id: "engagement-agreement",
    label: "Engagement Agreement",
    color: "green-700",
    order: 2,
  },
  {
    id: "case-submission",
    label: "Case Submission & Handoff",
    color: "violet-700",
    order: 3,
  },
];

export const intakeTasks: TrackerTask[] = [
  // Phase 1: Intake Call & Screening
  {
    id: "INT-A",
    label: "Complete intake screening questionnaire with prospective client",
    assignedTo: "Intake Specialist",
    sla: "During initial call",
    phase: "intake-call",
    phaseOrder: 1,
  },
  {
    id: "INT-B",
    label: "Run conflict check and verify case eligibility criteria",
    assignedTo: "Intake Specialist",
    sla: "During initial call",
    phase: "intake-call",
    phaseOrder: 2,
  },

  // Phase 2: Engagement Agreement
  {
    id: "INT-C",
    label: "Generate and send engagement agreement for e-signature",
    assignedTo: "Intake Specialist",
    sla: "Within 1 hour of qualified lead",
    phase: "engagement-agreement",
    phaseOrder: 1,
  },
  {
    id: "INT-D",
    label: "Confirm signed engagement agreement received and filed",
    assignedTo: "Intake Specialist",
    sla: "Within 24 hours of send",
    phase: "engagement-agreement",
    phaseOrder: 2,
  },

  // Phase 3: Case Submission & Handoff
  {
    id: "INT-E",
    label: "Create matter in Litify and assign to Pre-LIT team",
    assignedTo: "Intake Specialist",
    sla: "Within 1 hour of signed agreement",
    phase: "case-submission",
    phaseOrder: 1,
  },
];

// ── Path stages ──────────────────────────────────────────────────────

export const INTAKE_PATH_STAGES: PathStage[] = [
  { label: "Screening", firstTaskId: "INT-A", lastTaskId: "INT-B" },
  { label: "Engagement", firstTaskId: "INT-C", lastTaskId: "INT-D" },
  { label: "Case Submission", firstTaskId: "INT-E", lastTaskId: "INT-E" },
];

export function getIntakeTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = intakeTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = intakeTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return intakeTasks.slice(startIdx, endIdx + 1);
}
