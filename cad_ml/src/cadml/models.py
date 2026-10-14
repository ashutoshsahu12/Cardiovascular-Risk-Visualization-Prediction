"""Candidate model families, leakage-safe model selection and the deployable TargetModel."""
from __future__ import annotations

import time
import warnings
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import pandas as pd
from scipy.stats import loguniform, randint, uniform
from sklearn.base import clone
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import RandomizedSearchCV, RepeatedStratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

from . import config as C
from .data import assert_no_leakage
from .evaluate import select_thresholds

warnings.filterwarnings("ignore")


# =============================================================================
# Search configuration
# =============================================================================
@dataclass
class SearchConfig:
    n_iter: int = 15            # random-search draws per family
    inner_splits: int = 5
    inner_repeats: int = 2      # repeated CV -> less noisy on n=303
    top_k_max: int = 4          # largest soft-voting ensemble considered
    families: Optional[list] = None   # None -> all
    seed: int = C.SEED
    verbose: bool = True


def _pipe(clf, scale: bool) -> Pipeline:
    """Imputer / scaler live INSIDE the pipeline => they are re-fitted on every training fold."""
    steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale:
        steps.append(("scaler", StandardScaler()))
    steps.append(("clf", clf))
    return Pipeline(steps)


def candidate_space(seed: int = C.SEED) -> dict:
    """family -> (pipeline, random-search distributions). Small, regularised models for n~300."""
    from catboost import CatBoostClassifier
    from xgboost import XGBClassifier

    return {
        "lr_l2": (
            _pipe(LogisticRegression(max_iter=5000, solver="lbfgs"), True),
            {"clf__C": loguniform(1e-3, 3), "clf__class_weight": [None, "balanced"]},
        ),
        "lr_l1": (
            _pipe(LogisticRegression(penalty="l1", solver="liblinear", max_iter=5000), True),
            {"clf__C": loguniform(1e-2, 3), "clf__class_weight": [None, "balanced"]},
        ),
        "svm_rbf": (
            _pipe(SVC(kernel="rbf", probability=True, random_state=seed), True),
            {"clf__C": loguniform(0.1, 30), "clf__gamma": loguniform(3e-4, 0.1)},
        ),
        "rf": (
            _pipe(RandomForestClassifier(n_estimators=300, n_jobs=1, random_state=seed), False),
            {"clf__max_depth": [3, 4, 6, 8, None], "clf__min_samples_leaf": [1, 2, 3, 5, 8],
             "clf__max_features": [0.1, 0.2, 0.3, 0.5, "sqrt"],
             "clf__class_weight": [None, "balanced_subsample"]},
        ),
        "extra_trees": (
            _pipe(ExtraTreesClassifier(n_estimators=300, n_jobs=1, random_state=seed), False),
            {"clf__max_depth": [3, 4, 6, 8, None], "clf__min_samples_leaf": [1, 2, 3, 5, 8],
             "clf__max_features": [0.1, 0.2, 0.3, 0.5, "sqrt"],
             "clf__class_weight": [None, "balanced_subsample"]},
        ),
        "xgboost": (
            _pipe(XGBClassifier(tree_method="hist", n_jobs=1, verbosity=0, random_state=seed,
                                eval_metric="logloss"), False),
            {"clf__n_estimators": randint(80, 400), "clf__max_depth": [1, 2, 3, 4],
             "clf__learning_rate": loguniform(0.01, 0.15), "clf__subsample": uniform(0.6, 0.4),
             "clf__colsample_bytree": uniform(0.3, 0.7), "clf__min_child_weight": [1, 2, 4],
             "clf__reg_lambda": loguniform(0.5, 20)},
        ),
        "catboost": (
            _pipe(CatBoostClassifier(iterations=250, verbose=0, thread_count=1, random_seed=seed,
                                     allow_writing_files=False), False),
            {"clf__depth": [2, 3, 4, 5, 6], "clf__learning_rate": loguniform(0.02, 0.15),
             "clf__l2_leaf_reg": loguniform(1, 20)},
        ),
    }


# =============================================================================
# Deployable object
# =============================================================================
@dataclass
class TargetModel:
    """Everything needed to score one target (CAD / LAD / LCX / RCA) on raw encoded features."""
    target: str
    feature_names: list
    members: list                      # [(family_name, fitted sklearn Pipeline), ...]
    calibrator: Optional[LogisticRegression]
    thresholds: dict                   # f1 / youden / high_recall / default
    threshold: float                   # operating point used for the class label
    info: dict = field(default_factory=dict)

    # -- scoring ---------------------------------------------------------------
    def _check(self, X: pd.DataFrame) -> pd.DataFrame:
        assert_no_leakage(X.columns)
        missing = [c for c in self.feature_names if c not in X.columns]
        if missing:
            raise KeyError(f"Missing model features: {missing}")
        return X[self.feature_names]

    def predict_proba_raw(self, X: pd.DataFrame) -> np.ndarray:
        X = self._check(X)
        return np.mean([m.predict_proba(X)[:, 1] for _, m in self.members], axis=0)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """P(positive) - Platt-calibrated when a calibrator was selected."""
        p = self.predict_proba_raw(X)
        if self.calibrator is None:
            return p
        return self.calibrator.predict_proba(_logit(p).reshape(-1, 1))[:, 1]

    def predict(self, X: pd.DataFrame, threshold: Optional[float] = None) -> np.ndarray:
        t = self.threshold if threshold is None else threshold
        return (self.predict_proba(X) >= t).astype(int)

    def predict_proba_2d(self, X) -> np.ndarray:
        """sklearn-style (n, 2) output - convenient for SHAP/LIME explainers."""
        X = pd.DataFrame(X, columns=self.feature_names) if not isinstance(X, pd.DataFrame) else X
        p = self.predict_proba(X)
        return np.column_stack([1 - p, p])


