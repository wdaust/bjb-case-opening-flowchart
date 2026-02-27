import { useState, useMemo } from 'react';
import { Search, FileText, Receipt } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import { Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog.tsx';
import { CaseProgressionBar } from './CaseProgressionBar.tsx';
import { BillingHistory } from './BillingHistory.tsx';
import { BillingSubmitModal } from './BillingSubmitModal.tsx';
import {
  PROVIDERS,
  CASE_STAGES,
  INJURY_TYPES,
  STAGE_COLORS,
  getClientBilling,
  getBillingTotal,
  type Client,
  type BillingRecord,
  type CaseStage,
  type InjuryType,
} from '../../data/providerNetworkData.ts';

interface Props {
  clients: Client[];
  billing: BillingRecord[];
  onAddBilling: (record: BillingRecord) => void;
}

function getProviderName(providerId: string): string {
  return PROVIDERS.find(p => p.id === providerId)?.name ?? '—';
}

export function ClientRegistry({ clients, billing, onAddBilling }: Props) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [billingClient, setBillingClient] = useState<Client | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<CaseStage | ''>('');
  const [injuryFilter, setInjuryFilter] = useState<InjuryType | ''>('');

  const filtered = useMemo(() => {
    let list = clients;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.address.toLowerCase().includes(q) ||
          getProviderName(c.providerId).toLowerCase().includes(q)
      );
    }

    if (stageFilter) {
      list = list.filter(c => c.stage === stageFilter);
    }

    if (injuryFilter) {
      list = list.filter(c => c.injuryType === injuryFilter);
    }

    return list;
  }, [clients, search, stageFilter, injuryFilter]);

  const clientBilling = selectedClient ? getClientBilling(selectedClient.id, billing) : [];

  const selectClasses =
    'h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground shrink-0">Client Registry</h3>
        <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-7 h-8 text-xs"
            />
          </div>

          {/* Stage filter */}
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value as CaseStage | '')}
            className={selectClasses}
          >
            <option value="">All Stages</option>
            {CASE_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Injury type filter */}
          <select
            value={injuryFilter}
            onChange={e => setInjuryFilter(e.target.value as InjuryType | '')}
            className={selectClasses}
          >
            <option value="">All Injuries</option>
            {INJURY_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {(search || stageFilter || injuryFilter) && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} of {clients.length} clients
          </span>
          {(search || stageFilter || injuryFilter) && (
            <button
              onClick={() => { setSearch(''); setStageFilter(''); setInjuryFilter(''); }}
              className="text-[10px] text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Phone</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Injury</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Provider</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Referral Date</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Stage</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Billed</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client, i) => {
              const clientTotal = getBillingTotal(getClientBilling(client.id, billing));
              const billCount = getClientBilling(client.id, billing).length;
              const pdfCount = getClientBilling(client.id, billing).filter(b => b.fileName).length;

              return (
                <tr
                  key={client.id}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    i % 2 === 0 ? 'bg-card' : 'bg-table-stripe',
                  )}
                >
                  <td
                    onClick={() => setSelectedClient(client)}
                    className="py-2 px-3 text-foreground text-xs font-medium cursor-pointer hover:underline"
                  >
                    {client.name}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-xs whitespace-nowrap">{client.phone}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{client.injuryType}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs whitespace-nowrap">{getProviderName(client.providerId)}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs whitespace-nowrap">{client.referralDate}</td>
                  <td className="py-2 px-3">
                    <CaseProgressionBar currentStage={client.stage} compact />
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <span className="text-xs font-medium text-foreground">
                      ${clientTotal.toLocaleString()}
                    </span>
                    {billCount > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({billCount}{pdfCount > 0 && <> &middot; <FileText size={8} className="inline text-red-400" /> {pdfCount}</>})
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setBillingClient(client)}
                    >
                      <Receipt size={10} className="mr-1" />
                      Submit Bill
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                  {clients.length === 0 ? 'No clients referred yet' : 'No clients match your filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Client detail modal */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClient?.name}</DialogTitle>
            <DialogDescription>{selectedClient?.injuryType} &middot; {selectedClient?.treatmentNeeded}</DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="text-foreground">{selectedClient.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="text-foreground">{selectedClient.address}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Referred:</span>{' '}
                  <span className="text-foreground">{selectedClient.referralDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>{' '}
                  <span className="text-foreground">{getProviderName(selectedClient.providerId)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stage:</span>{' '}
                  <Badge className={cn('text-[10px] ml-1', STAGE_COLORS[selectedClient.stage])}>
                    {selectedClient.stage}
                  </Badge>
                </div>
                {selectedClient.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes:</span>{' '}
                    <span className="text-foreground">{selectedClient.notes}</span>
                  </div>
                )}
              </div>

              <CaseProgressionBar currentStage={selectedClient.stage} />

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">Billing History</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSelectedClient(null);
                      setBillingClient(selectedClient);
                    }}
                  >
                    <Receipt size={12} className="mr-1" />
                    Submit Bill
                  </Button>
                </div>
                <BillingHistory records={clientBilling} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Billing submission modal */}
      <BillingSubmitModal
        client={billingClient}
        onClose={() => setBillingClient(null)}
        onSubmit={onAddBilling}
      />
    </div>
  );
}
