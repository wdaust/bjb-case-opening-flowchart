// Discovery Phase - Metrics, KPIs, SLA Rules & Escalation Triggers

import type { Metric, KPICategory, SLARule, EscalationTrigger } from './tmMetricsData';

// ─── Weekly Scorecard Metrics (12) ───────────────────────────────────

export const discMetrics: Metric[] = [
  {
    id: 'disc-metric-001',
    name: 'Time to Depo Scheduled (Median Days)',
    description: 'Median number of days from case filing to deposition scheduling.',
    formula: 'Median(Depo scheduled date - Filing date)',
    target: 45,
    unit: 'days',
    sla: 'Schedule deposition within 45 days',
    rag: {
      green: { min: 0, max: 45 },
      amber: { min: 46, max: 60 },
      red: { min: 61, max: 999 },
    },
  },
  {
    id: 'disc-metric-002',
    name: 'Depo Held On First Date %',
    description: 'Percentage of depositions held on the originally scheduled date.',
    formula: '(Depos held on first date / Total depos) × 100',
    target: 85,
    unit: '%',
    sla: 'Hold deposition on originally scheduled date',
    rag: {
      green: { min: 85, max: 100 },
      amber: { min: 75, max: 84 },
      red: { min: 0, max: 74 },
    },
  },
  {
    id: 'disc-metric-003',
    name: 'Client Depo Prep Completed %',
    description: 'Percentage of clients with deposition preparation completed before their deposition date.',
    formula: '(Clients with prep complete / Clients with scheduled depo) × 100',
    target: 90,
    unit: '%',
    sla: 'Complete prep before deposition',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 80, max: 89 },
      red: { min: 0, max: 79 },
    },
  },
  {
    id: 'disc-metric-004',
    name: 'Doc Readiness %',
    description: 'Percentage of cases with all required documents ready 48 hours before deposition.',
    formula: '(Cases with docs ready / Cases with scheduled depo) × 100',
    target: 95,
    unit: '%',
    sla: 'All documents ready 48 hours before depo',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 90, max: 94 },
      red: { min: 0, max: 89 },
    },
  },
  {
    id: 'disc-metric-005',
    name: 'Medical Chronology Current %',
    description: 'Percentage of cases with medical chronology updated within 14 days of deposition.',
    formula: '(Cases with current chronology / Total active cases) × 100',
    target: 95,
    unit: '%',
    sla: 'Updated within 14 days of depo',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 90, max: 94 },
      red: { min: 0, max: 89 },
    },
  },
  {
    id: 'disc-metric-006',
    name: 'Prior History Cleared %',
    description: 'Percentage of cases where prior medical history has been fully reviewed and documented.',
    formula: '(Cases with cleared history / Total active cases) × 100',
    target: 95,
    unit: '%',
    sla: 'Clear prior history before discovery responses',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 90, max: 94 },
      red: { min: 0, max: 89 },
    },
  },
  {
    id: 'disc-metric-007',
    name: 'Surveillance / Social Media Risk Cleared %',
    description: 'Percentage of cases with surveillance and social media risk assessment completed.',
    formula: '(Cases with risk cleared / Total active cases) × 100',
    target: 90,
    unit: '%',
    sla: 'Clear risk before deposition',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 80, max: 89 },
      red: { min: 0, max: 79 },
    },
  },
  {
    id: 'disc-metric-008',
    name: 'Exhibits Set Complete %',
    description: 'Percentage of depositions with a complete exhibit set prepared.',
    formula: '(Cases with complete exhibits / Cases with scheduled depo) × 100',
    target: 95,
    unit: '%',
    sla: 'Complete exhibit set 48 hours before depo',
    rag: {
      green: { min: 95, max: 100 },
      amber: { min: 90, max: 94 },
      red: { min: 0, max: 89 },
    },
  },
  {
    id: 'disc-metric-009',
    name: 'Subpoena / Records Gap Rate',
    description: 'Percentage of cases with outstanding subpoenas or records gaps at time of deposition.',
    formula: '(Cases with gaps / Total cases with scheduled depo) × 100',
    target: 10,
    unit: '%',
    sla: 'Maintain gap rate below 10%',
    rag: {
      green: { min: 0, max: 10 },
      amber: { min: 11, max: 15 },
      red: { min: 16, max: 100 },
    },
  },
  {
    id: 'disc-metric-010',
    name: 'Discovery Response Timeliness %',
    description: 'Percentage of discovery responses served within court-ordered deadlines.',
    formula: '(Timely responses / Total responses due) × 100',
    target: 90,
    unit: '%',
    sla: 'Respond within court-ordered timeframe',
    rag: {
      green: { min: 90, max: 100 },
      amber: { min: 80, max: 89 },
      red: { min: 0, max: 79 },
    },
  },
  {
    id: 'disc-metric-011',
    name: 'Task SLA Compliance Rate %',
    description: 'Percentage of all 26 discovery tasks completed within their individual SLA targets.',
    formula: '(Tasks within SLA / Total tasks completed) × 100',
    target: 85,
    unit: '%',
    sla: 'Per individual task SLAs',
    rag: {
      green: { min: 85, max: 100 },
      amber: { min: 75, max: 84 },
      red: { min: 0, max: 74 },
    },
  },
  {
    id: 'disc-metric-012',
    name: 'Escalation Resolution Time (Hours)',
    description: 'Average hours to resolve escalated discovery issues.',
    formula: 'Avg(Resolution time - Escalation time)',
    target: 24,
    unit: 'hours',
    sla: 'Resolve within 24 hours',
    rag: {
      green: { min: 0, max: 24 },
      amber: { min: 25, max: 48 },
      red: { min: 49, max: 999 },
    },
  },
];

