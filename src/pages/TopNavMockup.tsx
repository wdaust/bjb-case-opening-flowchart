import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import {
  Search,
  UserCircle,
  Bell,
} from 'lucide-react';
import ControlTower from './ControlTower';
import { AIChatWidget } from '../components/dashboard/AIChatWidget';

const DARK_MODE_KEY = 'bjb-flowchart-dark';

const navTabs = [
  { label: 'Command View', href: '/top-nav-mockup', active: true },
  { label: 'Inventory Health', href: '#' },
  { label: 'Risk Radar', href: '#' },
  { label: 'Forecast', href: '#' },
  { label: 'Stages', href: '#' },
];

export default function TopNavMockup() {
  const [darkMode] = useState(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(DARK_MODE_KEY, String(darkMode)); } catch { /* ignore */ }
  }, [darkMode]);

  return (
    <div className="h-screen flex flex-col bg-[#111111]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Top Nav Bar — dark monochrome */}
      <header className="shrink-0 bg-[#1a1a1a] px-5 flex items-center justify-between h-14">
        {/* Left: Logo + Search */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt="BJB"
              className="h-6 w-6 brightness-0 invert"
            />
            <span className="text-white font-semibold text-sm tracking-wide">BJB</span>
          </div>
          <div className="flex items-center gap-2 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-500 text-sm">
            <Search size={14} />
            <span>Search any token /</span>
          </div>
        </div>

        {/* Center: Nav Tabs — plain text links */}
        <nav className="flex items-center gap-6">
          {navTabs.map((tab) => (
            <a
              key={tab.label}
              href={tab.active ? undefined : tab.href}
              className={cn(
                'text-sm font-medium transition-colors',
                tab.active
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {tab.label}
            </a>
          ))}
        </nav>

        {/* Right: Bell + Avatar */}
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-200 transition-colors">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
              <UserCircle size={22} />
            </div>
            <span className="text-sm text-gray-400">Admin</span>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-auto">
        <main data-topnav-dark className="bg-[#141414] min-h-screen">
          <style>{`
            [data-topnav-dark] {
              font-family: 'IBM Plex Mono', monospace;
              --background: 0 0% 8%;
              --foreground: 0 0% 85%;
              --card: 0 0% 10%;
              --card-foreground: 0 0% 85%;
              --border: 0 0% 18%;
              --muted: 0 0% 14%;
              --muted-foreground: 0 0% 50%;
              --popover: 0 0% 10%;
              --popover-foreground: 0 0% 85%;
              --primary: 142 71% 45%;
              --primary-foreground: 0 0% 5%;
              --secondary: 0 0% 14%;
              --secondary-foreground: 0 0% 85%;
              --accent: 142 71% 45%;
              --accent-foreground: 0 0% 5%;
              --destructive: 0 0% 35%;
              --destructive-foreground: 0 0% 85%;
              --ring: 142 71% 45%;
              --input: 0 0% 18%;

              --color-background: hsl(0 0% 8%);
              --color-foreground: hsl(0 0% 85%);
              --color-card: hsl(0 0% 10%);
              --color-card-foreground: hsl(0 0% 85%);
              --color-border: hsl(0 0% 18%);
              --color-muted: hsl(0 0% 14%);
              --color-muted-foreground: hsl(0 0% 50%);
              --color-popover: hsl(0 0% 10%);
              --color-popover-foreground: hsl(0 0% 85%);
              --color-primary: hsl(142 71% 45%);
              --color-primary-foreground: hsl(0 0% 5%);
              --color-secondary: hsl(0 0% 14%);
              --color-secondary-foreground: hsl(0 0% 85%);
              --color-accent: hsl(142 71% 45%);
              --color-accent-foreground: hsl(0 0% 5%);
              --color-destructive: hsl(0 0% 35%);
              --color-destructive-foreground: hsl(0 0% 85%);
              --color-ring: hsl(142 71% 45%);
              --color-input: hsl(0 0% 18%);
            }
          `}</style>
          <ControlTower />
        </main>
      </div>

      <AIChatWidget />
    </div>
  );
}
