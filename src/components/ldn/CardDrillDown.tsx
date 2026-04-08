import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog.tsx';
import { DataTable } from '../dashboard/DataTable';
import type { Column } from '../dashboard/DataTable';
import type { DrillRow, DrillColumn } from '../../utils/ldnMetrics';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: DrillRow[];
  columns: DrillColumn[];
}

export function CardDrillDown({ open, onClose, title, rows, columns }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(row =>
      columns.some(col => {
        const v = row[col.key];
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [rows, search, columns]);

  const tableColumns: Column<DrillRow>[] = columns.map(c => ({
    key: c.key,
    label: c.label,
    render: (row: DrillRow) => {
      const v = row[c.key];
      if (v == null || v === '') return <span className="text-muted-foreground">-</span>;
      return <span>{String(v)}</span>;
    },
  }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-accent text-xs font-medium text-foreground">
                {filtered.length} of {rows.length} rows
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search across all columns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          <DataTable
            data={filtered}
            columns={tableColumns}
            keyField={columns[0]?.key ?? 'Display Name'}
            maxRows={100}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
