import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const arbMedPhases: Phase[] = [
  {
    id: "court-notice-client-notice",
    label: "Court Notice & Client Notice",
    color: "amber-700",
    order: 1,
  },
  { id: "case-prep", label: "Case Prep", color: "indigo-700", order: 2 },
  { id: "doc-production", label: "Doc Production", color: "green-700", order: 3 },
  { id: "de-novo", label: "De Novo", color: "rose-700", order: 4 },
  { id: "mediation-prep", label: "Mediation Prep", color: "purple-700", order: 5 },
  {
    id: "mediation-doc-production",
    label: "Mediation Doc Production",
    color: "teal-700",
    order: 6,
  },
];

export const arbMedTasks: TrackerTask[] = [
  // Phase 1: Court Notice & Client Notice
  {
    id: "ARBMED-A",
    label: "Calendar arbitration notice from the court",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from notice receipt",
    phase: "court-notice-client-notice",
    phaseOrder: 1,
  },
  {
    id: "ARBMED-B",
    label: "Arbitration notice to the client (automation)",
    assignedTo: "System Automation",
    sla: "Immediate upon court notice calendared",
    phase: "court-notice-client-notice",
    phaseOrder: 2,
  },

  // Phase 2: Case Prep
  {
    id: "ARBMED-C",
    label: "Confirm all expert reports served, medical bills balance and lien balance",
    assignedTo: "Paralegal/Legal Asst",
    sla: "3 business days from notice",
    phase: "case-prep",
    phaseOrder: 1,
  },
  {
    id: "ARBMED-D",
    label: "Draft arbitration statement",
    assignedTo: "Paralegal/Legal Asst",
    sla: "5 business days from confirmation",
    phase: "case-prep",
    phaseOrder: 2,
  },
  {
    id: "ARBMED-E",
    label: "Attorney review and finalize arbitration statement",
    assignedTo: "Attorney",
    sla: "2 business days from draft",
    phase: "case-prep",
    phaseOrder: 3,
  },

  // Phase 3: Doc Production
  {
    id: "ARBMED-F",
    label: "Compile arbitration packet and send to arbitrator/defense counsel",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from attorney approval",
    phase: "doc-production",
    phaseOrder: 1,
  },

  // Phase 4: De Novo
  {
    id: "ARBMED-G",
    label: "Get De Novo direction from Attorney — Attempt 1",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from arbitration result",
    phase: "de-novo",
    phaseOrder: 1,
  },
  {
    id: "ARBMED-H",
    label: "Get De Novo direction from Attorney — Attempt 2",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day after Attempt 1",
    phase: "de-novo",
    phaseOrder: 2,
  },
  {
    id: "ARBMED-I",
    label: "Get De Novo direction from Attorney — Attempt 3",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day after Attempt 2",
    phase: "de-novo",
    phaseOrder: 3,
  },
  {
    id: "ARBMED-J",
    label: "Escalate to Management for De Novo direction",
    assignedTo: "Manager",
    sla: "Day 7 auto-escalation",
    phase: "de-novo",
    phaseOrder: 4,
  },
  {
    id: "ARBMED-K",
    label: "Attorney provides De Novo direction",
    assignedTo: "Attorney",
    sla: "Day 9 breach deadline",
    phase: "de-novo",
    phaseOrder: 5,
  },
  {
    id: "ARBMED-L",
    label: "Draft and file Demand for Trial De Novo",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from direction",
    phase: "de-novo",
    phaseOrder: 6,
  },

  // Phase 5: Mediation Prep
  {
    id: "ARBMED-M",
    label: "Get mediation prep direction from Attorney",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from De Novo filed",
    phase: "mediation-prep",
    phaseOrder: 1,
  },
  {
    id: "ARBMED-N",
    label: "Calendar mediation date",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from direction",
    phase: "mediation-prep",
    phaseOrder: 2,
  },
  {
    id: "ARBMED-O",
    label: "Mediation notice to the client (automation)",
    assignedTo: "System Automation",
    sla: "Immediate upon mediation calendared",
    phase: "mediation-prep",
    phaseOrder: 3,
  },
  {
    id: "ARBMED-P",
    label: "Draft mediation statement",
    assignedTo: "Paralegal/Legal Asst",
    sla: "5 business days from calendared",
    phase: "mediation-prep",
    phaseOrder: 4,
  },
  {
    id: "ARBMED-Q",
    label: "Attorney review and finalize mediation statement",
    assignedTo: "Attorney",
    sla: "2 business days from draft",
    phase: "mediation-prep",
    phaseOrder: 5,
  },

  // Phase 6: Mediation Doc Production
  {
    id: "ARBMED-R",
    label: "Compile mediation packet and send to mediator",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from attorney approval",
    phase: "mediation-doc-production",
    phaseOrder: 1,
  },
];

// ── Path stages (consolidated 4 stages for the top-level path bar) ──────

export const ARBMED_PATH_STAGES: PathStage[] = [
  { label: "Arbitration Prep", firstTaskId: "ARBMED-A", lastTaskId: "ARBMED-F" },
  { label: "De Novo", firstTaskId: "ARBMED-G", lastTaskId: "ARBMED-L" },
  { label: "Mediation Prep", firstTaskId: "ARBMED-M", lastTaskId: "ARBMED-Q" },
  { label: "Mediation Submission", firstTaskId: "ARBMED-R", lastTaskId: "ARBMED-R" },
];

export function getArbMedTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = arbMedTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = arbMedTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return arbMedTasks.slice(startIdx, endIdx + 1);
}
