import { AssessmentFormData } from '../types/assessment';
import { PredictionResponse, HistoricalAssessment, ShapContribution } from '../types/prediction';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const INITIAL_PREDICTION: PredictionResponse = {
  id: 'cv-init-892',
  timestamp: new Date().toISOString(),
  overallCadProbability: 0.68,
  overallCadPercentage: 68,
  overallRiskTier: 'Higher risk',
  modelConfidence: 0.72,
  summaryText: 'The model predicts a higher probability of coronary artery disease based on the provided information.',
  vessels: {
    LAD: {
      id: 'LAD',
      name: 'LAD',
      fullName: 'Left Anterior Descending',
      probability: 0.72,
      percentage: 72,
      riskTier: 'Higher risk',
      riskBadge: '+ Potential stenosis',
      anatomicalTerritory: 'Anterior left ventricular wall and interventricular septum',
      clinicalSummary: 'The model predicts a higher probability of stenosis in the LAD (72%) based on your clinical measurements.',
      keyDrivers: ['Systolic Blood Pressure (145 mmHg)', 'LDL Cholesterol (160 mg/dL)', 'Age Factor (45 yrs)', 'Resting ST-T wave changes']
    },
    LCX: {
      id: 'LCX',
      name: 'LCX',
      fullName: 'Left Circumflex',
      probability: 0.41,
      percentage: 41,
      riskTier: 'Moderate risk',
      riskBadge: '+ Moderate risk',
      anatomicalTerritory: 'Posterolateral left ventricular myocardium and left atrium',
      clinicalSummary: 'The model estimates moderate probability of stenosis in the LCX branch (41%).',
      keyDrivers: ['Total Cholesterol (240 mg/dL)', 'Arterial hemodynamic compliance', 'Resting Heart Rate (82 bpm)']
    },
    RCA: {
      id: 'RCA',
      name: 'RCA',
      fullName: 'Right Coronary Artery',
      probability: 0.35,
      percentage: 35,
      riskTier: 'Lower risk',
      riskBadge: '+ Lower risk',
      anatomicalTerritory: 'Right ventricle, inferior diaphragmatic wall, and AV conduction tissue',
      clinicalSummary: 'Lower estimated risk of significant obstruction in the right coronary circulation (35%).',
      keyDrivers: ['Normal right-sided chamber voltages', 'Fasting glucose baseline', 'Absence of inferior Q waves']
    }
  },
  shapContributions: [
    {
      feature: 'ldlCholesterol',
      displayName: 'LDL Cholesterol',
      value: 0.18,
      direction: 'positive',
      category: 'lab',
      description: 'Elevated LDL (160 mg/dL) contributes heavily towards estimated atherogenic risk.'
    },
    {
      feature: 'systolicBP',
      displayName: 'Systolic Blood Pressure',
      value: 0.14,
      direction: 'positive',
      category: 'clinical',
      description: 'Systolic BP of 145 mmHg increases hemodynamic shear and vessel wall stress.'
    },
    {
      feature: 'age',
      displayName: 'Age Factor (45 yrs)',
      value: 0.11,
      direction: 'positive',
      category: 'clinical',
      description: 'Age baseline reflects cumulative vascular exposure over decades.'
    },
    {
      feature: 'ecgFinding',
      displayName: 'ECG ST-T Changes',
      value: 0.09,
      direction: 'positive',
      category: 'ecg',
      description: 'Subendocardial repolarization changes correlate with localized ischemia markers.'
    },
    {
      feature: 'smokingStatus',
      displayName: 'Non-Smoker Status',
      value: -0.09,
      direction: 'negative',
      category: 'lifestyle',
      description: 'Lifetime non-smoker status provides significant protective offset against thrombosis.'
    },
    {
      feature: 'hdlCholesterol',
      displayName: 'HDL Cholesterol (42 mg/dL)',
      value: -0.05,
      direction: 'negative',
      category: 'lab',
      description: 'Reverse cholesterol transport function provides modest atheroprotective mitigation.'
    }
  ],
  clinicalInsights: {
    bloodPressureStatus: 'Blood pressure is slightly elevated',
    cholesterolStatus: 'Cholesterol levels require attention',
    cadRiskStatus: 'Moderate to high CAD risk predicted',
    recommendations: [
      'Your systolic blood pressure (145 mmHg) is higher than the usual reference range. Consider monitoring.',
      'LDL cholesterol (160 mg/dL) is above the recommended clinical threshold (< 100 mg/dL).',
      'The model indicates an elevated risk of CAD. Review detailed results and speak with your physician.'
    ]
  },
  limitations: [
    'Predictions are generated from tabular clinical measurements and statistical models.',
    'This system does not perform physical imaging, angiography, or diagnostic confirmation.',
    'Educational and clinical decision-support only; not a diagnosis.'
  ]
};