// ─── KPI Library (3 Categories, 16 KPIs) ─────────────────────────────

export const discKPICategories: KPICategory[] = [
  {
    id: 'kpi-cat-legal-asst',
    name: 'Legal Assistant / Paralegal KPIs',
    color: 'blue',
    kpis: [
      {
        id: 'kpi-la-001',
        name: 'Discovery Response Draft Turnaround',
        definition: 'Average days to complete initial draft of discovery responses.',
        active: true,
      },
      {
        id: 'kpi-la-002',
        name: 'Client Contact Attempt Compliance',
        definition: 'Percentage of scheduled contact attempts completed on time.',
        active: true,
      },
      {
        id: 'kpi-la-003',
        name: 'Document Production Timeliness',
        definition: 'Percentage of document productions completed within SLA.',
        active: true,
      },
      {
        id: 'kpi-la-004',
        name: 'Scoring System Update Rate',
        definition: 'Percentage of scoring systems updated within 1 hour of communication.',
        active: true,
      },
      {
        id: 'kpi-la-005',
        name: 'Letter/Notice Processing Speed',
        definition: 'Average hours to process and send required letters.',
        active: true,
      },
      {
        id: 'kpi-la-006',
        name: 'File Organization Completeness',
        definition: 'Percentage of case files meeting organization standards.',
        active: true,
      },
    ],
  },
  {
    id: 'kpi-cat-paralegal',
    name: 'Paralegal KPIs',
    color: 'indigo',
    kpis: [
      {
        id: 'kpi-para-001',
        name: 'Motion to Compel Turnaround',
        definition: 'Average days to draft and file motion to compel.',
        active: true,
      },
      {
        id: 'kpi-para-002',
        name: 'Court Filing Accuracy',
        definition: 'Percentage of court filings accepted without revision.',
        active: true,
      },
      {
        id: 'kpi-para-003',
        name: 'Deposition Exhibit Preparation',
        definition: 'Average hours to prepare complete exhibit set.',
        active: true,
      },
      {
        id: 'kpi-para-004',
        name: 'Records Gap Resolution Rate',
        definition: 'Percentage of records gaps resolved before deposition.',
        active: true,
      },
    ],
  },
  {
    id: 'kpi-cat-attorney',
    name: 'Attorney KPIs',
    color: 'purple',
    kpis: [
      {
        id: 'kpi-atty-001',
        name: 'Discovery Response Review Time',
        definition: 'Average days to review and finalize responses.',
        active: true,
      },
      {
        id: 'kpi-atty-002',
        name: 'Deposition Scheduling Efficiency',
        definition: 'Percentage of depositions scheduled within target timeframe.',
        active: true,
      },
      {
        id: 'kpi-atty-003',
        name: 'Client Prep Session Completion',
        definition: 'Percentage of clients with completed prep sessions.',
        active: true,
      },
      {
        id: 'kpi-atty-004',
        name: 'Motion Success Rate',
        definition: 'Percentage of motions to compel granted.',
        active: true,
      },
      {
        id: 'kpi-atty-005',
        name: 'Discovery Appointment Adherence',
        definition: 'Percentage of appointments conducted within 5 days.',
        active: true,
      },
      {
        id: 'kpi-atty-006',
        name: 'Case Strategy Currency',
        definition: 'Percentage of cases with updated strategy notes within 30 days.',
        active: true,
      },
    ],
  },
];

