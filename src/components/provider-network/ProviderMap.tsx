import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PROVIDER_TYPE_COLORS, getProviderScore, type Provider } from '../../data/providerNetworkData.ts';
import 'leaflet/dist/leaflet.css';

interface Props {
  providers: Provider[];
  center: [number, number];
  onSelectProvider: (provider: Provider) => void;
  selectedId?: string;
  referredIds?: string[];
  clientPin?: { lat: number; lng: number; label?: string } | null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function makeProviderIcon(score: number, color: string, selected: boolean, referred: boolean) {
  const size = selected ? 34 : referred ? 32 : 26;
  const fontSize = selected || referred ? 12 : 10;

  if (referred) {
    // Referred provider: larger, gold ring, pulsing glow, checkmark badge
    return L.divIcon({
      className: '',
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <div style="
            position: absolute; inset: -4px;
            border: 2px solid #fbbf24;
            border-radius: 50%;
            animation: referredPulse 2s ease-in-out infinite;
          "></div>
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: 3px solid #fbbf24;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${fontSize}px;
            font-weight: 700;
            color: #fff;
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.5), 0 2px 6px rgba(0,0,0,0.5);
            cursor: pointer;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          ">${score}</div>
          <div style="
            position: absolute;
            top: -4px; right: -4px;
            width: 14px; height: 14px;
            background: #22c55e;
            border: 2px solid #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #fff;
            line-height: 1;
          ">&#10003;</div>
        </div>
      `,
      iconSize: [size + 8, size + 8],
      iconAnchor: [(size + 8) / 2, (size + 8) / 2],
      popupAnchor: [0, -(size / 2 + 4)],
    });
  }

  const border = selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.6)';
  const shadow = selected ? '0 0 8px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.4)';

  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${border};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${fontSize}px;
      font-weight: 700;
      color: #fff;
      box-shadow: ${shadow};
      cursor: pointer;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    ">${score}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function ProviderMarker({
  provider,
  selected,
  referred,
  onSelect,
}: {
  provider: Provider;
  selected: boolean;
  referred: boolean;
  onSelect: () => void;
}) {
  const score = getProviderScore(provider);
  const color = PROVIDER_TYPE_COLORS[provider.type];
  const icon = useMemo(
    () => makeProviderIcon(score, color, selected, referred),
    [score, color, selected, referred]
  );

  return (
    <Marker
      position={[provider.lat, provider.lng]}
      icon={icon}
      zIndexOffset={referred ? 500 : selected ? 1000 : 0}
      eventHandlers={{ click: onSelect }}
    >
      <Popup>
        <div className="text-xs">
          <p className="font-semibold">{provider.name}</p>
          <p className="text-gray-500">{provider.type}</p>
          <p className="text-gray-400 mt-0.5">Score: {score}</p>
          {referred && <p className="text-amber-500 font-medium mt-0.5">In Referral Queue</p>}
        </div>
      </Popup>
    </Marker>
  );
}

export function ProviderMap({ providers, center, onSelectProvider, selectedId, referredIds = [], clientPin }: Props) {
  const clientIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div style="
          width: 28px; height: 28px;
          background: #3b82f6;
          border: 3px solid #fff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      }),
    []
  );

  const referredSet = useMemo(() => new Set(referredIds), [referredIds]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-[500px] w-full rounded-lg border border-border"
      style={{ background: '#1a1a2e' }}
    >
      <style>{`
        @keyframes referredPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapUpdater center={center} />

      {clientPin && (
        <Marker position={[clientPin.lat, clientPin.lng]} icon={clientIcon}>
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">{clientPin.label ?? 'Client Location'}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {providers.map(p => (
        <ProviderMarker
          key={p.id}
          provider={p}
          selected={selectedId === p.id}
          referred={referredSet.has(p.id)}
          onSelect={() => onSelectProvider(p)}
        />
      ))}
    </MapContainer>
  );
}
