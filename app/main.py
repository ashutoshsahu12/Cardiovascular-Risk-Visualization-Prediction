from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

from app.schemas import PatientDataInput, PredictionResponse, VesselRisk
from app.model_loader import model_manager
from app.xai_engine import compute_shap_explanations

app = FastAPI(
    title="Cardiovascular Risk & 3D Visualization API",
    version="1.0.0",
    description="Backend service providing CAD and multi-vessel stenosis predictions with SHAP explanations."
)

# Enable CORS for cross-origin integration with Member 3 (3D Engine) & Member 4 (Frontend UI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Loads pre-trained model artifacts on application startup."""
    model_manager.load_artifacts()

def classify_risk(prob: float) -> str:
    """Classifies risk probability into qualitative tiers."""
    if prob >= 0.7:
        return "High"
    elif prob >= 0.3:
        return "Moderate"
    return "Low"

@app.get("/health")
def health_check():
    """Health check endpoint to verify loaded artifacts."""
    models_loaded = all([
        model_manager.cad_model,
        model_manager.lad_model,
        model_manager.lcx_model,
        model_manager.rca_model
    ])
    return {
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded
    }

@app.get("/sample-patient", response_model=PatientDataInput)
def get_sample_patient():
    """Returns a sample patient payload for rapid testing by teammates."""
    return PatientDataInput(
        age=58.0,
        bp=130.0,
        pulse_rate=72.0,
        cholesterol=210.0,
        st_elevation=0,
        t_inversion=1,
        lvh=0,
        rwma=1
    )

@app.post("/predict", response_model=PredictionResponse)
def predict_cardiac_risk(patient: PatientDataInput):
    """
    Receives patient physiological data, runs model inference across all targets,
    computes SHAP feature importance, and returns combined prediction JSON.
    """
    if not model_manager.cad_model:
        raise HTTPException(
            status_code=500, 
            detail="Model artifacts not loaded. Ensure trained weights exist in /models or run generate_dummy_models.py."
        )

    # Convert Pydantic object to pandas DataFrame for sklearn/xgboost
    input_dict = patient.dict()
    input_df = pd.DataFrame([input_dict])

    # 1. Apply scaling if scaler exists
    if model_manager.scaler:
        scaled_features = model_manager.scaler.transform(input_df)
        processed_df = pd.DataFrame(scaled_features, columns=input_df.columns)
    else:
        processed_df = input_df

    # 2. Get target probabilities
    cad_prob = float(model_manager.cad_model.predict_proba(processed_df)[0][1])
    lad_prob = float(model_manager.lad_model.predict_proba(processed_df)[0][1])
    lcx_prob = float(model_manager.lcx_model.predict_proba(processed_df)[0][1])
    rca_prob = float(model_manager.rca_model.predict_proba(processed_df)[0][1])

    # 3. Compute SHAP explanations for CAD model
    shap_explanations = compute_shap_explanations(model_manager.cad_model, processed_df)

    # 4. Construct JSON Response matching teammate contract specifications
    return PredictionResponse(
        overall_cad_risk=float(np.round(cad_prob, 4)),
        overall_cad_status=classify_risk(cad_prob),
        vessels={
            "LAD": VesselRisk(probability=float(np.round(lad_prob, 4)), status=classify_risk(lad_prob)),
            "LCX": VesselRisk(probability=float(np.round(lcx_prob, 4)), status=classify_risk(lcx_prob)),
            "RCA": VesselRisk(probability=float(np.round(rca_prob, 4)), status=classify_risk(rca_prob)),
        },
        feature_importances=shap_explanations,
        disclaimer="FOR DECISION SUPPORT AND EDUCATIONAL PURPOSES ONLY. NOT A SUBSTITUTE FOR FORMAL DIAGNOSTIC IMAGING."
    )