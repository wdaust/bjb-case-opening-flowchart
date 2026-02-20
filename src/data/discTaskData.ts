import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const discPhases: Phase[] = [
  { id: "discovery", label: "Discovery", color: "blue-800", order: 1 },
  {
    id: "client-discovery-appt",
    label: "Client Discovery Appt",
    color: "blue-700",
    order: 2,
  },
  {
    id: "client-orientation",
    label: "Client Orientation",
    color: "blue-500",
    order: 3,
  },
  {
    id: "management-escalation",
    label: "Management Escalation",
    color: "red-700",
    order: 4,
  },
  { id: "case-setup", label: "Case Setup", color: "indigo-900", order: 5 },
  { id: "approval", label: "Approval", color: "purple-700", order: 6 },
  {
    id: "supportive-doc-production",
    label: "Supportive Doc Production",
    color: "pink-700",
    order: 7,
  },
  {
    id: "court-filing-notice",
    label: "Court Filing Notice",
    color: "slate-700",
    order: 8,
  },
];

export const discTasks: TrackerTask[] = [
  // Phase 1: Discovery
  {
    id: "DISC-A",
    label: "Draft Plaintiff's Discovery Responses",
    assignedTo: "Legal Asst / Para",
    sla: "30 days from complaint filed",
    phase: "discovery",
    phaseOrder: 1,
  },

  // Phase 2: Client Discovery Appt (B-D, F-H, K)
  {
    id: "DISC-B",
    label: "Call Discovery Appt Attempt 1",
    assignedTo: "Legal Asst / Para",
    sla: "10am on day 31 from complaint filed",
    phase: "client-discovery-appt",
    phaseOrder: 1,
  },
  {
    id: "DISC-C",
    label: "Call Discovery Appt Attempt 2",
    assignedTo: "Legal Asst / Para",
    sla: "1pm on day 32 from complaint filed",
    phase: "client-discovery-appt",
    phaseOrder: 2,
  },
  {
    id: "DISC-D",
    label: "Call Discovery Appt Attempt 3",
    assignedTo: "Legal Asst / Para",
    sla: "4pm on day 33 from complaint filed",
    phase: "client-discovery-appt",
    phaseOrder: 3,
  },

  // Phase 3: Client Orientation (E)
  {
    id: "DISC-E",
    label: "Send Discovery Appointment / Contact Letter",
    assignedTo: "System Automation",
    sla: "Automation (day 16)",
    phase: "client-orientation",
    phaseOrder: 1,
  },

  // Phase 2: Client Discovery Appt (F-H)
  {
    id: "DISC-F",
    label: "Call Discovery Appt Attempt 4",
    assignedTo: "Legal Asst / Para",
    sla: "10am on day 45 from complaint filed",
    phase: "client-discovery-appt",
    phaseOrder: 4,
  },
  {
    id: "DISC-G",
    label: "Call Discovery Appt Attempt 5",
    assignedTo: "Legal Asst / Para",
    sla: "1pm on day 46 from complaint filed",
    phase: "client-discovery-appt",
    phaseOrder: 5,
  },
  {
    id: "DISC-H",
    label: "Call Discovery Appt Attempt 6",
    assignedTo: "Legal Asst / Para",
    sla: "4pm on day 47 from complaint filed",
    phase: "client-discovery-appt",
    phaseOrder: 6,
  },

  // Phase 3: Client Orientation (I)
  {
    id: "DISC-I",
    label: "Send Discovery Appointment / Contact Letter 2",
    assignedTo: "System Automation",
    sla: "Automation (day 47)",
    phase: "client-orientation",
    phaseOrder: 2,
  },

  // Phase 4: Management Escalation (J)
  {
    id: "DISC-J",
    label: "Management Escalation",
    assignedTo: "System Automation",
    sla: "Day 49 from complaint filed",
    phase: "management-escalation",
    phaseOrder: 1,
  },

  // Phase 2: Client Discovery Appt (K)
  {
    id: "DISC-K",
    label: "Attorney Discovery Appointment",
    assignedTo: "Attorney",
    sla: "\u22645 days from client conversation",
    phase: "client-discovery-appt",
    phaseOrder: 7,
  },

  // Phase 5: Case Setup (L-P)
  {
    id: "DISC-L",
    label: "Client Profile Scoring",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 1,
  },
  {
    id: "DISC-M",
    label: "Liability Profile Scoring",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 2,
  },
  {
    id: "DISC-N",
    label: "Policy & Collectability Scoring",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 3,
  },
  {
    id: "DISC-O",
    label: "Treatment Strength Index (TSI)",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 4,
  },
  {
    id: "DISC-P",
    label: "Comprehensive Case Performance Index",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 5,
  },

  // Phase 1: Discovery (Q)
  {
    id: "DISC-Q",
    label: "Finalize Discovery Responses",
    assignedTo: "Attorney",
    sla: "2 days after appointment",
    phase: "discovery",
    phaseOrder: 2,
  },

  // Phase 6: Approval (R)
  {
    id: "DISC-R",
    label: "Approve Discovery Responses",
    assignedTo: "Attorney",
    sla: "6 days after discovery appt",
    phase: "approval",
    phaseOrder: 1,
  },

  // Phase 1: Discovery (S-V)
  {
    id: "DISC-S",
    label: "Serve upon Defense Counsel",
    assignedTo: "Paralegal/Legal Asst",
    sla: "10 days after answer filed",
    phase: "discovery",
    phaseOrder: 3,
  },
  {
    id: "DISC-T",
    label: "10 Day Good Faith Letter",
    assignedTo: "System Automation",
    sla: "60 days after answer filed",
    phase: "discovery",
    phaseOrder: 4,
  },
  {
    id: "DISC-U",
    label: "Draft Motion to Compel",
    assignedTo: "Paralegal",
    sla: "70 days after answer filed",
    phase: "discovery",
    phaseOrder: 5,
  },
  {
    id: "DISC-V",
    label: "Report Motion Outcome",
    assignedTo: "Paralegal",
    sla: "3 hours from receiving order",
    phase: "discovery",
    phaseOrder: 6,
  },

  // Phase 7: Supportive Doc Production (W-Y)
  {
    id: "DISC-W",
    label: "Supportive Doc Production 1",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from Manager approval",
    phase: "supportive-doc-production",
    phaseOrder: 1,
  },
  {
    id: "DISC-X",
    label: "Supportive Doc Production 2",
    assignedTo: "Legal Asst / Para",
    sla: "3 hours from Manager approval",
    phase: "supportive-doc-production",
    phaseOrder: 2,
  },
  {
    id: "DISC-Y",
    label: "Supportive Doc Production 3",
    assignedTo: "Legal Asst / Para",
    sla: "5 hours from Manager approval",
    phase: "supportive-doc-production",
    phaseOrder: 3,
  },

  // Phase 8: Court Filing Notice (Z)
  {
    id: "DISC-Z",
    label: "Court Discovery End Date Reminder Notice",
    assignedTo: "Paralegal/Legal Asst",
    sla: "1 business day from notice",
    phase: "court-filing-notice",
    phaseOrder: 1,
  },
];

// ── Path stages (consolidated 5 stages for the top-level path bar) ──────

export const DISC_PATH_STAGES: PathStage[] = [
  { label: "Discovery Prep", firstTaskId: "DISC-A", lastTaskId: "DISC-A" },
  { label: "Client Pursuit", firstTaskId: "DISC-B", lastTaskId: "DISC-K" },
  { label: "Scoring & Setup", firstTaskId: "DISC-L", lastTaskId: "DISC-P" },
  { label: "Approval & Docs", firstTaskId: "DISC-Q", lastTaskId: "DISC-Y" },
  { label: "Court Filing", firstTaskId: "DISC-Z", lastTaskId: "DISC-Z" },
];

export function getDiscTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = discTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = discTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return discTasks.slice(startIdx, endIdx + 1);
}
