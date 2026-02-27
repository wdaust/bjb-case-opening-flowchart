import { FileText } from 'lucide-react';
import { getBillingTotal, type BillingRecord } from '../../data/providerNetworkData.ts';

interface Props {
  records: BillingRecord[];
}

export function BillingHistory({ records }: Props) {
  const total = getBillingTotal(records);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Treatment</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Description</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">PDF</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr
                key={r.id}
                className={i % 2 === 0 ? 'bg-card' : 'bg-table-stripe'}
              >
                <td className="py-2 px-3 text-foreground text-xs whitespace-nowrap">{r.date}</td>
                <td className="py-2 px-3 text-foreground text-xs whitespace-nowrap">{r.treatmentType}</td>
                <td className="py-2 px-3 text-muted-foreground text-xs">{r.description}</td>
                <td className="py-2 px-3 text-foreground text-xs text-right font-medium">${r.amount.toLocaleString()}</td>
                <td className="py-2 px-3 text-center">
                  {r.fileName ? (
                    <span title={r.fileName}><FileText size={12} className="text-red-400 inline-block" /></span>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                  No billing records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {records.length > 0 && (
        <div className="flex justify-end">
          <span className="text-sm font-semibold text-foreground">
            Total: ${total.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
