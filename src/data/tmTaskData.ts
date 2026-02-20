import type { Phase, TrackerTask } from "./taskTrackerData";
import type { PathStage } from "./caseOpeningContactData";
export type { PathStage };

export const tmPhases: Phase[] = [
  { id: "client-contact", label: "Client Contact", color: "teal", order: 1 },
  {
    id: "appointment",
    label: "Appointment Protocol",
    color: "teal",
    order: 2,
  },
  {
    id: "case-setup",
    label: "Case Setup / Scoring",
    color: "indigo",
    order: 3,
  },
  { id: "liens-audit", label: "Liens Audit", color: "amber", order: 4 },
  { id: "medical-bills", label: "Medical Bills", color: "orange", order: 5 },
  { id: "discovery", label: "Discovery", color: "blue", order: 6 },
  {
    id: "admin-doc",
    label: "Admin & Doc Production",
    color: "slate",
    order: 7,
  },
];

export const tmTasks: TrackerTask[] = [
  // Phase 1: Client Contact (A-L)
  {
    id: "TM-A",
    label: "Call Attempt 1",
    assignedTo: "Legal Asst / Para",
    sla: "By 10am on day 30 from OA",
    phase: "client-contact",
    phaseOrder: 1,
  },
  {
    id: "TM-B",
    label: "Call Attempt 2",
    assignedTo: "Legal Asst / Para",
    sla: "By 10am on day 31 from OA",
    phase: "client-contact",
    phaseOrder: 2,
  },
  {
    id: "TM-C",
    label: "Call Attempt 3",
    assignedTo: "Legal Asst / Para",
    sla: "By 4pm on day 32 from OA",
    phase: "client-contact",
    phaseOrder: 3,
  },
  {
    id: "TM-D",
    label: "Send Contact Letter 1",
    assignedTo: "System Automation",
    sla: "33rd day from OA",
    phase: "client-contact",
    phaseOrder: 4,
  },
  {
    id: "TM-E",
    label: "Call Attempt 4",
    assignedTo: "Legal Asst / Para",
    sla: "By 10am on day 37 from OA",
    phase: "client-contact",
    phaseOrder: 5,
  },
  {
    id: "TM-F",
    label: "Call Attempt 5",
    assignedTo: "Legal Asst / Para",
    sla: "By 4pm on day 37 from OA",
    phase: "client-contact",
    phaseOrder: 6,
  },
  {
    id: "TM-G",
    label: "Call Attempt 6",
    assignedTo: "Legal Asst / Para",
    sla: "By 10am on day 38 from OA",
    phase: "client-contact",
    phaseOrder: 7,
  },
  {
    id: "TM-H",
    label: "Send Contact Letter 2",
    assignedTo: "System Automation",
    sla: "By EOD on day 38 from OA",
    phase: "client-contact",
    phaseOrder: 8,
  },
  {
    id: "TM-I",
    label: "Call Attempt 7",
    assignedTo: "Legal Asst / Para",
    sla: "By 10am on day 37 from OA",
    phase: "client-contact",
    phaseOrder: 9,
  },
  {
    id: "TM-J",
    label: "Call Attempt 8",
    assignedTo: "Legal Asst / Para",
    sla: "By 4pm on day 37 from OA",
    phase: "client-contact",
    phaseOrder: 10,
  },
  {
    id: "TM-K",
    label: "Call Attempt 9",
    assignedTo: "Legal Asst / Para",
    sla: "By 10am on day 38 from OA",
    phase: "client-contact",
    phaseOrder: 11,
  },
  {
    id: "TM-L",
    label: "Back to Intake as MIA",
    assignedTo: "System Automation",
    sla: "By EOD on day 38 from OA",
    phase: "client-contact",
    phaseOrder: 12,
  },

  // Phase 2: Appointment Protocol (M)
  {
    id: "TM-M",
    label: "Treatment Monitoring Appointment",
    assignedTo: "Legal Asst / Para",
    sla: "Every 30 days from OA",
    phase: "appointment",
    phaseOrder: 1,
  },

  // Phase 3: Case Setup / Scoring (N-R)
  {
    id: "TM-N",
    label: "Client Profile Scoring",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 1,
  },
  {
    id: "TM-O",
    label: "Liability Profile Scoring",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 2,
  },
  {
    id: "TM-P",
    label: "Policy & Collectability Scoring",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 3,
  },
  {
    id: "TM-Q",
    label: "Treatment Strength Index",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 4,
  },
  {
    id: "TM-R",
    label: "Case Performance Index",
    assignedTo: "Legal Asst / Para",
    sla: "1 hour from client communication",
    phase: "case-setup",
    phaseOrder: 5,
  },

  // Phase 4: Liens Audit (S)
  {
    id: "TM-S",
    label: "Medicare/VA/ERISA Liens Audit",
    assignedTo: "System Automation",
    sla: "By EOD day 60 from OA (every 60 days)",
    phase: "liens-audit",
    phaseOrder: 1,
  },

  // Phase 5: Medical Bills (T)
  {
    id: "TM-T",
    label: "Updated Medical Bills Request",
    assignedTo: "System Automation",
    sla: "By EOD day 90 from OA (every 90 days)",
    phase: "medical-bills",
    phaseOrder: 1,
  },

  // Phase 6: Discovery (U)
  {
    id: "TM-U",
    label: "Amend Discovery Responses",
    assignedTo: "Legal Asst / Para",
    sla: "30 min from initiating",
    phase: "discovery",
    phaseOrder: 1,
  },

  // Phase 7: Admin & Doc Production (V-Y)
  {
    id: "TM-V",
    label: "Supportive Admin Task 1",
    assignedTo: "Legal Asst / Para",
    sla: "30 min from initiating",
    phase: "admin-doc",
    phaseOrder: 1,
  },
  {
    id: "TM-W",
    label: "Supportive Doc Production 1",
    assignedTo: "Legal Asst / Para",
    sla: "4 hours from Manager approval",
    phase: "admin-doc",
    phaseOrder: 2,
  },
  {
    id: "TM-X",
    label: "Supportive Doc Production 2",
    assignedTo: "Legal Asst / Para",
    sla: "8 hours from Manager approval",
    phase: "admin-doc",
    phaseOrder: 3,
  },
  {
    id: "TM-Y",
    label: "Supportive Doc Production 3",
    assignedTo: "Legal Asst / Para",
    sla: "2 days from Manager approval",
    phase: "admin-doc",
    phaseOrder: 4,
  },
];

// ── Path stages (consolidated 5 stages for the top-level path bar) ──────

export const TM_PATH_STAGES: PathStage[] = [
  { label: "Client Contact", firstTaskId: "TM-A", lastTaskId: "TM-L" },
  { label: "Appointment", firstTaskId: "TM-M", lastTaskId: "TM-M" },
  { label: "Scoring & Setup", firstTaskId: "TM-N", lastTaskId: "TM-R" },
  { label: "Liens & Bills", firstTaskId: "TM-S", lastTaskId: "TM-T" },
  { label: "Discovery & Admin", firstTaskId: "TM-U", lastTaskId: "TM-Y" },
];

export function getTmTasksForStage(stage: PathStage): TrackerTask[] {
  const startIdx = tmTasks.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = tmTasks.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return tmTasks.slice(startIdx, endIdx + 1);
}
