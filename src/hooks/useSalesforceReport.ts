/**
 * Legacy compatibility wrapper — delegates to TanStack Query under the hood.
 * All existing useSalesforceReport() calls automatically get request dedup,
 * shared cache, and stale-while-revalidate via the shared QueryClient.
 *
 * New code should use useQuery(reportQueries.xxx()) or bundle hooks directly.
 */
import { useQuery } from '@tanstack/react-query';
import { reportQueries, dashboardQueries } from '../data/queries/reports';
import type { ReportSummaryResponse, DashboardResponse, ReportType } from '../types/salesforce';

interface UseSalesforceReportOptions {
  id: string;
  type: ReportType;
  mode?: 'summary' | 'full';
  enabled?: boolean;
}

interface UseSalesforceReportResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastFetched: string | null;
}

export function useSalesforceReport<T = ReportSummaryResponse | DashboardResponse>(
  opts: UseSalesforceReportOptions,
): UseSalesforceReportResult<T> {
  const { id, type, mode = 'summary', enabled = true } = opts;

  const queryOpts = type === 'dashboard'
    ? dashboardQueries.byId(id)
    : reportQueries.byId(id, mode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    ...(queryOpts as any),
    enabled: !!id && enabled,
  });

  return {
    data: (data as T | undefined) ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Unknown error') : null,
    refresh: () => { refetch(); },
    lastFetched: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null,
  };
}
