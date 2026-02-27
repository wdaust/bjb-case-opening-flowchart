import { useState, useCallback } from 'react';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.tsx';
import ProviderAssist from './provider-network/ProviderAssist.tsx';
import ProviderPortal from './provider-network/ProviderPortal.tsx';
import ReferClientForm from './provider-network/ReferClientForm.tsx';
import EducationLibrary from './provider-network/EducationLibrary.tsx';
import {
  INITIAL_CLIENTS,
  INITIAL_BILLING,
  type Provider,
  type Client,
  type BillingRecord,
} from '../data/providerNetworkData.ts';

export default function ProviderNetwork() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [billing, setBilling] = useState<BillingRecord[]>(INITIAL_BILLING);
  const [referredProviders, setReferredProviders] = useState<Provider[]>([]);

  const handleReferProvider = useCallback((provider: Provider) => {
    setReferredProviders(prev =>
      prev.some(p => p.id === provider.id) ? prev : [...prev, provider]
    );
  }, []);

  const handleRemoveProvider = useCallback((providerId: string) => {
    setReferredProviders(prev => prev.filter(p => p.id !== providerId));
  }, []);

  const handleAddClient = useCallback((client: Client) => {
    setClients(prev => [...prev, client]);
  }, []);

  const handleAddBilling = useCallback((record: BillingRecord) => {
    setBilling(prev => [...prev, record]);
  }, []);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: 'Development', path: '/performance-infrastructure' },
          { label: 'Provider Network' },
        ]}
      />
      <h1 className="text-2xl font-bold text-foreground">Provider Network</h1>

      <Tabs defaultValue="assist">
        <TabsList>
          <TabsTrigger value="assist">Provider Assist</TabsTrigger>
          <TabsTrigger value="portal">Provider Portal</TabsTrigger>
          <TabsTrigger value="refer">Client Referral</TabsTrigger>
          <TabsTrigger value="education">Education Library</TabsTrigger>
        </TabsList>

        <TabsContent value="assist">
          <ProviderAssist
            referredProviders={referredProviders}
            onReferProvider={handleReferProvider}
            onRemoveProvider={handleRemoveProvider}
          />
        </TabsContent>

        <TabsContent value="portal">
          <ProviderPortal
            clients={clients}
            billing={billing}
            onAddBilling={handleAddBilling}
          />
        </TabsContent>

        <TabsContent value="refer">
          <ReferClientForm onSubmit={handleAddClient} />
        </TabsContent>

        <TabsContent value="education">
          <EducationLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
