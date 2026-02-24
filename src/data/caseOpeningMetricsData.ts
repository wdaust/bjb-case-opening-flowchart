// ── Case Opening - Metrics, KPIs, SLA Rules, Escalation Triggers & Pursuit Ladder
// Follows same pattern as tmMetricsData.ts

import type { Metric, KPICategory, SLARule, EscalationTrigger } from './tmMetricsData';

// ── Pursuit Ladder ───────────────────────────────────────────────────────

export interface PursuitStep {
  step: number;
  label: string;
  owner: string;
  sla: string;
  method: 'call' | 'sms' | 'email' | 'letter' | 'attorney-call';
  timing: string;
}

export const caseOpeningPursuitLadder: PursuitStep[] = [
  { step: 1, label: 'Attempt 1', owner: 'Legal Asst/Para', sla: 'Within 24 hours', method: 'call', timing: 'Day 1' },
  { step: 2, label: 'Attempt 2', owner: 'Legal Asst/Para', sla: 'Day 2 by 10am', method: 'call', timing: 'Day 2 AM' },
  { step: 3, label: 'Attempt 3', owner: 'Legal Asst/Para', sla: 'Day 2 by 4pm', method: 'call', timing: 'Day 2 PM' },
  { step: 4, label: 'Intro/Contact Letter', owner: 'System', sla: 'Day 5', method: 'letter', timing: 'Day 5' },
  { step: 5, label: 'Attempt 4', owner: 'Legal Asst/Para', sla: 'Day 11 by 10am', method: 'call', timing: 'Day 11 AM' },
  { step: 6, label: 'Attempt 5', owner: 'Legal Asst/Para', sla: 'Day 12 by 12:30pm', method: 'call', timing: 'Day 12 Midday' },
  { step: 7, label: 'Attempt 6', owner: 'Legal Asst/Para', sla: 'Day 12 by 4pm', method: 'call', timing: 'Day 12 PM' },
  { step: 8, label: 'No Contact Letter', owner: 'System', sla: 'Day 13', method: 'letter', timing: 'Day 13' },
  { step: 9, label: 'Attempt 7', owner: 'Attorney', sla: 'Day 19', method: 'attorney-call', timing: 'Day 19' },
  { step: 10, label: 'Attempt 8', owner: 'Attorney', sla: 'Day 20', method: 'attorney-call', timing: 'Day 20' },
];

// ── Weekly Scorecard Metrics (12) ────────────────────────────────────────

