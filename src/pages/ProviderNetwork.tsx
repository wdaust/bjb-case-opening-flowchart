import { useState, useCallback } from 'react';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.tsx';
import ProviderAssist from './provider-network/ProviderAssist.tsx';
import ProviderPortal from './provider-network/ProviderPortal.tsx';
import EducationLibrary from './provider-network/EducationLibrary.tsx';
import MedicalBilling from '../components/provider-network/MedicalBilling.tsx';
import ReferralTracker from '../components/provider-network/ReferralTracker.tsx';
import {
  INITIAL_CLIENTS,
  INITIAL_BILLING,
  INITIAL_REFERRAL_TRACKING,
  INITIAL_DOCUMENT_REQUESTS,
  type Provider,
  type Client,
  type BillingRecord,
  type ReferralTracking,
  type DocumentRequest,
} from '../data/providerNetworkData.ts';

export default function ProviderNetwork() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [billing, setBilling] = useState<BillingRecord[]>(INITIAL_BILLING);
  const [referredProviders, setReferredProviders] = useState<Provider[]>([]);
  const [referralTracking] = useState<ReferralTracking[]>(INITIAL_REFERRAL_TRACKING);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(INITIAL_DOCUMENT_REQUESTS);

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

  const handleAddDocumentRequest = useCallback((req: DocumentRequest) => {
    setDocumentRequests(prev => [...prev, req]);
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

      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals">Client Referrals</TabsTrigger>
          <TabsTrigger value="assist">Provider Assist</TabsTrigger>
          <TabsTrigger value="portal">Provider Portal</TabsTrigger>
          <TabsTrigger value="education">Education Library</TabsTrigger>
          <TabsTrigger value="billing">Medical Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <ReferralTracker
            clients={clients}
            referralTracking={referralTracking}
            onAddClient={handleAddClient}
          />
        </TabsContent>

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
            documentRequests={documentRequests}
            onAddDocumentRequest={handleAddDocumentRequest}
          />
        </TabsContent>

        <TabsContent value="education">
          <EducationLibrary />
        </TabsContent>

        <TabsContent value="billing">
          <MedicalBilling clients={clients} billing={billing} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
