import { useMemo } from 'react';
import { SectionHeader } from '../../components/dashboard/SectionHeader.tsx';
import { StatCard } from '../../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../../components/dashboard/DashboardGrid.tsx';
import { ClientRegistry } from '../../components/provider-network/ClientRegistry.tsx';
import { getStageCounts, CASE_STAGES, STAGE_COLORS, type Client, type BillingRecord } from '../../data/providerNetworkData.ts';

interface Props {
  clients: Client[];
  billing: BillingRecord[];
  onAddBilling: (record: BillingRecord) => void;
}

export default function ProviderPortal({ clients, billing, onAddBilling }: Props) {
  const stageCounts = useMemo(() => getStageCounts(clients), [clients]);

  return (
    <div className="space-y-6 mt-4">
      <SectionHeader
        title="Provider Portal — Dr. Sarah Chen, MD"
        subtitle="Manage clients and billing"
      />

      <DashboardGrid cols={5}>
        {CASE_STAGES.map(stage => (
          <StatCard
            key={stage}
            label={stage}
            value={stageCounts[stage]}
            className={STAGE_COLORS[stage]}
          />
        ))}
      </DashboardGrid>

      <ClientRegistry clients={clients} billing={billing} onAddBilling={onAddBilling} />
    </div>
  );
}
