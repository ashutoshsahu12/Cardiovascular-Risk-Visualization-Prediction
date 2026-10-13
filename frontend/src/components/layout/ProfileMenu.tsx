import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  User,
  History,
  Settings,
  X,
  Activity,
  Info,
  ShieldCheck,
  Mail,
  Heart
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAssessmentStore } from '../../store/useAssessmentStore';

interface ProfileMenuProps {
  onNavigate: (tab: NavTab) => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { formData } = useAssessmentStore();

  // Known account information from active user profile
  const userAccount = {
    displayName: 'Vedant Mishra',
    email: 'mvedant7777@gmail.com', // Active local user email
    sessionType: 'Local Browser Session'
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key press and restore focus to trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNavigate = (tab: NavTab) => {
    onNavigate(tab);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile Button Trigger (Preserving exact header aesthetics) */}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="User profile and health information panel"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border bg-white cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/40 shadow-2xs ${
          isOpen
            ? 'border-teal-500 ring-2 ring-teal-500/20'
            : 'border-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-semibold overflow-hidden shadow-xs">
          VM
        </div>
        <span className="text-xs font-semibold text-slate-700">{userAccount.displayName.split(' ')[0]}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {/* Floating Compact Profile Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Profile and Health Information"
          className="absolute right-0 mt-2.5 w-84 sm:w-92 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                VM
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                  {userAccount.displayName}
                </h3>
                {userAccount.email && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{userAccount.email}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close profile panel"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs divide-y divide-slate-100">
            {/* Section 1: Account Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Account Information</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Display Name:</span>
                  <span className="font-semibold text-slate-800">{userAccount.displayName}</span>
                </div>
                {userAccount.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-800">{userAccount.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Access Mode:</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Local Session</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Relevant Health Information (Active Assessment) */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  <span>Health Information</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Active Assessment</span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                  <span className="text-slate-500">Biological Sex:</span>
                  <span className="font-semibold text-slate-800">{formData.sex || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                  <span className="text-slate-500">Height:</span>
                  <span className="font-semibold text-slate-800">{formData.height ? `${formData.height} cm` : 'Not recorded'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                  <span className="text-slate-500">Weight:</span>
                  <span className="font-semibold text-slate-800">{formData.weight ? `${formData.weight} kg` : 'Not recorded'}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                  <span className="text-slate-500">Smoking Status:</span>
                  <span className="font-semibold text-slate-800">{formData.smokingStatus || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Family History of CAD:</span>
                  <span className="font-semibold text-slate-800">{formData.familyHistory || 'Not recorded'}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                * Note: Health data reflects the current clinical assessment and is not stored as permanent account credentials.
              </p>
            </div>

            {/* Section 3: Navigation Links to Existing Routes */}
            <div className="pt-4 space-y-1">
              <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1.5">
                Quick Navigation
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('history')}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-teal-700 font-medium flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  <span>Assessment History</span>
                </div>
                <span className="text-slate-400 text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('settings')}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-teal-700 font-medium flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  <span>System Settings</span>
                </div>
                <span className="text-slate-400 text-xs">→</span>
              </button>
            </div>

            {/* Section 4: Compact Authentication Notice */}
            <div className="pt-4">
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Authentication Notice:</strong> Remote OAuth/JWT authentication is not enabled. Data is stored locally in this browser session and is not synced across devices.
                </p>
              </div>
            </div>
          </div>

          {/* Panel Footer Close Button */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
