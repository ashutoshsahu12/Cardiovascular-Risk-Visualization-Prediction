/**
 * Deterministic Risk-to-Color Spatial Mapping Utility
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 *
 * Rules:
 * 1. Continuous piecewise green-to-red gradient for predicted probability:
 *    [0.00: Emerald Green] -> [0.35: Warm Yellow] -> [0.65: Vibrant Orange] -> [1.00: Crimson Red]
 * 2. Neutral slate gray (#64748b) for missing, null, NaN, pending, or out-of-range data.
 *    (NEVER defaults missing data to green / low-risk!)
 * 3. Clear mathematical separation between:
 *    - Continuous predicted probability of stenosis
 *    - Binary ≥50% stenosis classification threshold
 *    - Anatomical stenosis measurement
 */

import * as THREE from 'three';
import type { VesselPrediction, StenosisRiskLevel } from '../types/heart';

/**
 * Standard palette definition in Hex strings and Three.js Color objects.
 */
export const RISK_COLOR_HEX = {
  LOW: '#10b981',         // Emerald Green (0% - ~30%)
  INTERMEDIATE: '#eab308', // Amber Yellow (~30% - ~50%)
  ELEVATED: '#f97316',     // Orange (~50% - ~70%)
  HIGH: '#ef4444',         // Crimson Red (~70% - 100%)
  UNKNOWN: '#64748b',      // Slate Gray (Pending, Null, Invalid)
  HOVER_GLOW: '#ffffff',   // Subtle white boost on hover
  SELECTION_HALO: '#38bdf8'// Sky cyan emissive halo when selected
} as const;

export const THREE_COLORS = {
  LOW: new THREE.Color(RISK_COLOR_HEX.LOW),
  INTERMEDIATE: new THREE.Color(RISK_COLOR_HEX.INTERMEDIATE),
  ELEVATED: new THREE.Color(RISK_COLOR_HEX.ELEVATED),
  HIGH: new THREE.Color(RISK_COLOR_HEX.HIGH),
  UNKNOWN: new THREE.Color(RISK_COLOR_HEX.UNKNOWN),
  HOVER_GLOW: new THREE.Color(RISK_COLOR_HEX.HOVER_GLOW),
  SELECTION_HALO: new THREE.Color(RISK_COLOR_HEX.SELECTION_HALO),
};

/**
 * Validates whether an input value is a legitimate probability in [0.0, 1.0].
 */
export function isValidProbability(val: unknown): val is number {
  return (
    typeof val === 'number' &&
    Number.isFinite(val) &&
    !Number.isNaN(val) &&
    val >= 0.0 &&
    val <= 1.0
  );
}

/**
 * Categorizes a valid continuous probability into clinical risk tiers.
 * Note: Clinical threshold of ≥50% marks elevated/high categories.
 */
export function classifyRiskTier(prob: number | null | undefined): StenosisRiskLevel {
  if (!isValidProbability(prob)) return 'unknown';
  if (prob < 0.30) return 'low';
  if (prob < 0.50) return 'intermediate';
  if (prob < 0.70) return 'elevated';
  return 'high';
}

/**
 * Interpolates smoothly along the 4-stop clinical gradient:
 * 0.00 -> 0.35: Low (Green) to Intermediate (Yellow)
 * 0.35 -> 0.65: Intermediate (Yellow) to Elevated (Orange)
 * 0.65 -> 1.00: Elevated (Orange) to High (Red)
 */
export function interpolateRiskColor(probability: number): THREE.Color {
  const p = Math.max(0, Math.min(1, probability));
  const result = new THREE.Color();

  if (p <= 0.35) {
    // 0.00 to 0.35: Green -> Yellow
    const factor = p / 0.35;
    result.copy(THREE_COLORS.LOW).lerp(THREE_COLORS.INTERMEDIATE, factor);
  } else if (p <= 0.65) {
    // 0.35 to 0.65: Yellow -> Orange
    const factor = (p - 0.35) / 0.30;
    result.copy(THREE_COLORS.INTERMEDIATE).lerp(THREE_COLORS.ELEVATED, factor);
  } else {
    // 0.65 to 1.00: Orange -> Red
    const factor = (p - 0.65) / 0.35;
    result.copy(THREE_COLORS.ELEVATED).lerp(THREE_COLORS.HIGH, factor);
  }

  return result;
}

