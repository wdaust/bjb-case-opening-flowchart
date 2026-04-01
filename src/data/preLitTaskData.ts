import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const preLitPhases: Phase[] = [
  {
    id: "client-orientation",
    label: "Client Orientation",
    color: "blue-700",
    order: 1,
  },
  {
    id: "case-setup",
    label: "Case Setup & Documentation",
    color: "indigo-700",
    order: 2,
  },
  {
    id: "evidence-collection",
    label: "Evidence Collection",
    color: "green-700",
    order: 3,
  },
  {
    id: "insurance-pursuit",
    label: "Insurance Pursuit",
    color: "amber-700",
    order: 4,
  },
  {
    id: "treatment-monitoring",
    label: "Treatment Monitoring",
    color: "teal-700",
    order: 5,
  },
  {
    id: "value-development",
    label: "Value Development",
    color: "purple-700",
    order: 6,
  },
  {
    id: "demand-readiness",
    label: "Demand Readiness",
    color: "rose-700",
    order: 7,
  },
];

export const preLitTasks: TrackerTask[] = [
  // Phase 1: Client Orientation
  {
    id: "PL-A",
    label: "Welcome call to client — introduce CM and set expectations",
    assignedTo: "Case Manager",
    sla: "Within 24 hours of case assignment",
    phase: "client-orientation",
    phaseOrder: 1,
  },
  {
    id: "PL-B",
    label: "Send welcome packet with portal access and treatment instructions",
    assignedTo: "Case Manager",
    sla: "Within 24 hours of case assignment",
    phase: "client-orientation",
    phaseOrder: 2,
  },
  {
    id: "PL-C",
    label: "Confirm client contact preferences and emergency contacts",
    assignedTo: "Case Manager",
    sla: "During welcome call",
    phase: "client-orientation",
    phaseOrder: 3,
  },

  // Phase 2: Case Setup & Documentation
  {
    id: "PL-D",
    label: "Create case file with all intake documents and signed agreements",
    assignedTo: "Case Manager",
    sla: "1 business day from assignment",
    phase: "case-setup",
    phaseOrder: 1,
  },
  {
    id: "PL-E",
    label: "File police report, photos, and initial evidence in matter",
    assignedTo: "Case Manager",
    sla: "2 business days from assignment",
    phase: "case-setup",
    phaseOrder: 2,
  },
  {
    id: "PL-F",
    label: "Open PIP/MedPay claim with client's carrier",
    assignedTo: "Case Manager",
    sla: "2 business days from assignment",
    phase: "case-setup",
    phaseOrder: 3,
  },

  // Phase 3: Evidence Collection
  {
    id: "PL-G",
    label: "Order police report if not already obtained",
    assignedTo: "Case Manager",
    sla: "2 business days from assignment",
    phase: "evidence-collection",
    phaseOrder: 1,
  },
  {
    id: "PL-H",
    label: "Request accident scene photos and dashcam footage",
    assignedTo: "Case Manager",
    sla: "3 business days from assignment",
    phase: "evidence-collection",
    phaseOrder: 2,
  },
  {
    id: "PL-I",
    label: "Obtain property damage estimate and vehicle photos",
    assignedTo: "Case Manager",
    sla: "5 business days from assignment",
    phase: "evidence-collection",
    phaseOrder: 3,
  },

  // Phase 4: Insurance Pursuit
  {
    id: "PL-J",
    label: "Send Letter of Representation to at-fault carrier",
    assignedTo: "Case Manager",
    sla: "2 business days from assignment",
    phase: "insurance-pursuit",
    phaseOrder: 1,
  },
  {
    id: "PL-K",
    label: "Request policy limits disclosure from at-fault carrier",
    assignedTo: "Case Manager",
    sla: "3 business days from LOR sent",
    phase: "insurance-pursuit",
    phaseOrder: 2,
  },
  {
    id: "PL-L",
    label: "Confirm UM/UIM coverage from client's policy declarations",
    assignedTo: "Case Manager",
    sla: "5 business days from assignment",
    phase: "insurance-pursuit",
    phaseOrder: 3,
  },

  // Phase 5: Treatment Monitoring
  {
    id: "PL-M",
    label: "Schedule initial treatment appointment with provider",
    assignedTo: "Case Manager",
    sla: "Within 48 hours of case setup",
    phase: "treatment-monitoring",
    phaseOrder: 1,
  },
  {
    id: "PL-N",
    label: "Bi-weekly client check-in — treatment compliance and status",
    assignedTo: "Case Manager",
    sla: "Every 14 days during active treatment",
    phase: "treatment-monitoring",
    phaseOrder: 2,
  },
  {
    id: "PL-O",
    label: "Monthly treatment progress review with case team",
    assignedTo: "Case Manager",
    sla: "Every 30 days during active treatment",
    phase: "treatment-monitoring",
    phaseOrder: 3,
  },
  {
    id: "PL-P",
    label: "Confirm MMI status or treatment completion with provider",
    assignedTo: "Case Manager",
    sla: "Upon provider notification",
    phase: "treatment-monitoring",
    phaseOrder: 4,
  },

  // Phase 6: Value Development
  {
    id: "PL-Q",
    label: "Order and review medical narrative report from treating physician",
    assignedTo: "Case Manager",
    sla: "Within 14 days of treatment completion",
    phase: "value-development",
    phaseOrder: 1,
  },
  {
    id: "PL-R",
    label: "Compile lost wages documentation and employer verification",
    assignedTo: "Case Manager",
    sla: "Within 14 days of treatment completion",
    phase: "value-development",
    phaseOrder: 2,
  },
  {
    id: "PL-S",
    label: "Document impact on daily living and quality of life",
    assignedTo: "Case Manager",
    sla: "Within 14 days of treatment completion",
    phase: "value-development",
    phaseOrder: 3,
  },

  // Phase 7: Demand Readiness
  {
    id: "PL-T",
    label: "Confirm all records, bills, and evidence are complete",
    assignedTo: "Case Manager",
    sla: "5 business days from value dev completion",
    phase: "demand-readiness",
    phaseOrder: 1,
  },
  {
    id: "PL-U",
    label: "Complete demand readiness checklist and submit to Claims",
    assignedTo: "Case Manager",
    sla: "2 business days from confirmation",
    phase: "demand-readiness",
    phaseOrder: 2,
  },
  {
    id: "PL-V",
    label: "Transfer case to Claims department with complete file",
    assignedTo: "Case Manager",
    sla: "1 business day from checklist approval",
    phase: "demand-readiness",
    phaseOrder: 3,
  },
];

// ── Path stages ──────────────────────────────────────────────────────

export const PRELIT_PATH_STAGES: PathStage[] = [
  { label: "Client Orientation", firstTaskId: "PL-A", lastTaskId: "PL-C" },
  { label: "Case Setup & Evidence", firstTaskId: "PL-D", lastTaskId: "PL-I" },
  { label: "Insurance & Treatment", firstTaskId: "PL-J", lastTaskId: "PL-P" },
  { label: "Value Dev & Demand Readiness", firstTaskId: "PL-Q", lastTaskId: "PL-V" },
];

export function getPreLitTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = preLitTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = preLitTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return preLitTasks.slice(startIdx, endIdx + 1);
}
