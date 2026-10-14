from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal, Union

# Categorical types matching frontend/src/types/assessment.ts
SexType = Literal['Male', 'Female']
SmokingStatusType = Literal['Never smoked', 'Former smoker', 'Current smoker']
YesNoType = Literal['Yes', 'No']
ChestPainTypeEnum = Literal['None', 'Typical Angina', 'Atypical Angina', 'Non-Anginal Pain']
ECGFindingType = Literal['Normal', 'ST Depression', 'T Wave Inversion', 'ST Elevation', 'Left Ventricular Hypertrophy']
RWMAFindingType = Literal['None', 'Hypokinesia', 'Akinesia', 'Dyskinesia']

class AssessmentFormDataInput(BaseModel):
    """
    23-field payload submitted by Member 4 frontend assessment form.
    Matches AssessmentFormData in frontend/src/types/assessment.ts.
    """
    # Step 1: Basic Information
    age: float = Field(..., ge=1.0, le=120.0, description="Age in years")
    sex: SexType = Field(..., description="Sex")
    height: float = Field(..., ge=50.0, le=250.0, description="Height in cm")
    weight: float = Field(..., ge=20.0, le=300.0, description="Weight in kg")
    smokingStatus: SmokingStatusType = Field(..., description="Smoking status")
    diabetes: YesNoType = Field(..., description="Diabetes history")
    familyHistory: YesNoType = Field(..., description="Family history of CAD")
    additionalInfo: Optional[str] = Field(None, description="Optional medical history notes")

    # Step 2: Clinical Measurements
    systolicBP: float = Field(..., ge=50.0, le=300.0, description="Systolic Blood Pressure (mmHg)")
    diastolicBP: float = Field(..., ge=30.0, le=200.0, description="Diastolic Blood Pressure (mmHg)")
    restingHeartRate: float = Field(..., ge=30.0, le=250.0, description="Resting Heart Rate (bpm)")
    chestPainType: ChestPainTypeEnum = Field(..., description="Chest pain presentation")

    # Step 3: Laboratory Results
    fastingBloodSugar: float = Field(..., ge=20.0, le=600.0, description="Fasting Blood Sugar (mg/dL)")
    totalCholesterol: float = Field(..., ge=0.0, le=600.0, description="Total Cholesterol (mg/dL)")
    ldlCholesterol: float = Field(..., ge=10.0, le=400.0, description="LDL Cholesterol (mg/dL)")
    hdlCholesterol: float = Field(..., ge=5.0, le=200.0, description="HDL Cholesterol (mg/dL)")
    triglycerides: float = Field(..., ge=20.0, le=1500.0, description="Triglycerides (mg/dL)")
    creatinine: Optional[float] = Field(None, ge=0.1, le=25.0, description="Serum Creatinine (mg/dL)")
    esr: Optional[float] = Field(None, ge=0.0, le=200.0, description="Erythrocyte Sedimentation Rate (mm/hr)")

    # Step 4: ECG and Echocardiography
    ecgFinding: ECGFindingType = Field(..., description="Resting ECG finding")
    qWave: YesNoType = Field(..., description="Pathological Q wave")
    ejectionFraction: float = Field(..., ge=10.0, le=90.0, description="Left Ventricular Ejection Fraction (%)")
    rwma: RWMAFindingType = Field(..., description="Regional Wall Motion Abnormality")


class PatientDataInput(BaseModel):
    """
    Legacy 8-field payload for backward compatibility with existing tests and scripts.
    """
    age: float = Field(..., json_schema_extra={"example": 58.0})
    bp: float = Field(..., description="Blood Pressure", json_schema_extra={"example": 130.0})
    pulse_rate: float = Field(..., json_schema_extra={"example": 72.0})
    cholesterol: float = Field(..., json_schema_extra={"example": 210.0})
    st_elevation: int = Field(..., description="0 or 1", json_schema_extra={"example": 0})
    t_inversion: int = Field(..., description="0 or 1", json_schema_extra={"example": 1})
    lvh: int = Field(..., description="Left Ventricular Hypertrophy (0 or 1)", json_schema_extra={"example": 0})
    rwma: int = Field(..., description="Region with RWMA (0 or 1)", json_schema_extra={"example": 1})


RiskTierType = Literal['Higher risk', 'Moderate risk', 'Lower risk']

class VesselPrediction(BaseModel):
    """
    Vessel prediction conforming to frontend/src/types/prediction.ts VesselPrediction,
    while also supplying status for legacy VesselRisk consumers.
    """
    id: Literal['LAD', 'LCX', 'RCA']
    name: str
    fullName: str
    probability: float
    percentage: int
    riskTier: RiskTierType
    status: str  # "Low", "Moderate", "High" for legacy backward compatibility
    riskBadge: str
    anatomicalTerritory: str
    clinicalSummary: str
    keyDrivers: List[str]

class VesselRisk(BaseModel):
    """Legacy vessel risk model."""
    probability: float
    status: str

class ShapContribution(BaseModel):
    """
    SHAP feature attribution conforming to frontend/src/types/prediction.ts ShapContribution.
    """
    feature: str
    displayName: str
    value: float
    direction: Literal['positive', 'negative']
    category: Literal['clinical', 'lab', 'ecg', 'lifestyle']
    description: str

class FeatureContribution(BaseModel):
    """Legacy feature contribution schema."""
    feature: str
    impact_score: float
    patient_value: float

class ClinicalInsights(BaseModel):
    bloodPressureStatus: str
    cholesterolStatus: str
    cadRiskStatus: str
    recommendations: List[str]

class PredictionResponse(BaseModel):
    """
    Unified prediction response conforming both to Member 4 frontend/src/types/prediction.ts
    (feeding Results page and Member 3 3D Heart Explorer) and preserving legacy fields.
    """
    # Member 4 & Member 3 fields
    id: str
    timestamp: str
    overallCadProbability: float
    overallCadPercentage: int
    overallRiskTier: RiskTierType
    modelConfidence: float
    summaryText: str
    vessels: Dict[str, VesselPrediction]
    shapContributions: List[ShapContribution]
    clinicalInsights: ClinicalInsights
    limitations: List[str]

    # Legacy fields (preserved for backward compatibility)
    overall_cad_risk: float
    overall_cad_status: str
    feature_importances: List[FeatureContribution]
    disclaimer: str