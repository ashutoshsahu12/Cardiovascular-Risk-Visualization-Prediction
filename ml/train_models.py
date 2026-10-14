"""
CardioVision AI - Clinical ML Training Pipeline
Dataset: Z-Alizadeh Sani Cardiovascular Disease Dataset (303 patients, 59 attributes)
Targets:
  1. Overall CAD (Cath: CAD vs Normal)
  2. LAD (Left Anterior Descending Stenosis >= 50%)
  3. LCX (Left Circumflex Stenosis >= 50%)
  4. RCA (Right Coronary Artery Stenosis >= 50%)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/z_alizadeh_sani.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")

def load_and_preprocess_dataset(data_path: str):
    """
    Loads genuine Z-Alizadeh Sani dataset and constructs the non-invasive
    clinical feature matrix matching backend PatientDataInput schema.
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Clinical dataset not found at {data_path}. Ensure data acquisition step succeeded.")

    df = pd.read_csv(data_path)
    print(f"Loaded dataset: {len(df)} patient rows, {len(df.columns)} columns.")

    # 1. Non-invasive feature extraction matching app/schemas.py:PatientDataInput
    # Feature 1: Age (years)
    age = df['Age'].astype(float)

    # Feature 2: Systolic Blood Pressure (mmHg)
    bp = df['BP'].astype(float)

    # Feature 3: Pulse Rate (bpm)
    pulse_rate = df['PR'].astype(float)

    # Feature 4: Total Cholesterol (mg/dL) via Friedewald calculation (HDL + LDL + TG/5)
    cholesterol = (df['HDL'].astype(float) + df['LDL'].astype(float) + (df['TG'].astype(float) / 5.0))

    # Feature 5: ST Elevation (0 or 1)
    st_elevation = df['St Elevation'].astype(int)

    # Feature 6: T Wave Inversion (0 or 1)
    t_inversion = df['Tinversion'].astype(int)

    # Feature 7: Left Ventricular Hypertrophy (0 or 1)
    lvh = (df['LVH'].astype(str).str.strip().str.upper() == 'Y').astype(int)

    # Feature 8: Regional Wall Motion Abnormality (0 if none, 1 if >= 1 defective region)
    rwma = (df['Region RWMA'].astype(int) > 0).astype(int)

    feature_df = pd.DataFrame({
        'age': age,
        'bp': bp,
        'pulse_rate': pulse_rate,
        'cholesterol': cholesterol,
        'st_elevation': st_elevation,
        't_inversion': t_inversion,
        'lvh': lvh,
        'rwma': rwma
    })

    # 2. Target extraction with strict binary encoding (1: Disease/Stenosis, 0: Normal)
    targets = {
        'cad': (df['Cath'].astype(str).str.strip().str.upper() == 'CAD').astype(int),
        'lad': (df['LAD'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int),
        'lcx': (df['LCX'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int),
        'rca': (df['RCA'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int),
    }

    return feature_df, targets

def train_and_evaluate_target(X_scaled: np.ndarray, y: pd.Series, target_name: str, n_splits: int = 5):
    """
    Evaluates model performance using Stratified 5-Fold Cross-Validation,
    then trains the final model on all data.
    """
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    oof_preds = np.zeros(len(y))
    oof_probs = np.zeros(len(y))

    # Hyperparameters regularized for small N=303 cohort to prevent memorization
    clf_config = {
        'n_estimators': 120,
        'max_depth': 4,
        'min_samples_split': 6,
        'min_samples_leaf': 3,
        'max_features': 'sqrt',
        'class_weight': 'balanced',
        'random_state': 42
    }

    for train_idx, val_idx in skf.split(X_scaled, y):
        X_train, X_val = X_scaled.iloc[train_idx], X_scaled.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        fold_clf = RandomForestClassifier(**clf_config)
        fold_clf.fit(X_train, y_train)

        probs = fold_clf.predict_proba(X_val)[:, 1]
        preds = (probs >= 0.50).astype(int)

        oof_probs[val_idx] = probs
        oof_preds[val_idx] = preds

    # Calculate validation metrics on Out-Of-Fold predictions
    metrics = {
        'accuracy': round(float(accuracy_score(y, oof_preds)), 4),
        'balanced_accuracy': round(float(balanced_accuracy_score(y, oof_preds)), 4),
        'precision': round(float(precision_score(y, oof_preds, zero_division=0)), 4),
        'recall_sensitivity': round(float(recall_score(y, oof_preds)), 4),
        'f1_score': round(float(f1_score(y, oof_preds)), 4),
        'roc_auc': round(float(roc_auc_score(y, oof_probs)), 4),
        'positive_prevalence': round(float(y.mean()), 4),
        'total_samples': int(len(y)),
        'positive_count': int(y.sum()),
        'negative_count': int((1 - y).sum()),
        'confusion_matrix': confusion_matrix(y, oof_preds).tolist()
    }

    # Fit final production model on full scaled feature set
    final_model = RandomForestClassifier(**clf_config)
    final_model.fit(X_scaled, y)

    return final_model, metrics

def run_pipeline():
    print("=" * 60)
    print(" CardioVision AI — Clinical Machine Learning Training Pipeline")
    print("=" * 60)

    os.makedirs(MODELS_DIR, exist_ok=True)

    # 1. Load and process dataset
    X, targets = load_and_preprocess_dataset(DATA_PATH)
    print(f"\nFeature Matrix X: {X.shape[0]} rows, {X.shape[1]} features.")
    print(f"Features: {list(X.columns)}")

    # 2. Fit StandardScaler on non-invasive features
    scaler = StandardScaler().fit(X)
    X_scaled = pd.DataFrame(scaler.transform(X), columns=X.columns)
    scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"Saved feature scaler -> {scaler_path}")

    # 3. Train models for all 4 targets (Strict Target Leakage Prevention)
    all_metrics = {}

    for target_key in ['cad', 'lad', 'lcx', 'rca']:
        y = targets[target_key]
        print(f"\nTraining model for Target: {target_key.upper()} (Pos: {y.sum()} / Neg: {(1 - y).sum()})...")
        
        model, metrics = train_and_evaluate_target(X_scaled, y, target_key)
        all_metrics[target_key] = metrics

        model_path = os.path.join(MODELS_DIR, f"{target_key}_model.joblib")
        joblib.dump(model, model_path)
        print(f"  -> Saved {model_path}")
        print(f"  -> ROC-AUC: {metrics['roc_auc']:.4f} | Recall: {metrics['recall_sensitivity']:.4f} | F1: {metrics['f1_score']:.4f}")

    # 4. Save validation metrics report
    report_path = os.path.join(MODELS_DIR, "metrics_report.json")
    with open(report_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\nSaved comprehensive validation report -> {report_path}")

    print("\n" + "=" * 60)
    print(" TRAINING SUMMARY & METRICS ACROSS 5-FOLD CV:")
    print("=" * 60)
    for k, v in all_metrics.items():
        print(f"{k.upper():5} | ROC-AUC: {v['roc_auc']:.4f} | Bal. Acc: {v['balanced_accuracy']:.4f} | F1: {v['f1_score']:.4f} | Pos: {v['positive_count']}/{v['total_samples']}")
    print("=" * 60)

if __name__ == "__main__":
    run_pipeline()
