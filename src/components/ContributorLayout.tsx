import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { LogOut } from 'lucide-react';

export function ContributorLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-[#111111]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Minimal header */}
      <header className="h-14 border-b border-[#2a2a2a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white tracking-tight">BJB Optimus</span>
          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            MOS Entry
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user.displayName}</span>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <main className="bg-background min-h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