// ─── SLA Rules (14) ──────────────────────────────────────────────────

export const discSLARules: SLARule[] = [
  // A) Depo Trigger & Scheduling
  {
    id: 'disc-sla-001',
    task: 'Deposition Trigger Identification',
    slaTarget: 'Identify depo trigger within 48 hours of discovery close',
    escalationTrigger: 'Trigger not identified within 72 hours',
    escalateTo: 'Supervising Attorney',
  },
  {
    id: 'disc-sla-002',
    task: 'Deposition Date Scheduling',
    slaTarget: 'Schedule within 14 days of trigger',
    escalationTrigger: 'Not scheduled within 21 days',
    escalateTo: 'Case Manager',
  },
  {
    id: 'disc-sla-003',
    task: 'Deposition Notice Service',
    slaTarget: 'Serve notice 30 days before depo date',
    escalationTrigger: 'Notice not served 25 days before',
    escalateTo: 'Paralegal Supervisor',
  },
  // B) Client Prep + Readiness
  {
    id: 'disc-sla-004',
    task: 'Client Depo Prep Session',
    slaTarget: 'Complete prep 7 days before depo',
    escalationTrigger: 'Prep not started 10 days before',
    escalateTo: 'Attorney',
  },
  {
    id: 'disc-sla-005',
    task: 'Client Do/Don\'t Review',
    slaTarget: 'Review completed 5 days before depo',
    escalationTrigger: 'Review not completed 7 days before',
    escalateTo: 'Attorney',
  },
  {
    id: 'disc-sla-006',
    task: 'Client Confirmation',
    slaTarget: 'Confirm attendance 3 days before depo',
    escalationTrigger: 'No confirmation 5 days before',
    escalateTo: 'Case Manager',
  },
  // C) File & Exhibit Readiness
  {
    id: 'disc-sla-007',
    task: 'Medical Chronology Update',
    slaTarget: 'Current within 14 days of depo',
    escalationTrigger: 'Not updated 21 days before depo',
    escalateTo: 'Paralegal',
  },
  {
    id: 'disc-sla-008',
    task: 'Exhibit Set Preparation',
    slaTarget: 'Complete 48 hours before depo',
    escalationTrigger: 'Incomplete 72 hours before',
    escalateTo: 'Case Manager',
  },
  {
    id: 'disc-sla-009',
    task: 'Records Gap Resolution',
    slaTarget: 'Resolve all gaps 7 days before depo',
    escalationTrigger: 'Gaps remaining 10 days before',
    escalateTo: 'Paralegal Supervisor',
  },
  {
    id: 'disc-sla-010',
    task: 'Prior History Clearance',
    slaTarget: 'Clear prior history before discovery responses',
    escalationTrigger: 'Not cleared at time of response drafting',
    escalateTo: 'Attorney',
  },
  {
    id: 'disc-sla-011',
    task: 'Social Media Risk Assessment',
    slaTarget: 'Complete assessment before depo prep',
    escalationTrigger: 'Assessment not started 14 days before depo',
    escalateTo: 'Case Manager',
  },
  // D) Post-Depo
  {
    id: 'disc-sla-012',
    task: 'Post-Depo Debrief',
    slaTarget: 'Complete debrief within 24 hours of depo',
    escalationTrigger: 'Debrief not completed within 48 hours',
    escalateTo: 'Attorney',
  },
  {
    id: 'disc-sla-013',
    task: 'Transcript Review',
    slaTarget: 'Review transcript within 5 business days of receipt',
    escalationTrigger: 'Not reviewed within 7 business days',
    escalateTo: 'Supervising Attorney',
  },
  {
    id: 'disc-sla-014',
    task: 'Testimony Summary',
    slaTarget: 'Complete summary within 3 business days of transcript',
    escalationTrigger: 'Not completed within 5 business days',
    escalateTo: 'Paralegal Supervisor',
  },
];

