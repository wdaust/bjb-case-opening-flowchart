import { MapPin, Phone } from 'lucide-react';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { QualityScoreBars } from './QualityScoreBars.tsx';
import { PROVIDER_TYPE_COLORS, getProviderScore, type Provider } from '../../data/providerNetworkData.ts';

interface Props {
  provider: Provider;
  distance?: string;
  onRefer: (provider: Provider) => void;
  isReferred: boolean;
}

export function ProviderDetailCard({ provider, distance, onRefer, isReferred }: Props) {
  const score = getProviderScore(provider);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: PROVIDER_TYPE_COLORS[provider.type] }}
          >
            {score}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{provider.name}</h3>
            <Badge
              className="mt-1 text-[10px]"
              style={{
                backgroundColor: `${PROVIDER_TYPE_COLORS[provider.type]}20`,
                color: PROVIDER_TYPE_COLORS[provider.type],
                borderColor: `${PROVIDER_TYPE_COLORS[provider.type]}40`,
              }}
            >
              {provider.type}
            </Badge>
          </div>
        </div>
        {distance && (
          <span className="text-xs text-muted-foreground shrink-0">{distance}</span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={12} className="shrink-0" />
          <span>{provider.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone size={12} className="shrink-0" />
          <span>{provider.phone}</span>
        </div>
      </div>

      <QualityScoreBars
        documentation={provider.qualityScores.documentation}
        treatmentOutcomes={provider.qualityScores.treatmentOutcomes}
        responsiveness={provider.qualityScores.responsiveness}
      />

      <Button
        size="sm"
        className="w-full"
        onClick={() => onRefer(provider)}
        disabled={isReferred}
      >
        {isReferred ? 'Already Referred' : 'Refer This Provider'}
      </Button>
    </div>
  );
}
