import unittest
import asyncio
import json
import numpy as np
import pandas as pd
from app.main import app, startup_event
from app.schemas import AssessmentFormDataInput, PatientDataInput, PredictionResponse
from app.adapter import adapt_input_to_model_features, CANONICAL_FEATURES

def call_asgi(app, method, path, body_dict=None):
    """Helper to dispatch ASGI requests directly to FastAPI without external dependencies."""
    body = json.dumps(body_dict).encode() if body_dict is not None else b''
    response = {'status': None, 'headers': [], 'body': bytearray()}

    async def receive():
        return {'type': 'http.request', 'body': body, 'more_body': False}

    async def send(event):
        if event['type'] == 'http.response.start':
            response['status'] = event['status']
            response['headers'] = event['headers']
        elif event['type'] == 'http.response.body':
            response['body'].extend(event.get('body', b''))

    scope = {
        'type': 'http',
        'http_version': '1.1',
        'method': method,
        'path': path,
        'raw_path': path.encode(),
        'query_string': b'',
        'headers': [(b'content-type', b'application/json'), (b'content-length', str(len(body)).encode())],
    }

    asyncio.run(app(scope, receive, send))
    parsed_json = json.loads(bytes(response['body']).decode()) if response['body'] else None
    return response['status'], parsed_json

