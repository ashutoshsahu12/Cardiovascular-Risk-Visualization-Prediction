"""Data loading, cleaning, encoding and the hard leakage guard."""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import config as C


class LeakageError(RuntimeError):
    """Raised when a forbidden (post-angiography / label) column reaches the model inputs."""


def load_raw(path=C.DATA_PATH) -> pd.DataFrame:
    """Read the populated sheet (the second sheet in the workbook only holds an empty schema)."""
    df = pd.read_excel(path, sheet_name=0)
    df.columns = [c.strip() for c in df.columns]
    return df


def build_targets(df: pd.DataFrame) -> pd.DataFrame:
    """Return a 0/1 DataFrame with columns CAD, LAD, LCX, RCA."""
    out = {}
    for name, (col, positive) in C.TARGETS.items():
        out[name] = (df[col].astype(str).str.strip() == positive).astype(int)
    return pd.DataFrame(out, index=df.index)


def assert_no_leakage(columns) -> None:
    """Hard guard: raise if any label / post-cath column is among the model input columns."""
    bad = sorted(set(columns) & C.LEAKAGE_COLUMNS)
    if bad:
        raise LeakageError(f"Target-leakage columns present in model inputs: {bad}")


def drop_leakage(df: pd.DataFrame) -> pd.DataFrame:
    """Remove every blocklisted column and verify the result."""
    X = df.drop(columns=[c for c in df.columns if c in C.LEAKAGE_COLUMNS])
    assert_no_leakage(X.columns)
    return X


def encode_features(X: pd.DataFrame) -> pd.DataFrame:
    """Deterministic, row-wise encoding (no statistics learned => safe to apply before CV)."""
    X = X.copy()
    assert_no_leakage(X.columns)
    X = X.drop(columns=[c for c in X.columns if c in C.REDUNDANT_COLUMNS])

    if "Sex" in X:
        X["Sex"] = X["Sex"].astype(str).str.strip().map(C.SEX_MAP)
    for c in C.BINARY_YN_COLUMNS:
        if c in X:
            X[c] = X[c].astype(str).str.strip().str.upper().map({"Y": 1, "N": 0})
    if "BBB" in X:  # N / LBBB / RBBB  ->  two indicator columns
        bbb = X.pop("BBB").astype(str).str.strip().str.upper()
        X["LBBB"] = (bbb == "LBBB").astype(int)
        X["RBBB"] = (bbb == "RBBB").astype(int)
    if "VHD" in X:
        X["VHD"] = X["VHD"].astype(str).str.strip().str.capitalize().map(
            {k.capitalize(): v for k, v in C.VHD_MAP.items()}
        )
    return X.astype(float)


def add_engineered_features(X: pd.DataFrame) -> pd.DataFrame:
    """Clinically motivated ratios. Purely row-wise => no leakage across samples."""
    X = X.copy()
    eps = 1e-6
    if {"Weight", "Length"} <= set(X.columns):
        X["BMI"] = X["Weight"] / ((X["Length"] / 100.0) ** 2)
    if {"LDL", "HDL"} <= set(X.columns):
        X["LDL_HDL_ratio"] = X["LDL"] / (X["HDL"] + eps)
    if {"TG", "HDL"} <= set(X.columns):
        X["TG_HDL_ratio"] = X["TG"] / (X["HDL"] + eps)
    if {"Neut", "Lymph"} <= set(X.columns):
        X["NLR"] = X["Neut"] / (X["Lymph"] + eps)
    return X


def load_dataset(engineered: bool = False):
    """Return (X, Y) where X is leak-free numeric features and Y the 4 binary targets."""
    raw = load_raw()
    Y = build_targets(raw)
    X = encode_features(drop_leakage(raw))
    if engineered:
        X = add_engineered_features(X)
    assert_no_leakage(X.columns)
    assert X.isna().sum().sum() == 0, "Unexpected NaNs after encoding"
    return X, Y
