# CardioVision AI — Clinical Cardiovascular Risk Prediction & 3D Spatial Visualization

CardioVision AI is an end-to-end clinical decision-support platform designed to evaluate Coronary Artery Disease (CAD) risk and estimate branch-specific stenosis probabilities across the coronary arterial tree (**LAD**, **LCX**, and **RCA**). The platform combines validated machine learning models, TreeSHAP explainability, an evidence-based clinical synthesis engine, and an interactive 3D cardiovascular digital twin.

---

## 1. Project Overview & Key Features

CardioVision AI translates complex, non-invasive patient clinical observations into clear, interpretable, and spatially contextualized risk intelligence for clinicians and patients.

### Key Capabilities
- **Multi-Target Coronary Risk Prediction**: Predicts overall CAD probability alongside individualized stenosis risk for three major coronary arteries:
  - **LAD** (*Left Anterior Descending*): Supplies the anterior left ventricular wall and interventricular septum.
  - **LCX** (*Left Circumflex*): Supplies the posterolateral left ventricular wall and left atrium.
  - **RCA** (*Right Coronary Artery*): Supplies the right ventricle, inferior diaphragmatic wall, and sinoatrial/atrioventricular conduction tissue.
- **Interactive 3D Cardiac Digital Twin**: High-fidelity WebGL 3D heart model rendering anatomical coronary arterial geometry with dynamic, piecewise green-to-red risk gradient coloring, pulse alerts for hemodynamically high-risk vessels ($\ge 70\%$), interactive orbit/zoom controls, camera presets (Anterior, Superior, Posterior, Right Lateral), and vessel inspection overlays.
- **Explainable AI (TreeSHAP)**: Patient-specific and global feature attributions detailing how key biomarkers (e.g., SBP, LDL, Ejection Fraction, Age, Regional Wall Motion Abnormalities) drive individual risk scores.
- **Evidence-Based AI Health Summary**: Clinical synthesis module that contextualizes risk tiers, highlights primary drivers, provides lifestyle considerations, and generates physician discussion questions.
- **Guided 23-Field Patient Intake**: A 5-step intuitive assessment workflow covering Demographics, Vitals, Lipid/Lab Panel, ECG & Echocardiography, and Review, with real-time validation, empty-safe editing, and specific clinical range checks.
- **Historical Assessment Tracking**: Longitudinal assessment timeline comparing risk trajectory and clinical metrics over time.

---

## 2. Architecture & Technology Stack

The platform is architected as a decoupled, modern clinical web application:

```
┌─────────────────────────────────────────────────────────────┐
│                   Vite + React Frontend                     │
│  - React 18 + TypeScript + Tailwind CSS                     │
│  - Zustand State Management                                 │
│  - React Three Fiber (@react-three/fiber) + Three.js        │
│  - 23-Field Assessment Form + 3D Viewport + SHAP Bar Charts │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│  - Python 3.10+ / FastAPI / Uvicorn / Pydantic              │
│  - Clinical Adapter (23-field intake -> 8 model features)   │
│  - Dual payload support (23-field & legacy 8-field schemas) │
│  - TreeSHAP XAI Engine                                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Trained ML Model Artifacts                  │
│  - CAD, LAD, LCX, RCA Classifiers (XGBoost / GradientBoost) │
│  - StandardScaler fitted on non-invasive training features  │
│  - Zero catheterization target leakage                      │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18.3, TypeScript 5.4, Vite 5.3, Tailwind CSS 3.4, React Three Fiber 8.16, Three.js 0.165, `@react-three/drei` 9.106, Zustand 4.5, Lucide React, Recharts.
- **Backend**: FastAPI 0.115+, Uvicorn 0.30+, Pydantic 2.0+, Scikit-learn 1.4+, XGBoost 2.0+, SHAP 0.44+, Joblib 1.3+, Pandas 2.2+, NumPy 1.26+.
- **Clinical Training Dataset**: Z-Alizadeh Sani coronary artery disease dataset (303 patient records, 54 raw features transformed to 8 non-invasive predictive markers).

---

## 3. Repository Structure

```
Cardiovascular-Risk-Visualization-Prediction/
├── app/                        # FastAPI backend application
│   ├── main.py                 # API routes, CORS, prediction endpoints
│   ├── adapter.py              # 23-field to 8-feature clinical intake adapter
│   ├── schemas.py              # Pydantic request and response schemas
│   └── xai_engine.py           # ML model loader & TreeSHAP explanation engine
├── data/                       # Verified training data
│   └── z_alizadeh_sani.csv     # Z-Alizadeh Sani CAD dataset (UCI ML Repository)
├── frontend/                   # React + TypeScript single-page application
│   ├── public/models/          # 3D anatomical heart models (heart.glb)
│   ├── src/                    # Components, pages, stores, and utilities
│   │   ├── components/heart/   # 3D Heart scene, lighting, controls, overlays
│   │   ├── pages/              # Dashboard, Assessment, Results, Explorer, Insights
│   │   ├── services/           # Backend API integration & clinical summary engine
│   │   ├── store/              # Zustand stores (assessment, heart, prediction)
│   │   └── types/              # TypeScript interfaces for forms, predictions, 3D
│   ├── package.json
│   └── vite.config.ts
├── ml/                         # Training pipeline and validation scripts
│   ├── train_models.py         # 5-fold cross-validation training script
│   └── evaluate_provenance.py  # Model provenance audit utility
├── models/                     # Saved production model artifacts
│   ├── cad_model.joblib        # Overall CAD classifier
│   ├── lad_model.joblib        # LAD branch classifier
│   ├── lcx_model.joblib        # LCX branch classifier
│   ├── rca_model.joblib        # RCA branch classifier
│   ├── scaler.joblib           # Preprocessing StandardScaler
│   └── metrics_report.json     # 5-fold cross-validation metrics
├── tests/                      # Automated backend unit and integration tests
│   └── test_adapter.py         # Adapter validation, schema, and endpoint tests
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation
```

---

## 4. Backend Installation & Startup

### Prerequisites
- Python 3.10, 3.11, or 3.12
- `pip` package manager

### Setup Steps
1. **Create and activate a virtual environment**:
   ```bash
   # From the repository root
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI backend server**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

