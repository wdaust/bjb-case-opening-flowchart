import { cn } from '../../utils/cn.ts';
import type { DocumentRequest, Client } from '../../data/providerNetworkData.ts';
import { PRIORITY_COLORS, DOC_STATUS_COLORS } from '../../data/providerNetworkData.ts';

interface Props {
  requests: DocumentRequest[];
  clients: Client[];
}

export function DocumentRequestList({ requests, clients }: Props) {
  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  const sorted = [...requests].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Document Requests</h3>
        <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {requests.length}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No document requests yet</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Message</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Priority</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(req => (
                <tr key={req.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-foreground">{clientMap.get(req.clientId) ?? req.clientId}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {req.message.length > 60 ? req.message.slice(0, 60) + '...' : req.message}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_COLORS[req.priority])}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{req.date}</td>
                  <td className="px-3 py-2">
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', DOC_STATUS_COLORS[req.status])}>
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
