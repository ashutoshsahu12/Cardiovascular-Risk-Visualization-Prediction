/**
 * Cardiovascular Risk Visualization & Prediction - Type Definitions
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 * 
 * Defines data contracts for:
 * - Coronary vessel identification (LAD, LCX, RCA)
 * - Machine-learning inference predictions (compatible with Member 2 FastAPI schemas)
 * - 3D scene configuration, camera presets, and selection callbacks
 */

export type CoronaryVesselId = 'LAD' | 'LCX' | 'RCA';

export type StenosisRiskLevel = 'low' | 'intermediate' | 'elevated' | 'high' | 'unknown';

/**
 * Vessel-specific stenosis prediction contract.
 * Reflects Member 2's FastAPI output schema and Member 4's clinical dashboard state.
 */
export interface VesselPrediction {
  /** Identifier of the target coronary artery */
  vesselId: CoronaryVesselId;
  
  /** 
   * Predicted probability of significant stenosis [0.0 - 1.0].
   * Null or undefined indicates missing/pending inference.
   */
  predictedProbability: number | null;
  
  /** 
   * Predicted binary stenosis status (classification threshold ≥ 50%).
   * True = significant stenosis predicted (≥50%).
   * False = no significant stenosis predicted (<50%).
   * Null = prediction pending or unavailable.
   */
  stenosisPrediction: boolean | null;
  
  /** 
   * Clinical threshold used for classification (standard 0.50 / 50%).
   */
  stenosisThreshold: number;

  /**
   * Evaluated risk tier based on continuous probability.
   */
  riskTier?: StenosisRiskLevel;

  /**
   * Optional model confidence score [0.0 - 1.0].
   */
  confidenceScore?: number | null;

  /**
   * Optional explainability / SHAP feature importance contributions.
   * e.g., { "calcification": 0.42, "systolic_bp": 0.28, "cholesterol": 0.15 }
   */
  featureImportance?: Record<string, number>;

  /** Optional clinical notes or localized segment detail (e.g. "Mid LAD plaque") */
  clinicalNotes?: string;
}

/**
 * Overall patient cardiovascular disease prediction contract.
 */
export interface OverallCADPrediction {
  /** Overall CAD probability [0.0 - 1.0] */
  predictedProbability: number | null;
  
  /** Overall CAD binary classification (≥ 50%) */
  cadDetected: boolean | null;
  
  /** Composite clinical risk score (e.g. Framingham or custom model score) */
  riskScore?: number | null;
  
  /** Overall risk category description */
  riskCategory?: 'Low' | 'Moderate' | 'High' | 'Critical' | 'Unknown';
}

/**
 * Complete cardiovascular inference payload passed from Member 2 API / Member 4 Store.
 */
export interface CardiovascularPredictionsPayload {
  patientId?: string;
  timestamp?: string;
  overallCAD?: OverallCADPrediction | null;
  vessels: {
    LAD?: VesselPrediction | null;
    LCX?: VesselPrediction | null;
    RCA?: VesselPrediction | null;
  };
}

/**
 * Anatomical metadata for a coronary vessel.
 */
export interface VesselMetadata {
  id: CoronaryVesselId;
  commonName: string;
  anatomicalName: string;
  latinName: string;
  perfusionTerritory: string;
  clinicalSignificance: string;
  meshAliases: string[];
}

/**
 * Camera preset view directions.
 */
export type CameraPreset = 'anterior' | 'lao' | 'rao' | 'posterior' | 'superior' | 'reset';

/**
 * 3D Scene Viewport display settings.
 */
export interface SceneDisplaySettings {
  showLabels: boolean;
  showVesselHalos: boolean;
  pulsateHighRisk: boolean;
  myocardiumOpacity: number;
  wireframe: boolean;
  backgroundColor: string;
}

/**
 * Props accepted by the root HeartScene integration component.
 * Allows Member 4 to seamlessly embed the 3D viewport into the clinical dashboard.
 */
export interface HeartSceneProps {
  /** Vessel predictions payload (or null/undefined if waiting for form submission) */
  predictions?: CardiovascularPredictionsPayload | null;
  
  /** Currently selected vessel (controlled mode) */
  selectedVessel?: CoronaryVesselId | null;
  
  /** Callback fired when a coronary vessel is clicked */
  onVesselSelect?: (vesselId: CoronaryVesselId | null) => void;
  
  /** Callback fired when a vessel is hovered */
  onVesselHover?: (vesselId: CoronaryVesselId | null) => void;
  
  /** Loading state flag (e.g. during backend inference) */
  isLoading?: boolean;
  
  /** Error message if backend inference or model loading failed */
  errorMessage?: string | null;
  
  /** Custom model asset URL (defaults to /models/heart.glb) */
  modelUrl?: string;
  
  /** Optional container height (CSS string, defaults to '100%') */
  height?: string | number;
  
  /** Optional container width (CSS string, defaults to '100%') */
  width?: string | number;

  /** Optional className for outer container styling */
  className?: string;

  /** Show built-in dashboard overlays (legend, camera controls, vessel detail pill) */
  showOverlays?: boolean;
}
