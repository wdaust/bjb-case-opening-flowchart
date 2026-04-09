import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { HeroSection } from '../components/dashboard/HeroSection';
import { HeroTitle } from '../components/dashboard/HeroTitle';
import { DataTable } from '../components/dashboard/DataTable';
import { useSalesforceReport } from '../hooks/useSalesforceReport';
import { COMPLAINTS_REPORT_ID } from '../data/sfReportIds';
import type { ReportSummaryResponse } from '../types/salesforce';
import { cn } from '../utils/cn';

type Row = Record<string, unknown>;

const BLOCKER_INSIGHTS: Record<string, string> = {
  'Public Entity Waiting Period': 'Waiting period required before filing against public entities. Track expiration dates.',
  'Close to Resolution': 'Case approaching settlement — complaint filing may be unnecessary. Monitor closely.',
  'Missing Medical Records': 'Cannot file without complete medical documentation. Expedite records requests.',
  'Missing Case Facts': 'Insufficient facts to draft complaint. Schedule client interview or follow up on investigation.',
  'Maritime': 'Maritime jurisdiction requires specialized complaint. Coordinate with maritime counsel.',
  'Waiting to Transfer/Cut Conflict': 'Conflict check or transfer pending. Follow up on conflict resolution timeline.',
  'Estate Paperwork': 'Waiting on estate/probate paperwork. Track court filings and deadlines.',
};

function getInsight(blockerType: string): string {
  for (const [key, insight] of Object.entries(BLOCKER_INSIGHTS)) {
    if (blockerType.toLowerCase().includes(key.toLowerCase())) return insight;
  }
  return 'Review blocker and determine action plan.';
}

interface BlockerGroup {
  type: string;
  count: number;
  avgDays: number;
  insight: string;
}

export default function BlockerReport() {
  const navigate = useNavigate();
  const { data: complaints, loading } = useSalesforceReport<ReportSummaryResponse>({
    id: COMPLAINTS_REPORT_ID, type: 'report', mode: 'full',
  });

  const { groups, blockedRows } = useMemo(() => {
    const allRows = (complaints?.detailRows ?? []) as Row[];
    // Filter to Pre-Lit rows with blockers
    const blocked = allRows.filter(r => {
      const status = r['PI Status'];
      if (status && status !== 'Pre-Lit') return false;
      const b = r['Blocker to Filing Complaint'] ?? r['Blocker'];
      return b && b !== '-';
    });

    // Group by blocker type
    const byType = new Map<string, Row[]>();
    for (const r of blocked) {
      const type = String(r['Blocker to Filing Complaint'] ?? r['Blocker'] ?? 'Unknown');
      const existing = byType.get(type) ?? [];
      existing.push(r);
      byType.set(type, existing);
    }

    const groupList: BlockerGroup[] = [];
    for (const [type, rows] of byType) {
      const daysArr = rows.map(r => {
        const v = r['Date Assigned to Team to Today'];
        const num = typeof v === 'number' ? v : Number(v);
        return isNaN(num) ? null : num;
      }).filter((d): d is number => d != null);
      const avg = daysArr.length ? Math.round(daysArr.reduce((a, b) => a + b, 0) / daysArr.length) : 0;
      groupList.push({ type, count: rows.length, avgDays: avg, insight: getInsight(type) });
    }
    groupList.sort((a, b) => b.count - a.count);

    return { groups: groupList, blockedRows: blocked };
  }, [complaints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading blocker data...</span>
      </div>
    );
  }

  const summaryColumns = [
    { key: 'type', label: 'Blocker Type' },
    { key: 'count', label: 'Count', render: (row: BlockerGroup) => <span className="font-bold tabular-nums">{row.count}</span> },
    { key: 'avgDays', label: 'Avg Days', render: (row: BlockerGroup) => <span className="tabular-nums">{row.avgDays}d</span> },
    { key: 'insight', label: 'Analysis', render: (row: BlockerGroup) => <span className="text-xs text-muted-foreground">{row.insight}</span> },
  ];

  const detailColumns = [
    { key: 'Display Name', label: 'Display Name' },
    { key: 'Matter Name', label: 'Matter Name' },
    { key: 'Blocker to Filing Complaint', label: 'Blocker', render: (row: Row) => <span>{String(row['Blocker to Filing Complaint'] ?? row['Blocker'] ?? '-')}</span> },
    { key: 'Date Assigned to Team to Today', label: 'Days Assigned', render: (row: Row) => <span className="tabular-nums">{String(row['Date Assigned to Team to Today'] ?? '-')}</span> },
    { key: 'Date Assigned To Litigation Unit', label: 'Assigned Date' },
    { key: 'PI Status', label: 'PI Status' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      <HeroSection>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ldm')}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to LDM</span>
          </button>
          <HeroTitle title="Blocker Report" subtitle="Pre-Lit complaints with documented blockers preventing filing" />
        </div>
      </HeroSection>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Blocked</div>
          <div className="text-2xl font-bold tabular-nums">{blockedRows.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Blocker Types</div>
          <div className="text-2xl font-bold tabular-nums">{groups.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Days on Case</div>
          <div className="text-2xl font-bold tabular-nums">
            {blockedRows.length ? (() => {
              const days = blockedRows.map(r => {
                const v = r['Date Assigned to Team to Today'];
                const num = typeof v === 'number' ? v : Number(v);
                return isNaN(num) ? null : num;
              }).filter((d): d is number => d != null);
              return days.length ? `${Math.round(days.reduce((a, b) => a + b, 0) / days.length)}d` : '—';
            })() : '—'}
          </div>
        </div>
      </div>

      {/* Blocker type breakdown */}
      <section className={cn('rounded-xl border border-border bg-card/50 p-5')}>
        <h3 className="text-sm font-medium text-foreground mb-3">By Blocker Type</h3>
        <DataTable
          data={groups}
          columns={summaryColumns}
          keyField="type"
          maxRows={50}
        />
      </section>

      {/* All blocked cases */}
      <section className={cn('rounded-xl border border-border bg-card/50 p-5')}>
        <h3 className="text-sm font-medium text-foreground mb-3">All Blocked Cases ({blockedRows.length})</h3>
        <DataTable
          data={blockedRows as Record<string, unknown>[]}
          columns={detailColumns}
          keyField="Matter Name"
          maxRows={100}
        />
      </section>
    </div>
  );
}
