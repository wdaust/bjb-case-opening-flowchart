import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn.ts';

const mainLinks = [
  { label: 'LDM', to: '/control-tower' },
  { label: 'LIT Scorecard', to: '/lit-scorecard' },
  { label: 'MOS', to: '/performance-infrastructure/mos' },
];

const moreLinks = [
  { label: 'Analytics', to: '/analytics' },
  { label: 'Insights', to: '/insights' },
  { label: 'Reports', to: '/reports' },
  { label: 'Litify Spec', to: '/specs' },
];

export function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  const moreIsActive = moreLinks.some(l => isActive(l.to));

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 shrink-0 bg-black border-b border-[#2a2a2a]"
      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div className="h-14 flex items-center px-6">
        {/* Left: Logo */}
        <Link to="/control-tower" className="shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Firm Logo"
            className="h-[2.3rem]"
          />
        </Link>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-8">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={() =>
                cn(
                  'text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(o => !o)}
              onMouseEnter={() => setMoreOpen(true)}
              className={cn(
                'text-sm font-medium transition-colors inline-flex items-center gap-1',
                moreIsActive ? 'text-white' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              More
              <ChevronDown size={14} className={cn('transition-transform', moreOpen && 'rotate-180')} />
            </button>

            {moreOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-44 rounded-lg border border-[#2a2a2a] bg-black/95 backdrop-blur shadow-xl py-1"
                onMouseLeave={() => setMoreOpen(false)}
              >
                {moreLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMoreOpen(false)}
                    className={() =>
                      cn(
                        'block px-4 py-2 text-sm font-medium transition-colors',
                        isActive(link.to)
                          ? 'text-white bg-white/5'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right: User */}
        <div className="hidden md:flex items-center gap-3 text-gray-500 text-sm">
          <span>Will Daust</span>
          <LogOut size={16} className="hover:text-gray-300 cursor-pointer" />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto text-gray-400"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-black border-t border-[#2a2a2a] px-4 pb-3">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={() =>
                cn(
                  'block py-2 text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
            <span className="block py-1 text-xs text-gray-600 uppercase tracking-wider">More</span>
            {moreLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={() =>
                  cn(
                    'block py-2 text-sm font-medium transition-colors pl-3',
                    isActive(link.to)
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
