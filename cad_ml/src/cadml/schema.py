"""Patient-input schema: single source of truth for the API (Member 2) and the form (Member 4).

Each entry: column (dataset name), id (snake_case), label, group, kind, unit, hard limits
(clinical plausibility, for validation) and observed training range (for extrapolation warnings).
"""
from __future__ import annotations

import json
import re

import pandas as pd

from . import config as C

YN = ["Y", "N"]

# column: (label, group, kind, unit, hard_min, hard_max, options)
_SPEC = {
    # --- demographics -------------------------------------------------------------------
    "Age": ("Age", "Demographics", "numeric", "years", 18, 110, None),
    "Sex": ("Sex", "Demographics", "categorical", None, None, None, ["Male", "Female"]),
    "Weight": ("Weight", "Demographics", "numeric", "kg", 30, 250, None),
    "Length": ("Height", "Demographics", "numeric", "cm", 100, 230, None),
    # --- history / risk factors -----------------------------------------------------------
    "DM": ("Diabetes mellitus", "History & risk factors", "binary", None, 0, 1, None),
    "HTN": ("Hypertension", "History & risk factors", "binary", None, 0, 1, None),
    "Current Smoker": ("Current smoker", "History & risk factors", "binary", None, 0, 1, None),
    "EX-Smoker": ("Ex-smoker", "History & risk factors", "binary", None, 0, 1, None),
    "FH": ("Family history of CAD", "History & risk factors", "binary", None, 0, 1, None),
    "CRF": ("Chronic renal failure", "History & risk factors", "yn", None, None, None, YN),
    "CVA": ("Prior stroke (CVA)", "History & risk factors", "yn", None, None, None, YN),
    "Airway disease": ("Airway disease", "History & risk factors", "yn", None, None, None, YN),
    "Thyroid Disease": ("Thyroid disease", "History & risk factors", "yn", None, None, None, YN),
    "CHF": ("Congestive heart failure", "History & risk factors", "yn", None, None, None, YN),
    "DLP": ("Dyslipidaemia", "History & risk factors", "yn", None, None, None, YN),
    # --- vitals / examination ------------------------------------------------------------
    "BP": ("Systolic blood pressure", "Vitals & examination", "numeric", "mmHg", 50, 260, None),
    "PR": ("Pulse rate", "Vitals & examination", "numeric", "bpm", 30, 200, None),
    "Edema": ("Edema", "Vitals & examination", "binary", None, 0, 1, None),
    "Weak Peripheral Pulse": ("Weak peripheral pulse", "Vitals & examination", "yn", None, None, None, YN),
    "Lung rales": ("Lung rales", "Vitals & examination", "yn", None, None, None, YN),
    "Systolic Murmur": ("Systolic murmur", "Vitals & examination", "yn", None, None, None, YN),
    "Diastolic Murmur": ("Diastolic murmur", "Vitals & examination", "yn", None, None, None, YN),
    # --- symptoms -------------------------------------------------------------------------
    "Typical Chest Pain": ("Typical chest pain", "Symptoms", "binary", None, 0, 1, None),
    "Dyspnea": ("Dyspnea", "Symptoms", "yn", None, None, None, YN),
    "Function Class": ("Functional class (NYHA 0-3)", "Symptoms", "ordinal", None, 0, 3, None),
    "Atypical": ("Atypical chest pain", "Symptoms", "yn", None, None, None, YN),
    "Nonanginal": ("Non-anginal chest pain", "Symptoms", "yn", None, None, None, YN),
    "LowTH Ang": ("Low-threshold angina", "Symptoms", "yn", None, None, None, YN),
    # --- ECG ---------------------------------------------------------------------------------
    "Q Wave": ("Q wave", "ECG", "binary", None, 0, 1, None),
    "St Elevation": ("ST elevation", "ECG", "binary", None, 0, 1, None),
    "St Depression": ("ST depression", "ECG", "binary", None, 0, 1, None),
    "Tinversion": ("T-wave inversion", "ECG", "binary", None, 0, 1, None),
    "LVH": ("Left ventricular hypertrophy", "ECG", "yn", None, None, None, YN),
    "Poor R Progression": ("Poor R-wave progression", "ECG", "yn", None, None, None, YN),
    "BBB": ("Bundle branch block", "ECG", "categorical", None, None, None, ["N", "LBBB", "RBBB"]),
    # --- laboratory -----------------------------------------------------------------------
    "FBS": ("Fasting blood sugar", "Laboratory", "numeric", "mg/dL", 30, 800, None),
    "CR": ("Creatinine", "Laboratory", "numeric", "mg/dL", 0.1, 15, None),
    "TG": ("Triglycerides", "Laboratory", "numeric", "mg/dL", 10, 2500, None),
    "LDL": ("LDL cholesterol", "Laboratory", "numeric", "mg/dL", 10, 500, None),
    "HDL": ("HDL cholesterol", "Laboratory", "numeric", "mg/dL", 5, 200, None),
    "BUN": ("Blood urea nitrogen", "Laboratory", "numeric", "mg/dL", 2, 200, None),
    "ESR": ("Erythrocyte sedimentation rate", "Laboratory", "numeric", "mm/h", 0, 150, None),
    "HB": ("Haemoglobin", "Laboratory", "numeric", "g/dL", 3, 25, None),
    "K": ("Potassium", "Laboratory", "numeric", "mEq/L", 1.5, 9, None),
    "Na": ("Sodium", "Laboratory", "numeric", "mEq/L", 100, 180, None),
    "WBC": ("White blood cells", "Laboratory", "numeric", "cells/mL", 500, 60000, None),
    "Lymph": ("Lymphocytes", "Laboratory", "numeric", "%", 0, 100, None),
    "Neut": ("Neutrophils", "Laboratory", "numeric", "%", 0, 100, None),
    "PLT": ("Platelets", "Laboratory", "numeric", "x10^3/mL", 10, 1500, None),
    # --- echocardiography ---------------------------------------------------------------
    "EF-TTE": ("Ejection fraction (TTE)", "Echocardiography", "numeric", "%", 5, 80, None),
    "Region RWMA": ("Regions with wall-motion abnormality (0-4)", "Echocardiography", "ordinal", None, 0, 4, None),
    "VHD": ("Valvular heart disease", "Echocardiography", "categorical", None, None, None,
            ["N", "mild", "Moderate", "Severe"]),
}


