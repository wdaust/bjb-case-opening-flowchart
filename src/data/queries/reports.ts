import { queryOptions } from '@tanstack/react-query';
import type { SfApiResponse, ReportSummaryResponse, DashboardResponse } from '../../types/salesforce';
import {
  OPEN_LIT_ID, RESOLUTIONS_ID, STATS_ID, TIMING_ID, DISCOVERY_ID, EXPERTS_ID,
  COMPLAINTS_REPORT_ID, FORM_A_REPORT_ID, DEP_REPORT_ID, FORM_C_REPORT_ID,
  MISSING_ANS_REPORT_ID, PAST_DUE_SERVICE_ID, MISSING_ANS_SERVED_ID,
  SERVICE_30DAY_ID, NEW_DASH_ID, MATTERS_ID,
  UNIT_GOALS_ID, COMPLAINTS_MONTHLY_ID, FORM_C_10DAY_ID,
  NEED_FORM_C_MOTION_ID, ARB_MED_60_ID, SERVICE_DASH_ID,
} from '../sfReportIds';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

// ── Core fetch functions (extracted from useSalesforceReport) ──────────

async function fetchReport(
  id: string,
  mode: 'summary' | 'full' = 'summary',
): Promise<ReportSummaryResponse> {
  try {
    const params = new URLSearchParams({ id, mode });
    const res = await fetch(`${API_BASE}/get-report?${params}`);
    const json = await res.json() as SfApiResponse<ReportSummaryResponse>;
    if (json.ok) return json.data;
    throw new Error(json.error ?? `API error (${res.status})`);
  } catch {
    // Fall back to static JSON
    const staticRes = await fetch(`${import.meta.env.BASE_URL}reports/${id}.json`);
    if (staticRes.ok) return await staticRes.json() as ReportSummaryResponse;
    throw new Error(`Failed to load report ${id}`);
  }
}

async function fetchDashboard(id: string): Promise<DashboardResponse> {
  try {
    const params = new URLSearchParams({ id });
    const res = await fetch(`${API_BASE}/get-dashboard?${params}`);
    const json = await res.json() as SfApiResponse<DashboardResponse>;
    if (json.ok) return json.data;
    throw new Error(json.error ?? `API error (${res.status})`);
  } catch {
    const staticRes = await fetch(`${import.meta.env.BASE_URL}reports/${id}.json`);
    if (staticRes.ok) return await staticRes.json() as DashboardResponse;
    throw new Error(`Failed to load dashboard ${id}`);
  }
}

// ── Report query option factories ─────────────────────────────────────