class TestAssessmentIntegrationAdapter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        startup_event()

    def setUp(self):
        self.valid_23_payload = {
            "age": 45.0,
            "sex": "Male",
            "height": 170.0,
            "weight": 72.0,
            "smokingStatus": "Never smoked",
            "diabetes": "No",
            "familyHistory": "Yes",
            "additionalInfo": "Routine corporate wellness checkup.",
            "systolicBP": 145.0,
            "diastolicBP": 92.0,
            "restingHeartRate": 82.0,
            "chestPainType": "Typical Angina",
            "fastingBloodSugar": 105.0,
            "totalCholesterol": 240.0,
            "ldlCholesterol": 160.0,
            "hdlCholesterol": 42.0,
            "triglycerides": 190.0,
            "creatinine": 1.0,
            "esr": 14.0,
            "ecgFinding": "ST Depression",
            "qWave": "No",
            "ejectionFraction": 55.0,
            "rwma": "Hypokinesia"
        }

        self.valid_8_payload = {
            "age": 58.0,
            "bp": 130.0,
            "pulse_rate": 72.0,
            "cholesterol": 210.0,
            "st_elevation": 0,
            "t_inversion": 1,
            "lvh": 0,
            "rwma": 1
        }

    def test_health_endpoints(self):
        """Verify both /health and /api/health endpoints return healthy status."""
        for path in ['/health', '/api/health']:
            status, data = call_asgi(app, 'GET', path)
            self.assertEqual(status, 200, f"Failed on {path}")
            self.assertEqual(data.get("status"), "healthy")
            self.assertTrue(data.get("models_loaded"))

    def test_valid_23_field_input(self):
        """Verify successful prediction with 23-field frontend form payload."""
        status, data = call_asgi(app, 'POST', '/api/predict', self.valid_23_payload)
        self.assertEqual(status, 200)

        # Validate top-level response fields
        self.assertIn("id", data)
        self.assertIn("timestamp", data)
        self.assertIsInstance(data["overallCadProbability"], float)
        self.assertIsInstance(data["overallCadPercentage"], int)
        self.assertIn(data["overallRiskTier"], ["Higher risk", "Moderate risk", "Lower risk"])
        self.assertIsInstance(data["modelConfidence"], float)
        self.assertIsInstance(data["summaryText"], str)

        # Validate vessels dictionary
        self.assertIn("vessels", data)
        vessels = data["vessels"]
        for vessel_id in ["LAD", "LCX", "RCA"]:
            self.assertIn(vessel_id, vessels)
            v = vessels[vessel_id]
            self.assertEqual(v["id"], vessel_id)
            self.assertIsInstance(v["probability"], float)
            self.assertIsInstance(v["percentage"], int)
            self.assertIn(v["riskTier"], ["Higher risk", "Moderate risk", "Lower risk"])
            self.assertIn(v["status"], ["High", "Moderate", "Low"])
            self.assertTrue(v["riskBadge"].startswith("+"))
            self.assertIsInstance(v["anatomicalTerritory"], str)
            self.assertIsInstance(v["clinicalSummary"], str)
            self.assertIsInstance(v["keyDrivers"], list)

        # Validate SHAP contributions
        self.assertIn("shapContributions", data)
        shap_list = data["shapContributions"]
        self.assertEqual(len(shap_list), 8)
        for sc in shap_list:
            self.assertIn("feature", sc)
            self.assertIn("displayName", sc)
            self.assertIsInstance(sc["value"], float)
            self.assertIn(sc["direction"], ["positive", "negative"])
            self.assertIn(sc["category"], ["clinical", "lab", "ecg", "lifestyle"])
            self.assertIsInstance(sc["description"], str)

        # Validate Clinical Insights
        self.assertIn("clinicalInsights", data)
        ci = data["clinicalInsights"]
        self.assertIn("bloodPressureStatus", ci)
        self.assertIn("cholesterolStatus", ci)
        self.assertIn("cadRiskStatus", ci)
        self.assertIsInstance(ci["recommendations"], list)
        self.assertGreater(len(ci["recommendations"]), 0)

        # Validate Limitations
        self.assertIn("limitations", data)
        self.assertGreaterEqual(len(data["limitations"]), 3)

        # Validate backward-compatible legacy fields
        self.assertIn("overall_cad_risk", data)
        self.assertIn("overall_cad_status", data)
        self.assertIn("feature_importances", data)
        self.assertIn("disclaimer", data)

    def test_valid_8_field_legacy_input(self):
        """Verify backward compatibility with legacy 8-field payload."""
        for endpoint in ['/predict', '/api/predict']:
            status, data = call_asgi(app, 'POST', endpoint, self.valid_8_payload)
            self.assertEqual(status, 200, f"Failed on endpoint {endpoint}")
            self.assertIn("overallCadProbability", data)
            self.assertIn("overall_cad_risk", data)
            self.assertIn("vessels", data)
            self.assertEqual(len(data["vessels"]), 3)
            self.assertIn("LAD", data["vessels"])
            self.assertIn("status", data["vessels"]["LAD"])

    def test_missing_required_fields(self):
        """Verify HTTP 422 error when required fields are missing."""
        required_fields_to_test = ["age", "systolicBP", "restingHeartRate", "totalCholesterol", "ecgFinding", "rwma"]
        for field in required_fields_to_test:
            incomplete_payload = dict(self.valid_23_payload)
            del incomplete_payload[field]
            status, data = call_asgi(app, 'POST', '/api/predict', incomplete_payload)
            self.assertEqual(status, 422, f"Expected 422 when missing '{field}', got {status}")

    def test_invalid_categorical_values(self):
        """Verify HTTP 422 error when invalid categorical values are passed."""
        test_cases = [
            ("sex", "NonBinary"),
            ("ecgFinding", "Severe Infarction"),
            ("rwma", "Paralyzed"),
            ("smokingStatus", "Casual smoker"),
            ("diabetes", "Maybe"),
            ("chestPainType", "Burning"),
        ]
        for field, invalid_val in test_cases:
            bad_payload = dict(self.valid_23_payload)
            bad_payload[field] = invalid_val
            status, data = call_asgi(app, 'POST', '/api/predict', bad_payload)
            self.assertEqual(status, 422, f"Expected 422 for {field}='{invalid_val}', got {status}")

    def test_feature_ordering_and_encoding_consistency(self):
        """Verify exact 8 feature names, strict column ordering, and encoding logic."""
        # 1. Column ordering
        input_obj = AssessmentFormDataInput(**self.valid_23_payload)
        df, ctx = adapt_input_to_model_features(input_obj)
        self.assertEqual(list(df.columns), CANONICAL_FEATURES)
        self.assertEqual(list(df.columns), ['age', 'bp', 'pulse_rate', 'cholesterol', 'st_elevation', 't_inversion', 'lvh', 'rwma'])

        # 2. ECG categorical encoding
        ecg_tests = [
            ('ST Elevation', 1, 0, 0),
            ('T Wave Inversion', 0, 1, 0),
            ('Left Ventricular Hypertrophy', 0, 0, 1),
            ('Normal', 0, 0, 0),
            ('ST Depression', 0, 0, 0),
        ]
        for ecg_val, exp_ste, exp_tin, exp_lvh in ecg_tests:
            payload = dict(self.valid_23_payload, ecgFinding=ecg_val)
            sub_df, _ = adapt_input_to_model_features(AssessmentFormDataInput(**payload))
            self.assertEqual(sub_df['st_elevation'].iloc[0], exp_ste)
            self.assertEqual(sub_df['t_inversion'].iloc[0], exp_tin)
            self.assertEqual(sub_df['lvh'].iloc[0], exp_lvh)

        # 3. RWMA categorical encoding
        rwma_tests = [
            ('None', 0),
            ('Hypokinesia', 1),
            ('Akinesia', 1),
            ('Dyskinesia', 1),
        ]
        for rwma_val, exp_rwma in rwma_tests:
            payload = dict(self.valid_23_payload, rwma=rwma_val)
            sub_df, _ = adapt_input_to_model_features(AssessmentFormDataInput(**payload))
            self.assertEqual(sub_df['rwma'].iloc[0], exp_rwma)

        # 4. Cholesterol Friedewald fallback if totalCholesterol is 0
        friedewald_payload = dict(self.valid_23_payload, totalCholesterol=0, hdlCholesterol=50.0, ldlCholesterol=130.0, triglycerides=150.0)
        # Friedewald: 50 + 130 + 150/5 = 210.0
        sub_df, _ = adapt_input_to_model_features(AssessmentFormDataInput(**friedewald_payload))
        self.assertEqual(sub_df['cholesterol'].iloc[0], 210.0)

    def test_response_schema_compatibility_with_frontend_and_3d_heart(self):
        """
        Verify response contract matches what frontend/src/types/prediction.ts
        and Member 3's mapPredictionTo3DPayload in frontend/src/utils/vesselColors.ts require.
        """
        status, res = call_asgi(app, 'POST', '/api/predict', self.valid_23_payload)
        self.assertEqual(status, 200)

        # Simulate Member 3 mapPredictionTo3DPayload
        shap_map = {}
        for sc in res["shapContributions"]:
            key = sc.get("displayName") or sc["feature"]
            shap_map[key] = abs(sc["value"])

        self.assertGreater(len(shap_map), 0)

        for vessel_id in ['LAD', 'LCX', 'RCA']:
            v = res["vessels"][vessel_id]
            prob = v["probability"] if isinstance(v["probability"], float) else v["percentage"] / 100.0
            stenosis_prediction = prob >= 0.50
            risk_tier = 'high' if prob >= 0.70 else ('elevated' if prob >= 0.50 else ('intermediate' if prob >= 0.30 else 'low'))

            self.assertIsInstance(prob, float)
            self.assertIsInstance(stenosis_prediction, bool)
            self.assertIn(risk_tier, ['high', 'elevated', 'intermediate', 'low'])
            self.assertIsInstance(v["clinicalSummary"], str)

        overall_cad = {
            "predictedProbability": res["overallCadProbability"],
            "cadDetected": res["overallCadProbability"] >= 0.50,
            "riskScore": res["overallCadPercentage"],
            "riskCategory": "High" if res["overallRiskTier"] == "Higher risk" else "Moderate"
        }
        self.assertIsInstance(overall_cad["predictedProbability"], float)
        self.assertIsInstance(overall_cad["riskScore"], int)

if __name__ == '__main__':
    unittest.main()
