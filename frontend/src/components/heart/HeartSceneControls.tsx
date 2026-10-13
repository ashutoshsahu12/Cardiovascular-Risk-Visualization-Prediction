/**
 * Interactive Camera & Orbit Controls Rig
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 *
 * Implements:
 * - Damped 360-degree orbit rotation, pan, zoom
 * - Distance boundaries to prevent clipping or losing the heart model
 * - Smooth camera transitions to standard clinical angiographic view angles (AP, LAO, RAO, Post)
 * - Animated camera reset mechanism
 */

import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CameraPreset } from '../../types/heart';

interface HeartSceneControlsProps {
  cameraPreset?: CameraPreset;
  resetNonce?: number;
}

const PRESET_CAMERA_POSITIONS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  anterior: { pos: [0.0, 0.2, 3.7], target: [0, -0.1, 0] },
  lao: { pos: [2.7, 0.5, 2.5], target: [0, -0.1, 0] },       // Left Anterior Oblique (LAD/LCX)
  rao: { pos: [-2.6, 0.4, 2.7], target: [0, -0.1, 0] },      // Right Anterior Oblique (RCA)
  posterior: { pos: [0.1, 0.6, -3.8], target: [0, -0.1, 0] },// Posterior wall / crux
  superior: { pos: [0.0, 3.8, 0.8], target: [0, -0.1, 0] },  // Cranial / base view
  reset: { pos: [0.0, 0.2, 3.7], target: [0, -0.1, 0] },
};

export const HeartSceneControls: React.FC<HeartSceneControlsProps> = ({
  cameraPreset = 'anterior',
  resetNonce = 0,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  // Animation target refs for smooth interpolation
  const targetPosRef = useRef(new THREE.Vector3(0, 0.2, 3.7));
  const targetLookAtRef = useRef(new THREE.Vector3(0, -0.1, 0));
  const isTransitioningRef = useRef(false);

  // When preset or resetNonce changes, trigger smooth camera animation
  useEffect(() => {
    const presetConfig = PRESET_CAMERA_POSITIONS[cameraPreset] || PRESET_CAMERA_POSITIONS.anterior;
    targetPosRef.current.set(...presetConfig.pos);
    targetLookAtRef.current.set(...presetConfig.target);
    isTransitioningRef.current = true;
  }, [cameraPreset, resetNonce]);

  // Frame-by-frame smooth dampening towards target camera position
  useFrame((_, delta) => {
    if (!isTransitioningRef.current || !controlsRef.current) return;

    // Smooth lerp camera position
    const lerpSpeed = Math.min(1.0, delta * 4.5);
    camera.position.lerp(targetPosRef.current, lerpSpeed);
    controlsRef.current.target.lerp(targetLookAtRef.current, lerpSpeed);
    controlsRef.current.update();

    // Check convergence
    if (camera.position.distanceTo(targetPosRef.current) < 0.02) {
      camera.position.copy(targetPosRef.current);
      controlsRef.current.target.copy(targetLookAtRef.current);
      controlsRef.current.update();
      isTransitioningRef.current = false;
    }
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.07}
      rotateSpeed={0.85}
      zoomSpeed={0.9}
      panSpeed={0.8}
      minDistance={1.6}
      maxDistance={8.5}
      maxPolarAngle={Math.PI * 0.95} // Avoid flipping past vertical pole
      minPolarAngle={Math.PI * 0.05}
      target={[0, -0.1, 0]}
      makeDefault
    />
  );
};
