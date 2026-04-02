import { useParams, useNavigate } from 'react-router-dom';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { KpiStrip } from '../components/reports/KpiStrip.tsx';
import { ReportSummaryTable } from '../components/reports/ReportSummaryTable.tsx';
import { DashboardRenderer } from '../components/reports/DashboardRenderer.tsx';
import { RefreshIndicator } from '../components/reports/RefreshIndicator.tsx';
import { useSalesforceReport } from '../hooks/useSalesforceReport.ts';
import type { ReportSummaryResponse, DashboardResponse, ReportConfig } from '../types/salesforce.ts';
import { REPORT_MAP } from '../config/reports.ts';
import { ArrowLeft, ExternalLink, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';

const ALERT_KEYWORDS = ['overdue', 'late', 'missing', 'not compliant', 'no attempt', 'past due', 'no service'];

function AlertBanner({ components }: { components: import('../types/salesforce.ts').DashboardComponent[] }) {
  const flagged: { label: string; value: number }[] = [];
  for (const comp of components) {
    for (const row of comp.rows) {
      const lower = row.label.toLowerCase();
      if (ALERT_KEYWORDS.some(k => lower.includes(k))) {
        const total = row.values.reduce((sum, v) => sum + (v.value ?? 0), 0);
        if (total > 0) flagged.push({ label: row.label, value: total });
      }
    }
  }
  if (flagged.length === 0) return null;
  const totalItems = flagged.reduce((sum, f) => sum + f.value, 0);
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
      <span className="font-medium text-amber-200">
        {totalItems.toLocaleString()} items need attention across {flagged.length} categories
      </span>
      <div className="flex flex-wrap gap-1.5 ml-auto">
        {flagged.map(f => (
          <span key={f.label} className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 whitespace-nowrap">
            {f.label}: {f.value.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

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
        <AlertBanner components={d.components} />
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
