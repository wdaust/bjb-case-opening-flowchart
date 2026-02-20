import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const trialPhases: Phase[] = [
  {
    id: "court-notice-calendar",
    label: "Court Notice & Calendar",
    color: "violet-700",
    order: 1,
  },
  {
    id: "client-expert-notice",
    label: "Client & Expert Notice",
    color: "sky-700",
    order: 2,
  },
  { id: "trial-prep", label: "Trial Prep", color: "fuchsia-700", order: 3 },
  {
    id: "trial-readiness",
    label: "Trial Readiness Verification",
    color: "red-700",
    order: 4,
  },
];

export const trialTasks: TrackerTask[] = [
  // Phase 1: Court Notice & Calendar
  {
    id: "TRIAL-A",
    label: "Calendar trial notice from the court",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from notice receipt",
    phase: "court-notice-calendar",
    phaseOrder: 1,
  },
  {
    id: "TRIAL-B",
    label: "Calendar trial date in Litify",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 hour from receiving trial notice",
    phase: "court-notice-calendar",
    phaseOrder: 2,
  },

  // Phase 2: Client & Expert Notice
  {
    id: "TRIAL-C",
    label: "Trial notice to the client (automation)",
    assignedTo: "System Automation",
    sla: "1 hour from notice receipt",
    phase: "client-expert-notice",
    phaseOrder: 1,
  },
  {
    id: "TRIAL-D",
    label: "Trial notice to all experts (automation)",
    assignedTo: "System Automation",
    sla: "1 hour from notice receipt",
    phase: "client-expert-notice",
    phaseOrder: 2,
  },

  // Phase 3: Trial Prep
  {
    id: "TRIAL-E",
    label: "Pre-trial exchange & notebook — 30% complete",
    assignedTo: "Paralegal/Legal Asst",
    sla: "6 weeks before trial",
    phase: "trial-prep",
    phaseOrder: 1,
  },
  {
    id: "TRIAL-F",
    label: "Pre-trial exchange & notebook — 60% complete",
    assignedTo: "Paralegal/Legal Asst",
    sla: "4 weeks before trial",
    phase: "trial-prep",
    phaseOrder: 2,
  },
  {
    id: "TRIAL-G",
    label: "Pre-trial exchange & notebook — 100% complete",
    assignedTo: "Paralegal/Legal Asst",
    sla: "3 weeks before trial",
    phase: "trial-prep",
    phaseOrder: 3,
  },
  {
    id: "TRIAL-H",
    label: "Confirm expert availability and testimony fee",
    assignedTo: "Paralegal/Legal Asst",
    sla: "2 weeks before trial",
    phase: "trial-prep",
    phaseOrder: 4,
  },

  // Phase 4: Trial Readiness Verification
  {
    id: "TRIAL-I",
    label: "Confirm with Attorney we are ready for trial",
    assignedTo: "Paralegal/Legal Asst",
    sla: "3 business days before trial",
    phase: "trial-readiness",
    phaseOrder: 1,
  },

  // Phase 3 continued: Trial Prep
  {
    id: "TRIAL-J",
    label: "Pay expert testimony fees",
    assignedTo: "Paralegal/Legal Asst",
    sla: "3 business days before trial",
    phase: "trial-prep",
    phaseOrder: 5,
  },
];

// ── Path stages (consolidated 3 stages for the top-level path bar) ──────

export const TRIAL_PATH_STAGES: PathStage[] = [
  { label: "Notice & Calendar", firstTaskId: "TRIAL-A", lastTaskId: "TRIAL-D" },
  { label: "Trial Preparation", firstTaskId: "TRIAL-E", lastTaskId: "TRIAL-J" },
  { label: "Readiness Verification", firstTaskId: "TRIAL-I", lastTaskId: "TRIAL-I" },
];

export function getTrialTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = trialTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = trialTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return trialTasks.slice(startIdx, endIdx + 1);
}
