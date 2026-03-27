import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '../utils/cn.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface NavItem {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
}

const navTabs: NavItem[] = [
  {
    label: 'INTAKE',
    to: '/dept/intake/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/intake/dashboard' },
      { label: 'New Leads', to: '/dept/intake/new-leads' },
      { label: 'Pipeline', to: '/dept/intake/pipeline' },
      { label: 'Conversion Metrics', to: '/dept/intake/conversion-metrics' },
    ],
  },
  {
    label: 'PRE LIT',
    to: '/dept/pre-lit/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/pre-lit/dashboard' },
      { label: 'Treatment Monitoring', to: '/dept/pre-lit/treatment-monitoring' },
      { label: 'Value Development', to: '/dept/pre-lit/value-development' },
      { label: 'Demand Readiness', to: '/dept/pre-lit/demand-readiness' },
      { label: 'Negotiation', to: '/dept/pre-lit/negotiation' },
    ],
  },
  {
    label: 'MED RECORDS',
    to: '/dept/med-records/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/med-records/dashboard' },
      { label: 'Records Requests', to: '/dept/med-records/records-requests' },
      { label: 'Pending Records', to: '/dept/med-records/pending-records' },
      { label: 'Completion Rate', to: '/dept/med-records/completion-rate' },
    ],
  },
  {
    label: 'CLAIMS',
    to: '/dept/claims/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/claims/dashboard' },
      { label: 'Active Claims', to: '/dept/claims/active-claims' },
      { label: 'Settlements', to: '/dept/claims/settlements' },
      { label: 'Billing', to: '/dept/claims/billing' },
    ],
  },
  {
    label: 'LIT',
    to: '/dept/lit/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/lit/dashboard' },
      { label: 'Case Opening', to: '/dept/lit/case-opening' },
      { label: 'Discovery', to: '/dept/lit/discovery' },
      { label: 'Expert & Depo', to: '/dept/lit/expert-depo' },
      { label: 'Arb/Med', to: '/dept/lit/arb-med' },
      { label: 'Trial', to: '/dept/lit/trial' },
    ],
  },
  {
    label: 'PIP ARBS',
    to: '/dept/pip-arbs/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/pip-arbs/dashboard' },
      { label: 'Active Cases', to: '/dept/pip-arbs/active-cases' },
      { label: 'Hearings', to: '/dept/pip-arbs/hearings' },
      { label: 'Awards', to: '/dept/pip-arbs/awards' },
    ],
  },
  {
    label: 'MED MARKETING',
    to: '/dept/med-marketing/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/med-marketing/dashboard' },
      { label: 'Outbound Calls', to: '/dept/med-marketing/outbound-calls' },
      { label: 'Appointments', to: '/dept/med-marketing/appointments' },
      { label: 'Referrals', to: '/dept/med-marketing/referrals' },
      { label: 'Conversion', to: '/dept/med-marketing/conversion' },
    ],
  },
  {
    label: 'LEGAL MARKETING',
    to: '/dept/legal-marketing/dashboard',
    children: [
      { label: 'Dashboard', to: '/dept/legal-marketing/dashboard' },
      { label: 'Campaigns', to: '/dept/legal-marketing/campaigns' },
      { label: 'Leads by Source', to: '/dept/legal-marketing/leads-by-source' },
      { label: 'Cost per Case', to: '/dept/legal-marketing/cost-per-case' },
      { label: 'ROI', to: '/dept/legal-marketing/roi' },
    ],
  },
  {
    label: 'More',
    to: '/control-tower',
    children: [
      { label: 'Command View', to: '/control-tower' },
      { label: 'Inventory Health', to: '/inventory-health' },
      { label: 'Risk Radar', to: '/risk-radar' },
      { label: 'Forecast', to: '/forecast' },
      { label: "Today's Exposure", to: '/today-exposure' },
      { label: '---', to: '' },
      { label: 'Attorney Cockpit', to: '/attorney' },
      { label: 'Manager Rhythm', to: '/manager-rhythm' },
      { label: '---', to: '' },
      { label: 'Stages', to: '/stage/intake' },
      { label: 'Development', to: '/performance-infrastructure' },
      { label: 'MOS', to: '/performance-infrastructure/mos' },
      { label: 'Provider Network', to: '/performance-infrastructure/provider-network' },
      { label: '---', to: '' },
      { label: 'Litify Spec', to: '/specs' },
      { label: 'Tech Projects', to: '/tech-projects' },
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
    if (tab.children) {
      return tab.children.some((child) => child.to && location.pathname === child.to);
    }
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
        <div className="absolute top-full right-0 mt-1 py-1 bg-black border border-[#2a2a2a] rounded-lg shadow-xl min-w-[200px] z-50">
          {item.children!.map((child, idx) =>
            child.label === '---' ? (
              <div key={`sep-${idx}`} className="my-1 border-t border-[#2a2a2a]" />
            ) : (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={() => { setOpen(false); onNavigate?.(); }}
                className={() =>
                  cn(
                    'block px-4 py-1.5 text-sm transition-colors whitespace-nowrap',
                    location.pathname === child.to
                      ? 'text-white bg-[#2a2a2a]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#222]',
                  )
                }
              >
                {child.label}
              </NavLink>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (tab: NavItem) => {
    if (tab.children) {
      return tab.children.some((child) => child.to && location.pathname === child.to);
    }
    return location.pathname === tab.to;
  };

  return (
    <header
      className="sticky top-0 z-50 shrink-0 bg-black border-b border-[#2a2a2a]"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="h-14 flex items-center px-6 gap-8">
        {/* Left: Logo */}
        <Link to="/control-tower" className="shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Firm Logo"
            className="h-[2.3rem]"
          />
        </Link>

        {/* Center: Nav Tabs */}
        <nav className="hidden lg:flex items-center justify-center flex-1 gap-4">
          {navTabs.map((tab) => (
            <DropdownMenu key={tab.label} item={tab} />
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-gray-400"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-black border-t border-[#2a2a2a] px-4 pb-3 max-h-[70vh] overflow-y-auto">
          {navTabs.map((tab) => (
            <div key={tab.label}>
              <button
                onClick={() => setMobileExpanded((e) => (e === tab.label ? null : tab.label))}
                className={cn(
                  'flex items-center justify-between w-full py-2 text-sm font-medium transition-colors',
                  isActive(tab) ? 'text-white' : 'text-gray-500',
                )}
              >
                {tab.label}
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', mobileExpanded === tab.label && 'rotate-180')}
                />
              </button>
              {mobileExpanded === tab.label && tab.children && (
                <div className="pl-4 pb-1">
                  {tab.children.map((child, idx) =>
                    child.label === '---' ? (
                      <div key={`sep-${idx}`} className="my-1 border-t border-[#2a2a2a]" />
                    ) : (
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
                        {child.label}
                      </NavLink>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
