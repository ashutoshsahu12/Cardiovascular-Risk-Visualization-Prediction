/**
 * Anatomical Heart Model Loader & Scene Graph Binding Component
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 * 
 * Features:
 * - Asynchronously loads and clones the anatomical GLB asset
 * - Traverses scene graph to locate and bind any pre-existing vessel meshes
 * - Applies non-destructive material cloning to protect unrelated anatomy from corruption
 * - Centers, scales, and positions the heart model accurately
 * - Supports opacity adjustments for internal vessel inspection
 * - Includes a fallback anatomical cardiac geometry if GLB asset is unavailable
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CoronaryVesselId, VesselPrediction } from '../types/index.ts';
import { findVesselByMeshName } from '../config/vesselConfig.ts';
import { getVesselMaterialProps } from '../utils/vesselColors.ts';

interface HeartModelProps {
  modelUrl?: string;
  vesselPredictions?: {
    LAD?: VesselPrediction | null;
    LCX?: VesselPrediction | null;
    RCA?: VesselPrediction | null;
  };
  selectedVessel?: CoronaryVesselId | null;
  hoveredVessel?: CoronaryVesselId | null;
  onVesselSelect?: (vesselId: CoronaryVesselId) => void;
  onVesselHover?: (vesselId: CoronaryVesselId | null) => void;
  myocardiumOpacity?: number;
  wireframe?: boolean;
}

export const HeartModel: React.FC<HeartModelProps> = ({
  modelUrl = '/models/heart.glb',
  vesselPredictions,
  selectedVessel,
  hoveredVessel,
  onVesselSelect,
  onVesselHover,
  myocardiumOpacity = 0.96,
  wireframe = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Attempt loading the GLTF model
  const gltf = useGLTF(modelUrl);

  // Deep clone scene to avoid sharing materials or mutating cached GLTF instances
  const clonedScene = useMemo(() => {
    if (!gltf?.scene) return null;
    const clone = gltf.scene.clone(true);

    // Compute bounding box and normalize centering/scale
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Center model at origin
    clone.position.x = -center.x;
    clone.position.y = -center.y;
    clone.position.z = -center.z;

    // Normalizing scale factor (target height ~ 2.6 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = 2.8 / maxDim;
      clone.scale.setScalar(scaleFactor);
    }

    return clone;
  }, [gltf]);

  // Traverse and update materials for any separable vessel meshes or myocardium
  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const vesselId = findVesselByMeshName(mesh.name);

        if (vesselId) {
          // If this mesh is an identifiable vessel in the loaded GLB
          const pred = vesselPredictions?.[vesselId];
          const isSelected = selectedVessel === vesselId;
          const isHovered = hoveredVessel === vesselId;
          const matProps = getVesselMaterialProps(pred, isSelected, isHovered);

          const vesselMat = new THREE.MeshStandardMaterial({
            color: matProps.color,
            emissive: matProps.emissive,
            emissiveIntensity: matProps.emissiveIntensity,
            roughness: matProps.roughness,
            metalness: matProps.metalness,
            wireframe,
          });

          mesh.material = vesselMat;

          // Wire interactions
          mesh.userData.vesselId = vesselId;
        } else {
          // Unrelated cardiac anatomy (myocardium, chambers, aorta)
          // Clone material to preserve original texture while allowing opacity and shading tuning
          if (mesh.material) {
            const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const myoMat = origMat.clone() as THREE.MeshStandardMaterial;

            if (myoMat.color) {
              // Slightly deepen base color to make vibrant coronary risk vessels stand out
              myoMat.color.multiplyScalar(0.92);
            }
            myoMat.transparent = myocardiumOpacity < 1.0;
            myoMat.opacity = myocardiumOpacity;
            myoMat.wireframe = wireframe;
            myoMat.roughness = 0.65;
            myoMat.metalness = 0.08;

            mesh.material = myoMat;
          }
        }
      }
    });
  }, [clonedScene, vesselPredictions, selectedVessel, hoveredVessel, myocardiumOpacity, wireframe]);

  if (!clonedScene) {
    return <FallbackHeartMyocardium opacity={myocardiumOpacity} wireframe={wireframe} />;
  }

  return (
    <primitive
      ref={groupRef}
      object={clonedScene}
      name="HeartModelInstance"
      onPointerOver={(e: any) => {
        // If hovered over a mapped mesh in the GLB
        const vesselId = e.object?.userData?.vesselId as CoronaryVesselId | undefined;
        if (vesselId && onVesselHover) {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onVesselHover(vesselId);
        }
      }}
      onPointerOut={() => {
        if (onVesselHover) {
          document.body.style.cursor = 'default';
          onVesselHover(null);
        }
      }}
      onClick={(e: any) => {
        const vesselId = e.object?.userData?.vesselId as CoronaryVesselId | undefined;
        if (vesselId && onVesselSelect) {
          e.stopPropagation();
          onVesselSelect(vesselId);
        }
      }}
    />
  );
};

/**
 * Procedural anatomical fallback heart representation.
 * Used if the GLB file cannot be loaded or during SSR/tests.
 */
export const FallbackHeartMyocardium: React.FC<{ opacity?: number; wireframe?: boolean }> = ({
  opacity = 0.95,
  wireframe = false,
}) => {
  return (
    <group name="FallbackHeartStructure">
      {/* Ventricular bulk (Apex to base) */}
      <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshStandardMaterial
          color="#881337"
          roughness={0.65}
          metalness={0.1}
          transparent={opacity < 1.0}
          opacity={opacity}
          wireframe={wireframe}
        />
      </mesh>

      {/* Aortic Arch Root */}
      <mesh position={[0.1, 0.75, 0.2]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.32, 0.35, 1.1, 24]} />
        <meshStandardMaterial
          color="#991b1b"
          roughness={0.5}
          metalness={0.15}
          transparent={opacity < 1.0}
          opacity={opacity}
        />
      </mesh>

      {/* Pulmonary Trunk */}
      <mesh position={[-0.25, 0.7, 0.35]} rotation={[0.2, 0.1, 0.3]}>
        <cylinderGeometry args={[0.28, 0.32, 0.95, 24]} />
        <meshStandardMaterial
          color="#1e3a8a"
          roughness={0.5}
          metalness={0.15}
          transparent={opacity < 1.0}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
};

// Preload the default heart asset
useGLTF.preload('/models/heart.glb');
