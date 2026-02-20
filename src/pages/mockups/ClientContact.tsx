import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MockupNav } from '../MockupsLanding.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Button } from '../../components/ui/button.tsx';
import {
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  PhoneOff,
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
import { cn } from '../../utils/cn.ts';

// ── Types ──────────────────────────────────────────────────────────────

type TaskStatus = 'pending' | 'active' | 'not-connected' | 'complete' | 'skipped';

interface TimelineTask {
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

const PHASE_STYLES: Record<string, { border: string; bg: string }> = {
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

// ── Task definitions (53 tasks from case-opening.json) ─────────────────

const cp = true; // isContactPursuit shorthand

const TASKS: TimelineTask[] = [
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

// ── Helpers ─────────────────────────────────────────────────────────────

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Component ───────────────────────────────────────────────────────────

export default function ClientContact() {
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(() => {
    const init: Record<string, TaskStatus> = {};
    TASKS.forEach((t) => {
      init[t.id] = t.id === 'A' ? 'active' : 'pending';
    });
    return init;
  });

  const [animatingTaskId, setAnimatingTaskId] = useState<string | null>(null);
  const [animatingTriggers, setAnimatingTriggers] = useState<string[]>([]);
  const [slaStartTime, setSlaStartTime] = useState<number>(Date.now());
  const [countdown, setCountdown] = useState('');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Find current active task
  const activeTask = TASKS.find((t) => statuses[t.id] === 'active');

  // Derived state
  const showPostConnection = statuses['M'] !== 'pending';
  const isMIAEnd = statuses['L'] === 'complete' && statuses['M'] === 'pending';
  const currentSection = !activeTask
    ? isMIAEnd ? 'Case Routed to Intake' : 'All Tasks Complete'
    : activeTask.isContactPursuit ? 'Contact Pursuit' : 'Post-Connection Workflow';

  // Phase progress for sidebar
  const phaseProgress = useMemo(() => {
    const map = new Map<string, { total: number; done: number; color: string }>();
    TASKS.forEach((t) => {
      if (!map.has(t.phase)) {
        map.set(t.phase, { total: 0, done: 0, color: PHASE_STYLES[t.phase]?.bg || 'bg-gray-500' });
      }
      const p = map.get(t.phase)!;
      p.total++;
      if (['complete', 'not-connected', 'skipped'].includes(statuses[t.id])) {
        p.done++;
      }
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [statuses]);

  // SLA countdown timer
  useEffect(() => {
    if (!activeTask) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - slaStartTime;
      const remaining = activeTask.slaDurationMs - elapsed;
      setCountdown(formatCountdown(Math.max(remaining, 0)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, slaStartTime]);

  // ── Handlers ────────────────────────────────────────────────────────

  const handleConnected = useCallback((taskId: string) => {
    setStatuses((prev) => {
      const next = { ...prev, [taskId]: 'complete' as TaskStatus };
      // Skip all remaining contact pursuit tasks
      TASKS.forEach((t) => {
        if (t.isContactPursuit && t.id !== taskId && next[t.id] === 'pending') {
          next[t.id] = 'skipped' as TaskStatus;
        }
      });
      // Activate Orientation Appointment
      next['M'] = 'active';
      return next;
    });
    setSlaStartTime(Date.now());
  }, []);

  const handleNotConnected = useCallback((taskId: string) => {
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return;

    setStatuses((prev) => ({ ...prev, [taskId]: 'not-connected' as TaskStatus }));

    const triggers = task.autoTriggers || [];
    if (triggers.length > 0) {
      setAnimatingTaskId(taskId);
      setAnimatingTriggers(triggers);
      animTimeoutRef.current = setTimeout(() => {
        setAnimatingTriggers([]);
        setAnimatingTaskId(null);
        const idx = TASKS.findIndex((t) => t.id === taskId);
        setStatuses((prev) => {
          const next = { ...prev };
          for (let i = idx + 1; i < TASKS.length; i++) {
            if (next[TASKS[i].id] !== 'skipped') {
              next[TASKS[i].id] = 'active' as TaskStatus;
              break;
            }
          }
          return next;
        });
        setSlaStartTime(Date.now());
      }, 1500);
    } else {
      const idx = TASKS.findIndex((t) => t.id === taskId);
      setStatuses((prev) => {
        const next = { ...prev };
        for (let i = idx + 1; i < TASKS.length; i++) {
          if (next[TASKS[i].id] !== 'skipped') {
            next[TASKS[i].id] = 'active' as TaskStatus;
            break;
          }
        }
        return next;
      });
      setSlaStartTime(Date.now());
    }
  }, []);

  const handleMarkComplete = useCallback((taskId: string) => {
    const idx = TASKS.findIndex((t) => t.id === taskId);
    const isEnd = taskId === 'L';
    setStatuses((prev) => {
      const next = { ...prev, [taskId]: 'complete' as TaskStatus };
      if (!isEnd) {
        for (let i = idx + 1; i < TASKS.length; i++) {
          if (next[TASKS[i].id] !== 'skipped') {
            next[TASKS[i].id] = 'active' as TaskStatus;
            break;
          }
        }
      }
      return next;
    });
    if (!isEnd) setSlaStartTime(Date.now());
  }, []);

  const handleRouteToIntake = useCallback((taskId: string) => {
    const idx = TASKS.findIndex((t) => t.id === taskId);
    setStatuses((prev) => {
      const next = { ...prev, [taskId]: 'complete' as TaskStatus };
      for (let i = idx + 1; i < TASKS.length; i++) {
        if (next[TASKS[i].id] !== 'skipped') {
          next[TASKS[i].id] = 'active' as TaskStatus;
          break;
        }
      }
      return next;
    });
    setSlaStartTime(Date.now());
  }, []);

  // Auto-advance for system automation tasks
  useEffect(() => {
    if (!activeTask?.isAutoAction) return;
    const taskId = activeTask.id;
    const triggers = activeTask.autoTriggers || ['Processing...'];
    setAnimatingTaskId(taskId);
    setAnimatingTriggers(triggers);

    const timeout = setTimeout(() => {
      setAnimatingTriggers([]);
      setAnimatingTaskId(null);
      const idx = TASKS.findIndex((t) => t.id === taskId);
      const isEnd = taskId === 'L';
      setStatuses((prev) => {
        const next = { ...prev, [taskId]: 'complete' as TaskStatus };
        if (!isEnd) {
          for (let i = idx + 1; i < TASKS.length; i++) {
            if (next[TASKS[i].id] !== 'skipped') {
              next[TASKS[i].id] = 'active' as TaskStatus;
              break;
            }
          }
        }
        return next;
      });
      if (!isEnd) setSlaStartTime(Date.now());
    }, 1500);

    return () => clearTimeout(timeout);
  }, [activeTask?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  // Progress
  const completedCount = TASKS.filter((t) =>
    ['complete', 'not-connected', 'skipped'].includes(statuses[t.id])
  ).length;
  const progressPct = Math.round((completedCount / TASKS.length) * 100);

  // Split tasks into sections
  const contactPursuitTasks = TASKS.filter((t) => t.isContactPursuit);
  const postConnectionTasks = TASKS.filter((t) => !t.isContactPursuit);

  // ── Render helpers ──────────────────────────────────────────────────

  function renderTask(task: TimelineTask, idx: number, taskList: TimelineTask[]) {
    const status = statuses[task.id];
    const Icon = task.icon;
    const isComplete = status === 'complete';
    const isActive = status === 'active';
    const isNotConnected = status === 'not-connected';
    const isPending = status === 'pending';
    const isSkipped = status === 'skipped';

    // Phase divider: show when phase changes from previous task
    const prevTask = idx > 0 ? taskList[idx - 1] : null;
    const showPhaseDivider = !prevTask || prevTask.phase !== task.phase;

    return (
      <div key={task.id}>
        {/* Phase divider */}
        {showPhaseDivider && (
          <div className="flex gap-4 mb-2 mt-3">
            <div className="w-10 shrink-0" />
            <div className={cn('flex-1 border-l-4 pl-3 py-1.5 rounded-r bg-card', task.phaseColor)}>
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {task.phase}
              </span>
            </div>
          </div>
        )}

        {/* Task row */}
        <div className={cn('flex gap-4', isSkipped && 'opacity-40')}>
          {/* Vertical timeline line + dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                isComplete && 'border-green-500 bg-green-500 text-white',
                isActive && 'border-blue-500 bg-blue-500/10 text-blue-500 ring-2 ring-blue-500/30',
                isNotConnected && 'border-amber-500 bg-amber-500/10 text-amber-500',
                isSkipped && 'border-border bg-muted text-muted-foreground',
                isPending && 'border-border bg-muted text-muted-foreground'
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            {idx < taskList.length - 1 && (
              <div
                className={cn(
                  'w-0.5 flex-1 min-h-[24px]',
                  isComplete ? 'bg-green-500' : isNotConnected ? 'bg-amber-500' : 'bg-border'
                )}
              />
            )}
          </div>

          {/* Task card */}
          <div
            className={cn(
              'mb-4 flex-1 rounded-lg border p-4 transition-all',
              isActive && 'border-blue-500/50 bg-blue-500/5 shadow-sm',
              isComplete && 'border-green-500/30 bg-green-500/5',
              isNotConnected && 'border-amber-500/30 bg-amber-500/5',
              isSkipped && 'border-border bg-card',
              isPending && 'border-border bg-card opacity-60'
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {task.letter}
                  </span>
                  <h3
                    className={cn(
                      'font-semibold',
                      (isComplete || isSkipped) && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.label}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    SLA: {task.sla}
                  </span>
                  <span>{task.assignedTo}</span>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Attorney badge */}
                {(task.id === 'I' || task.id === 'J') && (
                  <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-[10px]">
                    Attorney
                  </Badge>
                )}
                {/* System Automation badge */}
                {task.isAutoAction && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">
                    System Automation
                  </Badge>
                )}
                {/* Status badges */}
                {isSkipped && (
                  <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/30">
                    Skipped
                  </Badge>
                )}
                {isComplete && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                    Complete
                  </Badge>
                )}
                {isNotConnected && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Not Connected
                  </Badge>
                )}
                {isPending && (
                  <Badge variant="secondary">Pending</Badge>
                )}
                {isActive && !task.isAutoAction && (
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Active
                  </Badge>
                )}
                {isActive && task.isAutoAction && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 animate-pulse">
                    Auto-Processing
                  </Badge>
                )}
              </div>
            </div>

            {/* SLA countdown for active non-auto task */}
            {isActive && !task.isAutoAction && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-mono text-blue-600 font-semibold">{countdown}</span>
                <span className="text-muted-foreground">remaining</span>
              </div>
            )}

            {/* Animated triggers (not-connected auto actions) */}
            {isNotConnected && animatingTaskId === task.id && animatingTriggers.length > 0 && (
              <div className="mt-3 space-y-1">
                {animatingTriggers.map((trigger) => (
                  <div
                    key={trigger}
                    className="animate-pulse flex items-center gap-2 text-sm text-amber-600"
                  >
                    <Send className="h-3 w-3" />
                    {trigger}...
                  </div>
                ))}
              </div>
            )}

            {/* Animated triggers (auto-action processing) */}
            {isActive && task.isAutoAction && animatingTaskId === task.id && animatingTriggers.length > 0 && (
              <div className="mt-3 space-y-1">
                {animatingTriggers.map((trigger) => (
                  <div
                    key={trigger}
                    className="animate-pulse flex items-center gap-2 text-sm text-green-600"
                  >
                    <Send className="h-3 w-3" />
                    {trigger}...
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            {isActive && !task.isAutoAction && (
              <div className="mt-3 flex gap-2">
                {task.isMIA ? (
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => handleRouteToIntake(task.id)}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Route to Intake
                  </Button>
                ) : task.isCall ? (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleConnected(task.id)}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Connected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      onClick={() => handleNotConnected(task.id)}
                    >
                      <PhoneOff className="h-3.5 w-3.5 mr-1" />
                      Not Connected
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleMarkComplete(task.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Mark Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── JSX ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-3">Lit / Case Opening &mdash; Client Contact Pursuit</h1>
        <MockupNav active="client-contact" />
      </div>

      {/* Case header bar */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-xs text-blue-200">Case #</span>
            <p className="font-mono font-bold">2024-0847</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Client</span>
            <p className="font-semibold">Martinez, Roberto &mdash; MVA Rear-End</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Status</span>
            <Badge className="bg-blue-500/30 text-white border-blue-300/40">
              {isMIAEnd ? 'Routed to Intake' : completedCount === TASKS.length ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
          <div>
            <span className="text-xs text-blue-200">Assigned To</span>
            <p className="text-sm">Sarah Chen</p>
          </div>
          <div>
            <span className="text-xs text-blue-200">Date of Loss</span>
            <p className="text-sm">2024-11-15</p>
          </div>
        </div>
      </div>

      {/* Main content: timeline + sidebar */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Timeline */}
        <div className="lg:col-span-3 space-y-0">
          {/* Section 1: Contact Pursuit */}
          <div className="mb-6">
            <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <h2 className="text-lg font-bold text-foreground">Contact Pursuit</h2>
              <p className="text-sm text-muted-foreground">
                8 call attempts &mdash; Connect to proceed to Orientation
              </p>
            </div>
            {contactPursuitTasks.map((task, idx) => renderTask(task, idx, contactPursuitTasks))}
          </div>

          {/* MIA End State Banner */}
          {isMIAEnd && (
            <div className="mb-6 rounded-lg border-2 border-orange-500/50 bg-orange-500/10 p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="font-bold text-orange-600 dark:text-orange-400">Case Routed to Intake</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Client could not be reached after 8 call attempts. Case has been routed back to Intake as MIA and a cut letter has been sent.
              </p>
            </div>
          )}

          {/* Section 2: Post-Connection Workflow */}
          {showPostConnection && (
            <div>
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                <h2 className="text-lg font-bold text-foreground">Post-Connection Workflow</h2>
                <p className="text-sm text-muted-foreground">
                  Orientation through Court Filing Notice
                </p>
              </div>
              {postConnectionTasks.map((task, idx) => renderTask(task, idx, postConnectionTasks))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Current section */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Current Section</h3>
            <p className={cn(
              'text-sm font-medium',
              currentSection === 'Case Routed to Intake' && 'text-orange-500',
              currentSection === 'All Tasks Complete' && 'text-green-500',
              currentSection === 'Contact Pursuit' && 'text-blue-500',
              currentSection === 'Post-Connection Workflow' && 'text-green-600',
            )}>
              {currentSection}
            </p>
          </div>

          {/* Progress card */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Overall Progress</h3>
            <div className="text-3xl font-bold text-foreground">{progressPct}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {completedCount} of {TASKS.length} tasks complete
            </p>
          </div>

          {/* Phase breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Phase Progress</h3>
            <div className="space-y-2.5">
              {phaseProgress.map((phase) => (
                <div key={phase.name} className="flex items-center gap-2">
                  <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', phase.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-muted-foreground truncate">{phase.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        {phase.done}/{phase.total}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', phase.color)}
                        style={{ width: `${phase.total > 0 ? (phase.done / phase.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Status Legend</h3>
            <div className="space-y-2">
              {[
                { color: 'bg-blue-500', label: 'Active' },
                { color: 'bg-green-500', label: 'Complete' },
                { color: 'bg-amber-500', label: 'Not Connected' },
                { color: 'bg-slate-400', label: 'Skipped' },
                { color: 'bg-muted-foreground', label: 'Pending' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Branching logic info */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Branching Logic</h3>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-1 shrink-0" />
                <span><strong>Connected</strong> on any call attempt skips remaining contact tasks and jumps to Orientation</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span><strong>Not Connected</strong> auto-triggers voicemail, SMS, and email before advancing</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500 mt-1 shrink-0" />
                <span><strong>MIA</strong> after all 8 attempts routes case back to Intake and sends a cut letter</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
