import {
  Phone,
  Mail,
  CheckCircle2,
  Send,
  AlertTriangle,
  Calendar,
  BarChart3,
  FileText,
  Search,
  Gavel,
  Truck,
  Bell,
  RefreshCw,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'active' | 'not-connected' | 'complete' | 'skipped';

export interface TimelineTask {
  id: string;
  letter: string;
  label: string;
  assignedTo: string;
  sla: string;
  phase: string;
  phaseColor: string;
  icon: React.ComponentType<{ className?: string }>;
  isCall: boolean;
  isAutoAction: boolean;
  isMIA: boolean;
  isContactPursuit: boolean;
  autoTriggers?: string[];
  slaDurationMs: number;
}

// ── Constants ──────────────────────────────────────────────────────────

const H = 3_600_000;
const D = 24 * H;
const MIN = 60_000;

export const PHASE_STYLES: Record<string, { border: string; bg: string }> = {
  'Client Orientation': { border: 'border-blue-600', bg: 'bg-blue-600' },
  'Case Setup': { border: 'border-indigo-900', bg: 'bg-indigo-900' },
  'Automated Doc Request': { border: 'border-green-700', bg: 'bg-green-700' },
  'Doc Request': { border: 'border-orange-700', bg: 'bg-orange-700' },
  'Review': { border: 'border-purple-800', bg: 'bg-purple-800' },
  'Doc Production': { border: 'border-orange-700', bg: 'bg-orange-700' },
  'Approval': { border: 'border-purple-800', bg: 'bg-purple-800' },
  'Filing': { border: 'border-red-800', bg: 'bg-red-800' },
  'Service of Summons & Complaint': { border: 'border-teal-700', bg: 'bg-teal-700' },
  'Court Notice': { border: 'border-slate-700', bg: 'bg-slate-700' },
  'Follow Up': { border: 'border-yellow-600', bg: 'bg-yellow-600' },
  'Supportive Doc Production': { border: 'border-pink-800', bg: 'bg-pink-800' },
  'Court Filing Notice': { border: 'border-slate-700', bg: 'bg-slate-700' },
};

// Ordered list of unique phases for the path bar
export const PHASE_ORDER: string[] = [
  'Client Orientation',
  'Case Setup',
  'Automated Doc Request',
  'Doc Request',
  'Review',
  'Doc Production',
  'Approval',
  'Filing',
  'Service of Summons & Complaint',
  'Court Notice',
  'Follow Up',
  'Supportive Doc Production',
  'Court Filing Notice',
];

// ── Task definitions (53 tasks from case-opening.json) ─────────────────

const cp = true; // isContactPursuit shorthand

export const TASKS: TimelineTask[] = [
  // ── Client Orientation: Contact Pursuit (A–L) ───────────────────────
  { id: 'A', letter: 'A', label: 'Call Attempt 1', assignedTo: 'Legal Asst / Para', sla: '24 hours from being assigned', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 1', 'SMS 1', 'Email 1'], slaDurationMs: D },
  { id: 'B', letter: 'B', label: 'Call Attempt 2', assignedTo: 'Legal Asst / Para', sla: 'By 10am on the second day', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 2', 'SMS 2', 'Email 2'], slaDurationMs: D },
  { id: 'C', letter: 'C', label: 'Call Attempt 3', assignedTo: 'Legal Asst / Para', sla: 'By 4pm on the second day', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 3', 'SMS 3', 'Email 3'], slaDurationMs: 30 * H },
  { id: 'D', letter: 'D', label: 'Send Introduction / Contact Letter', assignedTo: 'System Automation', sla: 'Automation', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Mail, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: cp, autoTriggers: ['Introduction letter sent'], slaDurationMs: 5 * MIN },
  { id: 'E', letter: 'E', label: 'Call Attempt 4', assignedTo: 'Legal Asst / Para', sla: 'Day 11 before 10am', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 4', 'SMS 4', 'Email 4'], slaDurationMs: D },
  { id: 'F', letter: 'F', label: 'Call Attempt 5', assignedTo: 'Legal Asst / Para', sla: 'Day 12 no later than 12:30 noon', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 5', 'SMS 5', 'Email 5'], slaDurationMs: D },
  { id: 'G', letter: 'G', label: 'Call Attempt 6', assignedTo: 'Legal Asst / Para', sla: 'Day 12 no later than 4pm', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 6', 'SMS 6', 'Email 6'], slaDurationMs: D },
  { id: 'H', letter: 'H', label: 'Send No Contact Letter', assignedTo: 'System Automation', sla: 'Automation', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Mail, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: cp, autoTriggers: ['No contact letter sent'], slaDurationMs: 5 * MIN },
  { id: 'I', letter: 'I', label: 'Call Attempt 7', assignedTo: 'Attorney', sla: 'Day 6 from the day the letter is sent', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 7', 'SMS 7', 'Email 7'], slaDurationMs: D },
  { id: 'J', letter: 'J', label: 'Call Attempt 8', assignedTo: 'Attorney', sla: 'Day 7 from the day the letter is sent', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Phone, isCall: true, isAutoAction: false, isMIA: false, isContactPursuit: cp, autoTriggers: ['Voicemail 8', 'SMS 8', 'Email 8'], slaDurationMs: D },
  { id: 'K', letter: 'K', label: 'Back to Intake as MIA', assignedTo: 'System Automation', sla: 'Completion of the day 7 Atty call', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: AlertTriangle, isCall: false, isAutoAction: false, isMIA: true, isContactPursuit: cp, slaDurationMs: D },
  { id: 'L', letter: 'L', label: 'Send Cut Letter', assignedTo: 'System Automation', sla: 'Automation', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Mail, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: cp, autoTriggers: ['Cut letter sent'], slaDurationMs: 5 * MIN },

  // ── Client Orientation: Orientation (M) ──────────────────────────────
  { id: 'M', letter: 'M', label: 'Orientation Appointment', assignedTo: 'Legal Asst / Para', sla: '24 hours from being assigned', phase: 'Client Orientation', phaseColor: PHASE_STYLES['Client Orientation'].border, icon: Calendar, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: D },

  // ── Case Setup (N–R) ────────────────────────────────────────────────
  { id: 'N', letter: 'N', label: 'Client Profile Scoring', assignedTo: 'Legal Asst / Para', sla: '1 hour from SOL approval', phase: 'Case Setup', phaseColor: PHASE_STYLES['Case Setup'].border, icon: BarChart3, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },
  { id: 'O', letter: 'O', label: 'Liability Profile Scoring System', assignedTo: 'Legal Asst / Para', sla: '1 hour from SOL approval', phase: 'Case Setup', phaseColor: PHASE_STYLES['Case Setup'].border, icon: BarChart3, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },
  { id: 'P', letter: 'P', label: 'Policy & Collectability Scoring System', assignedTo: 'Legal Asst / Para', sla: '1 hour from SOL approval', phase: 'Case Setup', phaseColor: PHASE_STYLES['Case Setup'].border, icon: BarChart3, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },
  { id: 'Q', letter: 'Q', label: 'Treatment Strength Index (TSI)', assignedTo: 'Legal Asst / Para', sla: '1 hour from SOL approval', phase: 'Case Setup', phaseColor: PHASE_STYLES['Case Setup'].border, icon: BarChart3, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },
  { id: 'R', letter: 'R', label: 'Comprehensive Case Performance Index (CPI)', assignedTo: 'Legal Asst / Para', sla: '1 hour from SOL approval', phase: 'Case Setup', phaseColor: PHASE_STYLES['Case Setup'].border, icon: BarChart3, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },

  // ── Automated Doc Request (S–X) ─────────────────────────────────────
  { id: 'S', letter: 'S', label: 'Send letter to all medical providers with PIP/health ins info', assignedTo: 'System Automation', sla: 'Automation', phase: 'Automated Doc Request', phaseColor: PHASE_STYLES['Automated Doc Request'].border, icon: Send, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: false, autoTriggers: ['Medical provider letters sent'], slaDurationMs: 5 * MIN },
  { id: 'T', letter: 'T', label: 'Send letter to prior counsel and prior medical providers', assignedTo: 'System Automation', sla: 'Automation', phase: 'Automated Doc Request', phaseColor: PHASE_STYLES['Automated Doc Request'].border, icon: Send, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: false, autoTriggers: ['Prior counsel letters sent'], slaDurationMs: 5 * MIN },
  { id: 'U', letter: 'U', label: 'Request ERISA/Medicaid/Medicare/MVA liens', assignedTo: 'System Automation', sla: 'Automation', phase: 'Automated Doc Request', phaseColor: PHASE_STYLES['Automated Doc Request'].border, icon: Send, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: false, autoTriggers: ['Lien requests sent'], slaDurationMs: 5 * MIN },
  { id: 'V', letter: 'V', label: 'Request PIP No Fault Ledger', assignedTo: 'System Automation', sla: 'Automation', phase: 'Automated Doc Request', phaseColor: PHASE_STYLES['Automated Doc Request'].border, icon: Send, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: false, autoTriggers: ['PIP ledger request sent'], slaDurationMs: 5 * MIN },
  { id: 'W', letter: 'W', label: 'Request Med Pay', assignedTo: 'System Automation', sla: 'Automation', phase: 'Automated Doc Request', phaseColor: PHASE_STYLES['Automated Doc Request'].border, icon: Send, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: false, autoTriggers: ['Med Pay request sent'], slaDurationMs: 5 * MIN },
  { id: 'X', letter: 'X', label: 'Requesting evidence: photos, shoes, out of pocket expenses', assignedTo: 'System Automation', sla: 'Automation', phase: 'Automated Doc Request', phaseColor: PHASE_STYLES['Automated Doc Request'].border, icon: Send, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: false, autoTriggers: ['Evidence request sent'], slaDurationMs: 5 * MIN },

  // ── Doc Request (Y–Z) ───────────────────────────────────────────────
  { id: 'Y', letter: 'Y', label: 'Submission task', assignedTo: 'Legal Asst / Para', sla: '20 min from the completion of the OA', phase: 'Doc Request', phaseColor: PHASE_STYLES['Doc Request'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 20 * MIN },
  { id: 'Z', letter: 'Z', label: 'Request missing medical records, diag films, medical bills', assignedTo: 'Legal Asst / Para', sla: '20 min from the completion of the OA', phase: 'Doc Request', phaseColor: PHASE_STYLES['Doc Request'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 20 * MIN },

  // ── Review (AA) ─────────────────────────────────────────────────────
  { id: 'AA', letter: 'AA', label: 'Review the file to verify all defendants are properly listed', assignedTo: 'Legal Asst / Para', sla: '20 min from the completion of the OA', phase: 'Review', phaseColor: PHASE_STYLES['Review'].border, icon: Search, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 20 * MIN },

  // ── Doc Production (AB) ─────────────────────────────────────────────
  { id: 'AB', letter: 'AB', label: 'Draft complaint', assignedTo: 'Paralegal', sla: '3 days after completion of the OA', phase: 'Doc Production', phaseColor: PHASE_STYLES['Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 3 * D },

  // ── Approval (AC) ───────────────────────────────────────────────────
  { id: 'AC', letter: 'AC', label: 'Approve Complaint', assignedTo: 'Attorney', sla: '6 days after completion of the OA', phase: 'Approval', phaseColor: PHASE_STYLES['Approval'].border, icon: CheckCircle2, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 6 * D },

  // ── Filing (AD) ─────────────────────────────────────────────────────
  { id: 'AD', letter: 'AD', label: 'Filing the complaint', assignedTo: 'Paralegal', sla: '24 business hours from approval', phase: 'Filing', phaseColor: PHASE_STYLES['Filing'].border, icon: Gavel, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: D },

  // ── Service of Summons & Complaint (AE–AF) ──────────────────────────
  { id: 'AE', letter: 'AE', label: 'Service of Summons & Complaint', assignedTo: 'Paralegal', sla: '1 hour from receiving the filed complaint', phase: 'Service of Summons & Complaint', phaseColor: PHASE_STYLES['Service of Summons & Complaint'].border, icon: Truck, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },
  { id: 'AF', letter: 'AF', label: 'Uploading the affidavit of service to the court', assignedTo: 'Paralegal', sla: '1 hour from receiving the affidavit', phase: 'Service of Summons & Complaint', phaseColor: PHASE_STYLES['Service of Summons & Complaint'].border, icon: Truck, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },

  // ── Court Notice (AG) ───────────────────────────────────────────────
  { id: 'AG', letter: 'AG', label: 'Court initial filing notice from the court', assignedTo: 'Paralegal/Legal Asst', sla: '1 business day from notice receipt', phase: 'Court Notice', phaseColor: PHASE_STYLES['Court Notice'].border, icon: Bell, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: D },

  // ── Follow Up (AH–AM) ──────────────────────────────────────────────
  { id: 'AH', letter: 'AH', label: 'Follow Up Request 1', assignedTo: 'Legal Asst / Para', sla: '20 days from the submission request', phase: 'Follow Up', phaseColor: PHASE_STYLES['Follow Up'].border, icon: RefreshCw, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 7 * D },
  { id: 'AI', letter: 'AI', label: 'Follow Up Request 2', assignedTo: 'Legal Asst / Para', sla: '27 days from the submission request', phase: 'Follow Up', phaseColor: PHASE_STYLES['Follow Up'].border, icon: RefreshCw, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 7 * D },
  { id: 'AJ', letter: 'AJ', label: 'Follow Up Request 3', assignedTo: 'Legal Asst / Para', sla: '34 days from the submission request', phase: 'Follow Up', phaseColor: PHASE_STYLES['Follow Up'].border, icon: RefreshCw, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 7 * D },
  { id: 'AK', letter: 'AK', label: 'Call/Chatter Attempt 1', assignedTo: 'Paralegal Manager / Team Lead', sla: '42 days from the submission request', phase: 'Follow Up', phaseColor: PHASE_STYLES['Follow Up'].border, icon: RefreshCw, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 10 * D },
  { id: 'AL', letter: 'AL', label: 'Call/Chatter Attempt 2', assignedTo: 'Paralegal Manager / Team Lead', sla: '52 days from the submission request', phase: 'Follow Up', phaseColor: PHASE_STYLES['Follow Up'].border, icon: RefreshCw, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 10 * D },
  { id: 'AM', letter: 'AM', label: 'Call/Chatter Attempt 3', assignedTo: 'Paralegal Manager / Team Lead', sla: '62 days from the submission request', phase: 'Follow Up', phaseColor: PHASE_STYLES['Follow Up'].border, icon: RefreshCw, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 10 * D },

  // ── Doc Production (AN–AO) ──────────────────────────────────────────
  { id: 'AN', letter: 'AN', label: 'Draft a subpoena for medical records, bills, or films', assignedTo: 'Paralegal', sla: '67 days from the submission request', phase: 'Doc Production', phaseColor: PHASE_STYLES['Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 5 * D },
  { id: 'AO', letter: 'AO', label: 'Uploading proof of service', assignedTo: 'Paralegal', sla: '77 days from the submission request', phase: 'Doc Production', phaseColor: PHASE_STYLES['Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 10 * D },

  // ── Filing (AP) ─────────────────────────────────────────────────────
  { id: 'AP', letter: 'AP', label: 'File a motion to enforce litigants rights', assignedTo: 'Paralegal', sla: '107 days from the submission request', phase: 'Filing', phaseColor: PHASE_STYLES['Filing'].border, icon: Gavel, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 30 * D },

  // ── Doc Production (AQ) ─────────────────────────────────────────────
  { id: 'AQ', letter: 'AQ', label: 'Draft the summons and request service', assignedTo: 'Paralegal', sla: '15 days from OA', phase: 'Doc Production', phaseColor: PHASE_STYLES['Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 15 * D },

  // ── Follow Up (AR) ──────────────────────────────────────────────────
  { id: 'AR', letter: 'AR', label: 'Proof of service', assignedTo: 'Paralegal', sla: '35 days from OA', phase: 'Follow Up', phaseColor: PHASE_STYLES['Follow Up'].border, icon: RefreshCw, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 20 * D },

  // ── Doc Production (AS) ─────────────────────────────────────────────
  { id: 'AS', letter: 'AS', label: 'Resolving non-service', assignedTo: 'Paralegal', sla: '36 days from OA', phase: 'Doc Production', phaseColor: PHASE_STYLES['Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: D },

  // ── Filing (AT–AV) ──────────────────────────────────────────────────
  { id: 'AT', letter: 'AT', label: 'Resolving non-service', assignedTo: 'Paralegal', sla: '56 days from OA', phase: 'Filing', phaseColor: PHASE_STYLES['Filing'].border, icon: Gavel, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 20 * D },
  { id: 'AU', letter: 'AU', label: 'File affidavits of service', assignedTo: 'Paralegal', sla: '40 days from OA', phase: 'Filing', phaseColor: PHASE_STYLES['Filing'].border, icon: Gavel, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 5 * D },
  { id: 'AV', letter: 'AV', label: 'File request to enter default', assignedTo: 'Paralegal', sla: '35 days from date of service', phase: 'Filing', phaseColor: PHASE_STYLES['Filing'].border, icon: Gavel, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 35 * D },

  // ── Automated Doc Request (AW) ──────────────────────────────────────
  { id: 'AW', letter: 'AW', label: 'Sending default request to defendant and insurance carrier', assignedTo: 'System Automation', sla: 'Automation', phase: 'Automated Doc Request', phaseColor: PHASE_STYLES['Automated Doc Request'].border, icon: Send, isCall: false, isAutoAction: true, isMIA: false, isContactPursuit: false, autoTriggers: ['Default request sent to defendant'], slaDurationMs: 5 * MIN },

  // ── Supportive Doc Production (AX–AZ) ───────────────────────────────
  { id: 'AX', letter: 'AX', label: 'Supportive Doc Production 1', assignedTo: 'Legal Asst / Para', sla: '1 hour from Manager approval', phase: 'Supportive Doc Production', phaseColor: PHASE_STYLES['Supportive Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: H },
  { id: 'AY', letter: 'AY', label: 'Supportive Doc Production 2', assignedTo: 'Legal Asst / Para', sla: '3 hours from Manager approval', phase: 'Supportive Doc Production', phaseColor: PHASE_STYLES['Supportive Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 3 * H },
  { id: 'AZ', letter: 'AZ', label: 'Supportive Doc Production 3', assignedTo: 'Legal Asst / Para', sla: '5 hours from Manager approval', phase: 'Supportive Doc Production', phaseColor: PHASE_STYLES['Supportive Doc Production'].border, icon: FileText, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: 5 * H },

  // ── Court Filing Notice (BA) ────────────────────────────────────────
  { id: 'BA', letter: 'BA', label: 'Court filing notice', assignedTo: 'Paralegal/Legal Asst', sla: '1 business day from notice receipt', phase: 'Court Filing Notice', phaseColor: PHASE_STYLES['Court Filing Notice'].border, icon: Bell, isCall: false, isAutoAction: false, isMIA: false, isContactPursuit: false, slaDurationMs: D },
];

// ── Path stages (consolidated 7 stages for the top-level path bar) ──────

export interface PathStage {
  label: string;
  firstTaskId: string;
  lastTaskId: string;
}

export const PATH_STAGES: PathStage[] = [
  { label: 'Contact & Orientation', firstTaskId: 'A', lastTaskId: 'M' },
  { label: 'Case Setup', firstTaskId: 'N', lastTaskId: 'R' },
  { label: 'Doc Requests', firstTaskId: 'S', lastTaskId: 'Z' },
  { label: 'Review & Drafting', firstTaskId: 'AA', lastTaskId: 'AC' },
  { label: 'Filing & Service', firstTaskId: 'AD', lastTaskId: 'AG' },
  { label: 'Follow Up', firstTaskId: 'AH', lastTaskId: 'AV' },
  { label: 'Final Actions', firstTaskId: 'AW', lastTaskId: 'BA' },
];

export function getTasksForStage(stage: PathStage): TimelineTask[] {
  const startIdx = TASKS.findIndex((t) => t.id === stage.firstTaskId);
  const endIdx = TASKS.findIndex((t) => t.id === stage.lastTaskId);
  if (startIdx === -1 || endIdx === -1) return [];
  return TASKS.slice(startIdx, endIdx + 1);
}

// ── Helpers ─────────────────────────────────────────────────────────────

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
