import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { SectionHeader } from '../../components/dashboard/SectionHeader.tsx';
import { INJURY_TYPES, PROVIDERS, type Client, type InjuryType } from '../../data/providerNetworkData.ts';

interface Props {
  onSubmit: (client: Client) => void;
}

export default function ReferClientForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [injuryType, setInjuryType] = useState<InjuryType>('Auto Accident');
  const [treatmentNeeded, setTreatmentNeeded] = useState('');
  const [providerId, setProviderId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      injuryType,
      treatmentNeeded: treatmentNeeded.trim(),
      stage: 'Case Opened',
      referralDate: new Date().toISOString().split('T')[0],
      providerId,
      notes: notes.trim() || undefined,
    };

    onSubmit(newClient);
    setSubmitted(true);
    setName('');
    setPhone('');
    setAddress('');
    setInjuryType('Auto Accident');
    setTreatmentNeeded('');
    setProviderId('');
    setNotes('');

    setTimeout(() => setSubmitted(false), 3000);
  }

  const selectClasses = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  return (
    <div className="space-y-6 mt-4">
      <SectionHeader title="Client Referral" subtitle="Submit a new client referral to the provider network" />

      <div className="max-w-xl">
        <div className="rounded-lg border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Client Name *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mobile Phone *</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(201) 555-0000" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, State" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Injury Type</label>
              <select
                value={injuryType}
                onChange={e => setInjuryType(e.target.value as InjuryType)}
                className={selectClasses}
              >
                {INJURY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Referring Provider</label>
              <select
                value={providerId}
                onChange={e => setProviderId(e.target.value)}
                className={selectClasses}
              >
                <option value="">— Select Provider —</option>
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Treatment Needed</label>
              <Input value={treatmentNeeded} onChange={e => setTreatmentNeeded(e.target.value)} placeholder="e.g., Physical therapy, MRI" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <Button type="submit" className="w-full">
              Submit Referral
            </Button>
          </form>

          {submitted && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <span className="text-sm text-emerald-400">Client referral submitted successfully! They are now visible in the Provider Portal.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
