import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import { Input } from '../ui/input.tsx';
import { Button } from '../ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog.tsx';
import type { Client, BillingRecord } from '../../data/providerNetworkData.ts';

interface Props {
  client: Client | null;
  onClose: () => void;
  onSubmit: (record: BillingRecord) => void;
}

export function BillingSubmitModal({ client, onClose, onSubmit }: Props) {
  const [date, setDate] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setFileName(file.name);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function reset() {
    setDate('');
    setTreatmentType('');
    setDescription('');
    setAmount('');
    setFileName('');
    setSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !date || !treatmentType || !amount) return;

    onSubmit({
      id: `b-${Date.now()}`,
      clientId: client.id,
      date,
      treatmentType,
      description,
      amount: parseFloat(amount),
      fileName: fileName || undefined,
    });

    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 1500);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset();
      onClose();
    }
  }

  return (
    <Dialog open={!!client} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Billing</DialogTitle>
          <DialogDescription>
            {client?.name} &middot; {client?.injuryType}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-500 text-lg">&#10003;</span>
            </div>
            <p className="text-sm text-foreground font-medium">Bill submitted successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Date *</label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Treatment Type *</label>
                <Input
                  value={treatmentType}
                  onChange={e => setTreatmentType(e.target.value)}
                  placeholder="e.g., Initial Exam, Adjustment"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the treatment or services rendered..."
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-xs pl-7"
                />
              </div>
            </div>

            {/* PDF upload area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Billing PDF</label>
              {fileName ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <FileText size={16} className="text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{fileName}</p>
                    <p className="text-[10px] text-muted-foreground">PDF attached</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileName('')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    'rounded-lg border-2 border-dashed px-4 py-5 flex flex-col items-center gap-1.5 cursor-pointer transition-colors',
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <Upload
                    size={20}
                    className={cn(
                      'transition-colors',
                      dragActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="font-medium text-foreground">Drop PDF here</span> or click to browse
                  </p>
                  <p className="text-[10px] text-muted-foreground">PDF files only</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!date || !treatmentType || !amount}>
              Submit Bill
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
