# Cardiovascular Risk Prediction: ML Pipeline (Track A, Member 1)

Leakage-safe classification pipeline that predicts **overall CAD** and the stenosis status of the
**LAD, LCX and RCA** coronary vessels from demographic, clinical, ECG, laboratory and echocardiographic
features of the Z-Alizadeh Sani extension dataset (303 patients).

> **Disclaimer:** predictions are for decision support and educational purposes only. They are NOT a
> substitute for formal diagnostic imaging (e.g. coronary angiography) or clinical judgement.

---

## 1. Project structure

```
cad_ml/
├── data/z_alizadeh_sani_extension.xlsx     # dataset (sheet 1 = data, sheet 2 = empty full-schema header)
├── src/cadml/
│   ├── config.py        # paths, seed, targets, LEAKAGE BLOCKLIST
│   ├── data.py          # load, clean, encode, leakage guard (LeakageError)
│   ├── schema.py        # 52 patient input fields (groups, units, limits) -> feature_schema.json
│   ├── models.py        # 7 model families, tuning, ensemble, calibration, TargetModel
│   ├── evaluate.py      # metrics, bootstrap CIs, threshold selection
│   ├── train.py         # end-to-end training + locked test + final fit + artifact export
│   ├── nested_cv.py     # nested cross-validation of the whole procedure
│   ├── audit.py         # leakage audit
│   ├── predict.py       # CADPredictor: validated patient dict -> probabilities (for the API)
│   └── plots.py         # ROC, calibration, confusion matrices
├── tests/               # 24 pytest tests (leakage + inference contract)
├── artifacts/
│   ├── models/          # CAD/LAD/LCX/RCA .joblib + manifest.json
│   ├── metrics.json, nested_cv_metrics.json, leakage_audit.json
│   ├── feature_schema.json, background_sample.csv
│   ├── figures/         # ROC, calibration, confusion, metric bars
│   └── predictions/     # out-of-fold, locked-test and nested-CV predictions (CSV)
├── requirements.txt     # pinned versions
└── pyproject.toml
```

## 2. Setup

```bash
python -m venv .venv && source .venv/bin/activate      # Python >= 3.10
pip install -r requirements.txt
pip install -e .
```

Use the pinned versions. The saved `.joblib` models are only guaranteed to load under the same
scikit-learn / xgboost / catboost versions they were trained with.

## 3. Usage

```bash
python -m cadml.train        # ~20 min on 1 CPU: tune, evaluate on locked test, refit on all data, export artifacts
python -m cadml.nested_cv    # ~14 min: nested-CV estimate (headline numbers)
python -m cadml.audit        # leakage audit -> artifacts/leakage_audit.json
pytest -q                    # 24 tests
```

Quick smoke run: `python -m cadml.train --quick --n-iter 2 --inner-repeats 1 --out-dir /tmp/smoke`

### Inference

```python
from cadml.predict import CADPredictor

predictor = CADPredictor.load()                     # reads artifacts/models/
result = predictor.predict({
    "Age": 62, "Sex": "Male", "Weight": 80, "Length": 172,
    "HTN": 1, "DM": 0, "Typical Chest Pain": 1, "BP": 140, "PR": 78,
    "LDL": 140, "HDL": 35, "EF-TTE": 50, "Region RWMA": 2,   # ... up to 52 fields
})
```

Response:

```json
{
  "probabilities": {"CAD": 0.0, "LAD": 0.0, "LCX": 0.0, "RCA": 0.0},
  "labels": {"CAD": 1, "LAD": 1, "LCX": 0, "RCA": 0},
  "label_text": {"CAD": "CAD", "LAD": "Stenotic", "LCX": "Normal", "RCA": "Normal"},
  "risk_levels": {"CAD": "high", "LAD": "moderate", "LCX": "low", "RCA": "low"},
  "thresholds": {"CAD": 0.0, "LAD": 0.0, "LCX": 0.0, "RCA": 0.0},
  "cad_probability_before_coherence": 0.0,
  "missing_inputs": [], "input_completeness": 1.0, "low_confidence": false,
  "warnings": [], "model_version": "1.0.0", "disclaimer": "..."
}
```
(values above are placeholders showing the structure.)

