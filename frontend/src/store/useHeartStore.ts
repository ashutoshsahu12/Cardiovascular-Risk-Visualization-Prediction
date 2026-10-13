import { create } from 'zustand';
import { VesselId, HeartViewMode } from '../types/heart';

interface HeartStore {
  selectedVessel: VesselId;
  viewMode: HeartViewMode;
  cameraResetKey: number;
  setSelectedVessel: (vessel: VesselId) => void;
  setViewMode: (mode: HeartViewMode) => void;
  resetCamera: () => void;
}

export const useHeartStore = create<HeartStore>((set) => ({
  selectedVessel: 'LAD',
  viewMode: 'prediction',
  cameraResetKey: 0,

  setSelectedVessel: (vessel) => set({ selectedVessel: vessel }),
  setViewMode: (mode) => set({ viewMode: mode }),
  resetCamera: () => set((state) => ({ cameraResetKey: state.cameraResetKey + 1 }))
}));