/**
 * Reusable, deterministic risk-to-color mapping function.
 * Accepts a vessel prediction object and returns a cloned THREE.Color.
 *
 * Guarantees:
 * - If prediction is null, undefined, or missing probability: returns neutral gray (#64748b).
 * - If probability is NaN, negative, or > 1: returns neutral gray.
 * - If valid probability: returns continuous interpolated color along green->yellow->orange->red.
 */
export function getVesselRiskColor(prediction?: VesselPrediction | null): THREE.Color {
  if (!prediction || !isValidProbability(prediction.predictedProbability)) {
    return THREE_COLORS.UNKNOWN.clone();
  }
  return interpolateRiskColor(prediction.predictedProbability);
}

/**
 * Returns hex color string for CSS/UI labels.
 */
export function getVesselRiskColorHex(prediction?: VesselPrediction | null): string {
  if (!prediction || !isValidProbability(prediction.predictedProbability)) {
    return RISK_COLOR_HEX.UNKNOWN;
  }
  const color = interpolateRiskColor(prediction.predictedProbability);
  return `#${color.getHexString()}`;
}

/**
 * Evaluates binary classification threshold (≥ 50% stenosis).
 * Clearly distinguishes between:
 * 1. Model predicted probability
 * 2. Binary stenosis threshold status (≥50%)
 */
export function evaluateStenosisThreshold(prediction?: VesselPrediction | null): {
  isThresholdMet: boolean | null;
  statusLabel: string;
  statusColorHex: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'neutral';
  clinicalSummary: string;
} {
  if (!prediction) {
    return {
      isThresholdMet: null,
      statusLabel: 'Pending Inference',
      statusColorHex: RISK_COLOR_HEX.UNKNOWN,
      badgeVariant: 'neutral',
      clinicalSummary: 'No model inference results available yet.',
    };
  }

  // If explicit binary prediction provided by Member 2 backend, prioritize it
  if (typeof prediction.stenosisPrediction === 'boolean') {
    const met = prediction.stenosisPrediction;
    return {
      isThresholdMet: met,
      statusLabel: met ? 'Threshold Met (≥50% Stenosis)' : 'Below Threshold (<50%)',
      statusColorHex: met ? RISK_COLOR_HEX.HIGH : RISK_COLOR_HEX.LOW,
      badgeVariant: met ? 'danger' : 'success',
      clinicalSummary: met
        ? `Model predicts hemodynamically significant stenosis (≥50% luminal narrowing) with ${(prediction.predictedProbability != null ? (prediction.predictedProbability * 100).toFixed(1) : '--')}% probability.`
        : `Model does not predict significant stenosis (<50% threshold) with ${(prediction.predictedProbability != null ? (prediction.predictedProbability * 100).toFixed(1) : '--')}% probability.`,
    };
  }

  // Fallback to evaluating probability against threshold
  if (isValidProbability(prediction.predictedProbability)) {
    const threshold = prediction.stenosisThreshold ?? 0.50;
    const met = prediction.predictedProbability >= threshold;
    return {
      isThresholdMet: met,
      statusLabel: met ? 'Threshold Met (≥50% Stenosis)' : 'Below Threshold (<50%)',
      statusColorHex: met ? RISK_COLOR_HEX.HIGH : RISK_COLOR_HEX.LOW,
      badgeVariant: met ? 'danger' : 'success',
      clinicalSummary: met
        ? `Predicted probability ${(prediction.predictedProbability * 100).toFixed(1)}% satisfies the ≥50% clinical threshold.`
        : `Predicted probability ${(prediction.predictedProbability * 100).toFixed(1)}% is below the 50% clinical threshold.`,
    };
  }

  return {
    isThresholdMet: null,
    statusLabel: 'Data Unavailable',
    statusColorHex: RISK_COLOR_HEX.UNKNOWN,
    badgeVariant: 'neutral',
    clinicalSummary: 'Valid probability or threshold could not be computed.',
  };
}

/**
 * Computes complete material properties for a coronary vessel mesh,
 * handling base risk color, hover brightness, and selection halo highlighting.
 */
