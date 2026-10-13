import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  Activity,
  Boxes,
  History,
  Settings,
  Info
} from 'lucide-react';

export type NavTab = 'dashboard' | 'assessment' | 'results' | 'insights' | 'explorer' | 'history' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assessment' as NavTab, label: 'New Assessment', icon: FilePlus2 },
    { id: 'insights' as NavTab, label: 'Health Insights', icon: Activity },
    { id: 'explorer' as NavTab, label: '3D Heart Explorer', icon: Boxes },
    { id: 'history' as NavTab, label: 'History', icon: History },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Official Brand Logo */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              onSelectTab('dashboard');
              onCloseMobile?.();
            }}
            className="w-full focus:outline-none focus:ring-2 focus:ring-teal-500/40 rounded-xl transition-transform hover:opacity-95"
            aria-label="CardioVision AI Dashboard Home"
          >
            <img
              src="/logo.png"
              alt="CardioVision AI — See Beyond the Heartbeat"
              className="w-full max-h-22 object-contain select-none"
            />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Educational Disclaimer Card */}
      <div className="p-4 m-4 rounded-xl bg-slate-50 border border-slate-200/70">
        <div className="flex items-start gap-2.5 text-slate-600">
          <Info className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-slate-800 leading-snug">
              AI-Powered Cardiovascular Risk Prediction
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              Educational use only. Not a diagnosis.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
