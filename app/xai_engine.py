import shap
import pandas as pd
import numpy as np
from typing import List
from app.schemas import FeatureContribution

def compute_shap_explanations(model, input_df: pd.DataFrame) -> List[FeatureContribution]:
    """
    Computes SHAP feature attributions for a single patient inference request.
    """
    # Use TreeExplainer for tree models (e.g. XGBoost/RandomForest) or KernelExplainer
    explainer = shap.Explainer(model)
    shap_values = explainer(input_df)

    # Convert values for single prediction sample
    vals = shap_values.values[0]
    if len(vals.shape) > 1:  # Handle multi-class / probability output
        vals = vals[:, 1]

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