export function getVesselMaterialProps(
  prediction?: VesselPrediction | null,
  isSelected: boolean = false,
  isHovered: boolean = false
): {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
} {
  const baseColor = getVesselRiskColor(prediction);
  const emissive = new THREE.Color();
  let emissiveIntensity = 0.05;

  if (isSelected) {
    // When selected: bright cyan-white emissive highlight that makes the vessel
    // prominently glow without overwriting its true base risk color!
    emissive.copy(THREE_COLORS.SELECTION_HALO);
    emissiveIntensity = 0.65;
  } else if (isHovered) {
    // When hovered: subtle warm emissive boost for tactile feedback
    emissive.copy(baseColor).lerp(THREE_COLORS.HOVER_GLOW, 0.4);
    emissiveIntensity = 0.45;
  } else {
    // Subtle anatomical specular sheen
    emissive.copy(baseColor);
    emissiveIntensity = 0.12;
  }

  return {
    color: baseColor,
    emissive,
    emissiveIntensity,
    roughness: isSelected ? 0.2 : 0.35,
    metalness: isSelected ? 0.25 : 0.1,
  };
}

/**
 * Legend color stop descriptions for clinical UI display.
 */
export const RISK_LEGEND_ITEMS = [
  {
    tier: 'low' as const,
    label: 'Low Predicted Risk',
    range: '< 30%',
    colorHex: RISK_COLOR_HEX.LOW,
    description: 'Hemodynamically normal perfusion expected.',
  },
  {
    tier: 'intermediate' as const,
    label: 'Intermediate Risk',
    range: '30% – 49%',
    colorHex: RISK_COLOR_HEX.INTERMEDIATE,
    description: 'Borderline risk; watchful monitoring or stress testing.',
  },
  {
    tier: 'elevated' as const,
    label: 'Elevated Risk',
    range: '50% – 69%',
    colorHex: RISK_COLOR_HEX.ELEVATED,
    description: 'Clinical ≥50% stenosis threshold met; anatomical review advised.',
  },
  {
    tier: 'high' as const,
    label: 'High Risk',
    range: '≥ 70%',
    colorHex: RISK_COLOR_HEX.HIGH,
    description: 'Substantial probability of flow-limiting stenosis; urgent review.',
  },
  {
    tier: 'unknown' as const,
    label: 'Pending / Unknown',
    range: 'N/A',
    colorHex: RISK_COLOR_HEX.UNKNOWN,
    description: 'Model inference awaiting clinical input or unavailable.',
  },
] as const;

/**
 * Adapter function bridging Member 4 PredictionResponse to Member 3 CardiovascularPredictionsPayload.
 * Ensures dynamically driven vessel probabilities without hardcoding.
 */
export function mapPredictionTo3DPayload(
  prediction: import('../types/prediction').PredictionResponse
): import('../types/heart').CardiovascularPredictionsPayload {
  const shapMap: Record<string, number> = {};
  if (Array.isArray(prediction.shapContributions)) {
    for (const sc of prediction.shapContributions) {
      shapMap[sc.displayName || sc.feature] = Math.abs(sc.value);
    }
  }

  const mapVessel = (vesselId: 'LAD' | 'LCX' | 'RCA'): import('../types/heart').VesselPrediction | null => {
    const v = prediction.vessels?.[vesselId];
    if (!v) return null;
    const prob = typeof v.probability === 'number' ? v.probability : v.percentage / 100;
    return {
      vesselId,
      predictedProbability: prob,
      stenosisPrediction: prob >= 0.50,
      stenosisThreshold: 0.50,
      riskTier: prob >= 0.70 ? 'high' : prob >= 0.50 ? 'elevated' : prob >= 0.30 ? 'intermediate' : 'low',
      confidenceScore: prediction.modelConfidence,
      featureImportance: shapMap,
      clinicalNotes: v.clinicalSummary,
    };
  };

  return {
    patientId: prediction.id,
    timestamp: prediction.timestamp,
    overallCAD: {
      predictedProbability: prediction.overallCadProbability,
      cadDetected: prediction.overallCadProbability >= 0.50,
      riskScore: prediction.overallCadPercentage,
      riskCategory: prediction.overallRiskTier === 'Higher risk' ? 'High' : 'Moderate',
    },
    vessels: {
      LAD: mapVessel('LAD'),
      LCX: mapVessel('LCX'),
      RCA: mapVessel('RCA'),
    },
  };
}
