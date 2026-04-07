export interface ReportAggregate {
  label: string;
  value: number | null;
}

export interface ReportGrouping {
  key: string;
  label: string;
  aggregates: ReportAggregate[];
}

export interface ReportSummaryResponse {
  reportId: string;
  reportName: string;
  format: string;
  grandTotals: ReportAggregate[];
  groupings: ReportGrouping[];
  hasDetailRows: boolean;
  detailRows?: Array<Record<string, unknown>>;
}

export interface DashboardRow {
  label: string;
  values: Array<{ label: string; value: number | null }>;
}

export interface DashboardComponent {
  title: string;
  chartType: string;
  columns: string[];
  rows: DashboardRow[];
  sourceReportId?: string;
}

export interface DashboardResponse {
  dashboardId: string;
  dashboardName: string;
  components: DashboardComponent[];
}

export interface SfApiResponse<T> {
  ok: boolean;
  data: T;
  mode?: string;
  fetchedAt: string;
  error?: string;
}

export type ReportType = 'report' | 'dashboard';

export interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  mode?: 'summary' | 'full';
  description: string;
  sfUrl: string;
  recordCount?: number;
}