Input rules:
- Keys can be dataset names (`"Typical Chest Pain"`) or snake_case ids (`"typical_chest_pain"`).
- Yes/no fields accept `1/0`, `true/false`, `Y/N`, `yes/no`. `Sex`: Male/Female. `BBB`: N/LBBB/RBBB. `VHD`: N/mild/Moderate/Severe.
- BMI is derived from `Weight` and `Length`; do not send it.
- Label keys (`LAD`, `LCX`, `RCA`, `Cath`) raise `LeakageError`.
- Unknown keys, unparseable values and values outside plausible clinical limits raise `PatientValidationError` (map to HTTP 422).
- Missing fields are median-imputed and listed in `missing_inputs`. If fewer than 75% of the 52 inputs are given, `low_confidence` is `true`. **The UI should show this flag.**

## 4. Method

**Data preparation** (`data.py`)
- 303 patients, no missing values, no duplicates.
- Cleaning: `Fmale` -> Female, Y/N -> 1/0, `VHD` ordinal 0-3, `BBB` split into LBBB / RBBB indicators.
- Dropped as non-informative: `Exertional CP` (constant) and `Obesity` (equals BMI >= 25 up to one row).
- Result: 54 model features. Engineered ratios (LDL/HDL, TG/HDL, NLR) were tested and did not help, so they are off.

**Targets:** `CAD` (= `Cath` is CAD), `LAD`, `LCX`, `RCA` (= Stenotic, i.e. >= 50% narrowing). Four separate binary models.

**Modelling** (`models.py`), per target:
1. Seven families, each tuned with randomized search (12 draws) and repeated stratified 5x2 CV, scored by ROC-AUC: L2 logistic regression, L1 logistic regression, RBF-SVM, random forest, extra trees, XGBoost, CatBoost.
2. The best soft-voting ensemble of the top 1-4 families is chosen on out-of-fold AUC.
3. Optional Platt calibration is kept only if it improves out-of-fold Brier score (it did for all four targets). Calibrated probabilities drive the 3D vessel colours.
4. Decision threshold = the one maximizing out-of-fold F1. Other operating points stored: `youden`, `high_recall` (recall >= 0.90), `default` (0.5).
5. Imputer and scaler are steps inside each sklearn Pipeline, so they are refit on every training fold.

**Coherence:** CAD is defined as stenosis in any vessel, so `P(CAD) = max(P_CAD, P_LAD, P_LCX, P_RCA)`. This was adopted because it did not hurt out-of-fold F1/AUC.

**Selected models (final fit):** CAD = lr_l2 + lr_l1 + extra_trees + rf; LAD = rf + catboost + lr_l2 + extra_trees; LCX = xgboost + rf + catboost + lr_l1; RCA = lr_l1 + extra_trees + xgboost.

## 5. Preventing target leakage

1. **Blocklist** (`config.LEAKAGE_COLUMNS`): `LAD`, `LCX`, `RCA`, `Cath` (required by the brief) plus 16 post-angiography columns of the full 100-column schema (per-segment stenosis, vessel count, cath EF, PCI lesions). `assert_no_leakage` runs at data load, inside every `TargetModel` call, and at the API boundary.
2. **No train/test contamination:** preprocessing inside the CV pipeline; tuning, ensemble choice, calibration and thresholds use only training data; a locked 20% test set is evaluated once.
3. **Audit** (`python -m cadml.audit`), all passed:
   - no blocked column in the training matrix or saved models;
   - label-permutation test: AUC with shuffled labels is 0.49-0.51 for every target (chance);
   - single-feature scan: best single input has AUC 0.80 (no hidden proxy);
   - no duplicate patients;
   - counter-example: allowing the vessel labels as inputs gives CAD AUC 0.993 vs 0.919 leak-free.

