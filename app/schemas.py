from pydantic import BaseModel, Field
from typing import Dict, List

class PatientDataInput(BaseModel):
    # Demographics & Vitals
    age: float = Field(..., example=58.0)
    bp: float = Field(..., description="Blood Pressure", example=130.0)
    pulse_rate: float = Field(..., example=72.0)
    
    # Lab & ECG Features
    cholesterol: float = Field(..., example=210.0)
    st_elevation: int = Field(..., description="0 or 1", example=0)
    t_inversion: int = Field(..., description="0 or 1", example=1)
    lvh: int = Field(..., description="Left Ventricular Hypertrophy (0 or 1)", example=0)
    
    # Echocardiographic Features
    rwma: int = Field(..., description="Region with RWMA (0 or 1)", example=1)

class VesselRisk(BaseModel):
    probability: float
    status: str  # "Low", "Moderate", or "High"

class FeatureContribution(BaseModel):
    feature: str
    impact_score: float  # SHAP value
    patient_value: float

class PredictionResponse(BaseModel):
    overall_cad_risk: float
    overall_cad_status: str
    vessels: Dict[str, VesselRisk]  # "LAD", "LCX", "RCA"
    feature_importances: List[FeatureContribution]
    disclaimer: str