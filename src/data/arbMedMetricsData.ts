// Arbitration/Mediation Stage - Metrics, KPIs, SLA Rules, Escalation Triggers & Indexes

import type { Metric, KPICategory, SLARule, EscalationTrigger } from './tmMetricsData';

// ─── Re-export Index Types from expMetricsData ──────────────────────

export type { IndexComponent, IndexBand, IndexConfig } from './expMetricsData';
import type { IndexConfig } from './expMetricsData';

// ─── 1. Core Weekly Scorecard Metrics (15) ──────────────────────────

export const arbMedMetrics: Metric[] = [
  // SLA & Timeliness (7)
  {
    id: 'arbmed-m-001',
    name: 'Court Notice→Calendar SLA %',
    description: 'Percentage of court notices calendared within 1 business day',
    formula: '(Calendared within 1 day / Total notices) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'arbmed-m-002',
    name: 'Client Notice Automation SLA %',
    description: 'Percentage of client notices sent immediately upon court notice calendared',
    formula: '(Automated within threshold / Total) × 100',
    target: 98,
    unit: '%',
    sla: '≥98%',
    rag: { green: { min: 98, max: 100 }, amber: { min: 90, max: 97 }, red: { min: 0, max: 89 } },
  },
  {
    id: 'arbmed-m-003',
    name: '1-Hour Readiness Compliance %',
    description: 'Percentage of tasks meeting 1-hour readiness targets',
    formula: '(Compliant tasks / Total eligible) × 100',
    target: 90,
    unit: '%',
    sla: '≥90%',
    rag: { green: { min: 90, max: 100 }, amber: { min: 80, max: 89 }, red: { min: 0, max: 79 } },
  },
  {
    id: 'arbmed-m-004',
    name: 'Statement Draft SLA (Median Days)',
    description: 'Median days to complete statement drafts',
    formula: 'Median(Draft completion date - Start date)',
    target: 5,
    unit: 'days',
    sla: '≤5 days',
    rag: { green: { min: 0, max: 5 }, amber: { min: 6, max: 8 }, red: { min: 9, max: 999 } },
  },
  {
    id: 'arbmed-m-005',
    name: 'Attorney Review SLA %',
    description: 'Percentage of attorney reviews completed within 2 business days',
    formula: '(Reviews in ≤2d / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'arbmed-m-006',
    name: 'Packet Sent SLA %',
    description: 'Percentage of packets sent within 1 business day of attorney approval',
    formula: '(Sent within 1 day / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'arbmed-m-007',
    name: 'On-Time Completion Rate %',
    description: 'Percentage of all tasks completed within their SLA window',
    formula: '(On-time tasks / Total completed) × 100',
    target: 90,
    unit: '%',
    sla: '≥90%',
    rag: { green: { min: 90, max: 100 }, amber: { min: 80, max: 89 }, red: { min: 0, max: 79 } },
  },

  // Readiness (4)
  {
    id: 'arbmed-m-008',
    name: 'Next-Action Coverage %',
    description: 'Percentage of cases with a defined next action assigned',
    formula: '(Cases with next action / Total active) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
  {
    id: 'arbmed-m-009',
    name: 'Packet-Ready Coverage %',
    description: 'Percentage of cases with packet materials assembled and ready',
    formula: '(Packet-ready cases / Total approaching submission) × 100',
    target: 90,
    unit: '%',
    sla: '≥90%',
    rag: { green: { min: 90, max: 100 }, amber: { min: 80, max: 89 }, red: { min: 0, max: 79 } },
  },
  {
    id: 'arbmed-m-010',
    name: 'Missing Artifacts Count',
    description: 'Number of cases with missing required artifacts at submission',
    formula: 'Count(cases with missing artifacts)',
    target: 0,
    unit: 'count',
    sla: '0',
    rag: { green: { min: 0, max: 0 }, amber: { min: 1, max: 3 }, red: { min: 4, max: 999 } },
  },
  {
    id: 'arbmed-m-011',
    name: 'Upcoming Event Exposure (Days)',
    description: 'Minimum days of lead time before upcoming arbitration/mediation events',
    formula: 'Min(Event date - Today) for next event per case',
    target: 14,
    unit: 'days',
    sla: '≥14 days',
    rag: { green: { min: 14, max: 999 }, amber: { min: 7, max: 13 }, red: { min: 0, max: 6 } },
  },

  // Decision Latency (4)
  {
    id: 'arbmed-m-012',
    name: 'De Novo Direction Latency (Median Days)',
    description: 'Median days from arbitration result to attorney De Novo direction',
    formula: 'Median(Direction date - Arbitration result date)',
    target: 3,
    unit: 'days',
    sla: '≤3 days',
    rag: { green: { min: 0, max: 3 }, amber: { min: 4, max: 6 }, red: { min: 7, max: 999 } },
  },
  {
    id: 'arbmed-m-013',
    name: 'Direction Completion by Attempt %',
    description: 'Percentage of De Novo directions received by Attempt 3',
    formula: '(Directions received ≤ Attempt 3 / Total) × 100',
    target: 85,
    unit: '%',
    sla: '≥85% by Attempt 3',
    rag: { green: { min: 85, max: 100 }, amber: { min: 70, max: 84 }, red: { min: 0, max: 69 } },
  },
  {
    id: 'arbmed-m-014',
    name: 'Escalation Trigger Count',
    description: 'Number of De Novo direction escalations triggered per month',
    formula: 'Count(escalations triggered)',
    target: 5,
    unit: 'count',
    sla: '≤5/month',
    rag: { green: { min: 0, max: 5 }, amber: { min: 6, max: 10 }, red: { min: 11, max: 999 } },
  },
  {
    id: 'arbmed-m-015',
    name: 'De Novo Filing Timeliness %',
    description: 'Percentage of De Novo demands filed within 1 business day of direction',
    formula: '(Filed within 1 day / Total) × 100',
    target: 95,
    unit: '%',
    sla: '≥95%',
    rag: { green: { min: 95, max: 100 }, amber: { min: 85, max: 94 }, red: { min: 0, max: 84 } },
  },
];

// ─── 2. KPI Categories (3) ──────────────────────────────────────────

export const arbMedKPICategories: KPICategory[] = [
  {
    id: 'paralegal',
    name: 'Paralegal/Legal Asst',
    color: 'blue',
    kpis: [
      { id: 'arbmed-kpi-p-001', name: 'Court notice calendar compliance', definition: 'Percentage of court notices calendared within the 1-business-day SLA from receipt', active: true },
      { id: 'arbmed-kpi-p-002', name: 'Statement draft turnaround time', definition: 'Median days from task assignment to draft completion for arbitration and mediation statements', active: true },
      { id: 'arbmed-kpi-p-003', name: 'Packet compilation accuracy', definition: 'Percentage of packets compiled without missing artifacts or errors requiring rework', active: true },
      { id: 'arbmed-kpi-p-004', name: 'De Novo direction pursuit cadence', definition: 'Adherence to the 3-attempt schedule for obtaining attorney De Novo direction', active: true },
      { id: 'arbmed-kpi-p-005', name: 'Mediation scheduling SLA compliance', definition: 'Percentage of mediation dates calendared within 1 business day of attorney direction', active: true },
      { id: 'arbmed-kpi-p-006', name: 'Document production timeliness', definition: 'Percentage of document packets sent within SLA of attorney approval', active: true },
      { id: 'arbmed-kpi-p-007', name: 'File completeness before submission', definition: 'Percentage of cases with all required artifacts confirmed before packet submission', active: true },
    ],
  },
  {
    id: 'attorney',
    name: 'Attorney',
    color: 'purple',
    kpis: [
      { id: 'arbmed-kpi-a-001', name: 'Statement review turnaround time', definition: 'Median time from statement draft submission to attorney review completion', active: true },
      { id: 'arbmed-kpi-a-002', name: 'De Novo direction response time', definition: 'Median days from arbitration result to attorney De Novo direction provided', active: true },
      { id: 'arbmed-kpi-a-003', name: 'Strategic direction quality', definition: 'Assessment of clarity and actionability of De Novo and mediation direction provided', active: true },
      { id: 'arbmed-kpi-a-004', name: 'Settlement posture alignment', definition: 'Degree to which mediation preparation aligns with overall settlement strategy', active: true },
      { id: 'arbmed-kpi-a-005', name: 'Mediation preparation engagement', definition: 'Timeliness and quality of attorney participation in mediation preparation tasks', active: true },
    ],
  },
  {
    id: 'management',
    name: 'Management',
    color: 'emerald',
    kpis: [
      { id: 'arbmed-kpi-m-001', name: 'Stage throughput trend', definition: 'Trending analysis of cases moving through arbitration/mediation stages over time', active: true },
      { id: 'arbmed-kpi-m-002', name: 'Escalation frequency pattern', definition: 'Trend analysis of De Novo direction escalation frequency and root causes', active: true },
      { id: 'arbmed-kpi-m-003', name: 'SLA breach rate by task category', definition: 'Percentage of SLA breaches broken down by task type across the stage', active: true },
      { id: 'arbmed-kpi-m-004', name: 'De Novo vs settlement resolution ratio', definition: 'Ratio of cases proceeding through De Novo versus settling at arbitration', active: true },
      { id: 'arbmed-kpi-m-005', name: 'Mediation success rate', definition: 'Percentage of mediation sessions resulting in settlement or meaningful progress', active: true },
    ],
  },
];

// ─── 3. SLA Rules (18) ──────────────────────────────────────────────

export const arbMedSLARules: SLARule[] = [
  // Phase 1: Court Notice & Client Notice
  { id: 'arbmed-sla-001', task: 'Calendar arbitration notice from the court', slaTarget: '1 business day from notice receipt', escalationTrigger: 'Not calendared within 2 business days', escalateTo: 'Manager' },
  { id: 'arbmed-sla-002', task: 'Arbitration notice to the client (automation)', slaTarget: 'Immediate upon court notice calendared', escalationTrigger: 'Not sent within 1 hour of calendar entry', escalateTo: 'Manager' },

  // Phase 2: Case Prep
  { id: 'arbmed-sla-003', task: 'Confirm all expert reports served, medical bills balance and lien balance', slaTarget: '3 business days from notice', escalationTrigger: 'Not confirmed within 4 business days', escalateTo: 'Manager' },
  { id: 'arbmed-sla-004', task: 'Draft arbitration statement', slaTarget: '5 business days from confirmation', escalationTrigger: 'Draft not started by day 3', escalateTo: 'Manager' },
  { id: 'arbmed-sla-005', task: 'Attorney review and finalize arbitration statement', slaTarget: '2 business days from draft', escalationTrigger: 'Not reviewed within 3 business days', escalateTo: 'Senior Manager' },

  // Phase 3: Doc Production
  { id: 'arbmed-sla-006', task: 'Compile arbitration packet and send to arbitrator/defense counsel', slaTarget: '1 business day from attorney approval', escalationTrigger: 'Not sent within 2 business days', escalateTo: 'Manager' },

  // Phase 4: De Novo
  { id: 'arbmed-sla-007', task: 'Get De Novo direction from Attorney — Attempt 1', slaTarget: '1 business day from arbitration result', escalationTrigger: 'No attempt within 2 business days of result', escalateTo: 'Manager' },
  { id: 'arbmed-sla-008', task: 'Get De Novo direction from Attorney — Attempt 2', slaTarget: '1 business day after Attempt 1', escalationTrigger: 'No second attempt within 1 business day', escalateTo: 'Manager' },
  { id: 'arbmed-sla-009', task: 'Get De Novo direction from Attorney — Attempt 3', slaTarget: '1 business day after Attempt 2', escalationTrigger: 'No third attempt within 1 business day', escalateTo: 'Manager' },
  { id: 'arbmed-sla-010', task: 'Escalate to Management for De Novo direction', slaTarget: 'Day 7 auto-escalation', escalationTrigger: 'Auto-escalation not triggered by Day 7', escalateTo: 'Senior Manager' },
  { id: 'arbmed-sla-011', task: 'Attorney provides De Novo direction', slaTarget: 'Day 9 breach deadline', escalationTrigger: 'Direction not provided by Day 9', escalateTo: 'Senior Manager' },
  { id: 'arbmed-sla-012', task: 'Draft and file Demand for Trial De Novo', slaTarget: '1 business day from direction', escalationTrigger: 'Not filed within 2 business days', escalateTo: 'Manager' },

  // Phase 5: Mediation Prep
  { id: 'arbmed-sla-013', task: 'Get mediation prep direction from Attorney', slaTarget: '1 business day from De Novo filed', escalationTrigger: 'No direction within 2 business days', escalateTo: 'Manager' },
  { id: 'arbmed-sla-014', task: 'Calendar mediation date', slaTarget: '1 business day from direction', escalationTrigger: 'Not calendared within 2 business days', escalateTo: 'Manager' },
  { id: 'arbmed-sla-015', task: 'Mediation notice to the client (automation)', slaTarget: 'Immediate upon mediation calendared', escalationTrigger: 'Not sent within 1 hour of calendar entry', escalateTo: 'Manager' },
  { id: 'arbmed-sla-016', task: 'Draft mediation statement', slaTarget: '5 business days from calendared', escalationTrigger: 'Draft not started by day 3', escalateTo: 'Manager' },
  { id: 'arbmed-sla-017', task: 'Attorney review and finalize mediation statement', slaTarget: '2 business days from draft', escalationTrigger: 'Not reviewed within 3 business days', escalateTo: 'Senior Manager' },

  // Phase 6: Mediation Doc Production
  { id: 'arbmed-sla-018', task: 'Compile mediation packet and send to mediator', slaTarget: '1 business day from attorney approval', escalationTrigger: 'Not sent within 2 business days', escalateTo: 'Manager' },
];

// ─── 4. Escalation Triggers (6) ─────────────────────────────────────

export const arbMedEscalationTriggers: EscalationTrigger[] = [
  { id: 'arbmed-esc-001', condition: 'De Novo direction not received by Day 7', severity: 'critical', action: 'Auto-escalate to Management' },
  { id: 'arbmed-esc-002', condition: 'De Novo direction not received by Day 9', severity: 'critical', action: 'Breach: escalate to Senior Manager' },
  { id: 'arbmed-esc-003', condition: 'Statement draft exceeds 5-day SLA', severity: 'warning', action: 'Notify Manager' },
  { id: 'arbmed-esc-004', condition: 'Attorney review exceeds 2-day SLA', severity: 'warning', action: 'Escalate to Senior Manager' },
  { id: 'arbmed-esc-005', condition: 'Packet not sent within 1 business day', severity: 'warning', action: 'Escalate to Manager' },
  { id: 'arbmed-esc-006', condition: 'Missing artifacts at submission', severity: 'critical', action: 'Block submission and notify Attorney' },
];

// ─── 5. Stage Health Index ──────────────────────────────────────────

export const arbMedStageHealthIndex: IndexConfig = {
  name: 'Stage Health Index',
  description: 'Composite score (0-100) measuring overall arbitration/mediation stage performance',
  components: [
    { name: 'SLA & Timeliness', weight: 40, description: 'Adherence to SLA targets across all arbitration and mediation tasks' },
    { name: 'Readiness & Coverage', weight: 25, description: 'Completeness of next-action assignments and packet readiness' },
    { name: 'Decision Latency', weight: 20, description: 'Speed of attorney direction and De Novo decision-making' },
    { name: 'Quality & Rework', weight: 15, description: 'Accuracy of submissions and frequency of rework or corrections' },
  ],
  bands: [
    { label: 'Healthy', min: 85, max: 100, color: 'green' },
    { label: 'Watch', min: 70, max: 84, color: 'blue' },
    { label: 'At Risk', min: 55, max: 69, color: 'amber' },
    { label: 'Critical', min: 0, max: 54, color: 'red' },
  ],
};
