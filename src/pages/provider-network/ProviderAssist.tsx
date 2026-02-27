import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, Copy, Check, X } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import { Input } from '../../components/ui/input.tsx';
import { Button } from '../../components/ui/button.tsx';
import { SectionHeader } from '../../components/dashboard/SectionHeader.tsx';
import { ProviderMap } from '../../components/provider-network/ProviderMap.tsx';
import { ProviderDetailCard } from '../../components/provider-network/ProviderDetailCard.tsx';
import { ProviderTypeFilter } from '../../components/provider-network/ProviderTypeFilter.tsx';
import { ProviderTypeLegend } from '../../components/provider-network/ProviderTypeLegend.tsx';
import {
  PROVIDERS,
  PROVIDER_TYPE_COLORS,
  searchAddresses,
  getProvidersByType,
  getProviderScore,
  type Provider,
  type ProviderType,
  type MockAddress,
} from '../../data/providerNetworkData.ts';

interface Props {
  referredProviders: Provider[];
  onReferProvider: (provider: Provider) => void;
  onRemoveProvider?: (providerId: string) => void;
}

export default function ProviderAssist({ referredProviders, onReferProvider, onRemoveProvider }: Props) {
  const [address, setAddress] = useState('');
  const [searchCenter, setSearchCenter] = useState<[number, number]>([40.886, -74.044]);
  const [clientPin, setClientPin] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProviderType[]>([]);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<MockAddress[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const filteredProviders = useMemo(
    () => getProvidersByType(PROVIDERS, typeFilter),
    [typeFilter]
  );

  const sortedProviders = useMemo(() => {
    return [...filteredProviders].sort((a, b) => {
      const distA = Math.sqrt((a.lat - searchCenter[0]) ** 2 + (a.lng - searchCenter[1]) ** 2);
      const distB = Math.sqrt((b.lat - searchCenter[0]) ** 2 + (b.lng - searchCenter[1]) ** 2);
      return distA - distB;
    });
  }, [filteredProviders, searchCenter]);

  // Update suggestions as user types
  useEffect(() => {
    if (address.length >= 2) {
      const results = searchAddresses(address);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setHighlightedIdx(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [address]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectAddress(addr: MockAddress) {
    setAddress(addr.address);
    setSearchCenter([addr.lat, addr.lng]);
    setClientPin({ lat: addr.lat, lng: addr.lng, label: addr.address });
    setShowSuggestions(false);
  }

  function handleSearch() {
    if (!address.trim()) return;
    // If there's a matching suggestion, use its coordinates
    const match = suggestions.find(s => s.address.toLowerCase() === address.toLowerCase());
    if (match) {
      selectAddress(match);
    } else if (suggestions.length > 0) {
      selectAddress(suggestions[0]);
    } else {
      // Fallback: approximate geocode from address text
      const baseLat = 40.886;
      const baseLng = -74.044;
      const lat = baseLat + (Math.random() - 0.5) * 0.06;
      const lng = baseLng + (Math.random() - 0.5) * 0.06;
      setSearchCenter([lat, lng]);
      setClientPin({ lat, lng, label: address });
    }
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIdx >= 0) {
        selectAddress(suggestions[highlightedIdx]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function estimateDistance(provider: Provider): string {
    const dlat = provider.lat - searchCenter[0];
    const dlng = provider.lng - searchCenter[1];
    const miles = Math.sqrt(dlat * dlat + dlng * dlng) * 69;
    return `${miles.toFixed(1)} mi`;
  }

  const [copied, setCopied] = useState(false);

  function formatReferralData(): string {
    return referredProviders.map(p => {
      const score = getProviderScore(p);
      return [
        p.name,
        `Type: ${p.type}`,
        `Score: ${score}`,
        `Address: ${p.address}`,
        `Phone: ${p.phone}`,
        `Quality — Documentation: ${p.qualityScores.documentation}, Outcomes: ${p.qualityScores.treatmentOutcomes}, Responsiveness: ${p.qualityScores.responsiveness}`,
      ].join('\n');
    }).join('\n\n---\n\n');
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(formatReferralData());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 mt-4">
      <SectionHeader title="Medical Provider Assist" subtitle="Find and refer medical providers for your cases" />

      {/* Referral Queue */}
      {referredProviders.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Referral Queue ({referredProviders.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleCopyAll}
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </div>
          <div className="divide-y divide-border">
            {referredProviders.map(p => {
              const score = getProviderScore(p);
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  {/* Score badge */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: PROVIDER_TYPE_COLORS[p.type] }}
                  >
                    {score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.type} &middot; {p.phone}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground hidden sm:block shrink-0 max-w-[200px] truncate">
                    {p.address}
                  </p>
                  {onRemoveProvider && (
                    <button
                      onClick={() => onRemoveProvider(p.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-1"
                      title="Remove from queue"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1" ref={inputWrapperRef}>
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              value={address}
              onChange={e => setAddress(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Enter client address..."
              className="pl-9 text-sm"
              onKeyDown={handleKeyDown}
            />
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[1000] left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={s.address}
                    onClick={() => selectAddress(s)}
                    onMouseEnter={() => setHighlightedIdx(i)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors',
                      i === highlightedIdx ? 'bg-accent/70 text-foreground' : 'text-muted-foreground hover:bg-accent/40'
                    )}
                  >
                    <MapPin size={10} className="shrink-0 text-primary" />
                    <span>{s.address}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSearch} size="sm">
            <Search size={14} className="mr-1.5" />
            Search
          </Button>
        </div>
        <ProviderTypeFilter selected={typeFilter} onChange={setTypeFilter} />
      </div>

      {/* Two-column layout: map left, detail + list right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Map column */}
        <div className="lg:col-span-3 space-y-3">
          <ProviderMap
            providers={filteredProviders}
            center={searchCenter}
            onSelectProvider={setSelectedProvider}
            selectedId={selectedProvider?.id}
            referredIds={referredProviders.map(p => p.id)}
            clientPin={clientPin}
          />
          <ProviderTypeLegend />
        </div>

        {/* Right column: detail card + provider list */}
        <div className="lg:col-span-2 space-y-4">
          {selectedProvider ? (
            <ProviderDetailCard
              provider={selectedProvider}
              distance={estimateDistance(selectedProvider)}
              onRefer={onReferProvider}
              isReferred={referredProviders.some(p => p.id === selectedProvider.id)}
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 flex items-center justify-center text-sm text-muted-foreground min-h-[120px]">
              Click a provider on the map to view details
            </div>
          )}

          {/* Scrollable provider list */}
          <div className="rounded-lg border border-border bg-card">
            <div className="px-3 py-2 border-b border-border">
              <h3 className="text-xs font-semibold text-foreground">Providers ({sortedProviders.length})</h3>
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
              {sortedProviders.map(p => {
                const score = getProviderScore(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p)}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center gap-2 transition-colors hover:bg-accent/50',
                      selectedProvider?.id === p.id && 'bg-accent/70'
                    )}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: PROVIDER_TYPE_COLORS[p.type] }}
                    >
                      {score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.type}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {estimateDistance(p)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
