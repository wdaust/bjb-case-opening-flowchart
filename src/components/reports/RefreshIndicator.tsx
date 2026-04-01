import { RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

interface Props {
  lastFetched: string | null;
  loading: boolean;
  onRefresh: () => void;
  className?: string;
}

function timeAgo(iso: string): string {
  if (iso === 'static export') return 'from static export';
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return iso;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export function RefreshIndicator({ lastFetched, loading, onRefresh, className }: Props) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      {lastFetched && <span>Updated {timeAgo(lastFetched)}</span>}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-1 rounded hover:bg-accent/50 transition-colors disabled:opacity-50"
        title="Refresh data"
      >
        <RefreshCw size={14} className={cn(loading && "animate-spin")} />
      </button>
    </div>
  );
}
