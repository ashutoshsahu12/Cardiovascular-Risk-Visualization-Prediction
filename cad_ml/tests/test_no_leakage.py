"""Leakage guarantees. Run:  pytest -q"""
import numpy as np
import pandas as pd
import pytest

from cadml import config as C
from cadml.data import (LeakageError, assert_no_leakage, build_targets, drop_leakage, encode_features,
                        load_dataset, load_raw)
from cadml.models import SearchConfig, candidate_space, fit_target

MANDATED = {"LAD", "LCX", "RCA", "Cath"}


def test_blocklist_contains_mandated_columns():
    assert MANDATED <= C.LEAKAGE_COLUMNS


def test_feature_matrix_has_no_blocked_columns():
    X, Y = load_dataset()
    assert not (set(X.columns) & C.LEAKAGE_COLUMNS)
    assert list(Y.columns) == ["CAD", "LAD", "LCX", "RCA"]
    assert not (set(Y.columns) & set(X.columns))


def test_every_blocked_column_is_rejected():
    X, _ = load_dataset()
    for col in C.LEAKAGE_COLUMNS:
        bad = X.copy()
        bad[col] = 0
        with pytest.raises(LeakageError):
            assert_no_leakage(bad.columns)
        with pytest.raises(LeakageError):
            encode_features(bad)


def test_drop_leakage_removes_label_columns():
    raw = load_raw()
    assert MANDATED <= set(raw.columns)
    assert not (set(drop_leakage(raw).columns) & MANDATED)


def test_targets_are_binary_and_consistent():
    Y = build_targets(load_raw())
    assert set(np.unique(Y.values)) == {0, 1}
    # CAD is (almost) the OR of the three vessels in this dataset
    assert (Y["CAD"] == Y[["LAD", "LCX", "RCA"]].max(axis=1)).mean() > 0.99


def test_no_missing_after_encoding():
    X, _ = load_dataset()
    assert X.isna().sum().sum() == 0
    assert X.shape == (303, 54)


def test_preprocessing_lives_inside_the_pipeline():
    """Imputer & scaler must be pipeline steps so they are re-fitted on each training fold."""
    for fam, (pipe, _) in candidate_space().items():
        names = [n for n, _ in pipe.steps]
        assert names[0] == "imputer" and names[-1] == "clf", fam
    assert "scaler" in [n for n, _ in candidate_space()["lr_l2"][0].steps]


def test_label_permutation_gives_chance_level_auc():
    """If preprocessing/CV leaked label info, permuted labels would still score > 0.5."""
    from sklearn.metrics import roc_auc_score
    from sklearn.model_selection import StratifiedKFold, cross_val_predict

    X, Y = load_dataset()
    pipe = candidate_space()["lr_l2"][0].set_params(clf__C=0.1)
    rng = np.random.default_rng(0)
    aucs = []
    for _ in range(8):
        y = pd.Series(rng.permutation(Y["CAD"].values))
        p = cross_val_predict(pipe, X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0), method="predict_proba")[:, 1]
        aucs.append(roc_auc_score(y, p))
    assert abs(np.mean(aucs) - 0.5) < 0.06


def test_fit_target_api_and_leak_guard():
    X, Y = load_dataset()
    m = fit_target(X, Y["LAD"], "LAD", SearchConfig(n_iter=1, inner_repeats=1, families=["lr_l2"], verbose=False))
    p = m.predict_proba(X)
    assert p.shape == (303,) and (p >= 0).all() and (p <= 1).all()
    assert m.predict_proba_2d(X).shape == (303, 2)
    assert not (set(m.feature_names) & C.LEAKAGE_COLUMNS)
    leaky = X.copy()
    leaky["LAD"] = Y["LAD"]
    with pytest.raises(LeakageError):
        m.predict_proba(leaky)
