import { DataTable, type Column } from '../dashboard/DataTable.tsx';
import type { ReportGrouping } from '../../types/salesforce.ts';

interface Props {
  groupings: ReportGrouping[];
  className?: string;
}

interface GroupRow {
  _key: string;
  label: string;
  [aggKey: string]: string | number | null;
}

export function ReportSummaryTable({ groupings, className }: Props) {
  if (groupings.length === 0) return null;

  const aggLabels = groupings[0]?.aggregates.map(a => a.label) ?? [];

  const columns: Column<GroupRow>[] = [
    { key: 'label', label: 'Group', sortable: true },
    ...aggLabels.map((label, i) => ({
      key: `agg_${i}`,
      label,
      sortable: true,
      render: (row: GroupRow) => {
        const v = row[`agg_${i}`];
        if (v === null || v === undefined) return '—';
        if (typeof v === 'number') return v.toLocaleString();
        return String(v);
      },
    })),
  ];

  const data: GroupRow[] = groupings.map(g => {
    const row: GroupRow = { _key: g.key, label: g.label };
    g.aggregates.forEach((a, i) => {
      row[`agg_${i}`] = a.value;
    });
    return row;
  });

  return (
    <DataTable
      data={data}
      columns={columns}
      keyField="_key"
      className={className}
    />
  );
}
