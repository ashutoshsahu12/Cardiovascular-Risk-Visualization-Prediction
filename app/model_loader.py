import joblib
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")

class ModelManager:
    def __init__(self):
        self.cad_model = None
        self.lad_model = None
        self.lcx_model = None
        self.rca_model = None
        self.scaler = None

    def load_artifacts(self):
        # Gracefully handle missing artifacts during initial dev
        try:
            self.cad_model = joblib.load(os.path.join(MODELS_DIR, "cad_model.joblib"))
            self.lad_model = joblib.load(os.path.join(MODELS_DIR, "lad_model.joblib"))
            self.lcx_model = joblib.load(os.path.join(MODELS_DIR, "lcx_model.joblib"))
            self.rca_model = joblib.load(os.path.join(MODELS_DIR, "rca_model.joblib"))
            self.scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.joblib"))
        except FileNotFoundError:
            print("[Warning] Trained artifacts not found in /models. Ensure Member 1 provides them.")

model_manager = ModelManager()