def _logit(p, eps: float = 1e-4):
    p = np.clip(np.asarray(p, dtype=float), eps, 1 - eps)
    return np.log(p / (1 - p))


# =============================================================================
# Selection procedure (used by training AND by nested CV, so both are identical)
# =============================================================================
def _oof_repeated(est, X, y, cv: RepeatedStratifiedKFold) -> np.ndarray:
    """Out-of-fold probabilities for every CV repeat -> array (n_repeats, n)."""
    n_rep = cv.n_repeats
    oof = np.zeros((n_rep, len(y)))
    Xv, yv = X.values, y.values
    for i, (tr, te) in enumerate(cv.split(Xv, yv)):
        rep = i // cv.cvargs["n_splits"]
        m = clone(est).fit(X.iloc[tr], yv[tr])
        oof[rep, te] = m.predict_proba(X.iloc[te])[:, 1]
    return oof


def _mean_auc(y, oof) -> float:
    return float(np.mean([roc_auc_score(y, o) for o in oof]))


def fit_target(X: pd.DataFrame, y: pd.Series, target: str, cfg: SearchConfig | None = None) -> TargetModel:
    """Tune every family, build the best soft-voting ensemble, calibrate, set thresholds, refit.

    Every data-dependent step (imputation, scaling, hyper-parameter search, ensemble choice,
    calibration, threshold) only ever sees the (X, y) passed in -> no information from a
    held-out set can leak in.
    """
    cfg = cfg or SearchConfig()
    assert_no_leakage(X.columns)
    y = y.reset_index(drop=True)
    X = X.reset_index(drop=True)
    cv = RepeatedStratifiedKFold(n_splits=cfg.inner_splits, n_repeats=cfg.inner_repeats,
                                 random_state=cfg.seed)
    space = candidate_space(cfg.seed)
    fams = cfg.families or list(space)

    fam_res = {}
    for fam in fams:
        t0 = time.time()
        pipe, dist = space[fam]
        rs = RandomizedSearchCV(pipe, dist, n_iter=cfg.n_iter, scoring="roc_auc", cv=cv,
                                random_state=cfg.seed, n_jobs=1, refit=False)
        rs.fit(X, y)
        est = clone(pipe).set_params(**rs.best_params_)
        oof = _oof_repeated(est, X, y, cv)
        fam_res[fam] = {"est": est, "params": _clean(rs.best_params_), "oof": oof,
                        "cv_auc": _mean_auc(y, oof)}
        if cfg.verbose:
            print(f"  [{target}] {fam:<14} CV-AUC={fam_res[fam]['cv_auc']:.4f}  ({time.time()-t0:.0f}s)", flush=True)

    # ---- choose single model or top-k soft-voting ensemble by CV ROC-AUC ------
    ranked = sorted(fam_res, key=lambda f: fam_res[f]["cv_auc"], reverse=True)
    options = {}
    for k in range(1, min(cfg.top_k_max, len(ranked)) + 1):
        names = ranked[:k]
        oof = np.mean([fam_res[f]["oof"] for f in names], axis=0)
        options[tuple(names)] = _mean_auc(y, oof)
    best_names = max(options, key=lambda n: (round(options[n], 4), len(n)))   # tie -> bigger ensemble
    ens_oof = np.mean([fam_res[f]["oof"] for f in best_names], axis=0)        # (n_rep, n)

    # ---- optional Platt calibration (kept only if it improves OOF Brier) ------
    pooled_p = ens_oof.reshape(-1)
    pooled_y = np.tile(y.values, ens_oof.shape[0])
    brier_raw = brier_score_loss(pooled_y, pooled_p)
    cal = LogisticRegression(C=1e6, max_iter=1000).fit(_logit(pooled_p).reshape(-1, 1), pooled_y)
    cal_p = cal.predict_proba(_logit(pooled_p).reshape(-1, 1))[:, 1]
    brier_cal = brier_score_loss(pooled_y, cal_p)
    use_cal = brier_cal < brier_raw - 1e-4
    final_oof_rep = cal_p.reshape(ens_oof.shape) if use_cal else ens_oof
    oof_mean = final_oof_rep.mean(axis=0)               # smoothed OOF prob per patient

    thresholds = select_thresholds(y.values, oof_mean)

    members = [(f, clone(fam_res[f]["est"]).fit(X, y)) for f in best_names]
    info = {
        "families_cv_auc": {f: round(fam_res[f]["cv_auc"], 4) for f in ranked},
        "family_params": {f: fam_res[f]["params"] for f in ranked},
        "ensemble_options_cv_auc": {"+".join(k): round(v, 4) for k, v in options.items()},
        "selected": list(best_names),
        "selected_cv_auc": round(options[best_names], 4),
        "calibrated": bool(use_cal),
        "brier_raw": round(float(brier_raw), 4),
        "brier_calibrated": round(float(brier_cal), 4),
        "n_train": int(len(y)),
        "prevalence": float(y.mean()),
    }
    return TargetModel(
        target=target, feature_names=list(X.columns), members=members,
        calibrator=cal if use_cal else None, thresholds=thresholds,
        threshold=thresholds["f1"], info={**info, "_oof_mean": oof_mean.tolist()},
    )


def _clean(params: dict) -> dict:
    out = {}
    for k, v in params.items():
        if isinstance(v, (np.integer,)):
            v = int(v)
        elif isinstance(v, (np.floating,)):
            v = float(v)
        out[k] = v
    return out
