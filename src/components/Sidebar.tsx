import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from './ui/button.tsx';
import {
  GitBranch, LayoutDashboard, Activity, AlertTriangle, TrendingUp,
  FolderOpen, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, Menu, X,
  UserCircle, CalendarCheck, Inbox, FileText, Scale, Layers, DollarSign, Phone,
} from 'lucide-react';
import { cn } from '../utils/cn.ts';
import {
  parentStageOrder, substagesOf, parentStageLabels, subStageLabels,
  type ParentStage, type SubStage,
} from '../data/mockData.ts';

interface Props {
  darkMode: boolean;
  onToggleDark: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const parentStageIcons: Record<ParentStage, typeof Inbox> = {
  intake: Inbox,
  "pre-lit": FileText,
  lit: Scale,
};

export function Sidebar({ darkMode, onToggleDark, collapsed, onToggleCollapse }: Props) {
  const location = useLocation();
  const [stagesOpen, setStagesOpen] = useState(() =>
    location.pathname.startsWith('/stage'),
  );
  const [expandedParent, setExpandedParent] = useState<ParentStage | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(() =>
    location.pathname.startsWith('/performance-infrastructure'),
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/performance-infrastructure')) {
      setPerfOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/stage')) {
      setStagesOpen(true);
      // Auto-expand the correct parent group
      const stageId = location.pathname.split('/stage/')[1];
      for (const ps of parentStageOrder) {
        if (stageId === ps) { setExpandedParent(ps); break; }
        const subs = substagesOf[ps];
        if (subs && subs.includes(stageId as SubStage)) { setExpandedParent(ps); break; }
      }
    }
  }, [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group/link flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
      'transition-all duration-200 ease-out relative',
      isActive
        ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-sm shadow-sidebar-primary/5 border-l-2 border-sidebar-primary'
        : [
            'text-sidebar-foreground border-l-2 border-transparent',
            'hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
            'hover:translate-x-0.5 hover:border-sidebar-primary/40',
            'hover:shadow-sm hover:shadow-sidebar-primary/5',
          ]
    );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3 min-h-[60px]">
        <div className={cn('transition-all duration-200', !darkMode && !collapsed && 'bg-black rounded px-2 py-1')}>
          <img
            src={
              collapsed
                ? `${import.meta.env.BASE_URL}favicon-dark.png`
                : `${import.meta.env.BASE_URL}logo.png`
            }
            alt="BJB"
            className={cn('transition-all duration-200', collapsed ? 'w-8 h-8' : 'h-8')}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <NavLink to="/control-tower" className={linkClass} title="Command View">
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Command View</span>}
        </NavLink>

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

        <NavLink to="/today-exposure" className={linkClass} title="Today's Exposure">
          <DollarSign size={18} className="shrink-0" />
          {!collapsed && <span>Today's Exposure</span>}
        </NavLink>

        {/* Divider */}
        {!collapsed && (
          <div className="px-3 py-2">
            <div className="border-t border-sidebar-border" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">Stage Commands</p>
          </div>
        )}
        {collapsed && <div className="border-t border-sidebar-border my-2" />}

        {/* Stage Commands — 3 collapsible parent groups */}
        <div>
          {!collapsed ? (
            <>
              <button
                onClick={() => setStagesOpen(o => !o)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ease-out w-full border-l-2',
                  location.pathname.startsWith('/stage')
                    ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-sm shadow-sidebar-primary/5 border-sidebar-primary'
                    : 'text-sidebar-foreground border-transparent hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:translate-x-0.5 hover:border-sidebar-primary/40 hover:shadow-sm hover:shadow-sidebar-primary/5'
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
                  {parentStageOrder.map(ps => {
                    const Icon = parentStageIcons[ps];
                    const subs = substagesOf[ps];
                    const isExpanded = expandedParent === ps;

                    return (
                      <div key={ps}>
                        {subs ? (
                          <button
                            onClick={() => setExpandedParent(prev => prev === ps ? null : ps)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ease-out w-full border-l-2',
                              location.pathname === `/stage/${ps}` || (isExpanded && location.pathname.startsWith('/stage/'))
                                ? 'text-sidebar-primary font-medium border-sidebar-primary/50'
                                : 'text-sidebar-foreground border-transparent hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:translate-x-0.5 hover:border-sidebar-primary/40'
                            )}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span className="flex-1 text-left">{parentStageLabels[ps]}</span>
                            <ChevronDown
                              size={12}
                              className={cn('transition-transform duration-200', isExpanded ? 'rotate-0' : '-rotate-90')}
                            />
                          </button>
                        ) : (
                          <NavLink to={`/stage/${ps}`} className={linkClass}>
                            <Icon size={14} className="shrink-0" />
                            <span>{parentStageLabels[ps]}</span>
                          </NavLink>
                        )}
                        {subs && isExpanded && (
                          <div className="ml-4 mt-0.5 space-y-0.5">
                            <NavLink to={`/stage/${ps}`} className={linkClass}>
                              <FolderOpen size={12} className="shrink-0" />
                              <span className="text-xs">Overview</span>
                            </NavLink>
                            {subs.map(sub => (
                              <NavLink key={sub} to={`/stage/${sub}`} className={linkClass}>
                                <FolderOpen size={12} className="shrink-0" />
                                <span className="text-xs">{subStageLabels[sub]}</span>
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <NavLink to="/stage/intake" className={linkClass} title="Stage Commands">
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

        {/* Performance Infrastructure — collapsible */}
        {!collapsed ? (
          <div>
            <button
              onClick={() => setPerfOpen(o => !o)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ease-out w-full border-l-2',
                location.pathname.startsWith('/performance-infrastructure')
                  ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-sm shadow-sidebar-primary/5 border-sidebar-primary'
                  : 'text-sidebar-foreground border-transparent hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:translate-x-0.5 hover:border-sidebar-primary/40 hover:shadow-sm hover:shadow-sidebar-primary/5'
              )}
            >
              <GitBranch size={18} className="shrink-0" />
              <span className="flex-1 text-left">Development</span>
              <ChevronDown
                size={14}
                className={cn('transition-transform duration-200', perfOpen ? 'rotate-0' : '-rotate-90')}
              />
            </button>
            {perfOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <NavLink to="/performance-infrastructure" end className={linkClass}>
                  <GitBranch size={14} className="shrink-0" />
                  <span className="text-xs">Flowcharts</span>
                </NavLink>
                <NavLink to="/performance-infrastructure/mockups" className={linkClass}>
                  <Layers size={14} className="shrink-0" />
                  <span className="text-xs">Mockups</span>
                </NavLink>
                <NavLink to="/performance-infrastructure/litify" className={linkClass}>
                  <LayoutDashboard size={14} className="shrink-0" />
                  <span className="text-xs">Litify Mockups</span>
                </NavLink>
                <NavLink to="/performance-infrastructure/alt-control-tower" className={linkClass}>
                  <LayoutDashboard size={14} className="shrink-0" />
                  <span className="text-xs">Alt Control Tower</span>
                </NavLink>
                <NavLink to="/performance-infrastructure/call-team-dashboard" className={linkClass}>
                  <Phone size={14} className="shrink-0" />
                  <span className="text-xs">Call Team Dashboard</span>
                </NavLink>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/performance-infrastructure" className={linkClass} title="Performance Infrastructure">
            <GitBranch size={18} className="shrink-0" />
          </NavLink>
        )}
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Button variant="ghost" size="sm" onClick={onToggleDark}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground transition-all duration-200"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleCollapse}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground transition-all duration-200 max-md:hidden"
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
      <Button variant="outline" size="icon" onClick={() => setMobileOpen(o => !o)}
        className="fixed top-3 left-3 z-50 md:hidden" aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {mobileOpen && (
        <div className="sidebar-backdrop md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border',
        'transition-all duration-200 shrink-0',
        'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:w-64',
        mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        collapsed ? 'md:w-16' : 'md:w-64',
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
