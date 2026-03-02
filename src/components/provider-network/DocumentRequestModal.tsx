import { useState } from 'react';
import { Button } from '../ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog.tsx';
import type { Client, DocumentRequest, DocumentPriority } from '../../data/providerNetworkData.ts';

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  onSubmit: (req: DocumentRequest) => void;
}

export function DocumentRequestModal({ open, onClose, clients, onSubmit }: Props) {
  const [clientId, setClientId] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<DocumentPriority>('standard');
  const [submitted, setSubmitted] = useState(false);

  function reset() {
    setClientId('');
    setMessage('');
    setPriority('standard');
    setSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !message) return;

    onSubmit({
      id: `dr-${Date.now()}`,
      clientId,
      message,
      priority,
      date: new Date().toISOString().split('T')[0],
      status: 'open',
    });

    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 1500);
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      reset();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Documents</DialogTitle>
          <DialogDescription>Submit a document request for a client</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-500 text-lg">&#10003;</span>
            </div>
            <p className="text-sm text-foreground font-medium">Request submitted successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Client *</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe the documents needed..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as DocumentPriority)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="standard">Standard</option>
                <option value="expedited">Expedited</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={!clientId || !message}>
              Submit Request
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
