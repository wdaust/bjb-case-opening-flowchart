import { Fragment, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import type { ClientBillingSummary } from '../../data/providerNetworkData.ts';

interface Props {
  summary: ClientBillingSummary;
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  overdue: 'bg-red-500/20 text-red-400',
};

export function ClientBillingCard({ summary }: Props) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const totalDue = summary.totalPending + summary.totalOverdue;

  const handleDownload = useCallback((record: ClientBillingSummary['records'][0]) => {
    const lines = [
      'Invoice Details',
      '===============',
      `Invoice Number: ${record.invoiceNumber}`,
      `Date: ${record.date}`,
      `Client: ${summary.clientName}`,
      `Treatment Type: ${record.treatmentType}`,
      `Description: ${record.description}`,
      `Amount: $${record.amount.toLocaleString()}`,
      `Status: ${record.status}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.invoiceNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [summary.clientName]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-card-foreground">{summary.clientName}</h3>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
            {summary.injuryType}
          </span>
        </div>
        {totalDue > 0 && (
          <span className="text-sm font-bold text-red-400">
            ${totalDue.toLocaleString()} due
          </span>
        )}
      </div>

      {/* Invoice table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="px-4 py-2 text-left w-8"></th>
              <th className="px-4 py-2 text-left">Invoice #</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Treatment</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {summary.records.map(record => {
              const isExpanded = expandedRow === record.id;
              return (
                <Fragment key={record.id}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : record.id)}
                    className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2 text-muted-foreground">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-card-foreground">{record.invoiceNumber}</td>
                    <td className="px-4 py-2 text-card-foreground">{record.date}</td>
                    <td className="px-4 py-2 text-card-foreground">{record.treatmentType}</td>
                    <td className="px-4 py-2 text-right font-medium text-card-foreground">${record.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', STATUS_STYLES[record.status])}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-accent/10">
                      <td colSpan={6} className="px-8 py-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 text-sm">
                            <p className="text-card-foreground"><span className="text-muted-foreground">Description:</span> {record.description}</p>
                            <p className="text-card-foreground"><span className="text-muted-foreground">Invoice:</span> {record.invoiceNumber}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); handleDownload(record); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Download size={12} />
                            Download Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex justify-end">
        <span className="text-sm font-bold text-card-foreground">
          Total Billed: ${summary.totalBilled.toLocaleString()}
          {totalDue > 0 && (
            <span className="text-red-400 ml-4">Current Due: ${totalDue.toLocaleString()}</span>
          )}
        </span>
      </div>
    </div>
  );
}
