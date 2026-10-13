import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { NavTab } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AssessmentPage } from './pages/AssessmentPage';
import { ResultsPage } from './pages/ResultsPage';
import { HeartExplorerPage } from './pages/HeartExplorerPage';
import { HealthInsightsPage } from './pages/HealthInsightsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AiHealthSummaryModal } from './components/summary/AiHealthSummaryModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  return (
    <>
      <AppShell currentTab={currentTab} onSelectTab={setCurrentTab}>
        {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
        {currentTab === 'assessment' && <AssessmentPage onNavigate={setCurrentTab} />}
        {currentTab === 'results' && <ResultsPage onNavigate={setCurrentTab} />}
        {currentTab === 'explorer' && <HeartExplorerPage onNavigate={setCurrentTab} />}
        {currentTab === 'insights' && <HealthInsightsPage />}
        {currentTab === 'history' && <HistoryPage onNavigate={setCurrentTab} />}
        {currentTab === 'settings' && <SettingsPage />}
      </AppShell>

      {/* Global Reusable AI Health Summary Modal */}
      <AiHealthSummaryModal onNavigate={setCurrentTab} />
    </>
  );
};

export default App;
