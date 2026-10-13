/**
 * Cardiovascular 3D Viewport Controls & Clinical Diagnostics Overlay
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 *
 * Provides:
 * - Continuous risk scale legend with explicit ≥50% stenosis threshold delineation
 * - Fast camera angle presets (AP, LAO, RAO, Post) & Camera Reset
 * - Selected vessel clinical details panel (probability, threshold status, SHAP explainability)
 * - Scenario switchers for live demonstration and validation
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
  Compass,
  Box,
} from 'lucide-react';
import type {
  CoronaryVesselId,
  CameraPreset,
  CardiovascularPredictionsPayload,
} from '../../types/heart';
import { getVesselMetadata } from '../../config/vesselConfig';
import {
  evaluateStenosisThreshold,
  getVesselRiskColorHex,
  RISK_LEGEND_ITEMS,
} from '../../utils/vesselColors';

interface HeartSceneOverlayProps {
  isCompact?: boolean;
  onNavigateToExplorer?: () => void;
  predictions?: CardiovascularPredictionsPayload | null;
  selectedVessel: CoronaryVesselId | null;
  onVesselSelect: (vesselId: CoronaryVesselId | null) => void;
  onCameraPreset: (preset: CameraPreset) => void;
  onResetCamera: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  pulsateHighRisk: boolean;
  onTogglePulsate: () => void;
  myocardiumOpacity: number;
  onOpacityChange: (val: number) => void;
  onScenarioChange?: (scenario: 'high_risk_lad' | 'multivessel_cad' | 'normal_low_risk' | 'pending_inference') => void;
}

export const HeartSceneOverlay: React.FC<HeartSceneOverlayProps> = ({
  isCompact = false,
  onNavigateToExplorer,
  predictions,
  selectedVessel,
  onVesselSelect,
  onCameraPreset,
  onResetCamera,
  showLabels,
  onToggleLabels,
  pulsateHighRisk,
  onTogglePulsate,
  myocardiumOpacity,
  onOpacityChange,
  onScenarioChange,
}) => {
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const selectedPrediction = selectedVessel
    ? predictions?.vessels?.[selectedVessel]
    : null;
  const selectedMeta = selectedVessel ? getVesselMetadata(selectedVessel) : null;
  const thresholdEval = evaluateStenosisThreshold(selectedPrediction);
  const selectedColorHex = getVesselRiskColorHex(selectedPrediction);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── Top Bar: Compact or Full ─── */}
      {isCompact ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(51, 65, 85, 0.7)',
              borderRadius: '10px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Interactive 3D Heart
            </span>
          </div>

          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(51, 65, 85, 0.7)',
              borderRadius: '10px',
              padding: '4px 8px',
            }}
          >
            <button
              type="button"
              onClick={onResetCamera}
              style={{
                ...presetBtnStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#38bdf8',
              }}
              title="Reset 3D camera to default orientation"
            >
              <RotateCcw size={12} /> Reset Camera
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Camera Angle Presets */}
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(51, 65, 85, 0.7)',
              borderRadius: '10px',
              padding: '4px 6px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                padding: '0 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Compass size={13} style={{ color: '#38bdf8' }} /> Views
            </span>

            <button
              type="button"
              onClick={() => onCameraPreset('anterior')}
              style={presetBtnStyle}
              title="Anterior-Posterior (AP) frontal cardiac view"
            >
              AP (Front)
            </button>
            <button
              type="button"
              onClick={() => onCameraPreset('lao')}
              style={presetBtnStyle}
              title="Left Anterior Oblique (LAO 45°) - Optimal for LAD/LCX bifurcation"
            >
              LAO
            </button>
            <button
              type="button"
              onClick={() => onCameraPreset('rao')}
              style={presetBtnStyle}
              title="Right Anterior Oblique (RAO 30°) - Optimal for RCA length"
            >
              RAO
            </button>
            <button
              type="button"
              onClick={() => onCameraPreset('posterior')}
              style={presetBtnStyle}
              title="Posterior view - Optimal for LCX crux & PDA"
            >
              Posterior
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(71, 85, 105, 0.8)', margin: '0 4px' }} />

            <button
              type="button"
              onClick={onResetCamera}
              style={{
                ...presetBtnStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#38bdf8',
              }}
              title="Reset 3D camera to default orientation"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Right: Demo Scenarios & Quick Display Toggles */}
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {onScenarioChange && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(51, 65, 85, 0.7)',
                  borderRadius: '10px',
                  padding: '4px 8px',
                }}
              >
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Demo:</span>
                <select
                  aria-label="Clinical Inference Scenario"
                  onChange={(e) => onScenarioChange(e.target.value as any)}
                  defaultValue="high_risk_lad"
                  style={{
                    background: 'transparent',
                    color: '#f8fafc',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="high_risk_lad" style={{ background: '#0f172a' }}>High Risk LAD (88%)</option>
                  <option value="multivessel_cad" style={{ background: '#0f172a' }}>Multivessel CAD (LAD+RCA)</option>
                  <option value="normal_low_risk" style={{ background: '#0f172a' }}>Normal / Low Risk</option>
                  <option value="pending_inference" style={{ background: '#0f172a' }}>Pending Inference</option>
                </select>
              </div>
            )}

            {/* Quick Display Controls Dropdown Toggle */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              style={{
                ...presetBtnStyle,
                background: isSettingsOpen ? '#1e293b' : 'rgba(15, 23, 42, 0.88)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Toggle display settings"
            >
              <Layers size={13} /> Display
            </button>
          </div>
        </div>
      )}

      {/* Settings Flyout */}
      {isSettingsOpen && (
        <div
          style={{
            pointerEvents: 'auto',
            alignSelf: 'flex-end',
            marginTop: '8px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            borderRadius: '10px',
            padding: '12px 14px',
            minWidth: '220px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            color: '#f1f5f9',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px' }}>
              Display Settings
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={13} />
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={onToggleLabels}
              style={{ accentColor: '#38bdf8' }}
            />
            <span>3D Vessel Pins & Labels</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={pulsateHighRisk}
              onChange={onTogglePulsate}
              style={{ accentColor: '#ef4444' }}
            />
            <span>Pulsate High-Risk Vessels</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
              <span>Myocardium Opacity:</span>
              <span>{Math.round(myocardiumOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="1.0"
              step="0.05"
              value={myocardiumOpacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              style={{ accentColor: '#38bdf8', width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* ─── Bottom Section: Legend & Selected Vessel Inspection Card ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Continuous Risk Color Gradient Legend */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.90)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(51, 65, 85, 0.7)',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)',
            maxWidth: '310px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: isLegendExpanded ? '8px' : '0px',
            }}
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em' }}>
                Predicted Stenosis Risk Scale
              </span>
            </div>
            {isLegendExpanded ? (
              <ChevronDown size={14} style={{ color: '#94a3b8' }} />
            ) : (
              <ChevronUp size={14} style={{ color: '#94a3b8' }} />
            )}
          </div>

          {isLegendExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Continuous Gradient Bar */}
              <div
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  background:
                    'linear-gradient(to right, #10b981 0%, #eab308 35%, #f97316 65%, #ef4444 100%)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                  position: 'relative',
                  marginBottom: '2px',
                }}
              >
                {/* 50% Threshold Marker */}
                <div
                  title="Clinical Classification Threshold (≥50% Stenosis)"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '-3px',
                    bottom: '-3px',
                    width: '2px',
                    background: '#ffffff',
                    boxShadow: '0 0 4px #ffffff',
                  }}
                />
              </div>

              {/* Threshold indicator text */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  color: '#94a3b8',
                  paddingBottom: '4px',
                  borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                }}
              >
                <span>0% Low</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>▲ ≥50% Threshold</span>
                <span>100% High</span>
              </div>

              {/* Discrete Legend Tiers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {RISK_LEGEND_ITEMS.map((item) => (
                  <div
                    key={item.tier}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#cbd5e1',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: item.colorHex,
                          boxShadow: `0 0 4px ${item.colorHex}`,
                        }}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: '#94a3b8' }}>{item.range}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '4px',
                  fontSize: '9px',
                  color: '#64748b',
                  lineHeight: '1.25',
                }}
              >
                *Continuous probability mapped to color. Stenosis classification threshold fixed at ≥50%.
              </div>
            </div>
          )}
        </div>

        {/* Right: View in 3D Button (for compact dashboard mode) */}
        {isCompact && onNavigateToExplorer && (
          <button
            type="button"
            onClick={onNavigateToExplorer}
            style={{
              pointerEvents: 'auto',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              border: '1px solid rgba(45, 212, 191, 0.4)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Box size={14} />
            <span>View in 3D</span>
          </button>
        )}

        {/* Right: Selected Vessel Diagnostic Card (visible in full explorer mode) */}
        {!isCompact && selectedVessel && selectedMeta && (
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              border: `1.5px solid ${selectedColorHex}88`,
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px ${selectedColorHex}33`,
              maxWidth: '360px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Header: Name, Acronym & Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: `${selectedColorHex}22`,
                      color: selectedColorHex,
                      border: `1px solid ${selectedColorHex}`,
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '13px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {selectedVessel}
                  </span>
                  <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 700 }}>
                    {selectedMeta.commonName}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                  {selectedMeta.latinName}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onVesselSelect(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Deselect vessel"
              >
                <X size={15} />
              </button>
            </div>

            {/* Inference Risk Metric Bar */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                  Predicted Stenosis Probability:
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: selectedColorHex,
                  }}
                >
                  {selectedPrediction?.predictedProbability != null
                    ? `${(selectedPrediction.predictedProbability * 100).toFixed(1)}%`
                    : 'Pending / N/A'}
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: '6px',
                  background: 'rgba(51, 65, 85, 0.6)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {selectedPrediction?.predictedProbability != null && (
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, selectedPrediction.predictedProbability * 100))}%`,
                      background: selectedColorHex,
                      boxShadow: `0 0 8px ${selectedColorHex}`,
                      borderRadius: '3px',
                    }}
                  />
                )}
              </div>

              {/* Binary Threshold Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: thresholdEval.statusColorHex,
                }}
              >
                {thresholdEval.isThresholdMet === true ? (
                  <AlertTriangle size={14} />
                ) : thresholdEval.isThresholdMet === false ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <HelpCircle size={14} />
                )}
                <span>{thresholdEval.statusLabel}</span>
              </div>
            </div>

            {/* Perfusion Territory & Clinical Importance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              <div style={{ color: '#94a3b8', fontWeight: 600 }}>Perfusion Territory:</div>
              <div style={{ color: '#cbd5e1', lineHeight: '1.3' }}>{selectedMeta.perfusionTerritory}</div>
            </div>

            {/* Feature Importance / Explainability if available */}
            {selectedPrediction?.featureImportance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px' }}>
                <div style={{ color: '#94a3b8', fontWeight: 600 }}>Top Predictive Factors (SHAP):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Object.entries(selectedPrediction.featureImportance).map(([factor, weight]) => (
                    <span
                      key={factor}
                      style={{
                        background: 'rgba(51, 65, 85, 0.5)',
                        border: '1px solid rgba(71, 85, 105, 0.5)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        color: '#e2e8f0',
                      }}
                    >
                      {factor}: <strong>{(weight * 100).toFixed(0)}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical summary notes */}
            {selectedPrediction?.clinicalNotes && (
              <div
                style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  background: 'rgba(30, 41, 59, 0.4)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${selectedColorHex}`,
                }}
              >
                {selectedPrediction.clinicalNotes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const presetBtnStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.7)',
  border: '1px solid rgba(71, 85, 105, 0.6)',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '11px',
  fontWeight: 600,
  padding: '4px 8px',
  cursor: 'pointer',
  transition: 'all 0.12s ease',
  outline: 'none',
};
