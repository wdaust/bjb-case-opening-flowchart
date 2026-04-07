import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../ui/dialog.tsx';
import { initDb, loadGenericSection, saveGenericSection } from '../../utils/db.ts';
import { hashPassword } from '../../utils/auth.ts';
import type { Contributor, MosContributorsData } from '../../types/mos.ts';
import {
  Plus, Loader2, CheckCircle, KeyRound, UserX, UserCheck,
} from 'lucide-react';

interface ContributorManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContributorManager({ open, onOpenChange }: ContributorManagerProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New contributor form
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState('');

  // Reset password state
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      await initDb();
      const data = await loadGenericSection<MosContributorsData>('mos-contributors');
      setContributors(data?.contributors ?? []);
      setLoading(false);
    })();
  }, [open]);

  const persist = async (updated: Contributor[]) => {
    setSaving(true);
    const ok = await saveGenericSection<MosContributorsData>('mos-contributors', { contributors: updated });
    setSaving(false);
    if (ok) {
      setContributors(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    return ok;
  };

  const handleAdd = async () => {
    setAddError('');
    const uname = newUsername.trim().toLowerCase();
    const dname = newDisplayName.trim();
    const pwd = newPassword.trim();
    if (!uname || !dname || !pwd) {
      setAddError('All fields required');
      return;
    }
    if (pwd.length < 4) {
      setAddError('Password must be at least 4 characters');
      return;
    }
    if (contributors.some(c => c.username === uname)) {
      setAddError('Username already exists');
      return;
    }
    const hash = await hashPassword(pwd);
    const updated = [...contributors, { username: uname, displayName: dname, passwordHash: hash, active: true }];
    const ok = await persist(updated);
    if (ok) {
      setNewDisplayName('');
      setNewUsername('');
      setNewPassword('');
    }
  };

  const toggleActive = async (username: string) => {
    const updated = contributors.map(c =>
      c.username === username ? { ...c, active: !c.active } : c
    );
    await persist(updated);
  };

  const handleResetPassword = async (username: string) => {
    if (!resetPassword.trim() || resetPassword.trim().length < 4) return;
    const hash = await hashPassword(resetPassword.trim());
    const updated = contributors.map(c =>
      c.username === username ? { ...c, passwordHash: hash } : c
    );
    const ok = await persist(updated);
    if (ok) {
      setResetTarget(null);
      setResetPassword('');
    }
  };

  const handleRemove = async (username: string) => {
    const updated = contributors.filter(c => c.username !== username);
    await persist(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Contributors</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* Existing contributors */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {contributors.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No contributors yet</p>
              )}
              {contributors.map(c => (
                <div key={c.username} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{c.displayName}</p>
                    <p className="text-muted-foreground">{c.username}</p>
                  </div>
                  <span className={c.active ? "text-green-500 text-[10px]" : "text-red-400 text-[10px]"}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>

                  {/* Reset password inline */}
                  {resetTarget === c.username ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={e => setResetPassword(e.target.value)}
                        placeholder="New password"
                        className="w-[100px] px-2 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
                        autoFocus
                      />
                      <button
                        onClick={() => handleResetPassword(c.username)}
                        disabled={!resetPassword.trim() || resetPassword.trim().length < 4}
                        className="text-primary hover:text-primary/80 disabled:opacity-30"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => { setResetTarget(null); setResetPassword(''); }} className="text-muted-foreground hover:text-foreground">
                        &times;
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResetTarget(c.username)}
                      title="Reset password"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <KeyRound size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => toggleActive(c.username)}
                    title={c.active ? 'Deactivate' : 'Activate'}
                    className={c.active ? "text-muted-foreground hover:text-red-400" : "text-muted-foreground hover:text-green-400"}
                  >
                    {c.active ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>

                  <button
                    onClick={() => handleRemove(c.username)}
                    title="Remove"
                    className="text-red-400 hover:text-red-300"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {/* Add new contributor */}
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Add Contributor</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="flex-1 px-2 py-1.5 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
                />
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Username"
                  className="w-[100px] px-2 py-1.5 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
                />
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Password"
                  className="w-[100px] px-2 py-1.5 rounded bg-background border border-border text-xs focus:outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Add
                </button>
              </div>
              {addError && <p className="text-xs text-red-400">{addError}</p>}
              {saved && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle size={12} /> Saved
                </p>
              )}

              {/* Shareable link info */}
              <p className="text-[10px] text-muted-foreground mt-2">
                Contributors log in at the same URL and are automatically routed to their entry page.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
