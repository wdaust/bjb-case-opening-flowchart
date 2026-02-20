// Treatment Monitoring - Metrics, KPIs, SLA Rules & Escalation Triggers

// ─── Type Definitions ────────────────────────────────────────────────

export interface RAGThreshold {
  green: { min: number; max: number };
  amber: { min: number; max: number };
  red: { min: number; max: number };
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  formula: string;
  target: number;
  unit: string;
  sla: string;
  rag: RAGThreshold;
}

export interface KPI {
  id: string;
  name: string;
  definition: string;
  active: boolean;
}

export interface KPICategory {
  id: string;
  name: string;
  color: string;
  kpis: KPI[];
}

export interface SLARule {
  id: string;
  task: string;
  slaTarget: string;
  escalationTrigger: string;
  escalateTo: string;
}

export interface EscalationTrigger {
  id: string;
  condition: string;
  severity: 'warning' | 'critical';
  action: string;
}

// ─── Weekly Scorecard Metrics (12) ───────────────────────────────────

export const tmMetrics: Metric[] = [
  {
    id: 'tm-metric-001',
    name: 'Contact Attempt Completion Rate',
    description: 'Percentage of required contact attempts completed on schedule.',
    formula: '(Completed attempts / Required attempts) \u00d7 100',
    target: 95,
    unit: '%',
    sla: 'All 9 attempts within prescribed windows',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 75, max: 89 },
      red: { min: 0, max: 74 },
    },
  },
  {
    id: 'tm-metric-002',
    name: 'Client Connection Rate (Live Calls)',
    description: 'Percentage of contact attempts resulting in a live connection with the client.',
    formula: '(Connected calls / Total attempts) \u00d7 100',
    target: 40,
    unit: '%',
    sla: 'Connect within first 3 attempts',
    rag: {
      green: { min: 35, max: 100 },
      amber: { min: 20, max: 34 },
      red: { min: 0, max: 19 },
    },
  },
  {
    id: 'tm-metric-003',
    name: 'MIA Re-entry Rate',
    description: 'Percentage of MIA-routed cases that are successfully re-engaged.',
    formula: '(Re-engaged cases / MIA-routed cases) \u00d7 100',
    target: 80,
    unit: '%',
    sla: 'Re-engage within 14 days of MIA routing',
    rag: {
      green: { min: 75, max: 100 },
      amber: { min: 50, max: 74 },
      red: { min: 0, max: 49 },
    },
  },
  {
    id: 'tm-metric-004',
    name: 'Appointment Completion Rate',
    description: 'Percentage of scheduled treatment monitoring appointments completed.',
    formula: '(Completed appointments / Scheduled appointments) \u00d7 100',
    target: 90,
    unit: '%',
    sla: 'Every 30 days from OA',
    rag: {
      green: { min: 85, max: 100 },
      amber: { min: 70, max: 84 },
      red: { min: 0, max: 69 },
    },
  },
  {
    id: 'tm-metric-005',
    name: 'Treatment Gap Alert Response Time',
    description: 'Average hours to respond to treatment gap alerts after detection.',
    formula: 'Avg(Response time for gap alerts)',
    target: 4,
    unit: 'hours',
    sla: 'Respond within 4 hours of gap detection',
    rag: {
      green: { min: 0, max: 4 },
      amber: { min: 5, max: 8 },
      red: { min: 9, max: 999 },
    },
  },
  {
    id: 'tm-metric-006',
    name: 'Scoring System Completion Rate',
    description: 'Percentage of the 5 scoring systems updated after each client communication.',
    formula: '(Systems scored or "No Change" / 5) \u00d7 100',
    target: 100,
    unit: '%',
    sla: 'Within 1 hour of client communication',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 70, max: 89 },
      red: { min: 0, max: 69 },
    },
  },
  {
    id: 'tm-metric-007',
    name: 'Lien Audit Compliance Rate',
    description: 'Percentage of lien audit letters sent on schedule.',
    formula: '(Timely audits / Required audits) \u00d7 100',
    target: 98,
    unit: '%',
    sla: 'By EOD day 60, repeated every 60 days',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 80, max: 94 },
      red: { min: 0, max: 79 },
    },
  },
  {
    id: 'tm-metric-008',
    name: 'Medical Records Request Timeliness',
    description: 'Percentage of medical bill update requests sent within the prescribed SLA.',
    formula: '(Timely requests / Required requests) \u00d7 100',
    target: 95,
    unit: '%',
    sla: 'By EOD day 90, repeated every 90 days',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 75, max: 89 },
      red: { min: 0, max: 74 },
    },
  },
  {
    id: 'tm-metric-009',
    name: 'Discovery Amendment Turnaround',
    description: 'Average minutes to complete a discovery amendment after initiation.',
    formula: 'Avg(Completion time - Initiation time)',
    target: 30,
    unit: 'min',
    sla: '30 min from initiating task',
    rag: {
      green: { min: 0, max: 30 },
      amber: { min: 31, max: 60 },
      red: { min: 61, max: 999 },
    },
  },
  {
    id: 'tm-metric-010',
    name: 'Task SLA Compliance Rate',
    description: 'Percentage of all 25 tasks completed within their individual SLA targets.',
    formula: '(Tasks within SLA / Total tasks completed) \u00d7 100',
    target: 92,
    unit: '%',
    sla: 'Per individual task SLAs',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 75, max: 89 },
      red: { min: 0, max: 74 },
    },
  },
  {
    id: 'tm-metric-011',
    name: 'Portfolio Touch Rate (30-Day Cycle)',
    description: 'Percentage of active cases contacted within the 30-day contact cycle.',
    formula: '(Cases contacted in 30 days / Active cases) \u00d7 100',
    target: 100,
    unit: '%',
    sla: 'Every 30 days minimum',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 80, max: 94 },
      red: { min: 0, max: 79 },
    },
  },
  {
    id: 'tm-metric-012',
    name: 'Escalation Resolution Time',
    description: 'Average business days to resolve escalated issues.',
    formula: 'Avg(Resolution date - Escalation date)',
    target: 3,
    unit: 'days',
    sla: 'Resolve within 3 business days',
    rag: {
      green: { min: 0, max: 3 },
      amber: { min: 4, max: 7 },
      red: { min: 8, max: 999 },
    },
  },
];

