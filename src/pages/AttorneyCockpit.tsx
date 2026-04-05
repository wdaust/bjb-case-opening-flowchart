import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { Skeleton } from '../components/ui/skeleton';
import type { ReportSummaryResponse } from '../types/salesforce';
import { RESOLUTIONS_ID, DISCOVERY_ID, EXPERTS_ID } from '../data/sfReportIds';
import { fmt$, fmtNum } from '../utils/sfHelpers';

// ── Main Component ──────────────────────────────────────────────────
export default function AttorneyCockpit() {
  const { attorneyId } = useParams();
  const navigate = useNavigate();

  // Load 3 reports
  const { data: resData, loading: resLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: RESOLUTIONS_ID, type: 'report' });
  const { data: discData, loading: discLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: DISCOVERY_ID, type: 'report' });
  const { data: expertsData, loading: expertsLoading } =
    useSalesforceReport<ReportSummaryResponse>({ id: EXPERTS_ID, type: 'report' });

  const allLoading = resLoading || discLoading || expertsLoading;

  // Build attorney list from Resolutions groupings
  const attorneyList = useMemo(() => {
    if (!resData) return [];
    return resData.groupings
      .map(g => g.label)
      .sort((a, b) => a.localeCompare(b));
  }, [resData]);

  // Resolve which attorney is selected (URL-decoded param or first in list)
  const selectedName = attorneyId ? decodeURIComponent(attorneyId) : attorneyList[0] ?? '';

  // ── Resolutions data for selected attorney ────────────────────────
  const resGrouping = useMemo(() => {
    if (!resData) return null;
    return resData.groupings.find(g => g.label === selectedName) ?? null;
  }, [resData, selectedName]);

  const cases = (resGrouping?.aggregates.find(a => a.label === 'Record Count')?.value ?? 0) as number;
  const settlement = (resGrouping?.aggregates.find(a => a.label.includes('Settlement'))?.value ?? 0) as number;
  const avgPerCase = cases ? settlement / cases : 0;
  const netFee = (resGrouping?.aggregates.find(a => a.label.includes('Fee'))?.value ?? 0) as number;

  // ── Discovery trackers for selected attorney ──────────────────────
  const discGrouping = useMemo(() => {
    if (!discData) return null;
    return discData.groupings.find(g => g.label === selectedName) ?? null;
  }, [discData, selectedName]);

  const discoveryTrackers = (discGrouping?.aggregates[0]?.value ?? 0) as number;

  // ── Experts not served for selected attorney ──────────────────────
  const expertsGrouping = useMemo(() => {
    if (!expertsData) return null;
    return expertsData.groupings.find(g => g.label === selectedName) ?? null;
  }, [expertsData, selectedName]);

  const expertsUnserved = (expertsGrouping?.aggregates[0]?.value ?? 0) as number;

  // ── Loading skeleton ──────────────────────────────────────────────
  if (allLoading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-64" />
        <DashboardGrid cols={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </DashboardGrid>
        <DashboardGrid cols={2}>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DashboardGrid>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: 'Control Tower', path: '/control-tower' },
          { label: 'Attorney Cockpit' },
        ]}
      />

      {/* Attorney Selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="attorney-select" className="text-sm font-medium text-muted-foreground">
          Attorney
        </label>
        <select
          id="attorney-select"
          value={selectedName}
          onChange={(e) => navigate(`/attorney/${encodeURIComponent(e.target.value)}`)}
          className="bg-card border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[280px]"
        >
          {attorneyList.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Hero StatCards */}
      <SectionHeader title="Performance" subtitle={`Resolution metrics for ${selectedName}`} info="Selected attorney's resolved cases, total settlement, average per case, and net fee with fee ratio." />
      <DashboardGrid cols={4}>
        <StatCard
          label="Resolved Cases"
          value={fmtNum(cases)}
          variant="glass"
        />
        <StatCard
          label="Total Settlement"
          value={fmt$(settlement)}
          variant="glass"
        />
        <StatCard
          label="Avg / Case"
          value={fmt$(avgPerCase)}
          variant="glass"
        />
        <StatCard
          label="Net Fee"
          value={fmt$(netFee)}
          delta={settlement ? `${((netFee / settlement) * 100).toFixed(1)}% fee ratio` : undefined}
          deltaType="neutral"
          variant="glass"
        />
      </DashboardGrid>

      {/* Workload Cards */}
      <SectionHeader title="Workload" subtitle={`Current assignments for ${selectedName}`} info="Discovery tracker count and experts not served count for the selected attorney." />
      <DashboardGrid cols={2}>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-1">Discovery Trackers</p>
          <p className="text-3xl font-bold text-foreground">{fmtNum(discoveryTrackers)}</p>
          <p className="text-xs text-muted-foreground mt-1">Open trackers assigned</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-1">Experts Not Served</p>
          <p className="text-3xl font-bold text-foreground">{fmtNum(expertsUnserved)}</p>
          <p className="text-xs text-muted-foreground mt-1">Unserved experts assigned</p>
        </div>
      </DashboardGrid>

      {!resGrouping && selectedName && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          No resolution data found for "{selectedName}".
        </div>
      )}
    </div>
  );
}
