# CardioSpatial 3D — Member 3: 3D Scene Engine & Spatial Mapping Lead
## Cardiovascular Risk Visualization & Prediction

An interactive, production-oriented 3D cardiovascular visualization engine built for clinical decision-support web applications. The module renders high-fidelity anatomical heart geometry and dynamically represents vessel-specific stenosis risk predictions using continuous green-to-red color gradients with explicit separation of the clinical ≥50% stenosis classification threshold.

---

## 1. Executive Summary

- **Primary Target Vessels:**
  - **LAD** (Left Anterior Descending Artery) — *Ramus interventricularis anterior*
  - **LCX** (Left Circumflex Artery) — *Ramus circumflexus*
  - **RCA** (Right Coronary Artery) — *Arteria coronaria dextra*
- **Technology Stack:** React 19, React Three Fiber (`@react-three/fiber` v9), Three.js (`three` v0.186), `@react-three/drei` (v10), Zustand (v5), TypeScript, Vite.
- **Testing & Quality Assurance:** Vitest test suite with 25 passing automated unit tests covering risk-color interpolation, threshold separation, invalid data resilience, mesh identification aliases, and state synchronization.

---

## 2. 3D Model Asset Details & Attribution

- **Base Anatomical Asset:** `public/models/heart.glb` (7.2 MB).
- **Source & Provenance:** Adapted from the open-source educational 3D human organ anatomical collection (`yihalem123/Human-Organ3D`, derived from anatomical ZBrush sculpts).
- **Licensing & Attribution:** Licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)** for educational and research applications.
- **Mesh Structure & Spatial Registration:**
  - Inspection of the raw GLB revealed a unified cardiac shell (`hart:ZBrush_defualt_group_Heart Tex_0`) containing myocardium, cardiac chambers, and great vessels.
  - In accordance with Task A & Task B instructions, rather than destructively recoloring the entire heart shell, the engine implements a dedicated vascular layer (`CoronaryVessels.tsx`) containing high-precision 3D tubular splines (`TubeGeometry`) and branch offshoots (D1, D2, S1 for LAD; OM1, OM2 for LCX; AM, Conus for RCA) registered directly along the anatomical sulci landmarks of the heart model.
  - The model loader also provides multi-alias scene graph traversal (`vesselConfig.ts`) that automatically locates and binds native vessel sub-meshes if a hospital team provides a model with pre-split geometry.

---

## 3. Risk-to-Color Spatial Mapping Architecture

The risk mapping utility (`src/utils/vesselColors.ts`) enforces strict clinical guidelines:

### A. Continuous Piecewise Probability Gradient
Model predicted probabilities $p \in [0.0, 1.0]$ are deterministically interpolated across 4 clinical color stops:
1. **$p \in [0.00, 0.35]$ (Low to Borderline):** Emerald Green (`#10b981`) $\rightarrow$ Amber Yellow (`#eab308`)
2. **$p \in [0.35, 0.65]$ (Borderline to Elevated):** Amber Yellow (`#eab308`) $\rightarrow$ Warm Orange (`#f97316`)
3. **$p \in [0.65, 1.00]$ (Elevated to High):** Warm Orange (`#f97316`) $\rightarrow$ Crimson Red (`#ef4444`)

### B. Separate ≥50% Stenosis Classification Threshold
- **Probability vs Threshold:** A predicted probability of 50% does not imply 50% anatomical stenosis. The clinical decision threshold for hemodynamically significant stenosis is $\ge 50\%$ luminal narrowing.
- If Member 2's backend provides an explicit binary classification (`stenosisPrediction: boolean`), it is preserved and highlighted via dedicated clinical badges (`Threshold Met (≥50%)` vs `Below Threshold (<50%)`).

### C. Missing, Pending, or Invalid Data
- Missing, `null`, `undefined`, `NaN`, infinite, or out-of-range probabilities **never default to healthy green**.
- They resolve deterministically to neutral slate gray (`#64748b`), clearly signaling pending inference to clinicians.

---

## 4. Integration Guide for Team Members

### How Member 4 Mounts the 3D Scene in the Clinical Dashboard
Member 4 can mount `<HeartScene />` in any dashboard panel:

```tsx
import { HeartScene, useCardiovascularStore } from './components/HeartScene';

export function ClinicalDashboard() {
  // Option 1: Automatic sync with shared Zustand store
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <HeartScene />
    </div>
  );

  // Option 2: Controlled mode via props
  const { predictions, selectedVessel, selectVessel } = useCardiovascularStore();
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <HeartScene
        predictions={predictions}
        selectedVessel={selectedVessel}
        onVesselSelect={(vesselId) => selectVessel(vesselId)}
        showOverlays={true}
      />
    </div>
  );
}
```

### Data Contract for Member 2 (FastAPI Inference Response)
Member 2's FastAPI endpoint should return a payload matching `CardiovascularPredictionsPayload`:

```json
{
  "patientId": "PT-9042",
  "timestamp": "2026-10-12T16:00:00Z",
  "overallCAD": {
    "predictedProbability": 0.78,
    "cadDetected": true,
    "riskScore": 78,
    "riskCategory": "High"
  },
  "vessels": {
    "LAD": {
      "vesselId": "LAD",
      "predictedProbability": 0.88,
      "stenosisPrediction": true,
      "stenosisThreshold": 0.50,
      "riskTier": "high",
      "confidenceScore": 0.94,
      "featureImportance": {
        "Calcium Agatston Score": 0.44,
        "Systolic BP": 0.26
      },
      "clinicalNotes": "Severe proximal LAD stenosis predicted."
    },
    "LCX": {
      "vesselId": "LCX",
      "predictedProbability": 0.32,
      "stenosisPrediction": false,
      "stenosisThreshold": 0.50,
      "riskTier": "intermediate"
    },
    "RCA": {
      "vesselId": "RCA",
      "predictedProbability": 0.18,
      "stenosisPrediction": false,
      "stenosisThreshold": 0.50,
      "riskTier": "low"
    }
  }
}
```

---

## 5. Development & Verification Commands

```powershell
# 1. Install dependencies
npm install

# 2. Run automated test suite (Vitest)
npm run test

# 3. Type checking & production build
npm run build

# 4. Start local development server
npm run dev
```

---

## 6. Verification Outcomes

1. **Automated Unit Tests:** 25/25 passed across `vesselColors.test.ts`, `vesselConfig.test.ts`, and `cardiovascularStore.test.ts`.
2. **TypeScript & Bundler Validation:** `tsc -b && vite build` built cleanly in 5.36s with zero type errors.
3. **Visual Runtime Inspection:** Verified via automated browser subagent at `http://127.0.0.1:5173/`:
   - Anatomical 3D heart model and coronary artery trees rendered smoothly in WebGL canvas.
   - Interactive 3D pins and buttons switched between LAD, LCX, and RCA.
   - Camera angle presets (AP, LAO, RAO, Posterior, Reset) reoriented smoothly.
   - Dynamic probability slider demonstrated real-time smooth color transitions from green $\rightarrow$ yellow $\rightarrow$ orange $\rightarrow$ red.
   - Browser console confirmed zero runtime errors or crashes.
