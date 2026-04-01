import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const medRecordsPhases: Phase[] = [
  {
    id: "records-request",
    label: "Records Request",
    color: "blue-700",
    order: 1,
  },
  {
    id: "follow-up",
    label: "Follow Up & Collection",
    color: "amber-700",
    order: 2,
  },
  {
    id: "submission",
    label: "Records Submission",
    color: "green-700",
    order: 3,
  },
  {
    id: "qa-review",
    label: "QA Review",
    color: "rose-700",
    order: 4,
  },
];

export const medRecordsTasks: TrackerTask[] = [
  // Phase 1: Records Request
  {
    id: "MR-A",
    label: "Identify all treating providers from intake questionnaire",
    assignedTo: "Billing Coordinator",
    sla: "1 business day from case assignment",
    phase: "records-request",
    phaseOrder: 1,
  },
  {
    id: "MR-B",
    label: "Send HIPAA-compliant records request to each provider",
    assignedTo: "Billing Coordinator",
    sla: "1 business day from provider ID",
    phase: "records-request",
    phaseOrder: 2,
  },
  {
    id: "MR-C",
    label: "Log all requests in Litify with sent date and provider info",
    assignedTo: "Billing Coordinator",
    sla: "Same day as request sent",
    phase: "records-request",
    phaseOrder: 3,
  },
  {
    id: "MR-D",
    label: "Request billing records from each provider",
    assignedTo: "Billing Coordinator",
    sla: "1 business day from provider ID",
    phase: "records-request",
    phaseOrder: 4,
  },
  {
    id: "MR-E",
    label: "Request radiology/imaging records where applicable",
    assignedTo: "Billing Coordinator",
    sla: "1 business day from provider ID",
    phase: "records-request",
    phaseOrder: 5,
  },
  {
    id: "MR-F",
    label: "Send records request to ER/hospital if applicable",
    assignedTo: "Billing Coordinator",
    sla: "1 business day from provider ID",
    phase: "records-request",
    phaseOrder: 6,
  },

  // Phase 2: Follow Up & Collection
  {
    id: "MR-G",
    label: "14-day follow-up — call provider for records status",
    assignedTo: "Billing Coordinator",
    sla: "14 days from initial request",
    phase: "follow-up",
    phaseOrder: 1,
  },
  {
    id: "MR-H",
    label: "28-day follow-up — escalate outstanding requests",
    assignedTo: "Billing Coordinator",
    sla: "28 days from initial request",
    phase: "follow-up",
    phaseOrder: 2,
  },
  {
    id: "MR-I",
    label: "42-day follow-up — supervisor escalation for non-responsive providers",
    assignedTo: "Med Records Supervisor",
    sla: "42 days from initial request",
    phase: "follow-up",
    phaseOrder: 3,
  },
  {
    id: "MR-J",
    label: "Request updated records for ongoing treatment",
    assignedTo: "Billing Coordinator",
    sla: "Every 60 days during active treatment",
    phase: "follow-up",
    phaseOrder: 4,
  },
  {
    id: "MR-K",
    label: "Confirm receipt and log received records in Litify",
    assignedTo: "Billing Coordinator",
    sla: "Same day as receipt",
    phase: "follow-up",
    phaseOrder: 5,
  },
  {
    id: "MR-L",
    label: "Follow up on outstanding billing records",
    assignedTo: "Billing Coordinator",
    sla: "14 days from billing request",
    phase: "follow-up",
    phaseOrder: 6,
  },
  {
    id: "MR-M",
    label: "Track lien amounts and update lien ledger",
    assignedTo: "Billing Coordinator",
    sla: "Within 2 business days of receipt",
    phase: "follow-up",
    phaseOrder: 7,
  },

  // Phase 3: Records Submission
  {
    id: "MR-N",
    label: "Organize and index all received records by provider and date",
    assignedTo: "Billing Coordinator",
    sla: "2 business days from final receipt",
    phase: "submission",
    phaseOrder: 1,
  },
  {
    id: "MR-O",
    label: "Upload organized records package to matter document folder",
    assignedTo: "Billing Coordinator",
    sla: "Same day as organization complete",
    phase: "submission",
    phaseOrder: 2,
  },
  {
    id: "MR-P",
    label: "Create medical chronology summary",
    assignedTo: "Billing Coordinator",
    sla: "3 business days from organization",
    phase: "submission",
    phaseOrder: 3,
  },
  {
    id: "MR-Q",
    label: "Create billing summary with totals and lien breakdown",
    assignedTo: "Billing Coordinator",
    sla: "2 business days from organization",
    phase: "submission",
    phaseOrder: 4,
  },
  {
    id: "MR-R",
    label: "Notify case team that records package is complete",
    assignedTo: "Billing Coordinator",
    sla: "Same day as upload",
    phase: "submission",
    phaseOrder: 5,
  },
  {
    id: "MR-S",
    label: "Flag any gaps or missing records for case team attention",
    assignedTo: "Billing Coordinator",
    sla: "Same day as upload",
    phase: "submission",
    phaseOrder: 6,
  },

  // Phase 4: QA Review
  {
    id: "MR-T",
    label: "Verify all providers have records and bills on file",
    assignedTo: "Med Records Supervisor",
    sla: "2 business days from submission",
    phase: "qa-review",
    phaseOrder: 1,
  },
  {
    id: "MR-U",
    label: "Cross-reference records against provider list for completeness",
    assignedTo: "Med Records Supervisor",
    sla: "2 business days from submission",
    phase: "qa-review",
    phaseOrder: 2,
  },
  {
    id: "MR-V",
    label: "Verify lien ledger accuracy against billing records",
    assignedTo: "Med Records Supervisor",
    sla: "2 business days from submission",
    phase: "qa-review",
    phaseOrder: 3,
  },
  {
    id: "MR-W",
    label: "Approve records package or return for corrections",
    assignedTo: "Med Records Supervisor",
    sla: "1 business day from review",
    phase: "qa-review",
    phaseOrder: 4,
  },
  {
    id: "MR-X",
    label: "Mark records complete in Litify and update matter status",
    assignedTo: "Med Records Supervisor",
    sla: "Same day as approval",
    phase: "qa-review",
    phaseOrder: 5,
  },
];

// ── Path stages ──────────────────────────────────────────────────────

export const MEDREC_PATH_STAGES: PathStage[] = [
  { label: "Records Request", firstTaskId: "MR-A", lastTaskId: "MR-F" },
  { label: "Follow Up", firstTaskId: "MR-G", lastTaskId: "MR-M" },
  { label: "Submission", firstTaskId: "MR-N", lastTaskId: "MR-S" },
  { label: "QA Review", firstTaskId: "MR-T", lastTaskId: "MR-X" },
];

export function getMedRecordsTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = medRecordsTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = medRecordsTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return medRecordsTasks.slice(startIdx, endIdx + 1);
}
