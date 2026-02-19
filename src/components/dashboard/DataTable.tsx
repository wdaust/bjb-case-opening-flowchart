import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  keyField: string;
  onRowClick?: (row: T) => void;
  maxRows?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({ data, columns, keyField, onRowClick, maxRows, className }: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const displayed = maxRows ? sorted.slice(0, maxRows) : sorted;

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                className={cn(
                  "text-left py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap",
                  col.sortable !== false && "cursor-pointer hover:text-foreground select-none",
                  col.className,
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key && (
                    sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayed.map((row, i) => (
            <tr
              key={row[keyField] ?? i}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-border last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-accent/50",
                i % 2 === 0 ? "bg-card" : "bg-table-stripe",
              )}
            >
              {columns.map(col => (
                <td key={col.key} className={cn("py-2 px-3 text-foreground whitespace-nowrap", col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {displayed.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {maxRows && data.length > maxRows && (
        <div className="py-2 px-3 text-xs text-muted-foreground text-center border-t border-border bg-muted/30">
          Showing {maxRows} of {data.length} rows
        </div>
      )}
    </div>
  );
}
