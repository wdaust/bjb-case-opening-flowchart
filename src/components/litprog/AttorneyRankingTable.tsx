import { DataTable, type Column } from '../dashboard/DataTable';
import type { AttorneyScore, StageName } from '../../utils/litProgMetrics';

interface Props {
  scores: AttorneyScore[];
  stage: StageName;
  onSelectAttorney: (attorney: string) => void;
}

interface RankRow {
  rank: number;
  attorney: string;
  total: number;
  overdue: number;
  pctTimely: number;
  rag: string;
  [key: string]: unknown;
}

const RAG_BADGE: Record<string, string> = {
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export function AttorneyRankingTable({ scores, stage, onSelectAttorney }: Props) {
  // Build ranked rows sorted by overdue desc then total desc
  const rows: RankRow[] = scores
    .map(s => {
      const m = s.stages[stage];
      return {
        rank: 0,
        attorney: s.attorney,
        total: m.primary,
        overdue: m.overdue,
        pctTimely: m.pctTimely,
        rag: m.rag,
        ...m.subMetrics,
      };
    })
    .filter(r => r.total > 0)
    .sort((a, b) => b.overdue - a.overdue || b.total - a.total)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  // Build stage-specific sub-metric columns
  const subMetricKeys = rows.length > 0
    ? Object.keys(rows[0]).filter(k => !['rank', 'attorney', 'total', 'overdue', 'pctTimely', 'rag'].includes(k))
    : [];

  const columns: Column<RankRow>[] = [
    { key: 'rank', label: '#', className: 'w-12' },
    { key: 'attorney', label: 'Attorney' },
    { key: 'total', label: 'Total' },
    { key: 'overdue', label: 'Overdue' },
    ...subMetricKeys.map(k => ({ key: k, label: k })),
    {
      key: 'pctTimely', label: '% Timely',
      render: (r: RankRow) => <span className="tabular-nums">{r.pctTimely}%</span>,
    },
    {
      key: 'rag', label: 'RAG',
      render: (r: RankRow) => (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RAG_BADGE[r.rag] ?? RAG_BADGE.green}`}>
          {r.rag.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      keyField="attorney"
      onRowClick={(row) => onSelectAttorney(row.attorney)}
      maxRows={50}
    />
  );
}
