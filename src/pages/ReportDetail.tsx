import { useParams, useNavigate } from 'react-router-dom';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { KpiStrip } from '../components/reports/KpiStrip.tsx';
import { ReportSummaryTable } from '../components/reports/ReportSummaryTable.tsx';
import { DashboardRenderer } from '../components/reports/DashboardRenderer.tsx';
import { RefreshIndicator } from '../components/reports/RefreshIndicator.tsx';
import { useSalesforceReport } from '../hooks/useSalesforceReport.ts';
import type { ReportSummaryResponse, DashboardResponse } from '../types/salesforce.ts';
import { REPORT_MAP } from '../config/reports.ts';
import { ArrowLeft, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

function ReportContent({ config }: { config: ReportConfig }) {
  const { data, loading, error, refresh, lastFetched } = useSalesforceReport({
    id: config.id,
    type: config.type,
    mode: config.mode,
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading from Salesforce...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={32} className="text-amber-400" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={refresh}
          className="text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        No data available. Salesforce credentials may not be configured yet.
      </div>
    );
  }

  if (config.type === 'dashboard') {
    const d = data as DashboardResponse;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{d.components.length} dashboard components</p>
          <RefreshIndicator lastFetched={lastFetched} loading={loading} onRefresh={refresh} />
        </div>
        <DashboardRenderer components={d.components} />
      </div>
    );
  }

  const r = data as ReportSummaryResponse;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {r.format} report — {r.groupings.length} groups
        </p>
        <RefreshIndicator lastFetched={lastFetched} loading={loading} onRefresh={refresh} />
      </div>

      {r.grandTotals.length > 0 && <KpiStrip totals={r.grandTotals} />}
      {r.groupings.length > 0 && <ReportSummaryTable groupings={r.groupings} />}
    </div>
  );
}

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const config = reportId ? REPORT_MAP[reportId] : undefined;

  if (!config) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          Back to Reports
        </button>
        <div className="text-center py-20 text-muted-foreground">
          Report not found. Check the report ID and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        Back to Reports
      </button>

      <SectionHeader
        title={config.name}
        subtitle={config.description}
        actions={
          config.sfUrl ? (
            <a
              href={config.sfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={14} />
              Open in Salesforce
            </a>
          ) : undefined
        }
      />

      <ReportContent config={config} />
    </div>
  );
}