def to_id(col: str) -> str:
    return re.sub(r"[^0-9a-z]+", "_", col.lower()).strip("_")


ID_TO_COLUMN = {to_id(c): c for c in _SPEC}
INPUT_COLUMNS = list(_SPEC)          # 52 user-entered fields (BMI is derived from Weight & Length)


def build_schema(raw: pd.DataFrame) -> list[dict]:
    """Attach defaults (training median / mode) and observed ranges to the static spec."""
    out = []
    for col, (label, group, kind, unit, lo, hi, options) in _SPEC.items():
        s = raw[col]
        entry = {"id": to_id(col), "column": col, "label": label, "group": group, "kind": kind,
                 "unit": unit, "required": False}
        if kind in ("numeric", "binary", "ordinal"):
            entry.update(hard_min=lo, hard_max=hi, observed_min=float(s.min()), observed_max=float(s.max()),
                         default=float(s.median()))
        else:
            entry.update(options=options, default=str(s.mode().iloc[0]))
        out.append(entry)
    return out


def write_schema(raw: pd.DataFrame, path) -> list[dict]:
    schema = build_schema(raw)
    with open(path, "w") as f:
        json.dump({"inputs": schema, "derived": [{"id": "bmi", "label": "BMI", "unit": "kg/m^2",
                   "formula": "Weight / (Height/100)^2"}],
                   "forbidden_inputs": sorted(C.LEAKAGE_COLUMNS)}, f, indent=2)
    return schema
