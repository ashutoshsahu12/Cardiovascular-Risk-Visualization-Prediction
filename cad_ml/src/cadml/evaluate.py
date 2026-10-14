"""Classification metrics, bootstrap confidence intervals and threshold selection."""
from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    accuracy_score, average_precision_score, balanced_accuracy_score, brier_score_loss,
    confusion_matrix, f1_score, matthews_corrcoef, precision_score, recall_score,
    roc_auc_score,
)


def classification_metrics(y, p, threshold: float = 0.5, pred=None) -> dict:
    """All metrics required by the brief (+ a few extras) at a given operating threshold."""
    y = np.asarray(y).astype(int)
    p = np.asarray(p, dtype=float)
    pred = (p >= threshold).astype(int) if pred is None else np.asarray(pred).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        "n": int(len(y)),
        "prevalence": float(y.mean()),
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y, pred)),
        "precision": float(precision_score(y, pred, zero_division=0)),
        "recall": float(recall_score(y, pred, zero_division=0)),          # sensitivity
        "specificity": float(tn / (tn + fp)) if (tn + fp) else float("nan"),
        "f1": float(f1_score(y, pred, zero_division=0)),
        "balanced_accuracy": float(balanced_accuracy_score(y, pred)),
        "mcc": float(matthews_corrcoef(y, pred)),
        "roc_auc": float(roc_auc_score(y, p)),
        "pr_auc": float(average_precision_score(y, p)),
        "brier": float(brier_score_loss(y, p)),
        "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn),
    }


def bootstrap_ci(y, p, threshold: float, n_boot: int = 2000, seed: int = 0,
                 metrics=("accuracy", "precision", "recall", "f1", "roc_auc")) -> dict:
    """Percentile 95 % bootstrap CI (resampling patients)."""
    rng = np.random.default_rng(seed)
    y = np.asarray(y).astype(int)
    p = np.asarray(p, dtype=float)
    store = {m: [] for m in metrics}
    for _ in range(n_boot):
        idx = rng.integers(0, len(y), len(y))
        if len(np.unique(y[idx])) < 2:
            continue
        m = classification_metrics(y[idx], p[idx], threshold)
        for k in metrics:
            store[k].append(m[k])
    return {k: [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))] for k, v in store.items()}


def threshold_grid(p, lo: float = 0.05, hi: float = 0.95, step: float = 0.005):
    return np.arange(lo, hi + 1e-9, step)


def select_thresholds(y, p) -> dict:
    """Derive operating points from (out-of-fold) probabilities.

    * ``f1``          - threshold maximising F1 (ties -> higher accuracy). Default operating point.
    * ``high_recall`` - highest threshold that still gives recall >= 0.90 (screening mode).
    * ``youden``      - maximises sensitivity + specificity - 1.
    * ``default``     - plain 0.5 for reference.
    """
    y = np.asarray(y).astype(int)
    p = np.asarray(p, dtype=float)
    best_f1 = (-1.0, -1.0, 0.5)
    best_j = (-2.0, 0.5)
    hr = None
    for t in threshold_grid(p):
        pred = (p >= t).astype(int)
        tp = ((pred == 1) & (y == 1)).sum(); fn = ((pred == 0) & (y == 1)).sum()
        fp = ((pred == 1) & (y == 0)).sum(); tn = ((pred == 0) & (y == 0)).sum()
        f1 = 2 * tp / max(2 * tp + fp + fn, 1)
        acc = (tp + tn) / len(y)
        rec = tp / max(tp + fn, 1)
        spec = tn / max(tn + fp, 1)
        if (f1, acc) > (best_f1[0], best_f1[1]):
            best_f1 = (f1, acc, float(t))
        if rec + spec - 1 > best_j[0]:
            best_j = (rec + spec - 1, float(t))
        if rec >= 0.90:
            hr = float(t)  # grid ascends -> keeps the highest threshold that still has recall>=.9
    return {"f1": best_f1[2], "youden": best_j[1], "high_recall": hr if hr is not None else best_f1[2], "default": 0.5}
