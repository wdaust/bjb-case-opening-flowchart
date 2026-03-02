import { useState } from 'react';
import { UserPlus, Phone, MessageSquare, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog.tsx';
import { SectionHeader } from '../dashboard/SectionHeader.tsx';
import { StatCard } from '../dashboard/StatCard.tsx';
import { DashboardGrid } from '../dashboard/DashboardGrid.tsx';
import { Button } from '../ui/button.tsx';
import ReferClientForm from '../../pages/provider-network/ReferClientForm.tsx';
import {
  type Client,
  type ReferralTracking,
  getReferralStageCounts,
  REFERRAL_STAGES,
  REFERRAL_STAGE_LABELS,
  REFERRAL_STAGE_COLORS,
} from '../../data/providerNetworkData.ts';

interface Props {
  clients: Client[];
  referralTracking: ReferralTracking[];
  onAddClient: (client: Client) => void;
}

export default function ReferralTracker({ clients, referralTracking, onAddClient }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const stageCounts = getReferralStageCounts(referralTracking);

  function getClient(clientId: string) {
    return clients.find(c => c.id === clientId);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Client Referrals"
        subtitle="Track referral pipeline and client progress"
        actions={
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <UserPlus size={16} className="mr-1.5" />
            New Referral
          </Button>
        }
      />

      <DashboardGrid cols={4}>
        {REFERRAL_STAGES.map(stage => (
          <StatCard
            key={stage}
            label={REFERRAL_STAGE_LABELS[stage]}
            value={stageCounts[stage]}
            className={REFERRAL_STAGE_COLORS[stage]}
          />
        ))}
      </DashboardGrid>

      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Injury Type</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Calls</th>
              <th className="px-4 py-3 font-medium">Texts</th>
              <th className="px-4 py-3 font-medium">Emails</th>
              <th className="px-4 py-3 font-medium">Appointment Date</th>
            </tr>
          </thead>
          <tbody>
            {referralTracking.map(rt => {
              const client = getClient(rt.clientId);
              return (
                <tr key={rt.clientId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{client?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client?.injuryType ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${REFERRAL_STAGE_COLORS[rt.stage]}`}>
                      {REFERRAL_STAGE_LABELS[rt.stage]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Phone size={14} /> {rt.calls}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MessageSquare size={14} /> {rt.texts}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Mail size={14} /> {rt.emails}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{rt.appointmentDate ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Referral</DialogTitle>
          </DialogHeader>
          <ReferClientForm
            embedded={true}
            onSubmit={(client) => {
              onAddClient(client);
              setDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
