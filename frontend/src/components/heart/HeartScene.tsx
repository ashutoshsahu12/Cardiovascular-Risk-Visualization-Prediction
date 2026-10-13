/**
 * Main Interactive Cardiovascular 3D Viewport
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 *
 * Reusable, production-oriented React Three Fiber scene.
 * Can be used controlled via props by Member 4's dashboard or automatically synchronize with Zustand store.
 */

import React, { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CoronaryVesselId, HeartSceneProps, CameraPreset } from '../../types/heart';
import { useCardiovascularStore } from '../../store/cardiovascularStore';
import { HeartLighting } from './HeartLighting';
import { HeartSceneControls } from './HeartSceneControls';
import { HeartModel, FallbackHeartMyocardium } from './HeartModel';
import { CoronaryVessels } from './CoronaryVessels';
import { HeartSceneOverlay } from './HeartSceneOverlay';

/**
 * Loading fallback spinner displayed while 3D assets load
 */
const SceneLoadingSpinner: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(56, 189, 248, 0.2)',
          borderTop: '3px solid #38bdf8',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
          marginBottom: '12px',
        }}
      />
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.02em' }}>
        Loading 3D Cardiac Anatomy...
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
        Preparing high-precision coronary vessel geometry
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * Error fallback display if WebGL or asset loading encounters issues
 */
const SceneErrorFallback: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#f8fafc',
        padding: '24px',
        textAlign: 'center',
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444',
          fontSize: '22px',
          fontWeight: 'bold',
          marginBottom: '12px',
        }}
      >
        !
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
        Anatomical 3D Scene Notice
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '380px', lineHeight: 1.4, marginBottom: '16px' }}>
        {message}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: '#0284c7',
            border: 'none',
            color: '#fff',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reload Scene
        </button>
      )}
    </div>
  );
};

export const HeartScene: React.FC<HeartSceneProps> = ({
  isCompact = false,
  onNavigateToExplorer,
  predictions: controlledPredictions,
  selectedVessel: controlledSelectedVessel,
  onVesselSelect: controlledOnVesselSelect,
  onVesselHover: controlledOnVesselHover,
  isLoading: controlledIsLoading,
  errorMessage: controlledErrorMessage,
  modelUrl = '/models/heart.glb',
  height = '100%',
  width = '100%',
  className = '',
  showOverlays = true,
}) => {
  // Store integration: fallback to shared store if props are not explicitly provided
  const store = useCardiovascularStore();

  const predictions = controlledPredictions !== undefined ? controlledPredictions : store.predictions;
  const selectedVessel = controlledSelectedVessel !== undefined ? controlledSelectedVessel : store.selectedVessel;
  const isLoading = controlledIsLoading !== undefined ? controlledIsLoading : store.isLoading;
  const errorMessage = controlledErrorMessage !== undefined ? controlledErrorMessage : store.errorMessage;

  const [hoveredVessel, setHoveredVessel] = useState<CoronaryVesselId | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('anterior');
  const [resetNonce, setResetNonce] = useState(0);

  // Display toggles
  const [showLabels, setShowLabels] = useState(true);
  const [pulsateHighRisk, setPulsateHighRisk] = useState(true);
  const [myocardiumOpacity, setMyocardiumOpacity] = useState(0.95);

  const handleVesselSelect = useCallback(
    (vesselId: CoronaryVesselId | null) => {
      if (controlledOnVesselSelect) {
        controlledOnVesselSelect(vesselId);
      } else {
        store.selectVessel(vesselId);
      }
    },
    [controlledOnVesselSelect, store]
  );

  const handleVesselHover = useCallback(
    (vesselId: CoronaryVesselId | null) => {
      setHoveredVessel(vesselId);
      if (controlledOnVesselHover) {
        controlledOnVesselHover(vesselId);
      } else {
        store.setHoveredVessel(vesselId);
      }
    },
    [controlledOnVesselHover, store]
  );

  const handleResetCamera = useCallback(() => {
    setResetNonce((n) => n + 1);
    setCameraPreset('reset');
    store.triggerResetCamera();
  }, [store]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: '450px',
        background: 'radial-gradient(ellipse at 50% 40%, #0f172a 0%, #090d16 100%)',
        overflow: 'hidden',
        borderRadius: '12px',
      }}
    >
      {/* Loading state indicator */}
      {isLoading && <SceneLoadingSpinner />}

      {/* Error state fallback */}
      {errorMessage && (
        <SceneErrorFallback
          message={errorMessage}
          onRetry={() => {
            store.setError(null);
            handleResetCamera();
          }}
        />
      )}

      {/* Interactive 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0.0, 0.2, 3.7], fov: 45, near: 0.1, far: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => {
          // Deselect when clicking empty background space
          handleVesselSelect(null);
        }}
      >
        <HeartLighting />

        <HeartSceneControls
          cameraPreset={cameraPreset}
          resetNonce={resetNonce}
        />

        <Suspense fallback={<FallbackHeartMyocardium opacity={myocardiumOpacity} />}>
          <group name="AnatomicalHeartCenter">
            {/* Base anatomical myocardium and cardiac chambers */}
            <HeartModel
              modelUrl={modelUrl}
              vesselPredictions={predictions?.vessels}
              selectedVessel={selectedVessel}
              hoveredVessel={hoveredVessel}
              onVesselSelect={handleVesselSelect}
              onVesselHover={handleVesselHover}
              myocardiumOpacity={myocardiumOpacity}
            />

            {/* Separable, interactive coronary artery branches (LAD, LCX, RCA) */}
            <CoronaryVessels
              vesselPredictions={predictions?.vessels}
              selectedVessel={selectedVessel}
              hoveredVessel={hoveredVessel}
              onVesselSelect={handleVesselSelect}
              onVesselHover={handleVesselHover}
              showLabels={showLabels}
              pulsateHighRisk={pulsateHighRisk}
            />
          </group>
        </Suspense>
      </Canvas>

      {/* Built-in clinical dashboard overlays */}
      {showOverlays && (
        <HeartSceneOverlay
          isCompact={isCompact}
          onNavigateToExplorer={onNavigateToExplorer}
          predictions={predictions}
          selectedVessel={selectedVessel}
          onVesselSelect={handleVesselSelect}
          onCameraPreset={setCameraPreset}
          onResetCamera={handleResetCamera}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
          pulsateHighRisk={pulsateHighRisk}
          onTogglePulsate={() => setPulsateHighRisk(!pulsateHighRisk)}
          myocardiumOpacity={myocardiumOpacity}
          onOpacityChange={setMyocardiumOpacity}
          onScenarioChange={(scen) => store.loadDemoScenario(scen)}
        />
      )}
    </div>
  );
};
