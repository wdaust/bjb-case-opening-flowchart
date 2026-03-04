import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn.ts';

interface NavItem {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
}

const navTabs: NavItem[] = [
  { label: 'Command View', to: '/control-tower' },
  { label: 'Inventory Health', to: '/inventory-health' },
  { label: 'Risk Radar', to: '/risk-radar' },
  { label: 'Forecast', to: '/forecast' },
  { label: "Today's Exposure", to: '/today-exposure' },
  {
    label: 'Stages',
    to: '/stage/intake',
    children: [
      { label: 'Intake', to: '/stage/intake' },
      { label: 'Pre-Litigation', to: '/stage/pre-lit' },
      { label: '  Account Opening', to: '/stage/pre-account-opening' },
      { label: '  Treatment Monitoring', to: '/stage/pre-treatment-monitoring' },
      { label: '  Value Development', to: '/stage/pre-value-development' },
      { label: '  Demand Readiness', to: '/stage/pre-demand-readiness' },
      { label: '  Negotiation', to: '/stage/pre-negotiation' },
      { label: '  Resolution Pending', to: '/stage/pre-resolution-pending' },
      { label: 'Litigation', to: '/stage/lit' },
      { label: '  Case Opening', to: '/stage/lit-case-opening' },
      { label: '  Treatment Monitoring', to: '/stage/lit-treatment-monitoring' },
      { label: '  Discovery', to: '/stage/lit-discovery' },
      { label: '  Expert & Deposition', to: '/stage/lit-expert-depo' },
      { label: '  Arbitration/Mediation', to: '/stage/lit-arb-mediation' },
      { label: '  Trial', to: '/stage/lit-trial' },
    ],
  },
  {
    label: 'People',
    to: '/attorney',
    children: [
      { label: 'Attorney Cockpit', to: '/attorney' },
      { label: 'Manager Rhythm', to: '/manager-rhythm' },
    ],
  },
  {
    label: 'Development',
    to: '/performance-infrastructure',
    children: [
      { label: 'Flowcharts', to: '/performance-infrastructure' },
      { label: 'Mockups', to: '/performance-infrastructure/mockups' },
      { label: 'Litify Mockups', to: '/performance-infrastructure/litify' },
      { label: 'Provider Network', to: '/performance-infrastructure/provider-network' },
      { label: 'Alt Control Tower', to: '/performance-infrastructure/alt-control-tower' },
      { label: 'Call Team Dashboard', to: '/performance-infrastructure/call-team-dashboard' },
    ],
  },
];

function DropdownMenu({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const location = useLocation();

  useEffect(() => {
    return () => { if (timeout.current) clearTimeout(timeout.current); };
  }, []);

  const isGroupActive = (tab: NavItem) => {
    if (tab.to === '/stage/intake') return location.pathname.startsWith('/stage');
    if (tab.to === '/attorney')
      return location.pathname.startsWith('/attorney') || location.pathname.startsWith('/manager-rhythm');
    if (tab.to === '/performance-infrastructure')
      return location.pathname.startsWith('/performance-infrastructure') || location.pathname.startsWith('/top-nav-mockup');
    return location.pathname === tab.to;
  };

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => { if (timeout.current) clearTimeout(timeout.current); setOpen(true); }}
      onMouseLeave={() => { timeout.current = setTimeout(() => setOpen(false), 150); }}
    >
      <NavLink
        to={item.to}
        className={() =>
          cn(
            'text-sm font-medium transition-colors flex items-center gap-1',
            isGroupActive(item) ? 'text-white' : 'text-gray-500 hover:text-gray-300',
          )
        }
      >
        {item.label}
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </NavLink>
      {open && (
        <div className="absolute top-full right-0 mt-1 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl min-w-[200px] z-50">
          {item.children!.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={() => { setOpen(false); onNavigate?.(); }}
              className={() =>
                cn(
                  'block px-4 py-1.5 text-sm transition-colors whitespace-nowrap',
                  location.pathname === child.to
                    ? 'text-white bg-[#2a2a2a]'
                    : child.label.startsWith('  ')
                      ? 'text-gray-500 hover:text-gray-300 hover:bg-[#222] pl-7'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#222]',
                )
              }
            >
              {child.label.trimStart()}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/stage/intake') return location.pathname.startsWith('/stage');
    if (to === '/performance-infrastructure')
      return location.pathname.startsWith('/performance-infrastructure') || location.pathname.startsWith('/top-nav-mockup');
    if (to === '/attorney')
      return location.pathname.startsWith('/attorney') || location.pathname.startsWith('/manager-rhythm');
    return location.pathname === to;
  };

  return (
    <header
      className="sticky top-0 z-50 shrink-0 bg-[#1a1a1a] border-b border-[#2a2a2a]"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="max-w-[1460px] mx-auto h-14 flex items-center px-6 gap-8">
        {/* Left: Logo */}
        <div className="shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="BJB"
            className="h-6 brightness-0 invert"
          />
        </div>

        {/* Center: Nav Tabs */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-6">
          {navTabs.map((tab) =>
            tab.children ? (
              <DropdownMenu key={tab.label} item={tab} />
            ) : (
              <NavLink
                key={tab.label}
                to={tab.to}
                className={() =>
                  cn(
                    'text-sm font-medium transition-colors',
                    isActive(tab.to) ? 'text-white' : 'text-gray-500 hover:text-gray-300',
                  )
                }
              >
                {tab.label}
              </NavLink>
            ),
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-400"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-[#2a2a2a] px-4 pb-3 max-h-[70vh] overflow-y-auto">
          {navTabs.map((tab) =>
            tab.children ? (
              <div key={tab.label}>
                <button
                  onClick={() => setMobileExpanded((e) => (e === tab.label ? null : tab.label))}
                  className={cn(
                    'flex items-center justify-between w-full py-2 text-sm font-medium transition-colors',
                    isActive(tab.to) ? 'text-white' : 'text-gray-500',
                  )}
                >
                  {tab.label}
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform', mobileExpanded === tab.label && 'rotate-180')}
                  />
                </button>
                {mobileExpanded === tab.label && (
                  <div className="pl-4 pb-1">
                    {tab.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => setMobileOpen(false)}
                        className={() =>
                          cn(
                            'block py-1.5 text-sm transition-colors',
                            location.pathname === child.to
                              ? 'text-white'
                              : 'text-gray-500 hover:text-gray-300',
                          )
                        }
                      >
                        {child.label.trimStart()}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={tab.label}
                to={tab.to}
                onClick={() => setMobileOpen(false)}
                className={() =>
                  cn(
                    'block py-2 text-sm font-medium transition-colors',
                    isActive(tab.to) ? 'text-white' : 'text-gray-500 hover:text-gray-300',
                  )
                }
              >
                {tab.label}
              </NavLink>
            ),
          )}
        </div>
      )}
    </header>
  );
}
