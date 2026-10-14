"""Leakage audit:  python -m cadml.audit   ->  artifacts/leakage_audit.json

Five independent checks:
 1. STATIC      model inputs (training matrix + saved models + manifest) contain no blocklisted column.
 2. PERMUTATION fit the same leak-free pipeline on label-shuffled targets; CV AUC must be ~0.5.
 3. SINGLE-FEATURE no individual input has a suspiciously 'perfect' AUC (would flag a hidden proxy).
 4. DUPLICATES  no exact duplicate patients (which could straddle train/test).
 5. COUNTER-EXAMPLE (for the report only) show what AUC we would get if leakage were allowed.
"""
from __future__ import annotations

import json

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict

from . import config as C
from .data import build_targets, drop_leakage, encode_features, load_dataset, load_raw
from .models import candidate_space


def run(n_perm: int = 30, out_dir=C.ARTIFACT_DIR) -> dict:
    X, Y = load_dataset(engineered=False)
    raw = load_raw()
    res: dict = {}

    # 1. static --------------------------------------------------------------------------
    static = {"training_matrix_overlap": sorted(set(X.columns) & C.LEAKAGE_COLUMNS)}
    mdir = C.MODEL_DIR
    for t in C.TARGET_NAMES:
        f = mdir / f"{t}.joblib"
        if f.exists():
            m = joblib.load(f)
            static[f"saved_model_{t}_overlap"] = sorted(set(m.feature_names) & C.LEAKAGE_COLUMNS)
    static["passed"] = all(len(v) == 0 for k, v in static.items() if k != "passed")
    res["1_static_column_check"] = static

    # 2. permutation test --------------------------------------------------------------------
    pipe = candidate_space()["lr_l2"][0].set_params(clf__C=0.1)
    cv = StratifiedKFold(5, shuffle=True, random_state=C.SEED)
    rng = np.random.default_rng(C.SEED)
    perm = {}
    for t in C.TARGET_NAMES:
        real = roc_auc_score(Y[t], cross_val_predict(pipe, X, Y[t], cv=cv, method="predict_proba")[:, 1])
        null = []
        for _ in range(n_perm):
            yp = pd.Series(rng.permutation(Y[t].values))
            null.append(roc_auc_score(yp, cross_val_predict(pipe, X, yp, cv=cv, method="predict_proba")[:, 1]))
        perm[t] = {"real_auc": round(real, 4), "permuted_mean_auc": round(float(np.mean(null)), 4),
                   "permuted_95th_pct": round(float(np.percentile(null, 95)), 4),
                   "empirical_p": round(float((np.sum(np.array(null) >= real) + 1) / (n_perm + 1)), 4)}
    perm["passed"] = all(abs(v["permuted_mean_auc"] - 0.5) < 0.05 for k, v in perm.items() if k != "passed")
    res["2_label_permutation"] = perm

    # 3. single-feature AUC -----------------------------------------------------------------------
    single = {}
    for t in C.TARGET_NAMES:
        aucs = {c: roc_auc_score(Y[t], X[c]) for c in X.columns if X[c].nunique() > 1}
        aucs = {c: max(a, 1 - a) for c, a in aucs.items()}
        top = sorted(aucs.items(), key=lambda kv: kv[1], reverse=True)[:5]
        single[t] = {"top5": [(c, round(a, 3)) for c, a in top]}
    single["max_single_feature_auc"] = max(v["top5"][0][1] for k, v in single.items() if k != "max_single_feature_auc")
    single["passed"] = single["max_single_feature_auc"] < 0.90
    res["3_single_feature_scan"] = single

    # 4. duplicates ----------------------------------------------------------------------------
    res["4_duplicates"] = {"exact_duplicate_rows": int(X.duplicated().sum()), "passed": int(X.duplicated().sum()) == 0}

    # 5. counter-example (NEVER used for training) ---------------------------------------------------
    leaky = X.copy()
    for c in ("LAD", "LCX", "RCA"):
        leaky[c] = (raw[c] == "Stenotic").astype(int)
    from sklearn.ensemble import RandomForestClassifier
    rf = RandomForestClassifier(200, random_state=0)
    p = cross_val_predict(rf, leaky, Y["CAD"], cv=cv, method="predict_proba")[:, 1]
    res["5_counter_example"] = {
        "note": "AUC for overall CAD if LAD/LCX/RCA were (wrongly) allowed as inputs - demonstrates why they are excluded",
        "cad_auc_with_vessel_labels": round(float(roc_auc_score(Y["CAD"], p)), 4),
        "cad_auc_leak_free_same_model": round(float(roc_auc_score(Y["CAD"], cross_val_predict(
            RandomForestClassifier(200, random_state=0), X, Y["CAD"], cv=cv, method="predict_proba")[:, 1])), 4)}

    res["overall_passed"] = all(res[k].get("passed", True) for k in res if isinstance(res[k], dict))
    (type(C.ARTIFACT_DIR)(out_dir) / "leakage_audit.json").write_text(json.dumps(res, indent=2))
    print(json.dumps(res, indent=2))
    return res


if __name__ == "__main__":
    run()
