import { useState, useEffect } from 'react';
import type { Task, SectionData } from '../types/flowchart.ts';

interface Props {
  task: Task | null;
  section: SectionData;
  isOpen: boolean;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isNew?: boolean;
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
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)', zIndex: 999,
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 480, maxWidth: '90vw',
        height: '100vh', background: '#fff', zIndex: 1000,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.2)', display: 'flex',
        flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header with Task ID */}
        <div style={{
          padding: '16px 20px', background: section.themeColor, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {isNew ? 'Add New Task' : 'Edit Task'}
              </h3>
              {!isNew && form.id && (
                <span style={{ fontSize: 12, opacity: 0.85 }}>ID: {form.id}</span>
              )}
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#fff',
              fontSize: 24, cursor: 'pointer',
            }}>&times;</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {/* Task ID — only for new tasks */}
          {isNew && (
            <Field label="Task ID">
              <input
                value={form.id}
                onChange={e => update('id', e.target.value)}
                placeholder="e.g. T1, NP2"
                style={inputStyle}
              />
            </Field>
          )}

          {/* Description — full width textarea */}
          <Field label="Description">
            <textarea
              value={form.label}
              onChange={e => update('label', e.target.value)}
              rows={3}
              placeholder="Task description (use Enter for line breaks)"
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 70 }}
            />
          </Field>

          {/* Color Category with swatches */}
          <Field label="Color Category">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {styles.map(s => {
                const st = section.styles[s];
                const isSelected = form.style === s;
                return (
                  <button
                    key={s}
                    onClick={() => update('style', s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                      border: isSelected ? `2px solid ${st.stroke}` : '1px solid #ddd',
                      background: isSelected ? st.fill : '#fff',
                      color: isSelected ? st.color : '#333',
                      fontSize: 12, fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: 12, height: 12, borderRadius: 3,
                      background: st.fill, border: `1px solid ${st.stroke}`,
                      flexShrink: 0,
                    }} />
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Primary fields — single column with spacing */}
          <Field label="Assigned To">
            <input
              value={form.assignedTo}
              onChange={e => update('assignedTo', e.target.value)}
              placeholder="e.g. Paralegal / Legal Asst"
              style={inputStyle}
            />
          </Field>

          <Field label="Deadline / SLA">
            <input
              value={form.sla}
              onChange={e => update('sla', e.target.value)}
              placeholder="e.g. 1 hour from OA"
              style={inputStyle}
            />
          </Field>

          <Field label="Phase">
            <input
              value={form.phase}
              onChange={e => update('phase', e.target.value)}
              placeholder="e.g. Setup, Review"
              style={inputStyle}
            />
          </Field>

          <Field label="Quick Action">
            <input
              value={form.quickAction}
              onChange={e => update('quickAction', e.target.value)}
              placeholder="Quick action panel name"
              style={inputStyle}
            />
          </Field>

          <Field label="Icon (emoji)">
            <input
              value={form.emoji || ''}
              onChange={e => update('emoji', e.target.value)}
              placeholder="e.g. 📋 📞 ✅"
              style={{ ...inputStyle, width: 120 }}
            />
          </Field>

          {hasFunction && (
            <Field label="Function">
              <input
                value={form.function || ''}
                onChange={e => update('function', e.target.value)}
                style={inputStyle}
              />
            </Field>
          )}

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes || ''}
              onChange={e => update('notes', e.target.value)}
              rows={3}
              placeholder="Internal notes about this task..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 60 }}
            />
          </Field>

          {/* Advanced section — collapsible */}
          <div style={{ marginTop: 16, borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 4, padding: 0,
              }}
            >
              <span style={{ transform: advancedOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>
                ▶
              </span>
              Advanced
            </button>
            {advancedOpen && (
              <div style={{ marginTop: 10 }}>
                <Field label="Phase Tag Style">
                  <input
                    value={form.phaseClass}
                    onChange={e => update('phaseClass', e.target.value)}
                    placeholder="e.g. phase-setup"
                    style={inputStyle}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={handleSave} style={{
              padding: '8px 20px', background: section.themeColor, color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
            }}>
              {isNew ? 'Add Task' : 'Save Changes'}
            </button>
            {!isNew && (
              <button onClick={() => onDelete(form.id)} style={{
                padding: '8px 20px', background: '#c62828', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer',
              }}>
                Delete
              </button>
            )}
            <button onClick={onClose} style={{
              padding: '8px 20px', background: '#fff', color: '#666',
              border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
