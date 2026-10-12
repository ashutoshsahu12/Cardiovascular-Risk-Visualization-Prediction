/**
 * Shared Cardiovascular Store (Zustand)
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 * 
 * Provides unified state for:
 * - Real-time ML predictions from Member 2 API
 * - Interactive 3D scene selection, hover, and camera control
 * - Clinical dashboard synchronization for Member 4
 */

import { create } from 'zustand';
import type {
  CoronaryVesselId,
  CardiovascularPredictionsPayload,
  VesselPrediction,
  CameraPreset,
  SceneDisplaySettings,
} from '../types/index.ts';

export interface CardiovascularState {
  // --- Prediction State ---
  predictions: CardiovascularPredictionsPayload | null;
  isLoading: boolean;
  errorMessage: string | null;

  // --- 3D Scene Interaction State ---
  selectedVessel: CoronaryVesselId | null;
  hoveredVessel: CoronaryVesselId | null;
  cameraPreset: CameraPreset;
  cameraResetNonce: number; // Trigger camera reset animations

  // --- Visual Settings ---
  displaySettings: SceneDisplaySettings;
  showLegend: boolean;
  showAnatomyLabels: boolean;

  // --- Actions ---
  setPredictions: (predictions: CardiovascularPredictionsPayload | null) => void;
  setVesselPrediction: (vesselId: CoronaryVesselId, prediction: Partial<VesselPrediction>) => void;
  selectVessel: (vesselId: CoronaryVesselId | null) => void;
  setHoveredVessel: (vesselId: CoronaryVesselId | null) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  triggerResetCamera: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (errorMessage: string | null) => void;
  updateDisplaySettings: (settings: Partial<SceneDisplaySettings>) => void;
  toggleLegend: () => void;
  toggleAnatomyLabels: () => void;

  // --- Demo & Clinical Presets ---
  loadDemoScenario: (scenario: 'high_risk_lad' | 'multivessel_cad' | 'normal_low_risk' | 'pending_inference') => void;
}

const DEFAULT_DISPLAY_SETTINGS: SceneDisplaySettings = {
  showLabels: true,
  showVesselHalos: true,
  pulsateHighRisk: true,
  myocardiumOpacity: 0.95,
  wireframe: false,
  backgroundColor: '#090d16',
};

/**
 * Pre-configured clinical demo scenarios for interactive testing and presentation.
 */
