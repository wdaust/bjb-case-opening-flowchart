import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../components/dashboard/SectionHeader.tsx';
import { DashboardGrid } from '../components/dashboard/DashboardGrid.tsx';
import { RefreshIndicator } from '../components/reports/RefreshIndicator.tsx';
import { useSalesforceReport } from '../hooks/useSalesforceReport.ts';
import { cn } from '../utils/cn.ts';
import type { ReportSummaryResponse, DashboardResponse, ReportConfig } from '../types/salesforce.ts';
import {
  ExternalLink, BarChart3, LayoutDashboard, FileText, Loader2,
  AlertCircle, Users, Scale, Search, Activity,
} from 'lucide-react';

// ── Report registry ────────────────────────────────────────────────────
// Replace IDs with real Salesforce report/dashboard IDs once credentials are set
const REPORTS: ReportConfig[] = [
  {
    id: 'STATS_DASHBOARD_ID',
    name: 'Stats at a Glance',
    type: 'dashboard',
    description: 'High-level firm KPIs and volume metrics',
    sfUrl: 'https://litify.lightning.force.com/lightning/r/Dashboard/STATS_DASHBOARD_ID/view',
  },
  {
    id: 'NJ_PI_TIMING_DASHBOARD_ID',
    name: 'NJ PI — Timing',
    type: 'dashboard',
    description: 'Stage timing and throughput for NJ PI matters',
    sfUrl: 'https://litify.lightning.force.com/lightning/r/Dashboard/NJ_PI_TIMING_DASHBOARD_ID/view',
  },
  {
    id: 'RESOLUTIONS_REPORT_ID',
    name: 'Resolutions',
    type: 'report',
    mode: 'summary',
    description: 'Resolution outcomes across all matter types',
    sfUrl: 'https://litify.lightning.force.com/lightning/r/Report/RESOLUTIONS_REPORT_ID/view',
    recordCount: 11780,
  },
  {
    id: 'DISCOVERY_TRACKERS_REPORT_ID',
    name: 'Discovery Trackers',
    type: 'report',
    mode: 'summary',
    description: 'Discovery task completion grouped by owner',
    sfUrl: 'https://litify.lightning.force.com/lightning/r/Report/DISCOVERY_TRACKERS_REPORT_ID/view',
    recordCount: 8454,
  },
  {
    id: 'MATTERS_UNIVERSE_REPORT_ID',
    name: 'Matters Universe',
    type: 'report',
    mode: 'summary',
    description: 'Complete matter inventory — summary only (66K+ records)',
    sfUrl: 'https://litify.lightning.force.com/lightning/r/Report/MATTERS_UNIVERSE_REPORT_ID/view',
    recordCount: 66340,
  },
  {
    id: 'EXPERTS_NOT_SERVED_REPORT_ID',
    name: 'Experts Not Served',
    type: 'report',
    mode: 'summary',
    description: 'Expert depositions not yet served, grouped by owner',
    sfUrl: 'https://litify.lightning.force.com/lightning/r/Report/EXPERTS_NOT_SERVED_REPORT_ID/view',
    recordCount: 23141,
  },
];

const ICONS: Record<string, typeof BarChart3> = {
  'Stats at a Glance': Activity,
  'NJ PI — Timing': BarChart3,
  'Resolutions': Scale,
  'Discovery Trackers': Search,
  'Matters Universe': FileText,
  'Experts Not Served': Users,
};

// ── Card component with live preview ───────────────────────────────────
function ReportCard({ config }: { config: ReportConfig }) {
  const navigate = useNavigate();
  const { data, loading, error, refresh, lastFetched } = useSalesforceReport({
    id: config.id,
    type: config.type,
    mode: config.mode,
  });

  const Icon = ICONS[config.name] ?? FileText;
  const isDashboard = config.type === 'dashboard';

  const previewValue = (() => {
    if (loading) return null;
    if (error) return null;
    if (!data) return null;
    if (isDashboard) {
      const d = data as DashboardResponse;
      return `${d.components.length} components`;
    }
    const r = data as ReportSummaryResponse;
    const first = r.grandTotals[0];
    if (first?.value !== null && first?.value !== undefined) {
      return typeof first.value === 'number' ? first.value.toLocaleString() : String(first.value);
    }
    return `${r.groupings.length} groups`;
  })();

  return (
    <div
      onClick={() => navigate(`/reports/${config.id}`)}
      className={cn(
        "group relative bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl p-5",
        "cursor-pointer transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
              {config.name}
            </h3>
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1",
              isDashboard ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400",
            )}>
              {isDashboard ? <LayoutDashboard size={10} /> : <FileText size={10} />}
              {isDashboard ? 'Dashboard' : 'Report'}
            </span>
          </div>
        </div>
        <a
          href={config.sfUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
          title="Open in Salesforce"
        >
          <ExternalLink size={14} className="text-muted-foreground" />
        </a>
      </div>

      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{config.description}</p>

      {/* Live data preview */}
      <div className="flex items-center justify-between">
        <div className="min-h-[24px] flex items-center">
          {loading && <Loader2 size={14} className="text-muted-foreground animate-spin" />}
          {error && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400/70">
              <AlertCircle size={12} />
              <span>Offline</span>
            </div>
          )}
          {previewValue && !loading && !error && (
            <span className="text-lg font-bold text-white">{previewValue}</span>
          )}
        </div>
        {config.recordCount && (
          <span className="text-[10px] text-muted-foreground">
            {config.recordCount.toLocaleString()} records
          </span>
        )}
      </div>

      {lastFetched && !loading && (
        <div className="mt-2">
          <RefreshIndicator
            lastFetched={lastFetched}
            loading={loading}
            onRefresh={refresh}
            className="justify-end"
          />
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────
export default function Reports() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <SectionHeader
        title="Salesforce Reports"
        subtitle="Live data from Salesforce Analytics — click any card for detail view"
      />

      <DashboardGrid cols={3}>
        {REPORTS.map(config => (
          <ReportCard key={config.id} config={config} />
        ))}
      </DashboardGrid>
    </div>
  );
}