export const caseOpeningMetrics: Metric[] = [
  {
    id: 'co-metric-001',
    name: 'Orientation Completion On-Time',
    description: 'Percentage of new case orientations completed within the target window.',
    formula: '(On-time orientations / Total orientations) × 100',
    target: 85,
    unit: '%',
    sla: 'Complete orientation within 48 hours of assignment',
    rag: {
      green: { min: 85, max: 100 },
      amber: { min: 70, max: 84 },
      red: { min: 0, max: 69 },
    },
  },
  {
    id: 'co-metric-002',
    name: 'Orientation Pursuit Ladder Compliance',
    description: 'Percentage of cases where the prescribed pursuit ladder steps are followed on schedule.',
    formula: '(Compliant cases / Total active cases) × 100',
    target: 95,
    unit: '%',
    sla: 'All 10 pursuit ladder steps within prescribed windows',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 80, max: 94 },
      red: { min: 0, max: 79 },
    },
  },
  {
    id: 'co-metric-003',
    name: 'Time-to-First-Attempt',
    description: 'Average hours from case assignment to first contact attempt.',
    formula: 'Avg(First attempt time - Assignment time)',
    target: 8,
    unit: 'hours',
    sla: 'First attempt within 8 hours of assignment',
    rag: {
      green: { min: 0, max: 8 },
      amber: { min: 9, max: 16 },
      red: { min: 17, max: 999 },
    },
  },
  {
    id: 'co-metric-004',
    name: 'Connect Rate by Attempt 3',
    description: 'Cumulative percentage of clients successfully contacted by the third attempt.',
    formula: '(Connected by attempt 3 / Total cases) × 100',
    target: 85,
    unit: '%',
    sla: 'Cumulative 85% connection by attempt 3',
    rag: {
      green: { min: 85, max: 100 },
      amber: { min: 65, max: 84 },
      red: { min: 0, max: 64 },
    },
  },
  {
    id: 'co-metric-005',
    name: 'No-Contact/MIA Rate',
    description: 'Percentage of cases that exhaust all contact attempts without successful connection.',
    formula: '(MIA cases / Total cases) × 100',
    target: 5,
    unit: '%',
    sla: 'MIA rate below 5% of total portfolio',
    rag: {
      green: { min: 0, max: 5 },
      amber: { min: 6, max: 10 },
      red: { min: 11, max: 100 },
    },
  },
  {
    id: 'co-metric-006',
    name: 'Post-Orientation Automation Success Rate',
    description: 'Percentage of automated tasks (letters, SMS, emails) that complete without manual intervention.',
    formula: '(Successful automations / Total automations) × 100',
    target: 98,
    unit: '%',
    sla: 'Automation success rate above 98%',
    rag: {
      green: { min: 98, max: 100 },
      amber: { min: 90, max: 97 },
      red: { min: 0, max: 89 },
    },
  },
  {
    id: 'co-metric-007',
    name: 'Case Setup Scoring Completion Rate',
    description: 'Percentage of new cases with all 5 scoring systems initialized within the setup window.',
    formula: '(Cases with complete scoring / Total new cases) × 100',
    target: 90,
    unit: '%',
    sla: 'All 5 scoring systems initialized within 72 hours',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 75, max: 89 },
      red: { min: 0, max: 74 },
    },
  },
  {
    id: 'co-metric-008',
    name: 'Data Trust Meter - Required Fields Complete',
    description: 'Percentage of mandatory data fields populated at case setup completion.',
    formula: '(Completed fields / Required fields) × 100',
    target: 95,
    unit: '%',
    sla: 'All required fields populated before stage exit',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 85, max: 94 },
      red: { min: 0, max: 84 },
    },
  },
  {
    id: 'co-metric-009',
    name: 'Complaint Draft On-Time %',
    description: 'Percentage of complaints drafted within the prescribed timeline from case opening.',
    formula: '(On-time drafts / Total complaints due) × 100',
    target: 90,
    unit: '%',
    sla: 'Complaint draft within 14 days of case opening',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 75, max: 89 },
      red: { min: 0, max: 74 },
    },
  },
  {
    id: 'co-metric-010',
    name: 'Service Velocity - Proof by Day 35',
    description: 'Percentage of cases with proof of service filed by day 35 from complaint filing.',
    formula: '(Served by day 35 / Total filed) × 100',
    target: 85,
    unit: '%',
    sla: 'Proof of service by day 35',
    rag: {
      green: { min: 85, max: 100 },
      amber: { min: 70, max: 84 },
      red: { min: 0, max: 69 },
    },
  },
  {
    id: 'co-metric-011',
    name: 'Medical Records Chase Ladder Compliance',
    description: 'Percentage of medical records requests that follow the prescribed chase ladder schedule.',
    formula: '(Compliant chases / Total chases due) × 100',
    target: 95,
    unit: '%',
    sla: 'Chase ladder steps completed on schedule',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 80, max: 94 },
      red: { min: 0, max: 79 },
    },
  },
  {
    id: 'co-metric-012',
    name: 'Risk Discovery Escalation Rate within 24h',
    description: 'Percentage of risk-flagged items escalated within 24 hours of discovery.',
    formula: '(Escalated within 24h / Total risk items) × 100',
    target: 95,
    unit: '%',
    sla: 'Escalate within 24 hours of risk detection',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 85, max: 94 },
      red: { min: 0, max: 84 },
    },
  },
];

// ── KPI Library (6 Categories) ───────────────────────────────────────────

