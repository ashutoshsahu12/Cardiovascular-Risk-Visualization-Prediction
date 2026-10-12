/**
 * Interactive 3D Coronary Vessels Component
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 * 
 * Renders:
 * - LAD, LCX, and RCA arterial geometry with branch offshoots
 * - Deterministic dynamic risk coloring via getVesselMaterialProps
 * - Click, hover, and raycast interactions
 * - Emissive pulse alerts for hemodynamically high-risk vessels (≥70% or threshold met)
 * - 3D spatial labels registered at anatomical vessel midpoints
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type {
  CoronaryVesselId,
  VesselPrediction,
} from '../types/index.ts';
import {
  CORONARY_VESSEL_IDS,
  CORONARY_VESSEL_PATHS,
  createVesselCurve,
  getVesselMetadata,
} from '../config/vesselConfig.ts';
import {
  getVesselMaterialProps,
  getVesselRiskColorHex,
} from '../utils/vesselColors.ts';

interface CoronaryVesselsProps {
  vesselPredictions?: {
    LAD?: VesselPrediction | null;
    LCX?: VesselPrediction | null;
    RCA?: VesselPrediction | null;
  };
  selectedVessel: CoronaryVesselId | null;
  hoveredVessel: CoronaryVesselId | null;
  onVesselSelect: (vesselId: CoronaryVesselId) => void;
  onVesselHover: (vesselId: CoronaryVesselId | null) => void;
  showLabels?: boolean;
  pulsateHighRisk?: boolean;
}

interface SingleVesselProps {
  vesselId: CoronaryVesselId;
  prediction?: VesselPrediction | null;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  showLabel: boolean;
  pulsate: boolean;
}

const SingleVessel: React.FC<SingleVesselProps> = ({
  vesselId,
  prediction,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  showLabel,
  pulsate,
}) => {
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const pathDef = CORONARY_VESSEL_PATHS[vesselId];
  const metadata = getVesselMetadata(vesselId);

  // Generate main trunk curve and geometry
  const mainCurve = useMemo(() => createVesselCurve(pathDef.mainCenterline), [pathDef.mainCenterline]);
  const mainGeometry = useMemo(
    () => new THREE.TubeGeometry(mainCurve, 64, pathDef.startRadius, 14, false),
    [mainCurve, pathDef.startRadius]
  );

  // Generate branch geometries
  const branchGeometries = useMemo(() => {
    return pathDef.branches.map((b) => {
      const curve = createVesselCurve(b.centerline);
      return {
        name: b.name,
        geometry: new THREE.TubeGeometry(curve, 32, b.radius, 10, false),
      };
    });
  }, [pathDef.branches]);

  // Determine material styling
  const matProps = useMemo(
    () => getVesselMaterialProps(prediction, isSelected, isHovered),
    [prediction, isSelected, isHovered]
  );

  // Label anchor position (near proximal-mid arterial trunk)
  const labelPosition = useMemo(() => {
    const pt = pathDef.mainCenterline[Math.min(2, pathDef.mainCenterline.length - 1)];
    // Push slightly outward along normal
    return new THREE.Vector3(pt[0] * 1.15, pt[1], pt[2] * 1.15);
  }, [pathDef.mainCenterline]);

  // Is vessel at high risk (probability ≥ 70% or threshold met with elevated prob)
  const isHighRisk = Boolean(
    prediction &&
    ((prediction.predictedProbability != null && prediction.predictedProbability >= 0.70) ||
     (prediction.stenosisPrediction === true && (prediction.predictedProbability ?? 0) >= 0.50))
  );

  // Animate pulsating emissive intensity for high-risk vessels or selected vessels
  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    if (isSelected) {
      // Gentle rhythmic breathing glow for selected vessel
      const pulse = 0.55 + Math.sin(clock.getElapsedTime() * 3.5) * 0.2;
      materialRef.current.emissiveIntensity = pulse;
    } else if (pulsate && isHighRisk) {
      // Faster alert pulse for high-risk stenosis
      const pulse = 0.35 + Math.sin(clock.getElapsedTime() * 4.5) * 0.25;
      materialRef.current.emissiveIntensity = pulse;
    } else if (!isHovered) {
      materialRef.current.emissiveIntensity = matProps.emissiveIntensity;
    }
  });

  const riskColorHex = getVesselRiskColorHex(prediction);
  const probText =
    prediction?.predictedProbability != null
      ? `${Math.round(prediction.predictedProbability * 100)}%`
      : 'N/A';

  return (
    <group
      name={`VesselGroup_${vesselId}`}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
        onHover(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Shared material for main trunk and branches */}
      <meshStandardMaterial
        ref={materialRef}
        color={matProps.color}
        emissive={matProps.emissive}
        emissiveIntensity={matProps.emissiveIntensity}
        roughness={matProps.roughness}
        metalness={matProps.metalness}
      />

      {/* Main arterial trunk */}
      <mesh
        name={`Vessel_${vesselId}`}
        geometry={mainGeometry}
        material={materialRef.current ?? undefined}
      />

      {/* Side branch offshoots */}
      {branchGeometries.map((branch, idx) => (
        <mesh
          key={idx}
          name={`Vessel_${vesselId}_${branch.name.replace(/\s+/g, '_')}`}
          geometry={branch.geometry}
          material={materialRef.current ?? undefined}
        />
      ))}

      {/* 3D Anatomical floating label */}
      {showLabel && (
        <Html
          position={labelPosition}
          center
          distanceFactor={5.5}
          zIndexRange={[100, 0]}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            title={`${metadata.anatomicalName} - Click to inspect risk detail`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              background: isSelected
                ? 'rgba(15, 23, 42, 0.95)'
                : 'rgba(15, 23, 42, 0.85)',
              border: isSelected
                ? '1.5px solid #38bdf8'
                : `1px solid ${riskColorHex}88`,
              borderRadius: '9999px',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              boxShadow: isSelected
                ? '0 0 12px rgba(56, 189, 248, 0.5), 0 4px 10px rgba(0, 0, 0, 0.4)'
                : '0 2px 8px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transform: isHovered || isSelected ? 'scale(1.08)' : 'scale(1.0)',
              transition: 'all 0.15s ease-out',
              backdropFilter: 'blur(6px)',
              pointerEvents: 'auto',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: riskColorHex,
                boxShadow: `0 0 6px ${riskColorHex}`,
                flexShrink: 0,
              }}
            />
            <span>{vesselId}</span>
            <span
              style={{
                color: riskColorHex,
                fontSize: '10px',
                fontWeight: 700,
                opacity: 0.95,
              }}
            >
              {probText}
            </span>
          </button>
        </Html>
      )}
    </group>
  );
};

export const CoronaryVessels: React.FC<CoronaryVesselsProps> = ({
  vesselPredictions,
  selectedVessel,
  hoveredVessel,
  onVesselSelect,
  onVesselHover,
  showLabels = true,
  pulsateHighRisk = true,
}) => {
  return (
    <group name="CoronaryVascularTree">
      {CORONARY_VESSEL_IDS.map((vesselId) => {
        const prediction = vesselPredictions?.[vesselId];
        const isSelected = selectedVessel === vesselId;
        const isHovered = hoveredVessel === vesselId;

        return (
          <SingleVessel
            key={vesselId}
            vesselId={vesselId}
            prediction={prediction}
            isSelected={isSelected}
            isHovered={isHovered}
            onSelect={() => onVesselSelect(vesselId)}
            onHover={(hovered) => onVesselHover(hovered ? vesselId : null)}
            showLabel={showLabels}
            pulsate={pulsateHighRisk}
          />
        );
      })}
    </group>
  );
};
