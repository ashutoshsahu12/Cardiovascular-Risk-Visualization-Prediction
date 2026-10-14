"""End-to-end training:  python -m cadml.train [--n-iter 12] [--inner-repeats 2]

Protocol
--------
1. Leak-free feature matrix (LAD/LCX/RCA/Cath + all post-cath columns removed, hard-asserted).
2. Stratified LOCKED test split (20 %), never touched during any selection step.
3. DEV fit on the 80 % train part: per-target tuning of 7 model families with repeated stratified
   CV, soft-voting ensemble choice, Platt calibration, threshold selection (all on OOF predictions).
4. One-shot evaluation of the DEV models on the locked test set  -> unbiased performance estimate.
5. FINAL fit of the identical procedure on all 303 patients  -> deployed weights.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import platform
import time

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.model_selection import StratifiedShuffleSplit

from . import config as C
from .data import assert_no_leakage, load_dataset, load_raw
from .evaluate import bootstrap_ci, classification_metrics, select_thresholds
from .models import SearchConfig, fit_target
from .plots import calibration_figure, confusion_figure, metric_bars, roc_figure
from .schema import write_schema

DISCLAIMER = ("Predictions are for clinical decision support and educational purposes only. They are NOT a "
              "substitute for formal diagnostic imaging (e.g. invasive/CT coronary angiography) or clinical judgement.")
RISK_BINS = [0.33, 0.66]


def locked_split(X, Y, test_size=0.2, seed=C.SEED):
    strat = Y[["LAD", "LCX", "RCA"]].sum(axis=1)       # 0..3 stenotic vessels -> balances all 4 targets
    sss = StratifiedShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    tr, te = next(sss.split(X, strat))
    return np.sort(tr), np.sort(te)


def _strip(info: dict) -> dict:
    return {k: v for k, v in info.items() if not k.startswith("_")}


def main(n_iter=12, inner_repeats=2, quick=False, out_dir=C.ARTIFACT_DIR):
    t_start = time.time()
    out_dir = type(C.ARTIFACT_DIR)(out_dir)
    model_dir, fig_dir = out_dir / "models", out_dir / "figures"
    pred_dir = out_dir / "predictions"
    for d in (model_dir, fig_dir, pred_dir):
        d.mkdir(parents=True, exist_ok=True)

    X, Y = load_dataset(engineered=False)
    assert_no_leakage(X.columns)
    print(f"Features: {X.shape[1]}  | patients: {len(X)}  | leakage assertion passed", flush=True)

    tr, te = locked_split(X, Y)
    Xtr, Ytr, Xte, Yte = X.iloc[tr], Y.iloc[tr], X.iloc[te], Y.iloc[te]
    print(f"Locked split: train={len(tr)}  test={len(te)}", flush=True)
    cfg = SearchConfig(n_iter=n_iter, inner_repeats=inner_repeats,
                       families=["lr_l2", "rf"] if quick else None)

    # ------------------------------------------------------------- DEV fit + locked test
    dev, test_probs, oof_probs = {}, {}, {}
    for t in C.TARGET_NAMES:
        print(f"\n=== DEV fit: {t}", flush=True)
        dev[t] = fit_target(Xtr, Ytr[t], t, cfg)
        test_probs[t] = dev[t].predict_proba(Xte)
        oof_probs[t] = np.array(dev[t].info["_oof_mean"])

    # coherence: overall CAD must be >= every vessel (CAD == any stenotic vessel in this dataset)
    coh_oof = np.max([oof_probs[t] for t in C.TARGET_NAMES], axis=0)
    coh_thr = select_thresholds(Ytr["CAD"].values, coh_oof)["f1"]
    raw_m = classification_metrics(Ytr["CAD"], oof_probs["CAD"], dev["CAD"].threshold)
    coh_m = classification_metrics(Ytr["CAD"], coh_oof, coh_thr)
    adopt = (coh_m["f1"] >= raw_m["f1"] - 0.005) and (coh_m["roc_auc"] >= raw_m["roc_auc"] - 0.005)
    print(f"\nCoherence (CAD>=max vessel) OOF: raw F1={raw_m['f1']:.3f}/AUC={raw_m['roc_auc']:.3f}  "
          f"coherent F1={coh_m['f1']:.3f}/AUC={coh_m['roc_auc']:.3f}  -> adopt={adopt}", flush=True)

    report = {"protocol": {
        "n_patients": int(len(X)), "n_features": int(X.shape[1]), "n_train": int(len(tr)), "n_test": int(len(te)),
        "split": "stratified shuffle split, 80/20, stratified on number of stenotic vessels, seed 42",
        "model_families": list(dev["CAD"].info["families_cv_auc"]),
        "inner_cv": f"RepeatedStratifiedKFold(5 x {inner_repeats})", "random_search_iter": n_iter,
        "selection_metric": "ROC-AUC (OOF)", "threshold_rule": "maximise OOF F1 (ties -> accuracy)",
        "leakage_columns_excluded": sorted(C.LEAKAGE_COLUMNS)}}

    locked, dev_cv, sel = {}, {}, {}
    for t in C.TARGET_NAMES:
        m = dev[t]
        entry = {}
        for name, thr in (("f1_threshold", m.thresholds["f1"]), ("threshold_0.5", 0.5),
                          ("high_recall_threshold", m.thresholds["high_recall"])):
            entry[name] = classification_metrics(Yte[t], test_probs[t], thr)
        entry["ci95_at_f1_threshold"] = bootstrap_ci(Yte[t], test_probs[t], m.thresholds["f1"])
        locked[t] = entry
        dev_cv[t] = classification_metrics(Ytr[t], oof_probs[t], m.thresholds["f1"])
        sel[t] = _strip(m.info) | {"thresholds": m.thresholds}
    # coherent CAD on test
    coh_test = np.max([test_probs[t] for t in C.TARGET_NAMES], axis=0)
    report["coherence"] = {
        "rule": "P(CAD) = max(P_CAD_model, P_LAD, P_LCX, P_RCA)  (CAD is defined as >=50% stenosis in any vessel)",
        "adopted": bool(adopt), "dev_oof_raw": raw_m, "dev_oof_coherent": coh_m,
        "locked_test_raw": locked["CAD"]["f1_threshold"],
        "locked_test_coherent": classification_metrics(Yte["CAD"], coh_test, coh_thr)}
    report["locked_test"] = locked
    report["dev_cv_oof"] = dev_cv
    report["model_selection"] = sel

    # ---- figures for the locked test + dev OOF
    roc_figure(Yte, test_probs, fig_dir / "roc_locked_test.png", "ROC - locked test set (n=%d)" % len(te))
    roc_figure(Ytr, oof_probs, fig_dir / "roc_cv_oof.png", "ROC - repeated-CV out-of-fold (n=%d)" % len(tr))
    calibration_figure(Ytr, oof_probs, fig_dir / "calibration_cv_oof.png", "Reliability (out-of-fold, calibrated)")
    confusion_figure({t: locked[t]["f1_threshold"] for t in C.TARGET_NAMES}, fig_dir / "confusion_locked_test.png",
                     "Confusion matrices - locked test")
    metric_bars({t: locked[t]["f1_threshold"] for t in C.TARGET_NAMES}, fig_dir / "metrics_locked_test.png",
                "Locked test performance")
    pd.DataFrame({**{f"y_{t}": Yte[t].values for t in C.TARGET_NAMES},
                  **{f"p_{t}": test_probs[t] for t in C.TARGET_NAMES}}, index=Xte.index
                 ).to_csv(pred_dir / "locked_test_predictions.csv", index_label="row")
    pd.DataFrame({**{f"y_{t}": Ytr[t].values for t in C.TARGET_NAMES},
                  **{f"p_{t}": oof_probs[t] for t in C.TARGET_NAMES}}, index=Xtr.index
                 ).to_csv(pred_dir / "dev_oof_predictions.csv", index_label="row")

    # ------------------------------------------------------------- FINAL fit on all data
    final = {}
    for t in C.TARGET_NAMES:
        print(f"\n=== FINAL fit (all {len(X)} patients): {t}", flush=True)
        final[t] = fit_target(X, Y[t], t, cfg)
        joblib.dump(final[t], model_dir / f"{t}.joblib", compress=3)
    all_oof = {t: np.array(final[t].info["_oof_mean"]) for t in C.TARGET_NAMES}
    final_coh_thr = select_thresholds(Y["CAD"].values, np.max([all_oof[t] for t in C.TARGET_NAMES], axis=0))["f1"]
    report["final_model_cv_oof_all_data"] = {
        t: classification_metrics(Y[t], all_oof[t], final[t].thresholds["f1"]) for t in C.TARGET_NAMES}
    report["final_model_selection"] = {t: _strip(final[t].info) | {"thresholds": final[t].thresholds}
                                       for t in C.TARGET_NAMES}
    roc_figure(Y, all_oof, fig_dir / "roc_final_all_data_oof.png", "ROC - final procedure, OOF on all 303 patients")

    raw = load_raw()
    schema = write_schema(raw, out_dir / "feature_schema.json")
    X.sample(100, random_state=C.SEED).to_csv(out_dir / "background_sample.csv", index=False)
    manifest = {
        "version": "1.0.0", "trained_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "feature_names": list(X.columns), "targets": C.TARGET_NAMES, "risk_bins": RISK_BINS,
        "coherence": {"enabled": bool(adopt), "cad_threshold": float(final_coh_thr),
                      "rule": report["coherence"]["rule"]},
        "thresholds": {t: final[t].thresholds for t in C.TARGET_NAMES},
        "selected_models": {t: final[t].info["selected"] for t in C.TARGET_NAMES},
        "observed_ranges": {c: [float(X[c].min()), float(X[c].max())] for c in X.columns
                            if c in {s["column"] for s in schema if s["kind"] in ("numeric", "ordinal")} or c == "BMI"},
        "disclaimer": DISCLAIMER,
        "environment": {"python": platform.python_version(), "scikit-learn": sklearn.__version__,
                        "numpy": np.__version__, "pandas": pd.__version__},
    }
    (model_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    report["runtime_minutes"] = round((time.time() - t_start) / 60, 1)
    (out_dir / "metrics.json").write_text(json.dumps(report, indent=2))
    print(f"\nDone in {report['runtime_minutes']} min. Artifacts -> {out_dir}", flush=True)
    return report


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n-iter", type=int, default=12)
    ap.add_argument("--inner-repeats", type=int, default=2)
    ap.add_argument("--quick", action="store_true", help="tiny search for smoke tests")
    ap.add_argument("--out-dir", default=str(C.ARTIFACT_DIR))
    a = ap.parse_args()
    main(a.n_iter, a.inner_repeats, a.quick, a.out_dir)
