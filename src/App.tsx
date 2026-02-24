import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { DashboardFilterProvider } from './contexts/DashboardFilterContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import PerformanceInfrastructure from './pages/PerformanceInfrastructure.tsx';
import MockupsLanding from './pages/MockupsLanding.tsx';
import LitifyMockupsLanding from './pages/LitifyMockupsLanding.tsx';
import ClientContact from './pages/mockups/ClientContact.tsx';
import CaseSetup from './pages/mockups/CaseSetup.tsx';
import TaskTracker from './pages/mockups/TaskTracker.tsx';
import TMContact from './pages/mockups/TMContact.tsx';
import TMAppointment from './pages/mockups/TMAppointment.tsx';
import TMScoring from './pages/mockups/TMScoring.tsx';
import TMTracker from './pages/mockups/TMTracker.tsx';
import TMMetrics from './pages/mockups/TMMetrics.tsx';
import DiscContact from './pages/mockups/DiscContact.tsx';
import DiscAppointment from './pages/mockups/DiscAppointment.tsx';
import DiscScoring from './pages/mockups/DiscScoring.tsx';
import DiscTracker from './pages/mockups/DiscTracker.tsx';
import DiscMetrics from './pages/mockups/DiscMetrics.tsx';
import ExpContact from './pages/mockups/ExpContact.tsx';
import ExpAppointment from './pages/mockups/ExpAppointment.tsx';
import ExpScoring from './pages/mockups/ExpScoring.tsx';
import ExpTracker from './pages/mockups/ExpTracker.tsx';
import ExpMetrics from './pages/mockups/ExpMetrics.tsx';
import CaseOpeningMatter from './pages/mockups/CaseOpeningMatter.tsx';
import TMMatter from './pages/mockups/TMMatter.tsx';
import DiscMatter from './pages/mockups/DiscMatter.tsx';
import ExpMatter from './pages/mockups/ExpMatter.tsx';
import ArbMedTracker from './pages/mockups/ArbMedTracker.tsx';
import ArbMedScoring from './pages/mockups/ArbMedScoring.tsx';
import ArbMedMetrics from './pages/mockups/ArbMedMetrics.tsx';
import ArbMedMatter from './pages/mockups/ArbMedMatter.tsx';
import TrialTracker from './pages/mockups/TrialTracker.tsx';
import TrialScoring from './pages/mockups/TrialScoring.tsx';
import TrialMetrics from './pages/mockups/TrialMetrics.tsx';
import TrialMatter from './pages/mockups/TrialMatter.tsx';
import ControlTower from './pages/ControlTower.tsx';
import AltControlTower from './pages/AltControlTower.tsx';
import CallTeamDashboard from './pages/CallTeamDashboard.tsx';
import StageCommand from './pages/StageCommand.tsx';
import InventoryHealth from './pages/InventoryHealth.tsx';
import RiskRadar from './pages/RiskRadar.tsx';
import Forecast from './pages/Forecast.tsx';
import AttorneyCockpit from './pages/AttorneyCockpit.tsx';
import ManagerRhythm from './pages/ManagerRhythm.tsx';
import CaseExecution from './pages/CaseExecution.tsx';
import TodaysExposure from './pages/TodaysExposure.tsx';
import GaugeOptions from './pages/GaugeOptions.tsx';

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
            <Route path="today-exposure" element={<TodaysExposure />} />
            <Route path="case/:caseId" element={<CaseExecution />} />
            <Route path="gauge-options" element={<GaugeOptions />} />
            <Route path="performance-infrastructure" element={<PerformanceInfrastructure />} />
            <Route path="performance-infrastructure/mockups" element={<MockupsLanding />} />
            <Route path="performance-infrastructure/litify" element={<LitifyMockupsLanding />} />
            <Route path="performance-infrastructure/alt-control-tower" element={<AltControlTower />} />
            <Route path="performance-infrastructure/call-team-dashboard" element={<CallTeamDashboard />} />
            <Route path="performance-infrastructure/mockups/client-contact" element={<ClientContact />} />
            <Route path="performance-infrastructure/mockups/case-setup" element={<CaseSetup />} />
            <Route path="performance-infrastructure/mockups/task-tracker" element={<TaskTracker />} />
            <Route path="performance-infrastructure/mockups/tm-contact" element={<TMContact />} />
            <Route path="performance-infrastructure/mockups/tm-appointment" element={<TMAppointment />} />
            <Route path="performance-infrastructure/mockups/tm-scoring" element={<TMScoring />} />
            <Route path="performance-infrastructure/mockups/tm-tracker" element={<TMTracker />} />
            <Route path="performance-infrastructure/mockups/tm-metrics" element={<TMMetrics />} />
            <Route path="performance-infrastructure/mockups/disc-contact" element={<DiscContact />} />
            <Route path="performance-infrastructure/mockups/disc-appointment" element={<DiscAppointment />} />
            <Route path="performance-infrastructure/mockups/disc-scoring" element={<DiscScoring />} />
            <Route path="performance-infrastructure/mockups/disc-tracker" element={<DiscTracker />} />
            <Route path="performance-infrastructure/mockups/disc-metrics" element={<DiscMetrics />} />
            <Route path="performance-infrastructure/mockups/exp-contact" element={<ExpContact />} />
            <Route path="performance-infrastructure/mockups/exp-appointment" element={<ExpAppointment />} />
            <Route path="performance-infrastructure/mockups/exp-scoring" element={<ExpScoring />} />
            <Route path="performance-infrastructure/mockups/exp-tracker" element={<ExpTracker />} />
            <Route path="performance-infrastructure/mockups/exp-metrics" element={<ExpMetrics />} />
            <Route path="performance-infrastructure/mockups/co-matter" element={<CaseOpeningMatter />} />
            <Route path="performance-infrastructure/mockups/tm-matter" element={<TMMatter />} />
            <Route path="performance-infrastructure/mockups/disc-matter" element={<DiscMatter />} />
            <Route path="performance-infrastructure/mockups/exp-matter" element={<ExpMatter />} />
            <Route path="performance-infrastructure/mockups/arbmed-tracker" element={<ArbMedTracker />} />
            <Route path="performance-infrastructure/mockups/arbmed-scoring" element={<ArbMedScoring />} />
            <Route path="performance-infrastructure/mockups/arbmed-metrics" element={<ArbMedMetrics />} />
            <Route path="performance-infrastructure/mockups/arbmed-matter" element={<ArbMedMatter />} />
            <Route path="performance-infrastructure/mockups/trial-tracker" element={<TrialTracker />} />
            <Route path="performance-infrastructure/mockups/trial-scoring" element={<TrialScoring />} />
            <Route path="performance-infrastructure/mockups/trial-metrics" element={<TrialMetrics />} />
            <Route path="performance-infrastructure/mockups/trial-matter" element={<TrialMatter />} />
          </Route>
        </Routes>
      </DashboardFilterProvider>
    </TooltipProvider>
  );
}
