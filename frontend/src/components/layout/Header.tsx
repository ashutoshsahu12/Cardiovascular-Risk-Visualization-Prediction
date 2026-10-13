import React from 'react';
import { Search, Bell, Menu, Plus } from 'lucide-react';
import { NavTab } from './Sidebar';
import { ProfileMenu } from './ProfileMenu';

interface HeaderProps {
  currentTab: NavTab;
  onNavigateToAssessment: () => void;
  onToggleMobileMenu: () => void;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigateToAssessment,
  onToggleMobileMenu,
  onSelectTab
}) => {
  const getTitles = (): { title: string; subtitle: string } => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Your Heart Health Overview',
          subtitle: 'Understand your measurements and explore your cardiovascular assessment.'
        };
      case 'assessment':
        return {
          title: 'New Assessment',
          subtitle: 'Enter your clinical information for a personalized cardiovascular assessment.'
        };
      case 'results':
        return {
          title: 'Analysis Results',
          subtitle: 'AI-powered prediction and detailed analysis based on your input.'
        };
      case 'explorer':
        return {
          title: '3D Heart Explorer',
          subtitle: 'Explore the interactive 3D model with AI predictions for each coronary artery.'
        };
      case 'insights':
        return {
          title: 'Personalized Health Insights',
          subtitle: 'Detailed analysis of your clinical measurements and their significance.'
        };
      case 'history':
        return {
          title: 'Assessment History',
          subtitle: 'View and compare your previous assessments.'
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'Configure backend connection, threshold parameters, and preferences.'
        };
      default:
        return { title: 'CardioVision AI', subtitle: 'Cardiovascular assessment platform' };
    }
  };

  const { title, subtitle } = getTitles();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Compact Official Logo for mobile screen view */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          aria-label="Return to Dashboard"
          className="md:hidden focus:outline-none"
        >
          <img
            src="/logo.png"
            alt="CardioVision AI"
            className="h-9 w-auto object-contain select-none"
          />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Search, Notifications, Profile, Action CTA */}
      <div className="flex items-center gap-3 self-end md:self-auto">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs rounded-full border border-slate-200/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 w-44 transition-all"
          />
        </div>

        {/* Notification Icon */}
        <button
          type="button"
          title="Notifications"
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 ring-2 ring-white" />
        </button>

        {/* User Profile Menu */}
        <ProfileMenu onNavigate={onSelectTab} />

        {/* Action Button (Visible on Dashboard and History) */}
        {(currentTab === 'dashboard' || currentTab === 'history') && (
          <button
            type="button"
            onClick={onNavigateToAssessment}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{currentTab === 'dashboard' ? 'Start New Assessment' : 'New Assessment'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
