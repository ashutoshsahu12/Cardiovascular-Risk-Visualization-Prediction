import { create } from 'zustand';

export type SummaryEntryPoint = 'dashboard' | 'assessment' | 'results';

interface SummaryStore {
  isOpen: boolean;
  entryPoint: SummaryEntryPoint;
  openSummary: (entryPoint?: SummaryEntryPoint) => void;
  closeSummary: () => void;
}

export const useSummaryStore = create<SummaryStore>((set) => ({
  isOpen: false,
  entryPoint: 'dashboard',
  openSummary: (entryPoint = 'dashboard') => set({ isOpen: true, entryPoint }),
  closeSummary: () => set({ isOpen: false })
}));
