"""Central configuration: paths, seeds, target definitions and the leakage blocklist."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "data" / "z_alizadeh_sani_extension.xlsx"
ARTIFACT_DIR = ROOT / "artifacts"
MODEL_DIR = ARTIFACT_DIR / "models"
FIG_DIR = ARTIFACT_DIR / "figures"

SEED = 42

# ----------------------------------------------------------------------------
# Targets: name -> (raw dataset column, label value meaning "positive")
# ----------------------------------------------------------------------------
TARGETS: dict[str, tuple[str, str]] = {
    "CAD": ("Cath", "CAD"),          # overall CAD status (>=50% stenosis in any vessel)
    "LAD": ("LAD", "Stenotic"),
    "LCX": ("LCX", "Stenotic"),
    "RCA": ("RCA", "Stenotic"),
}
TARGET_NAMES = list(TARGETS)

# ----------------------------------------------------------------------------
# Target-leakage blocklist
# ----------------------------------------------------------------------------
# The brief mandates excluding LAD, LCX, RCA and Cath. We additionally block every
# other column of the full 100-column Z-Alizadeh Sani schema that is only known AFTER
# invasive angiography, so the pipeline stays leak-free even if the full file is swapped in.
LEAKAGE_COLUMNS: frozenset[str] = frozenset(
    {
        # mandated by the hackathon brief
        "LAD", "LCX", "RCA", "Cath",
        # post-catheterisation columns of the extended schema
        "LM Proximal", "LM Distal",
        "LAD Proximal", "LAD Mid", "LAD Distal",
        "LCX Proximal", "LCX Mid", "LCX Distal",
        "RCA Proximal", "RCA Mid", "RCA Distal",
        "Number of Vessel Involved", "EF- Cath", "Number Of lesion PCI",
    }
)

# Exact functions of other columns (Obesity == BMI >= 25 up to one row) or constants
# ("Exertional CP" is 'N' for all 303 patients => zero information).
REDUNDANT_COLUMNS: frozenset[str] = frozenset({"Obesity", "Exertional CP"})

BINARY_YN_COLUMNS = [
    "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP",
    "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur", "Diastolic Murmur",
    "Dyspnea", "Atypical", "Nonanginal", "Exertional CP", "LowTH Ang",
    "LVH", "Poor R Progression",
]
SEX_MAP = {"Male": 1, "Fmale": 0, "Female": 0}            # "Fmale" is the dataset's own spelling
VHD_MAP = {"N": 0, "mild": 1, "Moderate": 2, "Severe": 3}  # ordinal severity
