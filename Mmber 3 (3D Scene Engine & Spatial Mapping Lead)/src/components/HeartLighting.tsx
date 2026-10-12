/**
 * Anatomical 3D Scene Lighting Rig
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 * 
 * Provides calibrated medical visualization lighting:
 * - High dynamic range contrast for anatomical depth perception
 * - Soft fill so posterior coronary branches remain clearly identifiable
 * - Subtle rim lighting for vascular edge delineation
 */

import React from 'react';

export const HeartLighting: React.FC = () => {
  return (
    <>
      {/* Soft ambient base fill */}
      <ambientLight intensity={0.7} color="#ffffff" />

      {/* Hemispheric sky/ground natural bounce */}
      <hemisphereLight
        color="#f1f5f9"
        groundColor="#0f172a"
        intensity={0.65}
      />

      {/* Key Directional Light (Anterior-Superior) */}
      <directionalLight
        position={[4, 6, 7]}
        intensity={1.5}
        color="#fffbf0"
        castShadow={false}
      />

      {/* Fill Light (Anterior-Left, fills LCX lateral groove) */}
      <directionalLight
        position={[-5, 2, 5]}
        intensity={0.9}
        color="#f0f9ff"
      />

      {/* Rim / Silhouette Light (Posterior-Superior, highlights vessel contours) */}
      <directionalLight
        position={[0, 7, -6]}
        intensity={1.2}
        color="#e2e8f0"
      />

      {/* Subtle Inferior Bounce Light (illuminates apex and inferior wall) */}
      <directionalLight
        position={[0, -6, 2]}
        intensity={0.4}
        color="#cbd5e1"
      />
    </>
  );
};
