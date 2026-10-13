import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';
import { ShieldAlert } from 'lucide-react';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header
          currentTab={currentTab}
          onNavigateToAssessment={() => onSelectTab('assessment')}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSelectTab={onSelectTab}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mandatory Medical Safety Disclaimer Footer */}
        <footer className="mt-auto border-t border-slate-200/80 bg-white/70 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
            <p>
              <strong className="text-slate-700">Medical Notice:</strong> CardioVision AI provides educational and decision-support information. Its predictions are not a diagnosis and do not replace professional medical assessment or clinical imaging.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