// ─── KPI Library (6 Categories, 26 KPIs) ─────────────────────────────

export const tmKPICategories: KPICategory[] = [
  {
    id: 'kpi-cat-contact',
    name: 'Contact KPIs',
    color: 'teal',
    kpis: [
      {
        id: 'kpi-contact-001',
        name: 'First Contact Speed',
        definition: 'Average time from case assignment to first successful client contact.',
        active: true,
      },
      {
        id: 'kpi-contact-002',
        name: 'Contact Cadence Compliance',
        definition: 'Percentage of cases where the prescribed 9-attempt contact cadence is followed on schedule.',
        active: true,
      },
      {
        id: 'kpi-contact-003',
        name: 'Voicemail/SMS/Email Automation Rate',
        definition: 'Percentage of automated outreach messages (voicemail, SMS, email) delivered successfully.',
        active: true,
      },
      {
        id: 'kpi-contact-004',
        name: 'Letter Delivery Confirmation Rate',
        definition: 'Percentage of mailed contact letters confirmed as delivered to the client address.',
        active: true,
      },
      {
        id: 'kpi-contact-005',
        name: 'MIA Prevention Rate',
        definition: 'Percentage of at-risk cases prevented from entering MIA status through proactive outreach.',
        active: true,
      },
    ],
  },
  {
    id: 'kpi-cat-risk',
    name: 'Risk KPIs',
    color: 'red',
    kpis: [
      {
        id: 'kpi-risk-001',
        name: 'Treatment Gap Frequency',
        definition: 'Average number of treatment gaps exceeding 30 days per active case.',
        active: true,
      },
      {
        id: 'kpi-risk-002',
        name: 'Client Disengagement Score',
        definition: 'Composite score indicating the likelihood that a client will disengage from treatment.',
        active: true,
      },
      {
        id: 'kpi-risk-003',
        name: 'SLA Breach Rate',
        definition: 'Percentage of tasks that exceed their defined SLA target across all case activities.',
        active: true,
      },
      {
        id: 'kpi-risk-004',
        name: 'Escalation Frequency',
        definition: 'Number of escalation events triggered per 100 active cases per week.',
        active: true,
      },
    ],
  },
  {
    id: 'kpi-cat-treatment',
    name: 'Treatment Value KPIs',
    color: 'emerald',
    kpis: [
      {
        id: 'kpi-treatment-001',
        name: 'Treatment Consistency Score',
        definition: 'Measure of how consistently a client attends treatment sessions without gaps.',
        active: true,
      },
      {
        id: 'kpi-treatment-002',
        name: 'Provider Visit Compliance',
        definition: 'Percentage of recommended provider visits actually completed by the client.',
        active: true,
      },
      {
        id: 'kpi-treatment-003',
        name: 'Referral Follow-Through Rate',
        definition: 'Percentage of specialist referrals where the client attends the referred appointment.',
        active: true,
      },
      {
        id: 'kpi-treatment-004',
        name: 'Treatment Documentation Completeness',
        definition: 'Percentage of treatment events that have complete documentation in the case file.',
        active: true,
      },
    ],
  },
  {
    id: 'kpi-cat-depo',
    name: 'Depo Readiness KPIs',
    color: 'blue',
    kpis: [
      {
        id: 'kpi-depo-001',
        name: 'Discovery Response Currency',
        definition: 'Percentage of discovery amendments completed and current as of the latest filing deadline.',
        active: true,
      },
      {
        id: 'kpi-depo-002',
        name: 'Client Prep Completion',
        definition: 'Percentage of deposition-eligible cases where client preparation has been completed.',
        active: true,
      },
      {
        id: 'kpi-depo-003',
        name: 'Document Production Timeliness',
        definition: 'Percentage of document production requests fulfilled within the court-ordered timeframe.',
        active: true,
      },
      {
        id: 'kpi-depo-004',
        name: 'Witness List Currency',
        definition: 'Percentage of active litigation cases with an up-to-date witness list on file.',
        active: true,
      },
    ],
  },
  {
    id: 'kpi-cat-lien',
    name: 'Lien / Medical KPIs',
    color: 'amber',
    kpis: [
      {
        id: 'kpi-lien-001',
        name: 'Lien Identification Accuracy',
        definition: 'Percentage of known liens correctly identified and logged in the case management system.',
        active: true,
      },
      {
        id: 'kpi-lien-002',
        name: 'Medical Bill Currency',
        definition: 'Percentage of cases where medical billing records have been updated within the last 90 days.',
        active: true,
      },
      {
        id: 'kpi-lien-003',
        name: 'Provider Balance Reconciliation Rate',
        definition: 'Percentage of provider balances reconciled against insurance payments and client obligations.',
        active: true,
      },
      {
        id: 'kpi-lien-004',
        name: 'Subrogation Status Tracking',
        definition: 'Percentage of cases with active subrogation claims where status is current within 30 days.',
        active: true,
      },
    ],
  },
  {
    id: 'kpi-cat-ops',
    name: 'Operational KPIs',
    color: 'slate',
    kpis: [
      {
        id: 'kpi-ops-001',
        name: 'Task Throughput Rate',
        definition: 'Average number of tasks completed per paralegal per business day.',
        active: true,
      },
      {
        id: 'kpi-ops-002',
        name: 'Average Handle Time',
        definition: 'Mean time spent per client interaction including call, documentation, and follow-up.',
        active: true,
      },
      {
        id: 'kpi-ops-003',
        name: 'Paralegal Utilization Rate',
        definition: 'Percentage of available paralegal hours spent on billable or case-productive activities.',
        active: true,
      },
      {
        id: 'kpi-ops-004',
        name: 'Case Manager Load Balance',
        definition: 'Standard deviation of active case counts across case managers, measuring workload equity.',
        active: true,
      },
      {
        id: 'kpi-ops-005',
        name: 'Documentation Compliance Rate',
        definition: 'Percentage of case activities with complete and timely documentation per firm standards.',
        active: true,
      },
    ],
  },
];

