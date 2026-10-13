/**
 * Coronary Artery Configuration & Anatomical Spatial Mapping Module
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 *
 * Provides:
 * 1. Comprehensive anatomical metadata for LAD, LCX, and RCA
 * 2. Multi-alias scene-graph mesh identification patterns
 * 3. 3D spatial spline pathways accurately registered to cardiac sulci landmarks
 * 4. Caliber and branch definitions for realistic vascular morphology
 */

import * as THREE from 'three';
import type { CoronaryVesselId, VesselMetadata } from '../types/heart';

export const CORONARY_VESSEL_IDS: readonly CoronaryVesselId[] = ['LAD', 'LCX', 'RCA'] as const;

/**
 * Standardized anatomical metadata for target coronary arteries.
 */
export const VESSEL_METADATA_RECORD: Record<CoronaryVesselId, VesselMetadata> = {
  LAD: {
    id: 'LAD',
    commonName: 'Left Anterior Descending',
    anatomicalName: 'Left Anterior Descending Artery',
    latinName: 'Ramus interventricularis anterior',
    perfusionTerritory: 'Anterior 2/3 of interventricular septum, anterior LV wall, apex, anterolateral papillary muscle',
    clinicalSignificance: 'Supplies ~45-55% of LV myocardium. Severe proximal stenosis colloquially known as "widowmaker" due to high mortality.',
    meshAliases: [
      'vessel_lad',
      'lad',
      'left_anterior_descending',
      'arteria_interventricularis_anterior',
      'leftanteriordescending',
      'lad_artery',
      'artery_lad',
      'coronary_lad',
      'mesh_lad',
      'coronary_artery_lad'
    ],
  },
  LCX: {
    id: 'LCX',
    commonName: 'Left Circumflex',
    anatomicalName: 'Left Circumflex Artery',
    latinName: 'Ramus circumflexus arteriae coronariae sinistrae',
    perfusionTerritory: 'Posterolateral and lateral walls of left ventricle, left atrium, and SA node in ~40% of cases',
    clinicalSignificance: 'Stenosis causes posterolateral ischemia or infarction. Often electrically silent on standard 12-lead ECG (posterior leads required).',
    meshAliases: [
      'vessel_lcx',
      'lcx',
      'left_circumflex',
      'ramus_circumflexus',
      'leftcircumflex',
      'lcx_artery',
      'artery_lcx',
      'coronary_lcx',
      'mesh_lcx',
      'circumflex',
      'coronary_artery_lcx'
    ],
  },
  RCA: {
    id: 'RCA',
    commonName: 'Right Coronary Artery',
    anatomicalName: 'Right Coronary Artery',
    latinName: 'Arteria coronaria dextra',
    perfusionTerritory: 'Right atrium, right ventricle, inferior LV wall, posterior 1/3 of septum, SA node (~60%), AV node (~90%)',
    clinicalSignificance: 'Stenosis presents as inferior STEMI and high-grade AV nodal blocks. Dominant RCA supplies posterior descending artery (PDA) in ~85-90% of individuals.',
    meshAliases: [
      'vessel_rca',
      'rca',
      'right_coronary',
      'right_coronary_artery',
      'arteria_coronaria_dextra',
      'rightcoronary',
      'rca_artery',
      'artery_rca',
      'coronary_rca',
      'mesh_rca',
      'coronary_artery_rca'
    ],
  },
};

/**
 * 3D Spline waypoint coordinates registered to the heart model's surface sulci.
 * Model bounding coordinates:
 * X: [-1.16, 1.01] (Right to Left)
 * Y: [-1.59, 1.62] (Apex to Base)
 * Z: [-0.80, 0.97] (Posterior to Anterior)
 */
export interface VesselPathDefinition {
  id: CoronaryVesselId;
  mainCenterline: [number, number, number][];
  branches: {
    name: string;
    centerline: [number, number, number][];
    radius: number;
  }[];
  startRadius: number;
  endRadius: number;
}