## 6. Evaluation results

**Headline: nested 5-fold CV.** The entire procedure (tuning, ensemble choice, calibration, threshold) is re-run inside every outer fold; each patient is scored exactly once by a model that never saw them. Uses a lighter search (6 draws, 5x1 inner CV).

| Target | Accuracy | Precision | Recall | F1 | ROC-AUC (95% CI) |
|---|---|---|---|---|---|
| CAD | 0.861 | 0.903 | 0.903 | 0.903 | 0.928 (0.896-0.955) |
| LAD | 0.779 | 0.775 | 0.876 | 0.822 | 0.848 (0.802-0.891) |
| LCX | 0.597 | 0.492 | 0.739 | 0.591 | 0.732 (0.674-0.786) |
| RCA | 0.637 | 0.512 | 0.737 | 0.604 | 0.729 (0.672-0.783) |

**Locked test set** (20%, n = 61, one-shot; small, so intervals are wide):

| Target | Accuracy | Recall | F1 | ROC-AUC |
|---|---|---|---|---|
| CAD | 0.754 | 0.841 | 0.831 | 0.856 |
| LAD | 0.738 | 0.794 | 0.771 | 0.798 |
| LCX | 0.656 | 0.593 | 0.604 | 0.741 |
| RCA | 0.607 | 0.682 | 0.556 | 0.696 |

Development CV on the 242 training patients is higher (CAD AUC 0.958) but selection-optimistic; cite the nested-CV table.
Figures: `artifacts/figures/` (`roc_nested_cv.png`, `calibration_nested_cv.png`, `confusion_locked_test.png`, `metrics_nested_cv.png`, ...).

## 7. Limitations (state these in the report)

- **LCX and RCA are weakly predictable** from these features (AUC ~0.73). At the F1-optimal threshold their accuracy is at or below the majority-class rate (LCX 0.607, RCA 0.624), so judge them by AUC and recall. Use `thresholds["default"]` or `["youden"]` from `manifest.json` for a different accuracy/recall trade-off.
- **Small, single-centre referral cohort** (n = 303, 71% CAD). No external validation; calibration applies to this population.
- **Sparse input** is median-imputed. A near-blank record scores ~0.95 CAD because of the cohort prevalence; always surface `low_confidence`.
- Region RWMA is a count of abnormal regions, not an anatomical map, so vessel-level signal is limited.
- Probabilities are decision-support estimates, not diagnoses.

## 8. Integration notes

- **Member 2 (API / SHAP):** `predictor.get_target_model("LAD").predict_proba_2d(frame)` works with KernelExplainer / LIME; `predictor.to_frame(patient)` returns the 54-column frame; `artifacts/background_sample.csv` is a 100-row background set. Tree-model members are accessible via `TargetModel.members` for TreeExplainer if preferred. `feature_names` are the 54 model columns (incl. derived `BMI`, `LBBB`, `RBBB`).
- **Member 3 (3D):** colour each vessel from `probabilities[LAD|LCX|RCA]` (0-1, calibrated); `risk_levels` bins are low < 0.33, moderate < 0.66, high.
- **Member 4 (UI / report):** build the form from `artifacts/feature_schema.json` (ids, labels, groups, units, limits, defaults); use `artifacts/figures/` and the metrics JSON files in the documentation. Show the disclaimer from `manifest.json`.

## 9. Reproducibility

Fixed seed (42) everywhere, pinned `requirements.txt`, stratified split on number of stenotic vessels, all metrics written to JSON by the scripts above. Training the full pipeline took 19.7 min on a single CPU core.

## 10. Data source

UCI Machine Learning Repository: *Extension of Z-Alizadeh Sani Dataset* (also on Kaggle).
