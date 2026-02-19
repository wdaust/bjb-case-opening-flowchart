import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from './ui/button.tsx';
import {
  GitBranch,
  BarChart3,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn.ts';

interface Props {
  darkMode: boolean;
  onToggleDark: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ darkMode, onToggleDark, collapsed, onToggleCollapse }: Props) {
  const location = useLocation();
  const [dashOpen, setDashOpen] = useState(() =>
    location.pathname.startsWith('/dashboards'),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
    );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3 min-h-[60px]">
        <img
          src={
            collapsed
              ? `${import.meta.env.BASE_URL}favicon.png`
              : darkMode
                ? `${import.meta.env.BASE_URL}logo.png`
                : `${import.meta.env.BASE_URL}logo-dark.png`
          }
          alt="BJB"
          className={cn('transition-all duration-200', collapsed ? 'w-8 h-8' : 'h-8')}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <NavLink to="/performance-infrastructure" className={linkClass} title="Performance Infrastructure">
          <GitBranch size={18} className="shrink-0" />
          {!collapsed && <span>Performance Infrastructure</span>}
        </NavLink>

        <div>
          <button
            onClick={() => setDashOpen(o => !o)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full',
              location.pathname.startsWith('/dashboards')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
            title="Dashboards"
          >
            <BarChart3 size={18} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Dashboards</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform duration-200', dashOpen ? 'rotate-0' : '-rotate-90')}
                />
              </>
            )}
          </button>
          {dashOpen && !collapsed && (
            <div className="ml-7 mt-1 space-y-1">
              <NavLink to="/dashboards/client" className={linkClass}>Client</NavLink>
              <NavLink to="/dashboards/pre-lit" className={linkClass}>Pre LIT</NavLink>
              <NavLink to="/dashboards/lit" className={linkClass}>LIT</NavLink>
            </div>
          )}
        </div>

        <NavLink to="/lit-scorecard" className={linkClass} title="LIT Scorecard">
          <ClipboardCheck size={18} className="shrink-0" />
          {!collapsed && <span>LIT Scorecard</span>}
        </NavLink>
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDark}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground max-md:hidden"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} className="shrink-0" /> : <ChevronLeft size={18} className="shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMobileOpen(o => !o)}
        className="fixed top-3 left-3 z-50 md:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border',
          'transition-all duration-200 shrink-0',
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:w-64',
          mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
          collapsed ? 'md:w-16' : 'md:w-64',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