// ─── SLA Rules (10) ──────────────────────────────────────────────────

export const tmSLARules: SLARule[] = [
  {
    id: 'sla-001',
    task: 'Contact Attempt Cadence',
    slaTarget: 'Complete all 9 contact attempts within prescribed windows',
    escalationTrigger: '2 consecutive missed attempt windows',
    escalateTo: 'Case Manager',
  },
  {
    id: 'sla-002',
    task: 'Treatment Monitoring Appointment',
    slaTarget: 'Schedule and complete every 30 days from OA',
    escalationTrigger: 'No appointment completed within 35 days',
    escalateTo: 'Supervising Attorney',
  },
  {
    id: 'sla-003',
    task: 'Treatment Gap Response',
    slaTarget: 'Respond to gap alert within 4 hours',
    escalationTrigger: 'No response within 6 hours',
    escalateTo: 'Case Manager',
  },
  {
    id: 'sla-004',
    task: 'Scoring System Update',
    slaTarget: 'Update all 5 scoring systems within 1 hour of client communication',
    escalationTrigger: 'Scoring not updated after 2 consecutive communications',
    escalateTo: 'Supervisor',
  },
  {
    id: 'sla-005',
    task: 'Lien Audit Letter',
    slaTarget: 'Send by EOD day 60, repeat every 60 days',
    escalationTrigger: 'Lien audit overdue by 7 or more days',
    escalateTo: 'Case Manager',
  },
  {
    id: 'sla-006',
    task: 'Medical Bill Update Request',
    slaTarget: 'Send by EOD day 90, repeat every 90 days',
    escalationTrigger: 'Request overdue by 10 or more days',
    escalateTo: 'Case Manager',
  },
  {
    id: 'sla-007',
    task: 'Discovery Amendment',
    slaTarget: 'Complete within 30 minutes of initiation',
    escalationTrigger: 'Amendment not completed within 2 hours',
    escalateTo: 'Case Manager',
  },
  {
    id: 'sla-008',
    task: 'MIA Re-engagement',
    slaTarget: 'Re-engage client within 14 days of MIA routing',
    escalationTrigger: 'No re-engagement after 21 days',
    escalateTo: 'Attorney',
  },
  {
    id: 'sla-009',
    task: 'Escalation Resolution',
    slaTarget: 'Resolve within 3 business days',
    escalationTrigger: 'Unresolved after 5 business days',
    escalateTo: 'Managing Attorney',
  },
  {
    id: 'sla-010',
    task: 'Portfolio Contact Cycle',
    slaTarget: 'Contact every active case within 30-day cycle',
    escalationTrigger: 'Case not contacted for 45+ days',
    escalateTo: 'Supervising Attorney',
  },
];

