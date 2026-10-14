"""Inference API: validated patient dict -> calibrated CAD / LAD / LCX / RCA probabilities.

Member 2 (FastAPI) should only need::

    predictor = CADPredictor.load()
    result = predictor.predict(patient_dict)            # one patient
    frame  = predictor.to_frame([p1, p2])               # encoded features, e.g. for SHAP
    model  = predictor.get_target_model("LAD")          # .predict_proba_2d(frame) for SHAP/LIME
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable, Mapping

import joblib
import numpy as np
import pandas as pd

from . import config as C
from .data import LeakageError
from .models import TargetModel
from .schema import ID_TO_COLUMN, INPUT_COLUMNS, _SPEC, to_id

_TRUE = {"y", "yes", "true", "t", "1", "1.0"}
_FALSE = {"n", "no", "false", "f", "0", "0.0"}


class PatientValidationError(ValueError):
    """Raised with a list of human-readable problems (HTTP 422 material for the API)."""

    def __init__(self, problems: list[str]):
        super().__init__("; ".join(problems))
        self.problems = problems


def _is_missing(v) -> bool:
    if v is None:
        return True
    if isinstance(v, float) and math.isnan(v):
        return True
    return isinstance(v, str) and v.strip().lower() in ("", "nan")


def _resolve_key(key: str) -> str:
    k = str(key).strip()
    if k in C.LEAKAGE_COLUMNS or k.upper() in {c.upper() for c in C.LEAKAGE_COLUMNS}:
        raise LeakageError(f"'{key}' is a target/post-angiography field and must not be supplied as an input.")
    if k in _SPEC:
        return k
    if to_id(k) in ID_TO_COLUMN:
        return ID_TO_COLUMN[to_id(k)]
    if to_id(k) in ("bmi",):
        return "BMI"
    raise PatientValidationError([f"Unknown field '{key}'"])


def _binary(v, col, problems):
    s = str(v).strip().lower()
    if s in _TRUE:
        return 1.0
    if s in _FALSE:
        return 0.0
    problems.append(f"{col}: expected yes/no (Y/N, true/false, 1/0), got {v!r}")
    return np.nan


def encode_patient(p: Mapping, warnings: list[str] | None = None) -> tuple[dict, list[str]]:
    """Map one friendly patient dict to the 54 model features (NaN = not provided)."""
    problems: list[str] = []
    warnings = warnings if warnings is not None else []
    raw: dict = {}
    for k, v in p.items():
        raw[_resolve_key(k)] = v

    row: dict = {}
    missing: list[str] = []
    for col, (label, _g, kind, _u, lo, hi, options) in _SPEC.items():
        v = raw.get(col)
        if _is_missing(v):
            missing.append(col)
            if col == "BBB":
                row["LBBB"] = row["RBBB"] = np.nan
            else:
                row[col] = np.nan
            continue
        if kind in ("numeric", "ordinal"):
            try:
                x = float(v)
            except (TypeError, ValueError):
                problems.append(f"{col}: expected a number, got {v!r}")
                row[col] = np.nan
                continue
            if not (lo <= x <= hi):
                problems.append(f"{col}: {x} outside plausible range [{lo}, {hi}]")
            row[col] = x
        elif kind in ("binary", "yn"):
            row[col] = _binary(v, col, problems)
        elif col == "Sex":
            s = str(v).strip().lower()
            if s in ("male", "m"):
                row[col] = 1.0
            elif s in ("female", "fmale", "f"):
                row[col] = 0.0
            else:
                problems.append(f"Sex: expected Male/Female, got {v!r}")
                row[col] = np.nan
        elif col == "BBB":
            s = str(v).strip().upper()
            if s in ("N", "NONE", "NO"):
                row["LBBB"], row["RBBB"] = 0.0, 0.0
            elif s in ("LBBB", "RBBB"):
                row["LBBB"], row["RBBB"] = float(s == "LBBB"), float(s == "RBBB")
            else:
                problems.append(f"BBB: expected N/LBBB/RBBB, got {v!r}")
                row["LBBB"] = row["RBBB"] = np.nan
        elif col == "VHD":
            m = {"n": 0, "none": 0, "mild": 1, "moderate": 2, "severe": 3}
            s = str(v).strip().lower()
            if s in m:
                row[col] = float(m[s])
            else:
                problems.append(f"VHD: expected N/mild/Moderate/Severe, got {v!r}")
                row[col] = np.nan

    # derived BMI (exact formula of the dataset); fall back to a supplied BMI if weight/height missing
    w, l = row.get("Weight", np.nan), row.get("Length", np.nan)
    if not (np.isnan(w) or np.isnan(l)):
        row["BMI"] = w / ((l / 100.0) ** 2)
    elif not _is_missing(raw.get("BMI")):
        row["BMI"] = float(raw["BMI"])
    else:
        row["BMI"] = np.nan

    if problems:
        raise PatientValidationError(problems)
    row["_missing"] = missing
    return row, warnings


class CADPredictor:
    """Loads the four TargetModels and produces consistent, calibrated predictions."""

    def __init__(self, models: dict[str, TargetModel], manifest: dict):
        self.models = models
        self.manifest = manifest
        self.feature_names: list[str] = manifest["feature_names"]
        self.risk_bins: list[float] = manifest["risk_bins"]
        self.enforce_coherence: bool = manifest["coherence"]["enabled"]
        self._observed = manifest.get("observed_ranges", {})

    # ---- loading ----------------------------------------------------------------------
    @classmethod
    def load(cls, model_dir: str | Path = C.MODEL_DIR) -> "CADPredictor":
        model_dir = Path(model_dir)
        manifest = json.loads((model_dir / "manifest.json").read_text())
        models = {t: joblib.load(model_dir / f"{t}.joblib") for t in C.TARGET_NAMES}
        return cls(models, manifest)

    def get_target_model(self, target: str) -> TargetModel:
        return self.models[target]

    # ---- encoding ---------------------------------------------------------------------
    def to_frame(self, patients: Mapping | Iterable[Mapping]) -> pd.DataFrame:
        """Encode one or many patients into the exact (n, 54) feature frame the models expect."""
        if isinstance(patients, Mapping):
            patients = [patients]
        rows = []
        for p in patients:
            row, _ = encode_patient(p)
            row.pop("_missing")
            rows.append(row)
        return pd.DataFrame(rows).reindex(columns=self.feature_names)

    # ---- prediction -------------------------------------------------------------------
    def predict_frame(self, X: pd.DataFrame) -> pd.DataFrame:
        """Batch probabilities for an already-encoded frame (columns CAD, LAD, LCX, RCA)."""
        P = pd.DataFrame({t: self.models[t].predict_proba(X) for t in C.TARGET_NAMES}, index=X.index)
        P["CAD_model"] = P["CAD"]
        if self.enforce_coherence:
            P["CAD"] = P[["CAD", "LAD", "LCX", "RCA"]].max(axis=1)
        return P

    def _risk_level(self, p: float) -> str:
        lo, hi = self.risk_bins
        return "low" if p < lo else ("moderate" if p < hi else "high")

    def threshold_for(self, target: str) -> float:
        if target == "CAD" and self.enforce_coherence:
            return self.manifest["coherence"]["cad_threshold"]
        return self.models[target].threshold

    def predict(self, patient: Mapping) -> dict:
        row, warns = encode_patient(patient)
        missing = row.pop("_missing")
        X = pd.DataFrame([row]).reindex(columns=self.feature_names)

        for col, rng in self._observed.items():
            v = row.get(col)
            if v is not None and not np.isnan(v) and not (rng[0] <= v <= rng[1]):
                warns.append(f"{col}={v:g} lies outside the training range [{rng[0]:g}, {rng[1]:g}]; "
                             "prediction is an extrapolation.")
        completeness = 1.0 - len(missing) / len(INPUT_COLUMNS)
        low_conf = completeness < 0.75
        if low_conf:
            warns.append(f"LOW CONFIDENCE: only {completeness:.0%} of inputs provided. Missing values are filled with "
                         "training medians, so the output mostly reflects the dataset's average (high-CAD-prevalence) patient.")
        if missing:
            warns.append(f"{len(missing)} input(s) not provided and median-imputed: {', '.join(missing)}")

        P = self.predict_frame(X).iloc[0]
        probs = {t: float(P[t]) for t in C.TARGET_NAMES}
        labels = {t: int(probs[t] >= self.threshold_for(t)) for t in probs}
        return {
            "probabilities": probs,
            "labels": labels,
            "label_text": {t: ("CAD" if t == "CAD" else "Stenotic") if labels[t] else "Normal" for t in labels},
            "risk_levels": {t: self._risk_level(probs[t]) for t in probs},
            "thresholds": {t: float(self.threshold_for(t)) for t in probs},
            "cad_probability_before_coherence": float(P["CAD_model"]),
            "missing_inputs": missing,
            "input_completeness": round(completeness, 3),
            "low_confidence": bool(low_conf),
            "warnings": warns,
            "model_version": self.manifest["version"],
            "disclaimer": self.manifest["disclaimer"],
        }
