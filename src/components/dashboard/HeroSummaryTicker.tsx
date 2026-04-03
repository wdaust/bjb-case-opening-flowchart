interface TickerItem {
  label: string;
  value: string | number;
}

interface Props {
  items: TickerItem[];
}

export function HeroSummaryTicker({ items }: Props) {
  return (
    <div className="hidden md:flex items-center gap-3 text-sm">
      {items.map((item, i) => (
        <span
          key={item.label}
          className="animate-fade-in opacity-0 flex items-center gap-1.5"
          style={{ animationDelay: `${200 + i * 200}ms`, animationFillMode: 'forwards' }}
        >
          <span className="text-green-400 font-bold tabular-nums">{item.value}</span>
          <span className="text-white/50">{item.label}</span>
          {i < items.length - 1 && (
            <span className="text-white/20 ml-1.5">·</span>
          )}
        </span>
      ))}
      <span
        className="animate-fade-in opacity-0 text-xs text-white/30"
        style={{ animationDelay: `${200 + items.length * 200}ms`, animationFillMode: 'forwards' }}
      >
        Live
      </span>
    </div>
  );
}
