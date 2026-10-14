"""Nested cross-validation of the COMPLETE procedure (tuning + ensemble choice + calibration + threshold).

    python -m cadml.nested_cv [--outer 5] [--n-iter 6] [--inner-repeats 1]

For each outer fold the whole of ``fit_target`` is re-run on the outer-train part only; the outer-test
fold is scored once with the threshold chosen on the outer-train OOF predictions. Every patient is
predicted exactly once by a model that never saw them. This is the most honest estimate we can give
for n=303 and is what the headline numbers in the report should cite.
"""
from __future__ import annotations

import argparse
import json
import time

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold

from . import config as C
from .data import load_dataset
from .evaluate import bootstrap_ci, classification_metrics, select_thresholds
from .models import SearchConfig, fit_target
from .plots import calibration_figure, metric_bars, roc_figure


def main(n_outer=5, n_iter=6, inner_repeats=1, seed=C.SEED, out_dir=C.ARTIFACT_DIR, outer_repeats=1):
    t0 = time.time()
    X, Y = load_dataset(engineered=False)
    strat = Y[["LAD", "LCX", "RCA"]].sum(axis=1)
    cfg = SearchConfig(n_iter=n_iter, inner_repeats=inner_repeats, verbose=False)

    allres = []
    for rep in range(outer_repeats):
        P = {t: np.zeros(len(X)) for t in C.TARGET_NAMES}
        Pcoh = np.zeros(len(X))
        L = {t: np.zeros(len(X), dtype=int) for t in C.TARGET_NAMES}
        Lcoh = np.zeros(len(X), dtype=int)
        folds = []
        skf = StratifiedKFold(n_outer, shuffle=True, random_state=seed + rep)
        for k, (tr, te) in enumerate(skf.split(X, strat)):
            Xtr, Xte = X.iloc[tr], X.iloc[te]
            models, oofs = {}, {}
            for t in C.TARGET_NAMES:
                m = fit_target(Xtr, Y[t].iloc[tr], t, cfg)
                models[t] = m
                oofs[t] = np.array(m.info["_oof_mean"])
                P[t][te] = m.predict_proba(Xte)
                L[t][te] = (P[t][te] >= m.threshold).astype(int)
            coh_thr = select_thresholds(Y["CAD"].iloc[tr].values, np.max([oofs[t] for t in C.TARGET_NAMES], axis=0))["f1"]
            Pcoh[te] = np.max([P[t][te] for t in C.TARGET_NAMES], axis=0)
            Lcoh[te] = (Pcoh[te] >= coh_thr).astype(int)
            fm = {t: classification_metrics(Y[t].iloc[te], P[t][te], models[t].threshold) for t in C.TARGET_NAMES}
            folds.append(fm)
            print(f"[rep {rep} fold {k}] " + "  ".join(f"{t}: AUC={fm[t]['roc_auc']:.3f} acc={fm[t]['accuracy']:.3f}"
                                                       for t in C.TARGET_NAMES) + f"   ({(time.time()-t0)/60:.1f} min)", flush=True)
        pooled = {t: classification_metrics(Y[t], P[t], 0.5, pred=L[t]) for t in C.TARGET_NAMES}
        pooled_coh = classification_metrics(Y["CAD"], Pcoh, 0.5, pred=Lcoh)
        allres.append({"pooled": pooled, "pooled_cad_coherent": pooled_coh, "folds": folds, "P": P, "Pcoh": Pcoh, "L": L})

    # aggregate over outer repeats
    summary = {}
    keys = ["accuracy", "precision", "recall", "specificity", "f1", "roc_auc", "pr_auc", "brier", "balanced_accuracy", "mcc"]
    for t in C.TARGET_NAMES:
        summary[t] = {k: float(np.mean([r["pooled"][t][k] for r in allres])) for k in keys}
        fold_vals = [f[t] for r in allres for f in r["folds"]]
        summary[t]["fold_sd"] = {k: float(np.std([f[k] for f in fold_vals], ddof=1)) for k in ("accuracy", "f1", "recall", "roc_auc")}
        pr = allres[0]
        ci = bootstrap_ci(Y[t].values, pr["P"][t], 0.5, metrics=("roc_auc",))["roc_auc"]
        accs = []
        rng = np.random.default_rng(0)
        for _ in range(2000):
            idx = rng.integers(0, len(Y), len(Y))
            accs.append((pr["L"][t][idx] == Y[t].values[idx]).mean())
        summary[t]["roc_auc_ci95"] = ci
        summary[t]["accuracy_ci95"] = [float(np.percentile(accs, 2.5)), float(np.percentile(accs, 97.5))]
    summary["CAD_coherent"] = {k: float(np.mean([r["pooled_cad_coherent"][k] for r in allres])) for k in keys}

    out = {"protocol": {"outer_folds": n_outer, "outer_repeats": outer_repeats, "inner_cv": f"5x{inner_repeats}",
                        "random_search_iter": n_iter, "n_patients": int(len(X)),
                        "note": "Entire selection procedure re-run inside every outer fold; thresholds from inner OOF."},
           "nested_cv": summary, "runtime_minutes": round((time.time() - t0) / 60, 1)}
    out_dir = type(C.ARTIFACT_DIR)(out_dir)
    (out_dir / "nested_cv_metrics.json").write_text(json.dumps(out, indent=2))
    P0 = allres[0]["P"]
    roc_figure(Y, P0, out_dir / "figures" / "roc_nested_cv.png", "ROC - nested CV (n=303, each patient scored once)")
    calibration_figure(Y, P0, out_dir / "figures" / "calibration_nested_cv.png", "Reliability - nested CV")
    metric_bars({t: summary[t] for t in C.TARGET_NAMES}, out_dir / "figures" / "metrics_nested_cv.png", "Nested-CV performance")
    pd.DataFrame({**{f"y_{t}": Y[t] for t in C.TARGET_NAMES}, **{f"p_{t}": P0[t] for t in C.TARGET_NAMES}}
                 ).to_csv(out_dir / "predictions" / "nested_cv_predictions.csv", index_label="row")
    print(json.dumps({t: {k: round(v, 3) for k, v in summary[t].items() if isinstance(v, float)} for t in summary}, indent=1))
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--outer", type=int, default=5)
    ap.add_argument("--n-iter", type=int, default=6)
    ap.add_argument("--inner-repeats", type=int, default=1)
    ap.add_argument("--outer-repeats", type=int, default=1)
    a = ap.parse_args()
    main(a.outer, a.n_iter, a.inner_repeats, outer_repeats=a.outer_repeats)
