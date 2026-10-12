/**
 * Member 3: 3D Scene Engine & Spatial Mapping Lead - Public Library Exports
 * Cardiovascular Risk Visualization & Prediction
 */

// Core Viewport Components
export { HeartScene } from './components/HeartScene.tsx';
export { HeartModel } from './components/HeartModel.tsx';
export { CoronaryVessels } from './components/CoronaryVessels.tsx';
export { HeartLighting } from './components/HeartLighting.tsx';
export { HeartSceneControls } from './components/HeartSceneControls.tsx';
export { HeartSceneOverlay } from './components/HeartSceneOverlay.tsx';

// State Management
export {
  useCardiovascularStore,
  CLINICAL_DEMO_SCENARIOS,
} from './store/cardiovascularStore.ts';
export type { CardiovascularState } from './store/cardiovascularStore.ts';

// Deterministic Risk-to-Color Utilities
export {
  getVesselRiskColor,
  getVesselRiskColorHex,
  getVesselMaterialProps,
  interpolateRiskColor,
  evaluateStenosisThreshold,
  classifyRiskTier,
  isValidProbability,
  RISK_COLOR_HEX,
  RISK_LEGEND_ITEMS,
} from './utils/vesselColors.ts';

// Anatomical Configuration & Spatial Mappings
export {
  CORONARY_VESSEL_IDS,
  CORONARY_VESSEL_PATHS,
  VESSEL_METADATA_RECORD,
  findVesselByMeshName,
  isVesselMesh,
  getVesselMetadata,
  createVesselCurve,
} from './config/vesselConfig.ts';

// TypeScript Types & Contracts
export type {
  CoronaryVesselId,
  StenosisRiskLevel,
  VesselPrediction,
  OverallCADPrediction,
  CardiovascularPredictionsPayload,
  VesselMetadata,
  CameraPreset,
  SceneDisplaySettings,
  HeartSceneProps,
} from './types/index.ts';
