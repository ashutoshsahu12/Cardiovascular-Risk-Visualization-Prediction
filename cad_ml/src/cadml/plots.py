"""Figures for the report (ROC, calibration, confusion matrices, metric bars)."""
from __future__ import annotations

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.metrics import roc_curve

from . import config as C

COL = {"CAD": "#1f4e79", "LAD": "#c0392b", "LCX": "#e67e22", "RCA": "#27ae60"}


def roc_figure(Y, probs: dict, path, title: str):
    fig, ax = plt.subplots(figsize=(5.6, 5.2))
    for t in C.TARGET_NAMES:
        fpr, tpr, _ = roc_curve(Y[t], probs[t])
        from sklearn.metrics import roc_auc_score
        ax.plot(fpr, tpr, color=COL[t], lw=2, label=f"{t} (AUC {roc_auc_score(Y[t], probs[t]):.3f})")
    ax.plot([0, 1], [0, 1], "k--", lw=1)
    ax.set(xlabel="False-positive rate", ylabel="True-positive rate", title=title)
    ax.legend(loc="lower right"); ax.grid(alpha=.3)
    fig.tight_layout(); fig.savefig(path, dpi=160); plt.close(fig)


def calibration_figure(Y, probs: dict, path, title: str):
    fig, axes = plt.subplots(1, 4, figsize=(15, 3.8), sharey=True)
    for ax, t in zip(axes, C.TARGET_NAMES):
        fr, mp = calibration_curve(Y[t], probs[t], n_bins=6, strategy="quantile")
        ax.plot([0, 1], [0, 1], "k--", lw=1)
        ax.plot(mp, fr, "o-", color=COL[t], lw=2)
        ax.set(title=t, xlabel="Predicted probability")
        ax.grid(alpha=.3)
    axes[0].set_ylabel("Observed frequency")
    fig.suptitle(title); fig.tight_layout(); fig.savefig(path, dpi=160); plt.close(fig)


def confusion_figure(metrics: dict, path, title: str):
    fig, axes = plt.subplots(1, 4, figsize=(14, 3.6))
    for ax, t in zip(axes, C.TARGET_NAMES):
        m = metrics[t]
        cm = np.array([[m["tn"], m["fp"]], [m["fn"], m["tp"]]])
        ax.imshow(cm, cmap="Blues")
        for (i, j), v in np.ndenumerate(cm):
            ax.text(j, i, int(v), ha="center", va="center", fontsize=14,
                    color="white" if v > cm.max() / 2 else "black")
        ax.set(xticks=[0, 1], yticks=[0, 1], xticklabels=["Normal", "Pos"], yticklabels=["Normal", "Pos"],
               xlabel="Predicted", title=f"{t}  (thr={m['threshold']:.2f})")
    axes[0].set_ylabel("Actual")
    fig.suptitle(title); fig.tight_layout(); fig.savefig(path, dpi=160); plt.close(fig)


def metric_bars(metrics: dict, path, title: str):
    keys = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    fig, ax = plt.subplots(figsize=(8.5, 4.2))
    w = 0.2
    for i, t in enumerate(C.TARGET_NAMES):
        vals = [metrics[t][k] for k in keys]
        ax.bar(np.arange(len(keys)) + i * w, vals, w, label=t, color=COL[t])
    ax.set_xticks(np.arange(len(keys)) + 1.5 * w); ax.set_xticklabels(["Accuracy", "Precision", "Recall", "F1", "ROC-AUC"])
    ax.set_ylim(0, 1.05); ax.set_title(title); ax.legend(ncol=4, loc="lower center"); ax.grid(axis="y", alpha=.3)
    fig.tight_layout(); fig.savefig(path, dpi=160); plt.close(fig)
