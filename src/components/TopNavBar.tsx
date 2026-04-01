import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { cn } from '../utils/cn.ts';

const navLinks = [
  { label: 'Control Tower', to: '/control-tower' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'MOS', to: '/performance-infrastructure/mos' },
  { label: 'Litify Spec', to: '/specs' },
  { label: 'Reports', to: '/reports' },
];

export function TopNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={() =>
                cn(
                  'text-sm font-medium transition-colors',
                  location.pathname === link.to || location.pathname.startsWith(link.to + '/')
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
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
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={() =>
                cn(
                  'block py-2 text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
