import { useState, useEffect } from 'react';
import type { Task, SectionData } from '../types/flowchart.ts';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { X, ChevronRight, Trash2 } from 'lucide-react';

interface Props {
  task: Task | null;
  section: SectionData;
  isOpen: boolean;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isNew?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function NodeEditorPanel({ task, section, isOpen, onSave, onDelete, onClose, isNew }: Props) {
  const [form, setForm] = useState<Task>({
    id: '', label: '', assignedTo: '', sla: '', phase: '',
    phaseClass: '', quickAction: '', style: Object.keys(section.styles)[0] || '',
    connectsTo: [], notes: '',
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({ ...task });
    } else if (isNew) {
      setForm({
        id: '', label: '', assignedTo: '', sla: '', phase: '',
        phaseClass: '', quickAction: '', style: Object.keys(section.styles)[0] || '',
        connectsTo: [], notes: '',
      });
    }
  }, [task, isNew, section.styles]);

  if (!isOpen) return null;

  const styles = Object.keys(section.styles);
  const hasFunction = section.tableColumns?.includes('Function');

  const handleSave = () => {
    if (!form.id || !form.label) return;
    onSave(form);
  };

  const update = (field: keyof Task, value: string | string[]) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
      <div className="fixed top-0 right-0 w-[480px] max-w-[90vw] h-screen bg-background z-50 shadow-2xl flex flex-col overflow-hidden border-l border-border">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-foreground m-0">
              {isNew ? 'Add New Task' : 'Edit Task'}
            </h3>
            {!isNew && form.id && (
              <span className="text-xs text-muted-foreground">ID: {form.id}</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5">
          {isNew && (
            <Field label="Task ID">
              <Input
                value={form.id}
                onChange={e => update('id', e.target.value)}
                placeholder="e.g. T1, NP2"
              />
            </Field>
          )}

          <Field label="Description">
            <textarea
              value={form.label}
              onChange={e => update('label', e.target.value)}
              rows={3}
              placeholder="Task description (use Enter for line breaks)"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[70px]"
            />
          </Field>

          <Field label="Color Category">
            <div className="flex flex-wrap gap-1.5">
              {styles.map(s => {
                const st = section.styles[s];
                const isSelected = form.style === s;
                return (
                  <button
                    key={s}
                    onClick={() => update('style', s)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-all border"
                    style={{
                      borderColor: isSelected ? st.stroke : 'hsl(var(--border))',
                      borderWidth: isSelected ? 2 : 1,
                      background: isSelected ? st.fill : 'hsl(var(--secondary))',
                      color: isSelected ? st.color : 'hsl(var(--foreground))',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ background: st.fill, border: `1px solid ${st.stroke}` }}
                    />
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Assigned To">
            <Input value={form.assignedTo} onChange={e => update('assignedTo', e.target.value)} placeholder="e.g. Paralegal / Legal Asst" />
          </Field>

          <Field label="Deadline / SLA">
            <Input value={form.sla} onChange={e => update('sla', e.target.value)} placeholder="e.g. 1 hour from OA" />
          </Field>

          <Field label="Phase">
            <Input value={form.phase} onChange={e => update('phase', e.target.value)} placeholder="e.g. Setup, Review" />
          </Field>

          <Field label="Quick Action">
            <Input value={form.quickAction} onChange={e => update('quickAction', e.target.value)} placeholder="Quick action panel name" />
          </Field>

          <Field label="Icon (emoji)">
            <Input value={form.emoji || ''} onChange={e => update('emoji', e.target.value)} placeholder="e.g. 📋 📞 ✅" className="w-28" />
          </Field>

          {hasFunction && (
            <Field label="Function">
              <Input value={form.function || ''} onChange={e => update('function', e.target.value)} />
            </Field>
          )}

          <Field label="Notes">
            <textarea
              value={form.notes || ''}
              onChange={e => update('notes', e.target.value)}
              rows={3}
              placeholder="Internal notes about this task..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[60px]"
            />
          </Field>

          {/* Advanced section */}
          <div className="border-t border-border pt-3">
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="bg-transparent border-none cursor-pointer text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 p-0 hover:text-foreground transition-colors"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${advancedOpen ? 'rotate-90' : ''}`} />
              Advanced
            </button>
            {advancedOpen && (
              <div className="mt-3">
                <Field label="Phase Tag Style">
                  <Input value={form.phaseClass} onChange={e => update('phaseClass', e.target.value)} placeholder="e.g. phase-setup" />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border shrink-0">
          <Button onClick={handleSave}>
            {isNew ? 'Add Task' : 'Save Changes'}
          </Button>
          {!isNew && (
            <Button variant="destructive" onClick={() => onDelete(form.id)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
