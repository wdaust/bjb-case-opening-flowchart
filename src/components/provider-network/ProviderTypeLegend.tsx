import { PROVIDER_TYPE_COLORS, type ProviderType } from '../../data/providerNetworkData.ts';

export function ProviderTypeLegend() {
  const entries = Object.entries(PROVIDER_TYPE_COLORS) as [ProviderType, string][];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
      {entries.map(([type, color]) => (
        <span key={type} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          {type}
        </span>
      ))}
    </div>
  );
}