export const CLINICAL_DEMO_SCENARIOS: Record<'high_risk_lad' | 'multivessel_cad' | 'normal_low_risk' | 'pending_inference', CardiovascularPredictionsPayload | null> = {
  high_risk_lad: {
    patientId: 'PT-9042',
    timestamp: new Date().toISOString(),
    overallCAD: {
      predictedProbability: 0.78,
      cadDetected: true,
      riskScore: 78,
      riskCategory: 'High',
    },
    vessels: {
      LAD: {
        vesselId: 'LAD',
        predictedProbability: 0.88,
        stenosisPrediction: true,
        stenosisThreshold: 0.50,
        riskTier: 'high',
        confidenceScore: 0.94,
        featureImportance: {
          'Calcium Agatston Score': 0.44,
          'Max Systolic BP (168 mmHg)': 0.26,
          'LDL-C (174 mg/dL)': 0.18,
          'Diabetic History': 0.12,
        },
        clinicalNotes: 'Severe proximal LAD stenosis predicted (≥70% probability). High risk for anterior wall ischemia.',
      },
      LCX: {
        vesselId: 'LCX',
        predictedProbability: 0.32,
        stenosisPrediction: false,
        stenosisThreshold: 0.50,
        riskTier: 'intermediate',
        confidenceScore: 0.82,
        featureImportance: {
          'Age (64)': 0.35,
          'LDL-C': 0.25,
        },
        clinicalNotes: 'Mild to borderline plaque formation; below 50% flow-limiting threshold.',
      },
      RCA: {
        vesselId: 'RCA',
        predictedProbability: 0.18,
        stenosisPrediction: false,
        stenosisThreshold: 0.50,
        riskTier: 'low',
        confidenceScore: 0.89,
        featureImportance: {
          'Normal RV perfusion': 0.60,
        },
        clinicalNotes: 'Patent right coronary circulation.',
      },
    },
  },
  multivessel_cad: {
    patientId: 'PT-8831',
    timestamp: new Date().toISOString(),
    overallCAD: {
      predictedProbability: 0.91,
      cadDetected: true,
      riskScore: 91,
      riskCategory: 'Critical',
    },
    vessels: {
      LAD: {
        vesselId: 'LAD',
        predictedProbability: 0.82,
        stenosisPrediction: true,
        stenosisThreshold: 0.50,
        riskTier: 'high',
        confidenceScore: 0.91,
        featureImportance: {
          'Heavy anterior calcification': 0.45,
          'Smoking history': 0.30,
        },
      },
      LCX: {
        vesselId: 'LCX',
        predictedProbability: 0.62,
        stenosisPrediction: true,
        stenosisThreshold: 0.50,
        riskTier: 'elevated',
        confidenceScore: 0.85,
        featureImportance: {
          'Obtuse marginal narrowing': 0.38,
        },
      },
      RCA: {
        vesselId: 'RCA',
        predictedProbability: 0.74,
        stenosisPrediction: true,
        stenosisThreshold: 0.50,
        riskTier: 'high',
        confidenceScore: 0.88,
        featureImportance: {
          'Right coronary sinus plaque': 0.42,
        },
      },
    },
  },
  normal_low_risk: {
    patientId: 'PT-4105',
    timestamp: new Date().toISOString(),
    overallCAD: {
      predictedProbability: 0.08,
      cadDetected: false,
      riskScore: 8,
      riskCategory: 'Low',
    },
    vessels: {
      LAD: {
        vesselId: 'LAD',
        predictedProbability: 0.09,
        stenosisPrediction: false,
        stenosisThreshold: 0.50,
        riskTier: 'low',
        confidenceScore: 0.96,
        clinicalNotes: 'Clean anterior interventricular artery with no significant luminal restriction.',
      },
      LCX: {
        vesselId: 'LCX',
        predictedProbability: 0.12,
        stenosisPrediction: false,
        stenosisThreshold: 0.50,
        riskTier: 'low',
        confidenceScore: 0.94,
      },
      RCA: {
        vesselId: 'RCA',
        predictedProbability: 0.06,
        stenosisPrediction: false,
        stenosisThreshold: 0.50,
        riskTier: 'low',
        confidenceScore: 0.97,
      },
    },
  },
  pending_inference: null,
};

export const useCardiovascularStore = create<CardiovascularState>((set, get) => ({
  predictions: CLINICAL_DEMO_SCENARIOS.high_risk_lad, // Default to clinically illustrative state
  isLoading: false,
  errorMessage: null,

  selectedVessel: 'LAD', // Start with prominent LAD selected for immediate visual clarity
  hoveredVessel: null,
  cameraPreset: 'anterior',
  cameraResetNonce: 0,

  displaySettings: DEFAULT_DISPLAY_SETTINGS,
  showLegend: true,
  showAnatomyLabels: true,

  setPredictions: (predictions) => set({ predictions, errorMessage: null }),

  setVesselPrediction: (vesselId, partialPred) => {
    const current = get().predictions;
    const existingVessels = current?.vessels ?? {};
    const existing = existingVessels[vesselId] ?? {
      vesselId,
      predictedProbability: null,
      stenosisPrediction: null,
      stenosisThreshold: 0.50,
    };

    set({
      predictions: {
        ...(current ?? { vessels: {} }),
        vessels: {
          ...existingVessels,
          [vesselId]: {
            ...existing,
            ...partialPred,
          },
        },
      },
    });
  },

  selectVessel: (vesselId) => {
    set({ selectedVessel: vesselId });
  },

  setHoveredVessel: (vesselId) => set({ hoveredVessel: vesselId }),

  setCameraPreset: (cameraPreset) => set({ cameraPreset }),

  triggerResetCamera: () => set((state) => ({ cameraResetNonce: state.cameraResetNonce + 1, cameraPreset: 'reset' })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (errorMessage) => set({ errorMessage, isLoading: false }),

  updateDisplaySettings: (settings) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, ...settings },
    })),

  toggleLegend: () => set((state) => ({ showLegend: !state.showLegend })),

  toggleAnatomyLabels: () => set((state) => ({ showAnatomyLabels: !state.showAnatomyLabels })),

  loadDemoScenario: (scenario) => {
    const payload = CLINICAL_DEMO_SCENARIOS[scenario];
    set({
      predictions: payload,
      errorMessage: null,
      isLoading: false,
      selectedVessel: scenario === 'pending_inference' ? null : 'LAD',
    });
  },
}));