4. **Verify backend health**:
   ```bash
   curl http://127.0.0.1:8000/api/health
   # Response: {"status":"healthy","models_loaded":true,"shap_ready":true,...}
   ```
   The interactive API documentation is accessible at `http://127.0.0.1:8000/docs`.

---

## 5. Frontend Installation & Startup

### Prerequisites
- Node.js 18.x or higher
- `npm` package manager

### Setup Steps
1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Launch the development server**:
   ```bash
   npm run dev
   ```
   The frontend application will start on `http://localhost:3000`.

4. **Create a production build**:
   ```bash
   npm run build
   ```

---

## 6. How to Run Available Tests

### Backend Unit & Adapter Tests
Runs automated test suite verifying feature ordering, unit conversions, schema validation, HTTP error codes, and model invocation:
```bash
# From repository root (with virtual environment active)
python3 -m unittest -v tests/test_adapter.py
```

### Frontend TypeScript Verification & Build
Validates strict type-safety across all components, stores, and API contracts:
```bash
# From frontend directory
cd frontend
npm run lint    # Runs tsc --noEmit
npm run build   # Validates TypeScript and creates optimized Vite bundle
```

---

## 7. Required Datasets, Model Artifacts & 3D Assets

All required artifacts are bundled with the repository:

| Asset | Location | Description |
|---|---|---|
| **Clinical Dataset** | `data/z_alizadeh_sani.csv` | Legitimate Z-Alizadeh Sani CAD dataset from UCI Machine Learning Repository (303 patient rows, 54 attributes). |
| **CAD Model** | `models/cad_model.joblib` | Trained classifier for overall coronary artery disease risk. |
| **LAD Model** | `models/lad_model.joblib` | Trained classifier for Left Anterior Descending artery stenosis. |
| **LCX Model** | `models/lcx_model.joblib` | Trained classifier for Left Circumflex artery stenosis. |
| **RCA Model** | `models/rca_model.joblib` | Trained classifier for Right Coronary Artery stenosis. |
| **Scaler Artifact** | `models/scaler.joblib` | Scikit-learn `StandardScaler` fitted on non-invasive training features. |
| **3D Heart Model** | `frontend/public/models/heart.glb` | 3D anatomical heart geometry (CC BY 4.0 educational asset). |

---

## 8. Known Limitations & Medical Disclaimer

### Technical & Clinical Limitations
1. **Tabular Statistical Predictions**: Risk probabilities are generated via supervised machine learning on non-invasive tabular biomarkers (demographics, blood pressure, lipid panels, ECG findings, echocardiography). The models do not evaluate native medical imaging (e.g., DICOM scans, coronary CT angiography, invasive catheterization fluoroscopy).
2. **Dataset Demographics**: The underlying models were trained on the Z-Alizadeh Sani cohort (Tehran Heart Center). Model calibration may vary across diverse geographic or institutional patient demographics.
3. **Decision-Support Scope**: CardioVision AI provides assistive risk stratifications and educational insights; it does not constitute automated diagnosis.

### Medical Disclaimer
> **IMPORTANT NOTICE**: CardioVision AI is an educational and clinical research decision-support prototype. It is **not** a certified medical device, does not provide medical diagnoses, and must **never** be used as a substitute for professional clinical judgment, invasive coronary angiography, or diagnostic evaluation by a licensed cardiologist. All predictions, risk classifications, and summaries must be reviewed and confirmed by qualified healthcare practitioners.
