import { describe, it, expect } from 'vitest';
import {
  findVesselByMeshName,
  isVesselMesh,
  getVesselMetadata,
  CORONARY_VESSEL_IDS,
  CORONARY_VESSEL_PATHS,
  createVesselCurve,
} from './vesselConfig.ts';

describe('vesselConfig module tests', () => {
  describe('findVesselByMeshName', () => {
    it('correctly maps LAD meshes and aliases', () => {
      expect(findVesselByMeshName('Vessel_LAD')).toBe('LAD');
      expect(findVesselByMeshName('coronary_lad')).toBe('LAD');
      expect(findVesselByMeshName('Left_Anterior_Descending')).toBe('LAD');
      expect(findVesselByMeshName('arteria_interventricularis_anterior')).toBe('LAD');
      expect(findVesselByMeshName('lad_artery_proximal')).toBe('LAD');
    });

    it('correctly maps LCX meshes and aliases', () => {
      expect(findVesselByMeshName('Vessel_LCX')).toBe('LCX');
      expect(findVesselByMeshName('coronary_lcx')).toBe('LCX');
      expect(findVesselByMeshName('left_circumflex')).toBe('LCX');
      expect(findVesselByMeshName('ramus_circumflexus')).toBe('LCX');
      expect(findVesselByMeshName('circumflex_branch')).toBe('LCX');
    });

    it('correctly maps RCA meshes and aliases', () => {
      expect(findVesselByMeshName('Vessel_RCA')).toBe('RCA');
      expect(findVesselByMeshName('coronary_rca')).toBe('RCA');
      expect(findVesselByMeshName('right_coronary_artery')).toBe('RCA');
      expect(findVesselByMeshName('arteria_coronaria_dextra')).toBe('RCA');
    });

    it('returns null for unrelated heart anatomy meshes (prevents accidental recoloring)', () => {
      expect(findVesselByMeshName('Heart_Myocardium')).toBeNull();
      expect(findVesselByMeshName('Left_Ventricle')).toBeNull();
      expect(findVesselByMeshName('Right_Atrium')).toBeNull();
      expect(findVesselByMeshName('Aorta_Arch')).toBeNull();
      expect(findVesselByMeshName('Pulmonary_Artery')).toBeNull();
      expect(findVesselByMeshName('')).toBeNull();
      expect(findVesselByMeshName('unknown_geometry_12')).toBeNull();
    });
  });

  describe('isVesselMesh', () => {
    it('returns true only for valid vessel mesh identifiers', () => {
      expect(isVesselMesh('LAD')).toBe(true);
      expect(isVesselMesh('LCX')).toBe(true);
      expect(isVesselMesh('RCA')).toBe(true);
      expect(isVesselMesh('pericardium')).toBe(false);
    });
  });

  describe('getVesselMetadata', () => {
    it('returns complete anatomical metadata for each vessel', () => {
      for (const id of CORONARY_VESSEL_IDS) {
        const meta = getVesselMetadata(id);
        expect(meta.id).toBe(id);
        expect(meta.commonName).toBeDefined();
        expect(meta.latinName).toBeDefined();
        expect(meta.perfusionTerritory.length).toBeGreaterThan(10);
        expect(meta.clinicalSignificance.length).toBeGreaterThan(10);
        expect(meta.meshAliases.length).toBeGreaterThan(2);
      }
    });
  });

  describe('3D spatial pathways and curves', () => {
    it('generates valid CatmullRom splines with positive curve length for all target vessels', () => {
      for (const id of CORONARY_VESSEL_IDS) {
        const pathDef = CORONARY_VESSEL_PATHS[id];
        expect(pathDef.mainCenterline.length).toBeGreaterThanOrEqual(5);

        const curve = createVesselCurve(pathDef.mainCenterline);
        expect(curve.getLength()).toBeGreaterThan(0.5);

        // Check start and end radii
        expect(pathDef.startRadius).toBeGreaterThan(pathDef.endRadius);
        expect(pathDef.startRadius).toBeGreaterThan(0.02);

        // Check branches
        expect(pathDef.branches.length).toBeGreaterThanOrEqual(1);
        pathDef.branches.forEach((b) => {
          const branchCurve = createVesselCurve(b.centerline);
          expect(branchCurve.getLength()).toBeGreaterThan(0.1);
        });
      }
    });
  });
});