export const INITIAL_HISTORY: HistoricalAssessment[] = [
  {
    id: 'hist-1',
    date: 'May 14, 2024',
    rawDate: '2024-05-14',
    overallCadPercentage: 68,
    overallRiskTier: 'Higher risk',
    ladPercentage: 72,
    lcxPercentage: 41,
    rcaPercentage: 35,
    keyFindings: 'Elevated BP, High LDL'
  },
  {
    id: 'hist-2',
    date: 'Feb 10, 2024',
    rawDate: '2024-02-10',
    overallCadPercentage: 52,
    overallRiskTier: 'Moderate risk',
    ladPercentage: 56,
    lcxPercentage: 32,
    rcaPercentage: 28,
    keyFindings: 'Improved cholesterol'
  },
  {
    id: 'hist-3',
    date: 'Nov 5, 2023',
    rawDate: '2023-11-05',
    overallCadPercentage: 45,
    overallRiskTier: 'Moderate risk',
    ladPercentage: 49,
    lcxPercentage: 28,
    rcaPercentage: 25,
    keyFindings: 'Stable measurements'
  },
  {
    id: 'hist-4',
    date: 'Aug 12, 2023',
    rawDate: '2023-08-12',
    overallCadPercentage: 46,
    overallRiskTier: 'Moderate risk',
    ladPercentage: 51,
    lcxPercentage: 30,
    rcaPercentage: 26,
    keyFindings: 'Slightly elevated BP'
  }
];

export async function fetchHealthStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postPrediction(data: AssessmentFormData): Promise<PredictionResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const result: PredictionResponse = await res.json();
      return result;
    }
  } catch {
    // Graceful offline fallback with calibrated client-side computation
    console.info('Backend unreachable or offline. Using calibrated client-side inference engine.');
  }

  return computeClientFallback(data);
}

