// ── Types ──────────────────────────────────────────────────────────────

export interface UtilityBarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
}

interface LitifyUtilityBarProps {
  items: UtilityBarItem[];
}

// ── Component ──────────────────────────────────────────────────────────

export function LitifyUtilityBar({ items }: LitifyUtilityBarProps) {
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-0 divide-x divide-border h-10">
          {items.map((item) => {
            const Icon = item.icon;
            const inner = (
              <>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{item.label}</span>
                {item.value !== undefined && item.value}
              </>
            );

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-2 px-4 h-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {inner}
                </button>
              );
            }

            return (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 h-full text-xs"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
      {/* Bottom padding for utility bar */}
      <div className="h-14" />
    </>
  );
}