export const reportQueries = {
  // LDN source reports (full detail rows)
  complaints: () => queryOptions({
    queryKey: ['report', COMPLAINTS_REPORT_ID, 'full'] as const,
    queryFn: () => fetchReport(COMPLAINTS_REPORT_ID, 'full'),
  }),
  pastDueService: () => queryOptions({
    queryKey: ['report', PAST_DUE_SERVICE_ID, 'full'] as const,
    queryFn: () => fetchReport(PAST_DUE_SERVICE_ID, 'full'),
  }),
  missingAnsServed: () => queryOptions({
    queryKey: ['report', MISSING_ANS_SERVED_ID, 'full'] as const,
    queryFn: () => fetchReport(MISSING_ANS_SERVED_ID, 'full'),
  }),
  formA: () => queryOptions({
    queryKey: ['report', FORM_A_REPORT_ID, 'full'] as const,
    queryFn: () => fetchReport(FORM_A_REPORT_ID, 'full'),
  }),
  formC: () => queryOptions({
    queryKey: ['report', FORM_C_REPORT_ID, 'full'] as const,
    queryFn: () => fetchReport(FORM_C_REPORT_ID, 'full'),
  }),
  depositions: () => queryOptions({
    queryKey: ['report', DEP_REPORT_ID, 'full'] as const,
    queryFn: () => fetchReport(DEP_REPORT_ID, 'full'),
  }),
  openLit: (mode: 'summary' | 'full' = 'full') => queryOptions({
    queryKey: ['report', OPEN_LIT_ID, mode] as const,
    queryFn: () => fetchReport(OPEN_LIT_ID, mode),
  }),
  service30Day: () => queryOptions({
    queryKey: ['report', SERVICE_30DAY_ID, 'full'] as const,
    queryFn: () => fetchReport(SERVICE_30DAY_ID, 'full'),
  }),
  missingAnswers: () => queryOptions({
    queryKey: ['report', MISSING_ANS_REPORT_ID, 'full'] as const,
    queryFn: () => fetchReport(MISSING_ANS_REPORT_ID, 'full'),
  }),

  // LCI / ControlTower reports (summary mode)
  resolutions: () => queryOptions({
    queryKey: ['report', RESOLUTIONS_ID, 'summary'] as const,
    queryFn: () => fetchReport(RESOLUTIONS_ID, 'summary'),
  }),
  discovery: () => queryOptions({
    queryKey: ['report', DISCOVERY_ID, 'summary'] as const,
    queryFn: () => fetchReport(DISCOVERY_ID, 'summary'),
  }),
  experts: () => queryOptions({
    queryKey: ['report', EXPERTS_ID, 'summary'] as const,
    queryFn: () => fetchReport(EXPERTS_ID, 'summary'),
  }),
  matters: () => queryOptions({
    queryKey: ['report', MATTERS_ID, 'summary'] as const,
    queryFn: () => fetchReport(MATTERS_ID, 'summary'),
  }),

  // LIT Scorecard reports
  unitGoals: () => queryOptions({
    queryKey: ['report', UNIT_GOALS_ID, 'summary'] as const,
    queryFn: () => fetchReport(UNIT_GOALS_ID, 'summary'),
  }),
  complaintsMonthly: () => queryOptions({
    queryKey: ['report', COMPLAINTS_MONTHLY_ID, 'summary'] as const,
    queryFn: () => fetchReport(COMPLAINTS_MONTHLY_ID, 'summary'),
  }),
  formC10Day: () => queryOptions({
    queryKey: ['report', FORM_C_10DAY_ID, 'summary'] as const,
    queryFn: () => fetchReport(FORM_C_10DAY_ID, 'summary'),
  }),
  needFormCMotion: () => queryOptions({
    queryKey: ['report', NEED_FORM_C_MOTION_ID, 'summary'] as const,
    queryFn: () => fetchReport(NEED_FORM_C_MOTION_ID, 'summary'),
  }),
  arbMed60: () => queryOptions({
    queryKey: ['report', ARB_MED_60_ID, 'summary'] as const,
    queryFn: () => fetchReport(ARB_MED_60_ID, 'summary'),
  }),

  // Generic: fetch any report by ID
  byId: (id: string, mode: 'summary' | 'full' = 'summary') => queryOptions({
    queryKey: ['report', id, mode] as const,
    queryFn: () => fetchReport(id, mode),
  }),
};

// ── Dashboard query option factories ─────────────────────────────────

export const dashboardQueries = {
  stats: () => queryOptions({
    queryKey: ['dashboard', STATS_ID] as const,
    queryFn: () => fetchDashboard(STATS_ID),
  }),
  timing: () => queryOptions({
    queryKey: ['dashboard', TIMING_ID] as const,
    queryFn: () => fetchDashboard(TIMING_ID),
  }),
  litScorecard: () => queryOptions({
    queryKey: ['dashboard', NEW_DASH_ID] as const,
    queryFn: () => fetchDashboard(NEW_DASH_ID),
  }),
  serviceDash: () => queryOptions({
    queryKey: ['dashboard', SERVICE_DASH_ID] as const,
    queryFn: () => fetchDashboard(SERVICE_DASH_ID),
  }),

  // Generic: fetch any dashboard by ID
  byId: (id: string) => queryOptions({
    queryKey: ['dashboard', id] as const,
    queryFn: () => fetchDashboard(id),
  }),
};
