// ── Department Dashboard Config Types ────────────────────────────────────
// Defines the shape of config objects that drive the generic DeptDashboard renderer.

import type { LitCase } from '../mockData';

export interface StatCardConfig {
  label: string;
  compute: (cases: LitCase[]) => string | number;
  computeDelta?: (cases: LitCase[]) => { value: string; type: 'positive' | 'negative' | 'neutral' };
  sparkline?: (cases: LitCase[]) => number[];
}

export interface ChartSeriesConfig {
  dataKey: string;
  color: string;
  name?: string;
}

export interface ChartConfig {
  title: string;
  subtitle?: string;
  type: 'bar' | 'pie' | 'area' | 'line' | 'horizontal-bar' | 'stacked-bar';
  getData: (cases: LitCase[]) => Record<string, any>[];
  series: ChartSeriesConfig[];
  xAxisKey?: string;
}

export interface TableColumnConfig {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface TableConfig {
  title: string;
  columns: TableColumnConfig[];
  getData: (cases: LitCase[]) => Record<string, any>[];
  keyField: string;
  maxRows?: number;
}

export interface DeptPageConfig {
  deptId: string;          // URL param e.g. "intake", "pre-lit"
  pageId: string;          // URL param e.g. "dashboard", "new-leads"
  title: string;
  deptLabel: string;       // Display name e.g. "Intake", "Pre-Lit"
  accentColor: string;
  filterCases: (cases: LitCase[]) => LitCase[];
  statCards: StatCardConfig[];
  charts: ChartConfig[];
  table: TableConfig;
}