export const caseOpeningKPICategories: KPICategory[] = [
  {
    id: 'co-kpi-cat-orientation',
    name: 'Orientation KPIs',
    color: 'teal',
    kpis: [
      {
        id: 'co-kpi-orient-001',
        name: 'Orientation Scheduling Speed',
        definition: 'Average hours from case assignment to first orientation attempt.',
        active: true,
      },
      {
        id: 'co-kpi-orient-002',
        name: 'Orientation Completion Quality',
        definition: 'Percentage of orientations where all required topics were covered per the checklist.',
        active: true,
      },
      {
        id: 'co-kpi-orient-003',
        name: 'Client Understanding Score',
        definition: 'Average client comprehension rating from post-orientation feedback.',
        active: true,
      },
      {
        id: 'co-kpi-orient-004',
        name: 'Orientation No-Show Rate',
        definition: 'Percentage of scheduled orientations where the client did not attend.',
        active: true,
      },
    ],
  },
  {
    id: 'co-kpi-cat-contact',
    name: 'Contact & Pursuit KPIs',
    color: 'blue',
    kpis: [
      {
        id: 'co-kpi-contact-001',
        name: 'Pursuit Ladder Adherence',
        definition: 'Percentage of pursuit steps executed within their prescribed time window.',
        active: true,
      },
      {
        id: 'co-kpi-contact-002',
        name: 'First-Call Resolution Rate',
        definition: 'Percentage of initial contacts that resolve all immediate questions without callback.',
        active: true,
      },
      {
        id: 'co-kpi-contact-003',
        name: 'Multi-Channel Reach Rate',
        definition: 'Percentage of cases where at least 2 contact channels were utilized in first 48 hours.',
        active: true,
      },
      {
        id: 'co-kpi-contact-004',
        name: 'Attorney Escalation Success',
        definition: 'Percentage of attorney-escalated contacts (steps 9-10) that result in successful connection.',
        active: true,
      },
    ],
  },
  {
    id: 'co-kpi-cat-setup',
    name: 'Case Setup KPIs',
    color: 'emerald',
    kpis: [
      {
        id: 'co-kpi-setup-001',
        name: 'Scoring System Initialization Speed',
        definition: 'Average hours to initialize all 5 scoring systems from case creation.',
        active: true,
      },
      {
        id: 'co-kpi-setup-002',
        name: 'Data Completeness at Handoff',
        definition: 'Percentage of required data fields complete when case moves to next stage.',
        active: true,
      },
      {
        id: 'co-kpi-setup-003',
        name: 'Insurance Verification Timeliness',
        definition: 'Percentage of cases with insurance verified within 72 hours of opening.',
        active: true,
      },
      {
        id: 'co-kpi-setup-004',
        name: 'Conflict Check Completion Rate',
        definition: 'Percentage of cases with conflict check completed within 24 hours.',
        active: true,
      },
    ],
  },
  {
    id: 'co-kpi-cat-filing',
    name: 'Filing & Service KPIs',
    color: 'red',
    kpis: [
      {
        id: 'co-kpi-filing-001',
        name: 'Complaint Filing Velocity',
        definition: 'Average days from case opening to complaint filed with the court.',
        active: true,
      },
      {
        id: 'co-kpi-filing-002',
        name: 'Service Completion Rate by Day 35',
        definition: 'Percentage of filed cases with completed service of process by day 35.',
        active: true,
      },
      {
        id: 'co-kpi-filing-003',
        name: 'Filing Defect Rate',
        definition: 'Percentage of filed complaints returned for deficiencies.',
        active: true,
      },
      {
        id: 'co-kpi-filing-004',
        name: 'Process Server Efficiency',
        definition: 'Average number of service attempts required per case.',
        active: true,
      },
    ],
  },
  {
    id: 'co-kpi-cat-records',
    name: 'Records & Documentation KPIs',
    color: 'amber',
    kpis: [
      {
        id: 'co-kpi-records-001',
        name: 'Initial Records Request Speed',
        definition: 'Average hours from case opening to first medical records request.',
        active: true,
      },
      {
        id: 'co-kpi-records-002',
        name: 'Records Receipt Rate by Day 30',
        definition: 'Percentage of requested records received within 30 days of request.',
        active: true,
      },
      {
        id: 'co-kpi-records-003',
        name: 'Chase Ladder Compliance Rate',
        definition: 'Percentage of overdue records where the chase ladder is followed per protocol.',
        active: true,
      },
      {
        id: 'co-kpi-records-004',
        name: 'Authorization Signature Turnaround',
        definition: 'Average days from authorization request to signed authorization received.',
        active: true,
      },
    ],
  },
  {
    id: 'co-kpi-cat-risk',
    name: 'Risk & Escalation KPIs',
    color: 'slate',
    kpis: [
      {
        id: 'co-kpi-risk-001',
        name: 'Risk Flag Detection Speed',
        definition: 'Average hours from case data entry to risk flag generation.',
        active: true,
      },
      {
        id: 'co-kpi-risk-002',
        name: 'Escalation Response Time',
        definition: 'Average hours from escalation trigger to acknowledged response.',
        active: true,
      },
      {
        id: 'co-kpi-risk-003',
        name: 'SOL Proximity Alert Compliance',
        definition: 'Percentage of cases with SOL <90 days that have active mitigation plans.',
        active: true,
      },
      {
        id: 'co-kpi-risk-004',
        name: 'Coverage Gap Identification Rate',
        definition: 'Percentage of coverage issues identified within first 72 hours of case opening.',
        active: true,
      },
    ],
  },
];

