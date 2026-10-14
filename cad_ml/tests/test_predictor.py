"""Inference-layer tests (need trained artifacts: python -m cadml.train)."""
import numpy as np
import pytest

from cadml import config as C
from cadml.data import LeakageError, drop_leakage, encode_features, load_raw
from cadml.predict import CADPredictor, PatientValidationError, encode_patient
from cadml.schema import INPUT_COLUMNS

pytestmark = pytest.mark.skipif(not (C.MODEL_DIR / "manifest.json").exists(), reason="models not trained yet")


@pytest.fixture(scope="module")
def predictor():
    return CADPredictor.load()


@pytest.fixture(scope="module")
def raw():
    return load_raw()


def _patient(raw, i=0):
    return {c: raw.loc[i, c] for c in INPUT_COLUMNS}


def test_encoding_parity_with_training(predictor, raw):
    enc = encode_features(drop_leakage(raw))[predictor.feature_names].values
    F = predictor.to_frame([_patient(raw, i) for i in range(len(raw))]).values
    assert np.allclose(F, enc, atol=1e-9)


def test_prediction_contract(predictor, raw):
    r = predictor.predict(_patient(raw, 0))
    assert set(r["probabilities"]) == {"CAD", "LAD", "LCX", "RCA"}
    assert all(0 <= v <= 1 for v in r["probabilities"].values())
    assert "disclaimer" in r and "decision support" in r["disclaimer"]


def test_cad_probability_is_coherent_with_vessels(predictor, raw):
    if not predictor.enforce_coherence:
        pytest.skip("coherence disabled in manifest")
    for i in range(0, 303, 15):
        p = predictor.predict(_patient(raw, i))["probabilities"]
        assert p["CAD"] >= max(p["LAD"], p["LCX"], p["RCA"]) - 1e-12


@pytest.mark.parametrize("key", ["LAD", "LCX", "RCA", "Cath", "lad", "CATH"])
def test_label_keys_rejected(predictor, raw, key):
    p = _patient(raw, 0)
    p[key] = "Stenotic"
    with pytest.raises(LeakageError):
        predictor.predict(p)


def test_validation_errors(predictor, raw):
    p = _patient(raw, 0)
    p["Age"] = 500
    with pytest.raises(PatientValidationError):
        predictor.predict(p)
    with pytest.raises(PatientValidationError):
        predictor.predict({"not_a_field": 1})


def test_missing_values_are_imputed_with_warning(predictor, raw):
    p = _patient(raw, 0)
    del p["LDL"]
    r = predictor.predict(p)
    assert "LDL" in r["missing_inputs"] and any("imputed" in w for w in r["warnings"])


def test_id_and_column_keys_equivalent(predictor, raw):
    p = _patient(raw, 3)
    q = {c.lower().replace(" ", "_").replace("-", "_"): v for c, v in p.items()}
    assert predictor.predict(p)["probabilities"] == predictor.predict(q)["probabilities"]


def test_bmi_is_derived():
    row, _ = encode_patient({"Weight": 80, "Length": 200})
    assert row["BMI"] == pytest.approx(20.0)


def test_sparse_input_flagged_low_confidence(predictor):
    r = predictor.predict({"Age": 60, "Sex": "Male"})
    assert r["low_confidence"] and r["input_completeness"] < 0.1
    assert any("LOW CONFIDENCE" in w for w in r["warnings"])


def test_full_input_not_flagged(predictor, raw):
    r = predictor.predict(_patient(raw, 0))
    assert not r["low_confidence"] and r["input_completeness"] == 1.0
