import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import PerformanceInfrastructure from './pages/PerformanceInfrastructure.tsx';
import DashboardClient from './pages/DashboardClient.tsx';
import DashboardPreLit from './pages/DashboardPreLit.tsx';
import DashboardLit from './pages/DashboardLit.tsx';
import LitScorecard from './pages/LitScorecard.tsx';

const DARK_MODE_KEY = 'bjb-flowchart-dark';
const SIDEBAR_KEY = 'bjb-sidebar-collapsed';

function Layout() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(DARK_MODE_KEY, String(darkMode)); } catch { /* ignore */ }
  }, [darkMode]);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)); } catch { /* ignore */ }
  }, [collapsed]);

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/performance-infrastructure" replace />} />
          <Route path="performance-infrastructure" element={<PerformanceInfrastructure />} />
          <Route path="dashboards/client" element={<DashboardClient />} />
          <Route path="dashboards/pre-lit" element={<DashboardPreLit />} />
          <Route path="dashboards/lit" element={<DashboardLit />} />
          <Route path="lit-scorecard" element={<LitScorecard />} />
        </Route>
      </Routes>
    </TooltipProvider>
  );
}
