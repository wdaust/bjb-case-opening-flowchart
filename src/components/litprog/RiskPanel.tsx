import type { AttorneyScore } from '../../utils/litProgMetrics';

interface Props {
  scores: AttorneyScore[];
  onSelectAttorney: (attorney: string) => void;
}

export function RiskPanel({ scores, onSelectAttorney }: Props) {
  const sorted = [...scores].sort((a, b) => b.riskScore - a.riskScore);
  const needsAttention = sorted.slice(0, 5).filter(s => s.riskScore > 0);
  const topPerformers = sorted.slice(-5).reverse().filter(s => s.redCount === 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Needs Attention */}
      <div className="bg-card rounded-xl border border-red-500/20 p-5">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">
          Needs Attention
        </h3>
        {needsAttention.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attorneys flagged</p>
        ) : (
          <ol className="space-y-3">
            {needsAttention.map((s, i) => (
              <li key={s.attorney}>
                <button
                  onClick={() => onSelectAttorney(s.attorney)}
                  className="text-left w-full hover:bg-white/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm font-medium text-foreground">{s.attorney}</span>
                    <span className="text-xs text-red-400 ml-auto">{s.redCount} red</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6 mt-0.5">
                    {s.actionableText}
                  </div>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Top Performers */}
      <div className="bg-card rounded-xl border border-green-500/20 p-5">
        <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">
          Top Performers
        </h3>
        {topPerformers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attorneys with zero red stages</p>
        ) : (
          <ol className="space-y-3">
            {topPerformers.map((s, i) => (
              <li key={s.attorney}>
                <button
                  onClick={() => onSelectAttorney(s.attorney)}
                  className="text-left w-full hover:bg-white/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm font-medium text-foreground">{s.attorney}</span>
                    <span className="text-xs text-green-400 ml-auto">
                      {s.greenCount} green, {s.amberCount} amber
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
