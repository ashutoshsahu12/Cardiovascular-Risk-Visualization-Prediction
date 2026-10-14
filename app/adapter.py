import uuid
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Union
import numpy as np
import pandas as pd

from app.schemas import (
    AssessmentFormDataInput,
    PatientDataInput,
    PredictionResponse,
    VesselPrediction,
    ShapContribution,
    FeatureContribution,
    ClinicalInsights
)

# Canonical 8 features and strict order required by models and scaler
CANONICAL_FEATURES: List[str] = [
    'age', 'bp', 'pulse_rate', 'cholesterol', 'st_elevation', 't_inversion', 'lvh', 'rwma'
]

def adapt_input_to_model_features(
    payload: Union[AssessmentFormDataInput, PatientDataInput]
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Transforms either a 23-field frontend payload (AssessmentFormDataInput) or an
    8-field legacy payload (PatientDataInput) into the exact 8-feature DataFrame
    expected by the pre-trained ML models and scaler.

    Returns:
        (feature_df, raw_context)
    """
    if isinstance(payload, AssessmentFormDataInput):
        # 1. Demographics & Vitals
        age = float(payload.age)
        bp = float(payload.systolicBP)
        pulse_rate = float(payload.restingHeartRate)

        # 2. Cholesterol: Use totalCholesterol, or Friedewald formula if <= 0
        if payload.totalCholesterol > 0:
            cholesterol = float(payload.totalCholesterol)
        elif payload.hdlCholesterol > 0 and payload.ldlCholesterol > 0:
            cholesterol = float(payload.hdlCholesterol + payload.ldlCholesterol + (payload.triglycerides / 5.0))
        else:
            cholesterol = float(payload.totalCholesterol)

        # 3. ECG categorical mapping to binary indicators
        st_elevation = 1 if payload.ecgFinding == 'ST Elevation' else 0
        t_inversion = 1 if payload.ecgFinding == 'T Wave Inversion' else 0
        lvh = 1 if payload.ecgFinding == 'Left Ventricular Hypertrophy' else 0

        # 4. Regional Wall Motion Abnormality (RWMA) mapping
        # In training dataset, 0 = no RWMA, 1 = presence of hypokinesia/akinesia/dyskinesia
        rwma = 0 if payload.rwma == 'None' else 1

        raw_context = {
            'age': age,
            'bp': bp,
            'diastolicBP': float(payload.diastolicBP),
            'pulse_rate': pulse_rate,
            'cholesterol': cholesterol,
            'ldlCholesterol': float(payload.ldlCholesterol),
            'hdlCholesterol': float(payload.hdlCholesterol),
            'triglycerides': float(payload.triglycerides),
            'st_elevation': st_elevation,
            't_inversion': t_inversion,
            'lvh': lvh,
            'rwma': rwma,
            'sex': payload.sex,
            'smokingStatus': payload.smokingStatus,
            'diabetes': payload.diabetes,
            'familyHistory': payload.familyHistory,
            'chestPainType': payload.chestPainType,
            'ecgFinding': payload.ecgFinding,
            'rwmaFinding': payload.rwma,
            'ejectionFraction': float(payload.ejectionFraction),
        }
    else:
        # Legacy 8-field PatientDataInput
        age = float(payload.age)
        bp = float(payload.bp)
        pulse_rate = float(payload.pulse_rate)
        cholesterol = float(payload.cholesterol)
        st_elevation = int(payload.st_elevation)
        t_inversion = int(payload.t_inversion)
        lvh = int(payload.lvh)
        rwma = int(payload.rwma)

        raw_context = {
            'age': age,
            'bp': bp,
            'pulse_rate': pulse_rate,
            'cholesterol': cholesterol,
            'st_elevation': st_elevation,
            't_inversion': t_inversion,
            'lvh': lvh,
            'rwma': rwma,
        }

    # Construct DataFrame with exact column ordering
    feature_df = pd.DataFrame([{
        'age': age,
        'bp': bp,
        'pulse_rate': pulse_rate,
        'cholesterol': cholesterol,
        'st_elevation': st_elevation,
        't_inversion': t_inversion,
        'lvh': lvh,
        'rwma': rwma
    }], columns=CANONICAL_FEATURES)

    return feature_df, raw_context

def classify_risk_tier(prob: float) -> str:
    """Classifies risk probability into frontend-compatible RiskTier."""
    if prob >= 0.60:
        return "Higher risk"
    elif prob >= 0.35:
        return "Moderate risk"
    return "Lower risk"

def classify_legacy_status(prob: float) -> str:
    """Classifies risk probability into legacy status (Low, Moderate, High)."""
    if prob >= 0.70:
        return "High"
    elif prob >= 0.30:
        return "Moderate"
    return "Low"

def get_vessel_risk_badge(prob: float) -> str:
    """Returns badge text matching frontend UI specifications."""
    if prob >= 0.60:
        return "+ Potential stenosis"
    elif prob >= 0.35:
        return "+ Moderate risk"
    return "+ Low risk"

def build_shap_contributions(
    feature_names: List[str],
    shap_vals: np.ndarray,
    raw_context: Dict[str, Any]
) -> Tuple[List[ShapContribution], List[FeatureContribution]]:
    """
    Formats SHAP explanation values into both frontend ShapContribution items
    and legacy FeatureContribution items.
    """
    metadata = {
        'age': {
            'displayName': f"Age Factor ({int(raw_context.get('age', 50))} yrs)",
            'category': 'clinical',
            'pos_desc': f"Age ({int(raw_context.get('age', 50))} yrs) reflects cumulative vascular exposure over decades.",
            'neg_desc': f"Age ({int(raw_context.get('age', 50))} yrs) reflects cardiovascular resilience and lower cumulative risk."
        },
        'bp': {
            'displayName': f"Systolic Blood Pressure ({int(raw_context.get('bp', 120))} mmHg)",
            'category': 'clinical',
            'pos_desc': f"Systolic BP of {int(raw_context.get('bp', 120))} mmHg increases hemodynamic shear and vessel wall stress.",
            'neg_desc': f"Systolic BP of {int(raw_context.get('bp', 120))} mmHg is within protective hemodynamic parameters."
        },
        'pulse_rate': {
            'displayName': f"Resting Heart Rate ({int(raw_context.get('pulse_rate', 70))} bpm)",
            'category': 'clinical',
            'pos_desc': f"Resting heart rate of {int(raw_context.get('pulse_rate', 70))} bpm increases myocardial oxygen demand.",
            'neg_desc': f"Resting heart rate of {int(raw_context.get('pulse_rate', 70))} bpm reflects efficient autonomic tone."
        },
        'cholesterol': {
            'displayName': f"Serum Cholesterol ({int(raw_context.get('cholesterol', 200))} mg/dL)",
            'category': 'lab',
            'pos_desc': f"Total cholesterol of {int(raw_context.get('cholesterol', 200))} mg/dL contributes towards atherogenic burden.",
            'neg_desc': f"Total cholesterol of {int(raw_context.get('cholesterol', 200))} mg/dL reflects favorable lipid baseline."
        },
        'st_elevation': {
            'displayName': "ECG ST Elevation",
            'category': 'ecg',
            'pos_desc': "Resting ST segment elevation strongly correlates with localized transmural myocardial ischemia.",
            'neg_desc': "Absence of ST segment elevation confirms lack of resting transmural injury."
        },
        't_inversion': {
            'displayName': "ECG T Wave Inversion",
            'category': 'ecg',
            'pos_desc': "Subendocardial repolarization changes (T wave inversion) correlate with regional ischemia.",
            'neg_desc': "Normal ventricular repolarization without pathological T wave inversion."
        },
        'lvh': {
            'displayName': "Left Ventricular Hypertrophy (LVH)",
            'category': 'ecg',
            'pos_desc': "ECG voltage criteria for LVH indicates chronic ventricular pressure overload.",
            'neg_desc': "Absence of LVH criteria indicates preserved ventricular wall geometry."
        },
        'rwma': {
            'displayName': "Wall Motion Abnormality (RWMA)",
            'category': 'clinical',
            'pos_desc': "Regional wall motion abnormality on echocardiogram signals localized myocardial dysfunction.",
            'neg_desc': "Synchronous myocardial wall contraction without regional motion abnormality."
        }
    }

    shap_contributions: List[ShapContribution] = []
    legacy_contributions: List[FeatureContribution] = []

    for name, shap_val in zip(feature_names, shap_vals):
        val_rounded = float(np.round(shap_val, 4))
        direction = 'positive' if shap_val > 0 else 'negative'
        meta = metadata.get(name, {
            'displayName': name,
            'category': 'clinical',
            'pos_desc': f"{name} increases predicted cardiovascular risk.",
            'neg_desc': f"{name} mitigates predicted cardiovascular risk."
        })

        desc = meta['pos_desc'] if shap_val > 0 else meta['neg_desc']
        patient_val = float(raw_context.get(name, 0.0))

        shap_contributions.append(ShapContribution(
            feature=name,
            displayName=meta['displayName'],
            value=val_rounded,
            direction=direction,
            category=meta['category'],
            description=desc
        ))

        legacy_contributions.append(FeatureContribution(
            feature=name,
            impact_score=val_rounded,
            patient_value=patient_val
        ))

    # Sort descending by absolute impact
    shap_contributions.sort(key=lambda x: abs(x.value), reverse=True)
    legacy_contributions.sort(key=lambda x: abs(x.impact_score), reverse=True)

    return shap_contributions, legacy_contributions

def build_clinical_insights(
    cad_prob: float,
    raw_context: Dict[str, Any]
) -> ClinicalInsights:
    """Generates context-aware clinical insights based on patient inputs and predicted CAD risk."""
    bp_val = raw_context.get('bp', 120.0)
    chol_val = raw_context.get('cholesterol', 180.0)
    risk_tier = classify_risk_tier(cad_prob)

    # Blood Pressure interpretation
    if bp_val >= 140.0:
        bp_status = f"Systolic blood pressure ({int(bp_val)} mmHg) is elevated (Stage 2 Hypertension range)."
    elif bp_val >= 130.0:
        bp_status = f"Systolic blood pressure ({int(bp_val)} mmHg) is slightly elevated (Stage 1 Hypertension range)."
    else:
        bp_status = f"Systolic blood pressure ({int(bp_val)} mmHg) is within optimal clinical parameters."

    # Cholesterol interpretation
    if chol_val >= 240.0:
        chol_status = f"Total cholesterol ({int(chol_val)} mg/dL) exceeds clinical threshold (>200 mg/dL)."
    elif chol_val >= 200.0:
        chol_status = f"Total cholesterol ({int(chol_val)} mg/dL) is borderline elevated."
    else:
        chol_status = f"Total cholesterol ({int(chol_val)} mg/dL) is within desirable range."

    cad_status = f"{risk_tier} predicted for significant coronary artery disease."

    recommendations = []
    if bp_val >= 130.0:
        recommendations.append(
            f"Systolic blood pressure ({int(bp_val)} mmHg) is elevated. Regular hemodynamic monitoring recommended."
        )
    if chol_val >= 200.0:
        recommendations.append(
            f"Serum cholesterol ({int(chol_val)} mg/dL) is above optimal range. Discuss lipid management with physician."
        )
    if cad_prob >= 0.50:
        recommendations.append(
            "Elevated probability of CAD indicated. Consult a cardiologist for comprehensive diagnostic evaluation."
        )
    else:
        recommendations.append(
            "Maintain routine cardiovascular wellness screenings, heart-healthy nutrition, and regular physical activity."
        )

    return ClinicalInsights(
        bloodPressureStatus=bp_status,
        cholesterolStatus=chol_status,
        cadRiskStatus=cad_status,
        recommendations=recommendations
    )

def build_prediction_response(
    cad_prob: float,
    lad_prob: float,
    lcx_prob: float,
    rca_prob: float,
    shap_vals: np.ndarray,
    raw_context: Dict[str, Any],
    pred_id: Optional[str] = None
) -> PredictionResponse:
    """
    Constructs the unified PredictionResponse meeting both Member 4's frontend
    contract (types/prediction.ts), Member 3's 3D engine requirements (vesselColors.ts),
    and legacy backend API specifications.
    """
    prediction_id = pred_id or f"cv-pred-{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    cad_prob_rounded = float(np.round(cad_prob, 4))
    cad_percentage = int(np.round(cad_prob * 100))
    overall_tier = classify_risk_tier(cad_prob)
    overall_legacy_status = classify_legacy_status(cad_prob)

    # Probabilistic model confidence
    model_confidence = float(np.round(float(max(cad_prob, 1.0 - cad_prob)), 2))

    # SHAP explanations
    shap_contributions, legacy_contributions = build_shap_contributions(
        CANONICAL_FEATURES, shap_vals, raw_context
    )

    # Top drivers for vessel summaries
    top_driver_names = [f"{sc.displayName}" for sc in shap_contributions[:3]]

    # Vessel predictions
    lad_pct = int(np.round(lad_prob * 100))
    lcx_pct = int(np.round(lcx_prob * 100))
    rca_pct = int(np.round(rca_prob * 100))

    vessels = {
        "LAD": VesselPrediction(
            id="LAD",
            name="LAD",
            fullName="Left Anterior Descending",
            probability=float(np.round(lad_prob, 4)),
            percentage=lad_pct,
            riskTier=classify_risk_tier(lad_prob),
            status=classify_legacy_status(lad_prob),
            riskBadge=get_vessel_risk_badge(lad_prob),
            anatomicalTerritory="Anterior left ventricular wall and interventricular septum",
            clinicalSummary=f"The model estimates {lad_pct}% probability of significant stenosis in the LAD territory.",
            keyDrivers=top_driver_names
        ),
        "LCX": VesselPrediction(
            id="LCX",
            name="LCX",
            fullName="Left Circumflex",
            probability=float(np.round(lcx_prob, 4)),
            percentage=lcx_pct,
            riskTier=classify_risk_tier(lcx_prob),
            status=classify_legacy_status(lcx_prob),
            riskBadge=get_vessel_risk_badge(lcx_prob),
            anatomicalTerritory="Posterolateral left ventricular myocardium and left atrium",
            clinicalSummary=f"The model estimates {lcx_pct}% probability of stenosis in the LCX branch.",
            keyDrivers=top_driver_names
        ),
        "RCA": VesselPrediction(
            id="RCA",
            name="RCA",
            fullName="Right Coronary Artery",
            probability=float(np.round(rca_prob, 4)),
            percentage=rca_pct,
            riskTier=classify_risk_tier(rca_prob),
            status=classify_legacy_status(rca_prob),
            riskBadge=get_vessel_risk_badge(rca_prob),
            anatomicalTerritory="Right ventricle, inferior diaphragmatic wall, and AV conduction tissue",
            clinicalSummary=f"The model estimates {rca_pct}% probability of stenosis in the RCA territory.",
            keyDrivers=top_driver_names
        ),
    }

    # Summary text
    if cad_prob >= 0.60:
        summary_text = f"The model predicts a higher probability of coronary artery disease ({cad_percentage}%) based on the clinical measurements."
    elif cad_prob >= 0.35:
        summary_text = f"The model estimates moderate probability of coronary artery disease ({cad_percentage}%) based on the clinical measurements."
    else:
        summary_text = f"The model predicts lower probability of coronary artery disease ({cad_percentage}%) within standard reference limits."

    clinical_insights = build_clinical_insights(cad_prob, raw_context)

    limitations = [
        "Predictions are generated from tabular clinical measurements and statistical machine learning models.",
        "This system does not perform physical angiography, CT coronary angiography, or diagnostic imaging.",
        "For clinical decision-support and educational purposes only; not a definitive medical diagnosis."
    ]

    disclaimer = "FOR DECISION SUPPORT AND EDUCATIONAL PURPOSES ONLY. NOT A SUBSTITUTE FOR FORMAL DIAGNOSTIC IMAGING."

    return PredictionResponse(
        id=prediction_id,
        timestamp=timestamp,
        overallCadProbability=cad_prob_rounded,
        overallCadPercentage=cad_percentage,
        overallRiskTier=overall_tier,
        modelConfidence=model_confidence,
        summaryText=summary_text,
        vessels=vessels,
        shapContributions=shap_contributions,
        clinicalInsights=clinical_insights,
        limitations=limitations,
        overall_cad_risk=cad_prob_rounded,
        overall_cad_status=overall_legacy_status,
        feature_importances=legacy_contributions,
        disclaimer=disclaimer
    )