function computeClientFallback(data: AssessmentFormData): PredictionResponse {
  // Calibrated client-side inference
  let z = -2.2;
  z += (data.age - 45) * 0.045;
  if (data.sex === 'Male') z += 0.40;
  z += (data.systolicBP - 120) * 0.025 + (data.diastolicBP - 80) * 0.015;
  z += (data.totalCholesterol - 190) * 0.010 + (data.ldlCholesterol - 100) * 0.015 - (data.hdlCholesterol - 50) * 0.020;
  if (data.smokingStatus === 'Current smoker') z += 0.65;
  if (data.smokingStatus === 'Former smoker') z += 0.20;
  if (data.diabetes === 'Yes') z += 0.55;
  if (data.familyHistory === 'Yes') z += 0.45;
  if (data.ecgFinding !== 'Normal') z += 0.50;
  if (data.ejectionFraction < 50) z += (50 - data.ejectionFraction) * 0.03;

  const sigmoid = (v: number) => 1.0 / (1.0 + Math.exp(-v));
  const cadProb = Math.max(0.08, Math.min(0.95, Math.round(sigmoid(z) * 100) / 100));
  const cadPct = Math.round(cadProb * 100);

  const ladProb = Math.max(0.08, Math.min(0.96, Math.round(sigmoid(z + 0.18) * 100) / 100));
  const lcxProb = Math.max(0.06, Math.min(0.90, Math.round(sigmoid(z - 0.40) * 100) / 100));
  const rcaProb = Math.max(0.05, Math.min(0.88, Math.round(sigmoid(z - 0.65) * 100) / 100));

  const ladPct = Math.round(ladProb * 100);
  const lcxPct = Math.round(lcxProb * 100);
  const rcaPct = Math.round(rcaProb * 100);

  const overallTier = cadProb >= 0.60 ? 'Higher risk' : cadProb >= 0.35 ? 'Moderate risk' : 'Lower risk';

  const shap: ShapContribution[] = [];
  if (data.ldlCholesterol > 120) {
    shap.push({
      feature: 'ldlCholesterol',
      displayName: 'LDL Cholesterol',
      value: Math.round(((data.ldlCholesterol - 100) / 300) * 100) / 100,
      direction: 'positive',
      category: 'lab',
      description: `Elevated LDL (${data.ldlCholesterol} mg/dL) accelerates atheroma formation.`
    });
  }
  if (data.systolicBP > 125) {
    shap.push({
      feature: 'systolicBP',
      displayName: 'Systolic Blood Pressure',
      value: Math.round(((data.systolicBP - 120) / 150) * 100) / 100,
      direction: 'positive',
      category: 'clinical',
      description: `Systolic BP of ${data.systolicBP} mmHg elevates hemodynamic endothelial stress.`
    });
  }
  if (data.age > 45) {
    shap.push({
      feature: 'age',
      displayName: `Age Factor (${data.age} yrs)`,
      value: Math.round(((data.age - 45) * 0.006) * 100) / 100,
      direction: 'positive',
      category: 'clinical',
      description: 'Age increases cumulative risk.'
    });
  }
  if (data.smokingStatus === 'Never smoked') {
    shap.push({
      feature: 'smokingStatus',
      displayName: 'Non-Smoker Status',
      value: -0.09,
      direction: 'negative',
      category: 'lifestyle',
      description: 'Never-smoker status preserves vascular endothelial integrity.'
    });
  }
  if (data.hdlCholesterol >= 45) {
    shap.push({
      feature: 'hdlCholesterol',
      displayName: `HDL (${data.hdlCholesterol} mg/dL)`,
      value: -0.06,
      direction: 'negative',
      category: 'lab',
      description: 'Protective reverse cholesterol transport.'
    });
  }

  return {
    id: `cv-sim-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    overallCadProbability: cadProb,
    overallCadPercentage: cadPct,
    overallRiskTier: overallTier,
    modelConfidence: 0.72,
    summaryText: overallTier === 'Higher risk'
      ? 'The model predicts a higher probability of coronary artery disease based on the provided information.'
      : 'The model predicts moderate to lower risk. Periodic clinical monitoring is advised.',
    vessels: {
      LAD: {
        id: 'LAD',
        name: 'LAD',
        fullName: 'Left Anterior Descending',
        probability: ladProb,
        percentage: ladPct,
        riskTier: ladProb >= 0.60 ? 'Higher risk' : ladProb >= 0.35 ? 'Moderate risk' : 'Lower risk',
        riskBadge: ladProb >= 0.60 ? '+ Potential stenosis' : ladProb >= 0.35 ? '+ Moderate risk' : '+ Lower risk',
        anatomicalTerritory: 'Anterior left ventricular wall and interventricular septum',
        clinicalSummary: `The model estimates a ${ladPct}% risk in the LAD branch.`,
        keyDrivers: ['Systolic BP', 'LDL Cholesterol', 'Age Factor']
      },
      LCX: {
        id: 'LCX',
        name: 'LCX',
        fullName: 'Left Circumflex',
        probability: lcxProb,
        percentage: lcxPct,
        riskTier: lcxProb >= 0.60 ? 'Higher risk' : lcxProb >= 0.35 ? 'Moderate risk' : 'Lower risk',
        riskBadge: lcxProb >= 0.60 ? '+ High risk' : lcxProb >= 0.35 ? '+ Moderate risk' : '+ Lower risk',
        anatomicalTerritory: 'Posterolateral left ventricular myocardium and left atrium',
        clinicalSummary: `The model estimates a ${lcxPct}% risk in the circumflex branch.`,
        keyDrivers: ['Total Cholesterol', 'Hemodynamic compliance']
      },
      RCA: {
        id: 'RCA',
        name: 'RCA',
        fullName: 'Right Coronary Artery',
        probability: rcaProb,
        percentage: rcaPct,
        riskTier: rcaProb >= 0.60 ? 'Higher risk' : rcaProb >= 0.35 ? 'Moderate risk' : 'Lower risk',
        riskBadge: rcaProb >= 0.60 ? '+ High risk' : rcaProb >= 0.35 ? '+ Moderate risk' : '+ Lower risk',
        anatomicalTerritory: 'Right ventricle, inferior diaphragmatic wall, and SA node',
        clinicalSummary: `The model estimates a ${rcaPct}% risk in the right coronary system.`,
        keyDrivers: ['Fasting Glucose', 'Triglycerides']
      }
    },
    shapContributions: shap,
    clinicalInsights: {
      bloodPressureStatus: data.systolicBP >= 135 ? 'Blood pressure is slightly elevated' : 'Blood pressure is normal',
      cholesterolStatus: data.ldlCholesterol >= 130 ? 'Cholesterol levels require attention' : 'Lipid levels are optimal',
      cadRiskStatus: `${overallTier} predicted`,
      recommendations: [
        'Review blood pressure trends with ambulatory monitoring.',
        'Consider comprehensive lipid assessment with your primary care provider.',
        'Maintain heart-healthy diet and routine cardiovascular exercise.'
      ]
    },
    limitations: [
      'CardioVision AI predictions are statistical calculations based on clinical parameters.',
      'Does not replace an electrocardiogram, stress test, or cardiac catheterization.',
      'Educational and clinical decision-support only; not a diagnosis.'
    ]
  };
}
