import type { ReportConfig } from '../types/salesforce.ts';

const SF_BASE = 'https://bjblaw.lightning.force.com/lightning/r';

export const REPORTS: ReportConfig[] = [
  {
    id: '01ZPp0000015Ug1MAE',
    name: 'Stats at a Glance',
    type: 'dashboard',
    description: 'High-level firm KPIs and volume metrics',
    sfUrl: `${SF_BASE}/Dashboard/01ZPp0000015Ug1MAE/view`,
  },
  {
    id: '01ZPp0000015dGHMAY',
    name: 'NJ PI — Timing',
    type: 'dashboard',
    description: 'Stage timing and throughput for NJ PI matters',
    sfUrl: `${SF_BASE}/Dashboard/01ZPp0000015dGHMAY/view`,
  },
  {
    id: '00OPp000003OOCLMA4',
    name: 'Resolutions',
    type: 'report',
    mode: 'summary',
    description: 'Resolution outcomes across all matter types',
    sfUrl: `${SF_BASE}/Report/00OPp000003OOCLMA4/view`,
    recordCount: 11783,
  },
  {
    id: '00OPp000003OUcjMAG',
    name: 'Discovery Trackers',
    type: 'report',
    mode: 'summary',
    description: 'Discovery task completion grouped by owner',
    sfUrl: `${SF_BASE}/Report/00OPp000003OUcjMAG/view`,
    recordCount: 8455,
  },
  {
    id: '00OPp000003OaGjMAK',
    name: 'Matters Universe',
    type: 'report',
    mode: 'summary',
    description: 'Complete matter inventory — summary only (66K+ records)',
    sfUrl: `${SF_BASE}/Report/00OPp000003OaGjMAK/view`,
    recordCount: 66350,
  },
  {
    id: '00O4V000009RreKUAS',
    name: 'Open Lit Matters',
    type: 'report',
    mode: 'summary',
    description: 'Open litigation matters grouped by owner and PI status',
    sfUrl: `${SF_BASE}/Report/00O4V000009RreKUAS/view`,
    recordCount: 2207,
  },
  {
    id: '00OPp000003PLtxMAG',
    name: 'Experts Not Served',
    type: 'report',
    mode: 'summary',
    description: 'Expert depositions not yet served, grouped by owner',
    sfUrl: `${SF_BASE}/Report/00OPp000003PLtxMAG/view`,
    recordCount: 23144,
  },
];

export const REPORT_MAP: Record<string, ReportConfig> = Object.fromEntries(
  REPORTS.map(r => [r.id, r])
);
