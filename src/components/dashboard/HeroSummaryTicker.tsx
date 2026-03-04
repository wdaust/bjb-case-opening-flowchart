import { useCountUp } from '../../hooks/useCountUp';

interface Props {
  totalCases: number;
  onSlaPct: number;
  lciScore: number;
}

export function HeroSummaryTicker({ totalCases, onSlaPct, lciScore }: Props) {
  const casesDisplay = useCountUp(totalCases, 800);
  const slaDisplay = useCountUp(onSlaPct, 800, 0);
  const lciDisplay = useCountUp(lciScore, 800, 1);

  const items = [
    { label: 'active cases', value: casesDisplay },
    { label: 'on-SLA', value: `${slaDisplay}%` },
    { label: 'LCI', value: lciDisplay },
  ];

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
        style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
      >
        Updated 2m ago
      </span>
    </div>
  );
}