// ── SLA Rules (7) ────────────────────────────────────────────────────────

export const caseOpeningSLARules: SLARule[] = [
  {
    id: 'co-sla-001',
    task: 'First Contact Attempt',
    slaTarget: 'Within 24 hours of case assignment',
    escalationTrigger: 'No attempt within 36 hours',
    escalateTo: 'Case Manager',
  },
  {
    id: 'co-sla-002',
    task: 'Orientation Completion',
    slaTarget: 'Complete within 48 hours of first contact',
    escalationTrigger: 'Not completed within 72 hours',
    escalateTo: 'Supervising Attorney',
  },
  {
    id: 'co-sla-003',
    task: 'Pursuit Ladder Execution',
    slaTarget: 'All 10 steps within prescribed windows',
    escalationTrigger: '2 consecutive missed steps',
    escalateTo: 'Case Manager',
  },
  {
    id: 'co-sla-004',
    task: 'Scoring System Initialization',
    slaTarget: 'All 5 systems initialized within 72 hours',
    escalationTrigger: 'Scoring incomplete after 96 hours',
    escalateTo: 'Supervisor',
  },
  {
    id: 'co-sla-005',
    task: 'Complaint Drafting',
    slaTarget: 'Draft completed within 14 days of case opening',
    escalationTrigger: 'No draft initiated by day 10',
    escalateTo: 'Supervising Attorney',
  },
  {
    id: 'co-sla-006',
    task: 'Service of Process',
    slaTarget: 'Proof of service by day 35 from filing',
    escalationTrigger: 'No service attempt by day 21',
    escalateTo: 'Case Manager',
  },
  {
    id: 'co-sla-007',
    task: 'Medical Records Initial Request',
    slaTarget: 'All initial records requests sent within 5 business days',
    escalationTrigger: 'Requests not sent by day 7',
    escalateTo: 'Case Manager',
  },
];

// ── Escalation Triggers (8) ──────────────────────────────────────────────

export const caseOpeningEscalationTriggers: EscalationTrigger[] = [
  {
    id: 'co-esc-001',
    condition: 'No contact attempt within 36 hours of assignment',
    severity: 'warning',
    action: 'Notify Case Manager for immediate outreach',
  },
  {
    id: 'co-esc-002',
    condition: 'Client not reached after 3 consecutive attempts',
    severity: 'warning',
    action: 'Trigger multi-channel outreach (SMS + email)',
  },
  {
    id: 'co-esc-003',
    condition: 'MIA status reached (all 10 attempts exhausted)',
    severity: 'critical',
    action: 'Attorney review and file disposition decision',
  },
  {
    id: 'co-esc-004',
    condition: 'Scoring systems not initialized within 96 hours',
    severity: 'warning',
    action: 'Notify supervisor for manual completion',
  },
  {
    id: 'co-esc-005',
    condition: 'Complaint draft not started by day 10',
    severity: 'critical',
    action: 'Escalate to supervising attorney',
  },
  {
    id: 'co-esc-006',
    condition: 'Service of process not attempted by day 21',
    severity: 'critical',
    action: 'Expedited service protocol initiated',
  },
  {
    id: 'co-esc-007',
    condition: 'Risk flag detected with SOL <60 days',
    severity: 'critical',
    action: 'Immediate attorney notification and priority filing',
  },
  {
    id: 'co-esc-008',
    condition: 'Required data fields <80% complete at day 7',
    severity: 'warning',
    action: 'Data completion task assigned with 24h deadline',
  },
];
