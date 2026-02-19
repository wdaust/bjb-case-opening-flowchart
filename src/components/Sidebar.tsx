import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from './ui/button.tsx';
import {
  GitBranch,
  LayoutDashboard,
  Activity,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
  Stethoscope,
  Search,
  Users,
  Scale,
  Gavel,
  UserCircle,
  CalendarCheck,
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
  const [stagesOpen, setStagesOpen] = useState(() =>
    location.pathname.startsWith('/stage'),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/stage')) {
      setStagesOpen(true);
    }
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
              ? `${import.meta.env.BASE_URL}favicon-dark.png`
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
        {/* Control Tower */}
        <NavLink to="/control-tower" className={linkClass} title="Control Tower">
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Control Tower</span>}
        </NavLink>

        {/* Cross-stage pages */}
        <NavLink to="/inventory-health" className={linkClass} title="Inventory Health Index">
          <Activity size={18} className="shrink-0" />
          {!collapsed && <span>Inventory Health</span>}
        </NavLink>

        <NavLink to="/risk-radar" className={linkClass} title="Risk & Deadline Radar">
          <AlertTriangle size={18} className="shrink-0" />
          {!collapsed && <span>Risk & Deadline Radar</span>}
        </NavLink>

        <NavLink to="/forecast" className={linkClass} title="Forecast & Yield">
          <TrendingUp size={18} className="shrink-0" />
          {!collapsed && <span>Forecast & Yield</span>}
        </NavLink>

        {/* Divider */}
        {!collapsed && (
          <div className="px-3 py-2">
            <div className="border-t border-sidebar-border" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">Stage Commands</p>
          </div>
        )}
        {collapsed && <div className="border-t border-sidebar-border my-2" />}

        {/* Stage Commands - collapsible on mobile/expanded */}
        <div>
          {!collapsed ? (
            <>
              <button
                onClick={() => setStagesOpen(o => !o)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full',
                  location.pathname.startsWith('/stage')
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <FolderOpen size={18} className="shrink-0" />
                <span className="flex-1 text-left">Stages</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform duration-200', stagesOpen ? 'rotate-0' : '-rotate-90')}
                />
              </button>
              {stagesOpen && (
                <div className="ml-4 mt-1 space-y-0.5">
                  <NavLink to="/stage/opening" className={linkClass}>
                    <FolderOpen size={14} className="shrink-0" />
                    <span>Case Opening</span>
                  </NavLink>
                  <NavLink to="/stage/treatment" className={linkClass}>
                    <Stethoscope size={14} className="shrink-0" />
                    <span>Treatment Monitoring</span>
                  </NavLink>
                  <NavLink to="/stage/discovery" className={linkClass}>
                    <Search size={14} className="shrink-0" />
                    <span>Discovery</span>
                  </NavLink>
                  <NavLink to="/stage/expert-depo" className={linkClass}>
                    <Users size={14} className="shrink-0" />
                    <span>Expert & Deposition</span>
                  </NavLink>
                  <NavLink to="/stage/adr" className={linkClass}>
                    <Scale size={14} className="shrink-0" />
                    <span>ADR (Arb/Mediation)</span>
                  </NavLink>
                  <NavLink to="/stage/trial" className={linkClass}>
                    <Gavel size={14} className="shrink-0" />
                    <span>Trial</span>
                  </NavLink>
                </div>
              )}
            </>
          ) : (
            <NavLink to="/stage/opening" className={linkClass} title="Stage Commands">
              <FolderOpen size={18} className="shrink-0" />
            </NavLink>
          )}
        </div>

        {/* Divider */}
        {!collapsed && (
          <div className="px-3 py-2">
            <div className="border-t border-sidebar-border" />
          </div>
        )}
        {collapsed && <div className="border-t border-sidebar-border my-2" />}

        {/* Accountability */}
        <NavLink to="/attorney" className={linkClass} title="Attorney Cockpit">
          <UserCircle size={18} className="shrink-0" />
          {!collapsed && <span>Attorney Cockpit</span>}
        </NavLink>

        <NavLink to="/manager-rhythm" className={linkClass} title="Manager Rhythm">
          <CalendarCheck size={18} className="shrink-0" />
          {!collapsed && <span>Manager Rhythm</span>}
        </NavLink>

        {/* Divider */}
        {!collapsed && (
          <div className="px-3 py-2">
            <div className="border-t border-sidebar-border" />
          </div>
        )}
        {collapsed && <div className="border-t border-sidebar-border my-2" />}

        {/* Performance Infrastructure */}
        <NavLink to="/performance-infrastructure" className={linkClass} title="Performance Infrastructure">
          <GitBranch size={18} className="shrink-0" />
          {!collapsed && <span>Performance Infrastructure</span>}
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
