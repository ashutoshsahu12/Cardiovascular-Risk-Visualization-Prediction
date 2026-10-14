import shap
import pandas as pd
import numpy as np
from typing import List
from app.schemas import FeatureContribution

def compute_raw_shap_values(model, input_df: pd.DataFrame) -> np.ndarray:
    """
    Computes raw TreeSHAP values for single sample inference (CAD target class).
    """
    explainer = shap.Explainer(model)
    shap_values = explainer(input_df)

    vals = shap_values.values[0]
    if len(vals.shape) > 1:  # Handle binary classifier output dimension
        vals = vals[:, 1]
    return vals

def compute_shap_explanations(model, input_df: pd.DataFrame) -> List[FeatureContribution]:
    """
    Computes legacy SHAP feature attributions for a single patient inference request.
    Preserved for backward compatibility.
    """
    vals = compute_raw_shap_values(model, input_df)
    feature_names = input_df.columns
    contributions = []

    for name, shap_val, val in zip(feature_names, vals, input_df.iloc[0]):
        contributions.append(
            FeatureContribution(
                feature=name,
                impact_score=float(np.round(shap_val, 4)),
                patient_value=float(val)
            )
        )

    # Sort features by absolute impact descending
    contributions.sort(key=lambda x: abs(x.impact_score), reverse=True)
    return contributions