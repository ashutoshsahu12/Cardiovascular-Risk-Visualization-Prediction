import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useSummaryStore } from '../../store/useSummaryStore';
import { AiHealthSummary } from './AiHealthSummary';
import { NavTab } from '../layout/Sidebar';

interface AiHealthSummaryModalProps {
  onNavigate: (tab: NavTab) => void;
}

export const AiHealthSummaryModal: React.FC<AiHealthSummaryModalProps> = ({ onNavigate }) => {
  const { isOpen, entryPoint, closeSummary } = useSummaryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSummary();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSummary]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-summary-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeSummary}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200/90 shadow-2xl overflow-hidden my-auto relative animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="ai-summary-title" className="text-sm sm:text-base font-bold text-slate-900">
                AI Health Summary & Educational Guidance
              </h3>
              <p className="text-[11px] text-slate-400">
                CardioVision AI • Clinical Decision Support
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSummary}
            aria-label="Close summary modal"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <AiHealthSummary
            entryPoint={entryPoint}
            onClose={closeSummary}
            onNavigateToAssessment={() => {
              closeSummary();
              onNavigate('assessment');
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500">
            Intended for educational support. Not a diagnostic confirmation.
          </span>
          <button
            type="button"
            onClick={closeSummary}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
