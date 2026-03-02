import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { StatCard } from '../dashboard/StatCard.tsx';
import { ClientBillingCard } from './ClientBillingCard.tsx';
import {
  type Client,
  type BillingRecord,
  getClientBillingSummary,
} from '../../data/providerNetworkData.ts';

type StatusFilter = 'all' | 'paid' | 'pending' | 'overdue';

interface Props {
  clients: Client[];
  billing: BillingRecord[];
}

export default function MedicalBilling({ clients, billing }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const summaries = useMemo(() => getClientBillingSummary(clients, billing), [clients, billing]);

  const totals = useMemo(() => {
    return {
      clients: summaries.length,
      billed: summaries.reduce((s, c) => s + c.totalBilled, 0),
      outstanding: summaries.reduce((s, c) => s + c.totalPending + c.totalOverdue, 0),
      overdueCount: summaries.filter(c => c.totalOverdue > 0).length,
    };
  }, [summaries]);

  const filtered = useMemo(() => {
    let result = summaries;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.clientName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.records.some(r => r.status === statusFilter));
    }
    // Sort by outstanding amount descending
    return [...result].sort((a, b) => (b.totalPending + b.totalOverdue) - (a.totalPending + a.totalOverdue));
  }, [summaries, search, statusFilter]);

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="space-y-6 mt-4">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={totals.clients} />
        <StatCard label="Total Billed" value={fmt(totals.billed)} />
        <StatCard
          label="Total Outstanding"
          value={fmt(totals.outstanding)}
          delta={`${summaries.filter(s => s.totalPending + s.totalOverdue > 0).length} clients`}
          deltaType="negative"
        />
        <StatCard
          label="Overdue Accounts"
          value={totals.overdueCount}
          delta={`${fmt(summaries.reduce((s, c) => s + c.totalOverdue, 0))} total`}
          deltaType="negative"
        />
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-card text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'paid', 'pending', 'overdue'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Client billing cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No clients match your search criteria.
          </div>
        ) : (
          filtered.map(summary => (
            <ClientBillingCard key={summary.clientId} summary={summary} />
          ))
        )}
      </div>
    </div>
  );
}