// ─── Escalation Triggers (8) ─────────────────────────────────────────

export const tmEscalationTriggers: EscalationTrigger[] = [
  {
    id: 'esc-001',
    condition: '3 consecutive missed contact attempts',
    severity: 'warning',
    action: 'Notify Case Manager',
  },
  {
    id: 'esc-002',
    condition: 'Client not contacted for 45+ days',
    severity: 'critical',
    action: 'Escalate to Attorney',
  },
  {
    id: 'esc-003',
    condition: 'Treatment gap >30 days detected',
    severity: 'critical',
    action: 'Treatment gap protocol',
  },
  {
    id: 'esc-004',
    condition: 'Scoring not updated after 2 communications',
    severity: 'warning',
    action: 'Notify supervisor',
  },
  {
    id: 'esc-005',
    condition: 'Lien audit overdue by 7+ days',
    severity: 'warning',
    action: 'Send reminder',
  },
  {
    id: 'esc-006',
    condition: 'MIA status >21 days without re-engagement',
    severity: 'critical',
    action: 'Attorney review',
  },
  {
    id: 'esc-007',
    condition: 'SLA compliance <75% for 2 consecutive weeks',
    severity: 'critical',
    action: 'Performance review',
  },
  {
    id: 'esc-008',
    condition: 'Discovery amendment overdue >2 hours',
    severity: 'warning',
    action: 'Notify case manager',
  },
];
