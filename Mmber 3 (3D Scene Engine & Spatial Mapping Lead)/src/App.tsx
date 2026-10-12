/**
 * Cardiovascular Risk Visualization & Prediction - Interactive Clinical Application
 * Member 3: 3D Scene Engine & Spatial Mapping Lead
 * 
 * Showcases:
 * - High-fidelity 3D anatomical heart visualization with React Three Fiber
 * - Dynamic continuous green-to-red risk gradient mapping for LAD, LCX, and RCA
 * - Explicit separation between predicted probability and ≥50% stenosis classification threshold
 * - Raycasting, hover tooltips, and click selection synchronized with clinical details
 * - Seamless integration architecture for Member 2 (FastAPI) and Member 4 (Dashboard)
 */

import React from 'react';
import {
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sliders,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { HeartScene } from './components/HeartScene.tsx';
import { useCardiovascularStore } from './store/cardiovascularStore.ts';
import { CORONARY_VESSEL_IDS, getVesselMetadata } from './config/vesselConfig.ts';
import {
  getVesselRiskColorHex,
  evaluateStenosisThreshold,
} from './utils/vesselColors.ts';

export const App: React.FC = () => {
  const {
    predictions,
    selectedVessel,
    selectVessel,
    setVesselPrediction,
    loadDemoScenario,
  } = useCardiovascularStore();

  const selectedPred = selectedVessel ? predictions?.vessels?.[selectedVessel] : null;
  const selectedMeta = selectedVessel ? getVesselMetadata(selectedVessel) : null;
  const thresholdEval = evaluateStenosisThreshold(selectedPred);
  const selectedColorHex = getVesselRiskColorHex(selectedPred);

  // Overall CAD status
  const overallCAD = predictions?.overallCAD;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#090d16' }}>
      {/* ─── Top Clinical Header ─── */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid #1e293b',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Heart size={20} color="#ffffff" fill="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                CardioSpatial 3D
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                Member 3 Engine
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              Interactive 3D Anatomical Scene Engine & Coronary Stenosis Risk Mapping
            </p>
          </div>
        </div>

        {/* Patient Metadata & ML Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Activity size={14} style={{ color: '#10b981' }} />
            <span>Patient: <strong>{predictions?.patientId || 'PT-9042'}</strong></span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ color: '#94a3b8' }}>Classification Threshold: <strong>≥50%</strong></span>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#10b981',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            <span>WebGL 3D Engine Active</span>
          </div>
        </div>
      </header>

      {/* ─── Fast Overview Ribbon (4 Target Metrics) ─── */}
      <section
        style={{
          background: '#0d1322',
          borderBottom: '1px solid #1e293b',
          padding: '10px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Overall CAD */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Overall CAD Risk</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: overallCAD?.cadDetected ? '#ef4444' : '#10b981',
                background: overallCAD?.cadDetected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              {overallCAD?.cadDetected ? 'Positive (≥50%)' : 'Negative (<50%)'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
              {overallCAD?.predictedProbability != null ? `${Math.round(overallCAD.predictedProbability * 100)}%` : '--'}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Score: {overallCAD?.riskScore != null ? overallCAD.riskScore : 'N/A'}
            </span>
          </div>
        </div>

        {/* Vessel Cards (LAD, LCX, RCA) */}
        {CORONARY_VESSEL_IDS.map((vesselId) => {
          const pred = predictions?.vessels?.[vesselId];
          const colorHex = getVesselRiskColorHex(pred);
          const isSelected = selectedVessel === vesselId;
          const met = pred?.stenosisPrediction ?? (pred?.predictedProbability != null ? pred.predictedProbability >= 0.5 : false);

          return (
            <div
              key={vesselId}
              onClick={() => selectVessel(vesselId)}
              style={{
                background: isSelected ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.7)',
                border: isSelected ? `2px solid #38bdf8` : `1px solid ${colorHex}55`,
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: colorHex,
                      boxShadow: `0 0 6px ${colorHex}`,
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{vesselId}</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: met ? '#ef4444' : '#10b981',
                    background: met ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {met ? '≥50% Stenosis' : '<50% Stenosis'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: colorHex }}>
                  {pred?.predictedProbability != null ? `${Math.round(pred.predictedProbability * 100)}%` : '--'}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  predicted prob.
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── Main Content: 3D Scene Viewport + Clinical Inspector Panel ─── */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          padding: '16px 24px',
          gap: '20px',
          overflow: 'hidden',
        }}
      >
        {/* 3D Viewport Panel Container */}
        <section
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            background: '#0b101d',
            border: '1px solid #1e293b',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* HeartScene Component mounted inside dashboard panel container */}
          <HeartScene
            modelUrl="/models/heart.glb"
            height="100%"
            width="100%"
          />
        </section>

        {/* Clinical Inspector & Interactive Prediction Tuning Side-Panel */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
          }}
        >
          {/* Active Vessel Focus Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: `1.5px solid ${selectedVessel ? selectedColorHex : '#334155'}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: selectedVessel ? `0 0 16px ${selectedColorHex}22` : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Localized Vessel Inspector
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                  {selectedMeta ? `${selectedMeta.id} — ${selectedMeta.commonName}` : 'Select a Coronary Artery'}
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                  {selectedMeta?.latinName}
                </div>
              </div>

              {/* Vessel switcher buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {CORONARY_VESSEL_IDS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => selectVessel(v)}
                    style={{
                      background: selectedVessel === v ? '#0284c7' : '#1e293b',
                      color: '#f8fafc',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {selectedVessel && selectedPred ? (
              <>
                {/* Risk Probability & Classification Threshold */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Stenosis Probability:</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: selectedColorHex }}>
                      {selectedPred.predictedProbability != null
                        ? `${(selectedPred.predictedProbability * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>

                  {/* Gradient Meter Bar */}
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '4px',
                      background: 'rgba(51, 65, 85, 0.7)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedPred.predictedProbability != null && (
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(0, selectedPred.predictedProbability * 100))}%`,
                          background: selectedColorHex,
                          boxShadow: `0 0 10px ${selectedColorHex}`,
                          borderRadius: '4px',
                        }}
                      />
                    )}
                  </div>

                  {/* Threshold Classification Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: thresholdEval.statusColorHex,
                      marginTop: '4px',
                    }}
                  >
                    {thresholdEval.isThresholdMet ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                    <span>{thresholdEval.statusLabel}</span>
                  </div>
                </div>

                {/* Real-time Dynamic Probability Slider for Testing Color Response */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px dashed #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sliders size={12} /> Test Live Color Gradient:
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                      {selectedPred.predictedProbability != null
                        ? `${Math.round(selectedPred.predictedProbability * 100)}%`
                        : '50%'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedPred.predictedProbability ?? 0.5}
                    onChange={(e) => {
                      const newProb = parseFloat(e.target.value);
                      setVesselPrediction(selectedVessel, {
                        predictedProbability: newProb,
                        stenosisPrediction: newProb >= 0.50,
                      });
                    }}
                    style={{ accentColor: selectedColorHex, width: '100%', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                    <span>0% (Green)</span>
                    <span>50% (Orange / Threshold)</span>
                    <span>100% (Red)</span>
                  </div>
                </div>

                {/* Perfusion Territory */}
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Myocardial Territory: </span>
                  {selectedMeta?.perfusionTerritory}
                </div>

                {/* Explainability / SHAP Factors */}
                {selectedPred.featureImportance && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} style={{ color: '#38bdf8' }} /> Inference Drivers (SHAP Importance):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {Object.entries(selectedPred.featureImportance).map(([feat, val]) => (
                        <div
                          key={feat}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            background: 'rgba(30, 41, 59, 0.5)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          <span style={{ color: '#e2e8f0' }}>{feat}</span>
                          <strong style={{ color: '#38bdf8' }}>+{(val * 100).toFixed(0)}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '12px' }}>
                <Info size={28} style={{ color: '#38bdf8', marginBottom: '8px' }} />
                <p>Click on any coronary artery (LAD, LCX, or RCA) on the 3D heart model to inspect localized stenosis risk and SHAP explainability.</p>
              </div>
            )}
          </div>

          {/* Clinical Simulation Scenarios */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Clinical Testing Scenarios
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => loadDemoScenario('high_risk_lad')}
                style={scenarioBtnStyle}
              >
                High Risk LAD (88%)
              </button>
              <button
                type="button"
                onClick={() => loadDemoScenario('multivessel_cad')}
                style={scenarioBtnStyle}
              >
                Multivessel Disease
              </button>
              <button
                type="button"
                onClick={() => loadDemoScenario('normal_low_risk')}
                style={scenarioBtnStyle}
              >
                Normal / Low Risk
              </button>
              <button
                type="button"
                onClick={() => loadDemoScenario('pending_inference')}
                style={scenarioBtnStyle}
              >
                Clear / Pending (Gray)
              </button>
            </div>
          </div>

          {/* Member 2 & Member 4 Architecture Integration Note */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
              <ExternalLink size={13} /> Team Architecture Integration
            </div>
            <span>
              Member 3 module exports <code>HeartScene</code> and <code>useCardiovascularStore</code>. Fully compatible with Member 2 FastAPI schema and Member 4 dashboard panel embedding.
            </span>
          </div>
        </aside>
      </main>
    </div>
  );
};

const scenarioBtnStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.8)',
  border: '1px solid #334155',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '11px',
  fontWeight: 600,
  padding: '6px 8px',
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.12s ease',
};

export default App;
