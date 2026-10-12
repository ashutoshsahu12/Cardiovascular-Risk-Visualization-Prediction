import { describe, it, expect, beforeEach } from 'vitest';
import { useCardiovascularStore } from './cardiovascularStore.ts';

describe('cardiovascularStore tests', () => {
  beforeEach(() => {
    useCardiovascularStore.setState({
      predictions: null,
      selectedVessel: null,
      hoveredVessel: null,
      cameraPreset: 'anterior',
      isLoading: false,
      errorMessage: null,
    });
  });

  it('selects and deselects coronary vessels', () => {
    const store = useCardiovascularStore.getState();
    expect(store.selectedVessel).toBeNull();

    store.selectVessel('LAD');
    expect(useCardiovascularStore.getState().selectedVessel).toBe('LAD');

    store.selectVessel('LCX');
    expect(useCardiovascularStore.getState().selectedVessel).toBe('LCX');

    store.selectVessel(null);
    expect(useCardiovascularStore.getState().selectedVessel).toBeNull();
  });

  it('handles hovered vessel changes', () => {
    const store = useCardiovascularStore.getState();
    store.setHoveredVessel('RCA');
    expect(useCardiovascularStore.getState().hoveredVessel).toBe('RCA');

    store.setHoveredVessel(null);
    expect(useCardiovascularStore.getState().hoveredVessel).toBeNull();
  });

  it('loads clinical demo scenarios correctly', () => {
    const store = useCardiovascularStore.getState();
    store.loadDemoScenario('high_risk_lad');

    const state = useCardiovascularStore.getState();
    expect(state.predictions).not.toBeNull();
    expect(state.predictions?.vessels.LAD?.predictedProbability).toBe(0.88);
    expect(state.predictions?.vessels.LAD?.stenosisPrediction).toBe(true);
    expect(state.predictions?.vessels.LCX?.predictedProbability).toBe(0.32);
    expect(state.predictions?.vessels.RCA?.predictedProbability).toBe(0.18);
  });

  it('increments camera reset nonce to signal controls', () => {
    const initialNonce = useCardiovascularStore.getState().cameraResetNonce;
    useCardiovascularStore.getState().triggerResetCamera();
    expect(useCardiovascularStore.getState().cameraResetNonce).toBe(initialNonce + 1);
    expect(useCardiovascularStore.getState().cameraPreset).toBe('reset');
  });

  it('updates vessel-specific prediction reactively without overwriting other vessels', () => {
    const store = useCardiovascularStore.getState();
    store.loadDemoScenario('high_risk_lad');

    // Update only LCX
    store.setVesselPrediction('LCX', {
      predictedProbability: 0.95,
      stenosisPrediction: true,
    });

    const updated = useCardiovascularStore.getState().predictions?.vessels;
    expect(updated?.LCX?.predictedProbability).toBe(0.95);
    expect(updated?.LCX?.stenosisPrediction).toBe(true);
    // LAD should remain intact
    expect(updated?.LAD?.predictedProbability).toBe(0.88);
  });
});