// ─── Escalation Triggers (8) ─────────────────────────────────────────

export const discEscalationTriggers: EscalationTrigger[] = [
  {
    id: 'disc-esc-001',
    condition: 'Discovery responses not served within court-ordered timeframe',
    severity: 'critical',
    action: 'Immediate attorney notification + emergency filing',
  },
  {
    id: 'disc-esc-002',
    condition: '6 consecutive failed contact attempts',
    severity: 'critical',
    action: 'Management escalation at day 49',
  },
  {
    id: 'disc-esc-003',
    condition: 'Deposition scheduled with incomplete file',
    severity: 'critical',
    action: 'Emergency file completion protocol',
  },
  {
    id: 'disc-esc-004',
    condition: 'Client not prepped 7 days before deposition',
    severity: 'warning',
    action: 'Attorney scheduling priority override',
  },
  {
    id: 'disc-esc-005',
    condition: 'Motion to compel deadline approaching (5 days)',
    severity: 'warning',
    action: 'Notify paralegal and attorney',
  },
  {
    id: 'disc-esc-006',
    condition: 'Records gaps identified within 14 days of depo',
    severity: 'warning',
    action: 'Emergency subpoena protocol',
  },
  {
    id: 'disc-esc-007',
    condition: 'Social media risk flagged and unresolved',
    severity: 'warning',
    action: 'Attorney risk assessment meeting',
  },
  {
    id: 'disc-esc-008',
    condition: 'Post-depo debrief overdue >48 hours',
    severity: 'warning',
    action: 'Notify supervising attorney',
  },
];

// ─── Depo Readiness Checklist ────────────────────────────────────────

export interface DepoChecklistItem {
  id: string;
  label: string;
  category: 'core' | 'exhibits' | 'risk-flags';
}

export const discDepoChecklist: DepoChecklistItem[] = [
  // Core (7)
  { id: 'depo-core-1', label: 'Depo date/time/location confirmed', category: 'core' },
  { id: 'depo-core-2', label: 'Client confirmation received', category: 'core' },
  { id: 'depo-core-3', label: 'Client Do/Don\'t list acknowledged', category: 'core' },
  { id: 'depo-core-4', label: 'Medical chronology current (\u226414 days)', category: 'core' },
  { id: 'depo-core-5', label: 'Provider list finalized', category: 'core' },
  { id: 'depo-core-6', label: 'Treatment gaps documented', category: 'core' },
  { id: 'depo-core-7', label: 'Prior injuries cleared', category: 'core' },
  // Exhibits (5)
  { id: 'depo-exhibit-1', label: 'Police report + photos/video collected', category: 'exhibits' },
  { id: 'depo-exhibit-2', label: 'Medical records complete', category: 'exhibits' },
  { id: 'depo-exhibit-3', label: 'Wage loss documentation gathered', category: 'exhibits' },
  { id: 'depo-exhibit-4', label: 'Prior imaging status confirmed', category: 'exhibits' },
  { id: 'depo-exhibit-5', label: 'Recorded statements summarized', category: 'exhibits' },
  // Risk Flags (2)
  { id: 'depo-risk-1', label: 'Social media risk cleared/flagged', category: 'risk-flags' },
  { id: 'depo-risk-2', label: 'Prior accident risk cleared/flagged', category: 'risk-flags' },
];
