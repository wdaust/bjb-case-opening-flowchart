import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtNum } from '../utils/sfHelpers';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { StatCard } from '../components/dashboard/StatCard';
import { DataTable } from '../components/dashboard/DataTable';
import type { Column } from '../components/dashboard/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { MISSING_ANS_REPORT_ID } from '../data/sfReportIds';
import type { ReportSummaryResponse } from '../types/salesforce';
import { X } from 'lucide-react';

interface DetailRow extends Record<string, unknown> {
  _groupingLabel?: string;
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-6 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function MissingAnswersDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const attorneyParam = searchParams.get('attorney');

  const { data: reportData, loading: reportLoading } =
    useSalesforceReport<ReportSummaryResponse>({
      id: MISSING_ANS_REPORT_ID,
      type: 'report',
      mode: 'full',
    });

  const [filterText, setFilterText] = useState('');

  // Detail rows from source report
  const allDetailRows = (reportData?.detailRows ?? []) as DetailRow[];

  // Pre-filter by attorney if param is set
  const detailRows = useMemo(() => {
    if (!attorneyParam) return allDetailRows;
    return allDetailRows.filter(r => r._groupingLabel === attorneyParam);
  }, [allDetailRows, attorneyParam]);

  const detailColumns: Column<DetailRow>[] = useMemo(() => {
    if (!detailRows.length) return [];
    const first = detailRows[0];
    return Object.keys(first)
      .filter(k => k !== '_groupingLabel')
      .map(k => ({
        key: k,
        label: k,
        sortable: true,
        render: (row: DetailRow) => {
          const v = row[k];
          if (v == null) return '—';
          if (typeof v === 'number') return fmtNum(v);
          return String(v);
        },
      }));
  }, [detailRows]);

  const allDetailColumns: Column<DetailRow>[] = useMemo(() => {
    if (!detailRows.length || !detailRows[0]._groupingLabel) return detailColumns;
    return [
      { key: '_groupingLabel', label: 'Group', sortable: true },
      ...detailColumns,
    ];
  }, [detailColumns, detailRows]);

  const filteredRows = useMemo(() => {
    if (!filterText) return detailRows;
    const q = filterText.toLowerCase();
    return detailRows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [detailRows, filterText]);

  const clearAttorneyFilter = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('attorney');
      return next;
    });
  };

  if (reportLoading) return <LoadingSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs crumbs={[
        { label: 'Control Tower', path: '/control-tower' },
        { label: 'Missing Answers' },
      ]} />

      <h1 className="text-2xl font-bold text-foreground">Missing Answers &gt;40 Days</h1>
      <p className="text-sm text-muted-foreground">
        Matters missing all answers with no default filed (NJ). Source report detail rows shown below.
      </p>

      {/* Attorney filter banner */}
      {attorneyParam && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Filtered to:</span>
          <span className="font-medium text-foreground">{attorneyParam}</span>
          <button
            onClick={clearAttorneyFilter}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" /> Clear filter
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <DashboardGrid cols={2}>
        <StatCard
          label="Missing Answers"
          value={attorneyParam
            ? `${fmtNum(detailRows.length)} of ${fmtNum(allDetailRows.length)}`
            : fmtNum(allDetailRows.length)}
          variant="glass"
        />
        <StatCard label="Showing" value={fmtNum(filteredRows.length)} variant="glass" />
      </DashboardGrid>

      {/* Matter Detail Table */}
      {!reportLoading && detailRows.length > 0 && (
        <section>
          <SectionHeader
            title="Matter Detail"
            subtitle={`${fmtNum(filteredRows.length)} of ${fmtNum(detailRows.length)} matters`}
          />
          <div className="mb-3">
            <input
              type="text"
              placeholder="Filter matters..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full max-w-sm px-3 py-1.5 text-sm rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
            />
          </div>
          <DataTable
            data={filteredRows}
            columns={allDetailColumns}
            keyField="_groupingLabel"
            maxRows={100}
          />
        </section>
      )}
      {!reportLoading && detailRows.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          {attorneyParam
            ? `No matters found for ${attorneyParam}.`
            : <>No detail rows available. Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">scripts/refresh-sf-data.sh</code> to fetch detail data.</>
          }
        </div>
      )}
    </div>
  );
}
