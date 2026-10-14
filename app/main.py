from typing import Union
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

from app.schemas import (
    AssessmentFormDataInput,
    PatientDataInput,
    PredictionResponse
)
from app.adapter import adapt_input_to_model_features, build_prediction_response
from app.model_loader import model_manager
from app.xai_engine import compute_raw_shap_values

app = FastAPI(
    title="CardioVision AI - Cardiovascular Risk & 3D Visualization API",
    version="1.0.0",
    description="Backend service providing CAD and multi-vessel stenosis predictions with SHAP explanations."
)

# Enable CORS for Member 4 frontend and Member 3 3D Engine
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Loads pre-trained model artifacts on application startup."""
    model_manager.load_artifacts()

def classify_risk(prob: float) -> str:
    """Classifies risk probability into qualitative tiers (legacy helper)."""
    if prob >= 0.7:
        return "High"
    elif prob >= 0.3:
        return "Moderate"
    return "Low"

@app.get("/health")
@app.get("/api/health")
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
@app.get("/api/sample-patient", response_model=PatientDataInput)
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
@app.post("/api/predict", response_model=PredictionResponse)
def predict_cardiac_risk(patient: Union[AssessmentFormDataInput, PatientDataInput]):
    """
    Receives patient physiological data (either 23-field frontend form or 8-field legacy input),
    adapts features to the model schema, runs inference across CAD, LAD, LCX, RCA models,
    computes SHAP feature importance, and returns a unified response compatible with
    the Member 4 frontend, Member 3 3D heart explorer, and legacy callers.
    """
    if not model_manager.cad_model:
        raise HTTPException(
            status_code=500, 
            detail="Model artifacts not loaded. Ensure trained weights exist in /models."
        )

    # 1. Adapt input payload to exact 8 canonical model features
    input_df, raw_context = adapt_input_to_model_features(patient)

    # 2. Apply feature scaling if scaler exists
    if model_manager.scaler:
        scaled_features = model_manager.scaler.transform(input_df)
        processed_df = pd.DataFrame(scaled_features, columns=input_df.columns)
    else:
        processed_df = input_df

    # 3. Model inference across all 4 clinical targets
    cad_prob = float(model_manager.cad_model.predict_proba(processed_df)[0][1])
    lad_prob = float(model_manager.lad_model.predict_proba(processed_df)[0][1])
    lcx_prob = float(model_manager.lcx_model.predict_proba(processed_df)[0][1])
    rca_prob = float(model_manager.rca_model.predict_proba(processed_df)[0][1])

    # 4. Compute SHAP values for CAD model
    shap_vals = compute_raw_shap_values(model_manager.cad_model, processed_df)

    # 5. Build unified PredictionResponse
    return build_prediction_response(
        cad_prob=cad_prob,
        lad_prob=lad_prob,
        lcx_prob=lcx_prob,
        rca_prob=rca_prob,
        shap_vals=shap_vals,
        raw_context=raw_context
    )