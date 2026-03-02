import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { SectionHeader } from '../../components/dashboard/SectionHeader.tsx';
import { StatCard } from '../../components/dashboard/StatCard.tsx';
import { DashboardGrid } from '../../components/dashboard/DashboardGrid.tsx';
import { ClientRegistry } from '../../components/provider-network/ClientRegistry.tsx';
import { DocumentRequestModal } from '../../components/provider-network/DocumentRequestModal.tsx';
import { DocumentRequestList } from '../../components/provider-network/DocumentRequestList.tsx';
import { Button } from '../../components/ui/button.tsx';
import { getStageCounts, CASE_STAGES, STAGE_COLORS, type Client, type BillingRecord, type DocumentRequest } from '../../data/providerNetworkData.ts';

interface Props {
  clients: Client[];
  billing: BillingRecord[];
  onAddBilling: (record: BillingRecord) => void;
  documentRequests: DocumentRequest[];
  onAddDocumentRequest: (req: DocumentRequest) => void;
}

export default function ProviderPortal({ clients, billing, onAddBilling, documentRequests, onAddDocumentRequest }: Props) {
  const stageCounts = useMemo(() => getStageCounts(clients), [clients]);
  const [docModalOpen, setDocModalOpen] = useState(false);

  return (
    <div className="space-y-6 mt-4">
      <SectionHeader
        title="Provider Portal — Dr. Sarah Chen, MD"
        subtitle="Manage clients and billing"
        actions={
          <Button variant="outline" size="sm" onClick={() => setDocModalOpen(true)}>
            <FileText size={14} />
            Open Request
          </Button>
        }
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

      <DocumentRequestList requests={documentRequests} clients={clients} />

      <DocumentRequestModal
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        clients={clients}
        onSubmit={onAddDocumentRequest}
      />
    </div>
  );
}