export const CORONARY_VESSEL_PATHS: Record<CoronaryVesselId, VesselPathDefinition> = {
  LAD: {
    id: 'LAD',
    // Courses down anterior interventricular groove towards the apex
    mainCenterline: [
      [0.08, 0.48, 0.72],    // Origin at left main bifurcation
      [0.10, 0.30, 0.76],    // Proximal LAD
      [0.12, 0.10, 0.77],    // Giving off D1
      [0.11, -0.15, 0.73],   // Mid LAD
      [0.09, -0.42, 0.65],   // Mid-to-distal LAD
      [0.06, -0.70, 0.54],   // Distal LAD
      [0.03, -0.98, 0.42],   // Approaching incisura apicis
      [0.00, -1.22, 0.28],   // At the cardiac apex
    ],
    branches: [
      {
        name: 'First Diagonal Branch (D1)',
        centerline: [
          [0.12, 0.10, 0.77],
          [0.26, -0.02, 0.72],
          [0.42, -0.18, 0.62],
          [0.55, -0.38, 0.48],
        ],
        radius: 0.022,
      },
      {
        name: 'Second Diagonal Branch (D2)',
        centerline: [
          [0.09, -0.42, 0.65],
          [0.22, -0.56, 0.55],
          [0.34, -0.74, 0.40],
        ],
        radius: 0.018,
      },
      {
        name: 'First Septal Perforator (S1)',
        centerline: [
          [0.10, 0.28, 0.74],
          [0.06, 0.22, 0.65],
          [0.04, 0.15, 0.55],
        ],
        radius: 0.016,
      },
    ],
    startRadius: 0.038,
    endRadius: 0.018,
  },
  LCX: {
    id: 'LCX',
    // Courses laterally and posteriorly along the left atrioventricular groove
    mainCenterline: [
      [0.08, 0.48, 0.72],    // Left main bifurcation origin
      [0.26, 0.46, 0.66],    // Entering left AV sulcus
      [0.48, 0.42, 0.52],    // Proximal LCX beneath LAA
      [0.66, 0.32, 0.32],    // Mid LCX
      [0.76, 0.18, 0.06],    // Obtuse margin
      [0.74, -0.02, -0.22],  // Posterolateral wall
      [0.60, -0.24, -0.46],  // Distal LCX towards crux
      [0.42, -0.46, -0.62],  // Posterior termination
    ],
    branches: [
      {
        name: 'First Obtuse Marginal (OM1)',
        centerline: [
          [0.66, 0.32, 0.32],
          [0.72, 0.10, 0.40],
          [0.70, -0.16, 0.36],
          [0.62, -0.45, 0.26],
        ],
        radius: 0.024,
      },
      {
        name: 'Second Obtuse Marginal (OM2)',
        centerline: [
          [0.74, -0.02, -0.22],
          [0.76, -0.25, -0.14],
          [0.68, -0.52, -0.10],
        ],
        radius: 0.020,
      },
    ],
    startRadius: 0.035,
    endRadius: 0.016,
  },
  RCA: {
    id: 'RCA',
    // Originates at right aortic sinus and courses through the right atrioventricular groove
    mainCenterline: [
      [-0.14, 0.54, 0.66],   // Right coronary sinus origin
      [-0.32, 0.46, 0.62],   // Proximal RCA under right auricle
      [-0.50, 0.32, 0.52],   // Anterior RV groove
      [-0.64, 0.10, 0.38],   // Mid RCA
      [-0.68, -0.15, 0.20],  // Acute margin of the heart
      [-0.62, -0.42, -0.02], // Distal RCA
      [-0.48, -0.68, -0.24], // Posterolateral branch
      [-0.26, -0.88, -0.42], // Crux cordis (origin of PDA)
      [-0.16, -1.06, -0.32], // Posterior descending branch (PDA)
    ],
    branches: [
      {
        name: 'Conus Artery',
        centerline: [
          [-0.32, 0.46, 0.62],
          [-0.25, 0.42, 0.70],
          [-0.18, 0.36, 0.75],
        ],
        radius: 0.016,
      },
      {
        name: 'Right Acute Marginal Branch (AM)',
        centerline: [
          [-0.68, -0.15, 0.20],
          [-0.54, -0.36, 0.32],
          [-0.38, -0.58, 0.40],
          [-0.22, -0.78, 0.38],
        ],
        radius: 0.022,
      },
    ],
    startRadius: 0.038,
    endRadius: 0.018,
  },
};

/**
 * Creates smooth CatmullRomCurve3 curves from waypoint coordinates.
 */
export function createVesselCurve(points: [number, number, number][]): THREE.CatmullRomCurve3 {
  const vectorPoints = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return new THREE.CatmullRomCurve3(vectorPoints, false, 'centripetal', 0.5);
}

/**
 * Normalizes an arbitrary mesh name for case/delimiter-insensitive matching.
 */
function normalizeMeshName(name: string): string {
  return name.toLowerCase().replace(/[-_.: ]/g, '_').trim();
}

/**
 * Inspects a mesh or object name and identifies whether it corresponds to LAD, LCX, or RCA.
 * Supports partial matching, exact alias matching, and hierarchy lookups.
 */
export function findVesselByMeshName(meshName: string): CoronaryVesselId | null {
  if (!meshName) return null;
  const normalized = normalizeMeshName(meshName);

  for (const vesselId of CORONARY_VESSEL_IDS) {
    const meta = VESSEL_METADATA_RECORD[vesselId];
    for (const alias of meta.meshAliases) {
      const normAlias = normalizeMeshName(alias);
      if (normalized === normAlias || normalized.includes(normAlias)) {
        return vesselId;
      }
    }
  }

  return null;
}

/**
 * Checks whether a given mesh name maps to any identifiable coronary artery.
 */
export function isVesselMesh(meshName: string): boolean {
  return findVesselByMeshName(meshName) !== null;
}

/**
 * Retrieves metadata for a vessel.
 */
export function getVesselMetadata(vesselId: CoronaryVesselId): VesselMetadata {
  return VESSEL_METADATA_RECORD[vesselId];
}
