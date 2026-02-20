import type { AgendaSection } from "./tmAppointmentData";

export const expertDepoProtocolAgenda: AgendaSection[] = [
  {
    id: "expert-directive",
    order: 1,
    title: "Expert Directive Confirmation",
    purpose:
      "Confirm attorney directive on expert selection and specialties needed.",
    checkItems: [
      { id: "ed-1", label: "Confirm email from Attorney on all experts" },
      {
        id: "ed-2",
        label: "Input Expert 1 info (name, specialty, contact)",
      },
      { id: "ed-3", label: "Input Expert 2 info if applicable" },
      { id: "ed-4", label: "Input Expert 3 info if applicable" },
      {
        id: "ed-5",
        label: "Verify expert specialties match case needs",
      },
    ],
    sampleQuestions: [
      "Confirm the attorney's expert directive email before proceeding with retention.",
      "Ensure each expert's specialty aligns with the injuries documented in the case.",
    ],
    litifyFields: [
      "Expert Name",
      "Expert Specialty",
      "Expert Contact",
      "Attorney Directive Date",
    ],
  },
  {
    id: "initial-contact",
    order: 2,
    title: "Initial Contact — 3 Attempts",
    purpose: "Retain expert within 3 call attempts per SLA timeline.",
    checkItems: [
      { id: "ic-1", label: "Attempt 1 — Call by 10am day 10" },
      { id: "ic-2", label: "Attempt 2 — Call by 1pm day 11" },
      { id: "ic-3", label: "Attempt 3 — Call by 4pm day 11" },
      {
        id: "ic-4",
        label: "Log each attempt outcome (connected/not connected)",
      },
      {
        id: "ic-5",
        label: "If not connected: drop voicemail + SMS + email",
      },
      { id: "ic-6", label: "Confirm fee schedule and form of payment" },
    ],
    sampleQuestions: [
      "Call expert to confirm availability, fee, and form of payment.",
      "If not connected after 3 attempts, escalate to replacement workflow.",
    ],
    litifyFields: ["Attempt Date", "Outcome", "Fee Confirmed", "Payment Method"],
  },
  {
    id: "retention-scheduling",
    order: 3,
    title: "Retention & Scheduling",
    purpose:
      "Finalize expert retention and schedule IME/report appointment.",
    checkItems: [
      { id: "rs-1", label: "Expert retained — mark complete" },
      { id: "rs-2", label: "Schedule IME or report appointment" },
      { id: "rs-3", label: "Input scheduled date in system" },
      { id: "rs-4", label: "Send IME/Report request within 1 hour" },
      {
        id: "rs-5",
        label: "Confirm expert received case materials",
      },
    ],
    sampleQuestions: [
      "Once retained, send the IME/Report request letter with all case documents within 1 hour.",
      "Confirm the expert has all necessary films and records.",
    ],
    litifyFields: [
      "Retention Date",
      "Scheduled Date",
      "IME Request Sent",
      "Materials Confirmed",
    ],
  },
  {
    id: "report-followup",
    order: 4,
    title: "Report Request & Follow-Up — 4 Attempts",
    purpose:
      "Follow up with expert on report delivery within 4 attempts.",
    checkItems: [
      { id: "rf-1", label: "Follow-up 1 — 10 days after retention" },
      { id: "rf-2", label: "Follow-up 2 — 48 hours after attempt 1" },
      { id: "rf-3", label: "Follow-up 3 — 48 hours after attempt 2" },
      { id: "rf-4", label: "Follow-up 4 — 48 hours after attempt 3" },
      {
        id: "rf-5",
        label: "If not responsive after 4 attempts: escalate to replacement",
      },
      { id: "rf-6", label: "Log each follow-up outcome" },
    ],
    sampleQuestions: [
      "Follow up with expert on report status. Confirm expected delivery date.",
      "After 4 failed attempts, notify attorney for replacement decision.",
    ],
    litifyFields: [
      "Follow-up Date",
      "Report Status",
      "Expected Delivery",
      "Escalation Flag",
    ],
  },
  {
    id: "report-upload-review",
    order: 5,
    title: "Report Upload & Review",
    purpose:
      "Upload expert report and ensure attorney review within 7-day SLA.",
    checkItems: [
      { id: "rur-1", label: "Upload report within 1 hour of receipt" },
      { id: "rur-2", label: "System notification sent to Attorney" },
      { id: "rur-3", label: "Attorney review within 7 days" },
      { id: "rur-4", label: "If approved — mark approved" },
      {
        id: "rur-5",
        label: "If not approved — note reasons and route to amendment",
      },
    ],
    sampleQuestions: [
      "Upload triggers automatic notification to the assigned attorney.",
      "Attorney must complete review within 7 calendar days.",
    ],
    litifyFields: [
      "Upload Date",
      "Attorney Review Date",
      "Approval Status",
      "Amendment Notes",
    ],
  },
  {
    id: "amendment-workflow",
    order: 6,
    title: "Amendment Workflow — 3 Attempts",
    purpose:
      "Follow up on amended expert report with 3-attempt cadence.",
    checkItems: [
      {
        id: "aw-1",
        label: "Amendment request sent to expert immediately",
      },
      { id: "aw-2", label: "Follow-up 1 — day 19" },
      { id: "aw-3", label: "Follow-up 2 — same day as attempt 1" },
      { id: "aw-4", label: "Follow-up 3 — same day as attempt 2" },
      { id: "aw-5", label: "Upload amended report within 1 hour" },
      { id: "aw-6", label: "Attorney re-review within 7 days" },
      { id: "aw-7", label: "Admin corrections within 3 hours" },
    ],
    sampleQuestions: [
      "Send amendment request immediately after attorney rejection.",
      "Follow up aggressively — all 3 attempts on day 19.",
    ],
    litifyFields: [
      "Amendment Request Date",
      "Follow-up Dates",
      "Amended Upload Date",
      "Re-review Status",
    ],
  },
  {
    id: "ime-compliance",
    order: 7,
    title: "IME Scheduling & Compliance",
    purpose:
      "Ensure IME scheduling, client notification, and attendance compliance.",
    checkItems: [
      {
        id: "imc-1",
        label: "IME scheduled per court order timeline",
      },
      { id: "imc-2", label: "Client notice sent within 1 hour" },
      {
        id: "imc-3",
        label: "10-day reminder sent (text + voicemail + email)",
      },
      { id: "imc-4", label: "1-day reminder sent (text + email)" },
      { id: "imc-5", label: "Attendance confirmed day-of" },
      {
        id: "imc-6",
        label: "If no-show: alert Attorney immediately",
      },
      {
        id: "imc-7",
        label: "Reschedule within 48 hours if missed",
      },
    ],
    sampleQuestions: [
      "Send IME notice to client within 1 hour of scheduling with expert.",
      "If client misses IME, alert attorney and reschedule within 48 hours.",
    ],
    litifyFields: [
      "IME Date",
      "Client Notice Sent",
      "10-Day Reminder",
      "1-Day Reminder",
      "Attendance Status",
    ],
  },
  {
    id: "client-depo-tracking",
    order: 8,
    title: "Client Deposition Tracking",
    purpose:
      "Track client deposition completion and post-depo admin.",
    checkItems: [
      {
        id: "cdt-1",
        label: "Report depo completed or rescheduled within 1 hour",
      },
      {
        id: "cdt-2",
        label: "Select reason if rescheduled (dropdown)",
      },
      {
        id: "cdt-3",
        label: "Complete post-depo admin within 3 hours",
      },
      { id: "cdt-4", label: "Update case status in Litify" },
      { id: "cdt-5", label: "Note any follow-up actions needed" },
    ],
    sampleQuestions: [
      "Report deposition outcome immediately — whether completed or rescheduled.",
      "Complete all post-deposition administrative tasks within the 3-hour SLA.",
    ],
    litifyFields: [
      "Depo Date",
      "Outcome",
      "Reschedule Reason",
      "Admin Completion Time",
    ],
  },
];
