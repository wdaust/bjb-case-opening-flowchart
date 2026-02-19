import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { DashboardFilterProvider } from './contexts/DashboardFilterContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import PerformanceInfrastructure from './pages/PerformanceInfrastructure.tsx';
import ControlTower from './pages/ControlTower.tsx';
import StageCommand from './pages/StageCommand.tsx';
import InventoryHealth from './pages/InventoryHealth.tsx';
import RiskRadar from './pages/RiskRadar.tsx';
import Forecast from './pages/Forecast.tsx';
import AttorneyCockpit from './pages/AttorneyCockpit.tsx';
import ManagerRhythm from './pages/ManagerRhythm.tsx';
import CaseExecution from './pages/CaseExecution.tsx';

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
      <DashboardFilterProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/control-tower" replace />} />
            <Route path="control-tower" element={<ControlTower />} />
            <Route path="stage/:stageId" element={<StageCommand />} />
            <Route path="inventory-health" element={<InventoryHealth />} />
            <Route path="risk-radar" element={<RiskRadar />} />
            <Route path="forecast" element={<Forecast />} />
            <Route path="attorney/:attorneyId?" element={<AttorneyCockpit />} />
            <Route path="attorney" element={<AttorneyCockpit />} />
            <Route path="manager-rhythm" element={<ManagerRhythm />} />
            <Route path="case/:caseId" element={<CaseExecution />} />
            <Route path="performance-infrastructure" element={<PerformanceInfrastructure />} />
          </Route>
        </Routes>
      </DashboardFilterProvider>
    </TooltipProvider>
  );
}
