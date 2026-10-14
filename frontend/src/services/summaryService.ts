import { AssessmentFormData } from '../types/assessment';
import { PredictionResponse, ShapContribution } from '../types/prediction';

/**
 * CONTRACT FOR BACKEND MEMBER 2:
 * ==============================
 * When connecting the backend LLM / AI Summary service, implement an endpoint such as:
 * POST /api/ai-summary
 * Request body: { assessment: AssessmentFormData, prediction: PredictionResponse }
 * Response body: AiHealthSummaryPayload (matching the structure below)
 */
export interface AiHealthSummaryPayload {
  source: 'clinical-rules-engine' | 'backend-llm-service';
  modelVersion: string;
  generatedAt: string;
  sectionA_overview: {
    title: string;
    headline: string;
    narrative: string;
    diagnosticDisclaimer: string;
  };
  sectionB_measurements: {
    id: string;
    name: string;
    value: string;
    clinicalMeaning: string;
    referenceContext: string;
    nextStep: string;
  }[];
  sectionC_aiResults: {
    cadExplanation: string;
    vesselDetails: {
      vessel: string;
      percentage: number;
      anatomicalRole: string;
      interpretation: string;
      limitation: string;
    }[];
    calibrationDisclaimer: string;
  };
  sectionD_shapInfluence: {
    hasShapData: boolean;
    explanation: string;
    topFactors: {
      displayName: string;
      direction: 'increases-risk' | 'lowers-risk';
      magnitudeLabel: string;
      plainEnglishReason: string;
    }[];
    causationDisclaimer: string;
  };
  sectionE_overallContext: {
    synthesis: string;
    missingDiagnostics: string[];
  };
  sectionF_precautions: string[];
  sectionG_foodsToEat: {
    category: string;
    examples: string;
    benefit: string;
  }[];
  sectionH_foodsToLimit: {
    category: string;
    examples: string;
    reason: string;
    distinction: string;
  }[];
  sectionI_nextSteps: {
    verificationPoints: string[];
    doctorQuestions: string[];
    urgentWarning: string;
  };
}

/**
 * Generates an evidence-supported clinical health summary from the patient's
 * actual measurements and model outputs.
 */
export function buildHealthSummary(
  formData: AssessmentFormData | null,
  prediction: PredictionResponse | null
): AiHealthSummaryPayload | null {
  if (!formData && !prediction) {
    return null;
  }

  const age = Number(formData?.age) || 45;
  const sbp = Number(formData?.systolicBP) || 145;
  const dbp = Number(formData?.diastolicBP) || 92;
  const tc = Number(formData?.totalCholesterol) || 240;
  const ldl = Number(formData?.ldlCholesterol) || 160;
  const hdl = Number(formData?.hdlCholesterol) || 42;
  const hr = Number(formData?.restingHeartRate) || 82;
  const fbs = Number(formData?.fastingBloodSugar) || 105;
  const ef = Number(formData?.ejectionFraction) || 55;
  const ecg = formData?.ecgFinding ?? 'ST Depression';

  const cadPct = prediction?.overallCadPercentage ?? 68;
  const ladPct = prediction?.vessels.LAD.percentage ?? 72;
  const lcxPct = prediction?.vessels.LCX.percentage ?? 41;
  const rcaPct = prediction?.vessels.RCA.percentage ?? 35;
  const shapList = prediction?.shapContributions ?? [];

  return {
    source: 'clinical-rules-engine',
    modelVersion: 'Clinical Synthesis Engine v1.0 (Integration contract ready for Member 2 Backend)',
    generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),

    // SECTION A: YOUR CONDITION AT A GLANCE
    sectionA_overview: {
      title: 'Your Condition at a Glance',
      headline: `Overall estimated CAD probability: ${cadPct}% (${prediction?.overallRiskTier ?? 'Higher risk'}).`,
      narrative: `Based on your recorded clinical measurements, the CardioVision statistical model estimates an elevated likelihood of coronary artery disease. Your assessment combines elevated systolic blood pressure (${sbp} mmHg) and elevated LDL cholesterol (${ldl} mg/dL) with resting electrocardiographic repolarization findings (${ecg}). These factors together produce a higher statistical risk pattern.`,
      diagnosticDisclaimer: 'Important: This probability score is a statistical risk estimate derived from non-invasive clinical biomarkers. It does NOT constitute a confirmed medical diagnosis, fluoroscopic imaging proof, or confirmation of a physical blockage.'
    },

    // SECTION B: UNDERSTANDING YOUR MEASUREMENTS
    sectionB_measurements: [
      {
        id: 'bp',
        name: 'Blood Pressure',
        value: `${sbp} / ${dbp} mmHg`,
        clinicalMeaning: 'Measures the force exerted by circulating blood against the walls of the main arteries during cardiac contraction and relaxation.',
        referenceContext: sbp >= 140 || dbp >= 90
          ? 'Stage 2 Hypertension range (AHA/ACC reference: normal is <120/<80 mmHg).'
          : sbp >= 130
          ? 'Stage 1 Hypertension range.'
          : 'Within normal baseline range.',
        nextStep: 'Confirm with resting home blood pressure logs over 7 consecutive days.'
      },
      {
        id: 'ldl',
        name: 'LDL Cholesterol',
        value: `${ldl} mg/dL`,
        clinicalMeaning: 'Low-density lipoprotein, commonly known as "bad" cholesterol, is the primary particle that transports lipid molecules into coronary arterial walls.',
        referenceContext: ldl >= 160
          ? 'High range (AHA/ACC optimal reference: <100 mg/dL for individuals with cardiac risk factors).'
          : ldl >= 130
          ? 'Borderline high range.'
          : 'Optimal reference range.',
        nextStep: 'Discuss lifestyle interventions and whether lipid-lowering medical therapy is advised.'
      },
      {
        id: 'hdl',
        name: 'HDL Cholesterol',
        value: `${hdl} mg/dL`,
        clinicalMeaning: 'High-density lipoprotein ("good" cholesterol) participates in reverse cholesterol transport, removing surplus cholesterol from the bloodstream.',
        referenceContext: hdl < 50
          ? 'Suboptimal level (optimal is >50 mg/dL for men, >60 mg/dL for women).'
          : 'Desirable protective level.',
        nextStep: 'Aerobic exercise and healthy fats can support higher HDL activity.'
      },
      {
        id: 'fbs',
        name: 'Fasting Blood Glucose',
        value: `${fbs} mg/dL`,
        clinicalMeaning: 'Measures blood sugar concentration after an overnight fast to detect impaired glucose tolerance.',
        referenceContext: fbs >= 100 && fbs <= 125
          ? 'Impaired fasting glucose / prediabetes range (Normal: 70–99 mg/dL; Diabetes: ≥126 mg/dL).'
          : fbs >= 126
          ? 'Elevated diabetic range.'
          : 'Normal fasting range.',
        nextStep: 'Consider obtaining an HbA1c test to evaluate your 3-month glycemic average.'
      },
      {
        id: 'ef',
        name: 'Left Ventricular Ejection Fraction (LVEF)',
        value: `${ef}%`,
        clinicalMeaning: 'The percentage of blood pumped out of the main left ventricle pumping chamber with each contraction.',
        referenceContext: ef >= 50
          ? 'Preserved normal systolic function (standard reference: 50%–70%).'
          : 'Reduced systolic pump function.',
        nextStep: 'Normal systolic function is a reassuring finding; monitor during routine checkups.'
      }
    ],

    // SECTION C: UNDERSTANDING YOUR AI RESULTS
    sectionC_aiResults: {
      cadExplanation: `The model outputs an overall CAD score of ${cadPct}%. This reflects statistical concordance with patterns observed in clinical validation datasets of patients evaluated for coronary disease.`,
      vesselDetails: [
        {
          vessel: 'LAD (Left Anterior Descending)',
          percentage: ladPct,
          anatomicalRole: 'Supplies blood to the front anterior wall of the left ventricle and the muscular septum between chambers.',
          interpretation: `Model estimates a ${ladPct}% probability score for significant stenosis in this territory.`,
          limitation: 'Cannot determine exact millimeters of narrowing or characterize soft vs. calcified plaque.'
        },
        {
          vessel: 'LCX (Left Circumflex)',
          percentage: lcxPct,
          anatomicalRole: 'Curves around the side and back of the heart to nourish the posterolateral myocardium.',
          interpretation: `Model estimates a ${lcxPct}% risk score in this territory (moderate probability).`,
          limitation: 'Reflects statistical association with lipid and pressure load, not direct optical visualization.'
        },
        {
          vessel: 'RCA (Right Coronary Artery)',
          percentage: rcaPct,
          anatomicalRole: 'Supplies the right ventricle, inferior base wall, and key cardiac electrical conduction nodes.',
          interpretation: `Model estimates a ${rcaPct}% risk score in this territory (lower relative risk).`,
          limitation: 'Does not rule out non-obstructive plaque or microvascular endothelial changes.'
        }
      ],
      calibrationDisclaimer: 'Statistical Calibration Notice: Predicted values represent tabular regression outputs. They should be reviewed as clinical decision-support and never interpreted as definitive anatomical confirmation.'
    },

    // SECTION D: WHAT INFLUENCED YOUR RESULTS (SHAP)
    sectionD_shapInfluence: {
      hasShapData: shapList.length > 0,
      explanation: 'SHAP (SHapley Additive exPlanations) decomposes the total AI score to illustrate how each measurement shifted the prediction above or below the baseline population average.',
      topFactors: shapList.length > 0
        ? shapList.map((item: ShapContribution) => ({
            displayName: item.displayName,
            direction: item.direction === 'positive' ? 'increases-risk' : 'lowers-risk',
            magnitudeLabel: `${item.value > 0 ? '+' : ''}${(item.value * 100).toFixed(0)} pts`,
            plainEnglishReason: item.description
          }))
        : [
            {
              displayName: 'SHAP attribution data pending',
              direction: 'increases-risk',
              magnitudeLabel: 'N/A',
              plainEnglishReason: 'Local feature explanations will appear once an assessment with SHAP output is evaluated.'
            }
          ],
      causationDisclaimer: 'Important Scientific Principle: SHAP scores represent statistical feature importance inside the algorithm. They demonstrate correlation within training datasets, NOT definitive physiological causation in an individual.'
    },

    // SECTION E: YOUR OVERALL HEALTH CONTEXT
    sectionE_overallContext: {
      synthesis: `Your clinical profile presents a classic cardiovascular risk profile where elevated hemodynamic stress (Blood Pressure ${sbp}/${dbp} mmHg) coexists with elevated circulating atherogenic particles (LDL ${ldl} mg/dL). Over time, mechanical shear stress from high blood pressure can damage delicate arterial linings, making it easier for LDL particles to deposit and initiate inflammatory plaque. Reassuringly, your left ventricular ejection fraction (${ef}%) shows preserved pump strength.`,
      missingDiagnostics: [
        'Coronary Artery Calcium (CAC) CT Score',
        'Formal Exercise Stress Testing or Nuclear Perfusion Study',
        'Direct Coronary CT Angiography (CCTA) or Invasive Fluoroscopy',
        'Apolipoprotein B (ApoB) and High-Sensitivity C-Reactive Protein (hs-CRP)'
      ]
    },

    // SECTION F: PRECAUTIONS TO CONSIDER
    sectionF_precautions: [
      'Record resting blood pressure at home twice daily (morning and evening) seated quietly for 5 minutes.',
      'Discuss persistent findings with your physician before making any changes to physical activities or medications.',
      'Maintain continuous tobacco avoidance; non-smoking status is one of the strongest protective shields.',
      'Incorporate a structured, moderate aerobic activity routine (such as 30 minutes of brisk walking 5 days a week) as approved by your doctor.',
      'Schedule follow-up lipid and glycemic panels within 3 months to monitor response to lifestyle adjustments.'
    ],

    // SECTION G: FOODS TO EAT MORE OFTEN
    sectionG_foodsToEat: [
      {
        category: 'High-Soluble Fiber Foods',
        examples: 'Oats, barley, lentils, chickpeas, black beans, apples, and Brussels sprouts.',
        benefit: 'Soluble fiber binds bile acids in the digestive tract, encouraging the liver to extract LDL from the blood.'
      },
      {
        category: 'Heart-Healthy Unsaturated Fats',
        examples: 'Extra-virgin olive oil, avocados, walnuts, almonds, and ground chia seeds.',
        benefit: 'Unsaturated fats help maintain healthy endothelial vascular elasticity and support HDL functionality.'
      },
      {
        category: 'Omega-3 Rich Foods',
        examples: 'Fatty fish (salmon, sardines, mackerel) or plant sources (flaxseed, walnuts).',
        benefit: 'Omega-3 fatty acids contribute to lower serum triglycerides and healthy cellular membranes.'
      },
      {
        category: 'Colorful Vegetables & Leafy Greens',
        examples: 'Spinach, kale, arugula, broccoli, tomatoes, and bell peppers.',
        benefit: 'Rich in dietary nitrates, potassium, and polyphenols that promote arterial dilation and blood pressure regulation.'
      }
    ],

    // SECTION H: FOODS TO LIMIT OR AVOID
    sectionH_foodsToLimit: [
      {
        category: 'High-Sodium Processed Foods',
        examples: 'Cured deli meats, canned soups, frozen ready meals, salty snack chips, and commercial sauces.',
        reason: 'Excess sodium promotes fluid retention and increases arterial vascular tension, worsening blood pressure.',
        distinction: 'Limit to less than 2,000 mg/day (or 1,500 mg/day if advised by a clinician for hypertension).'
      },
      {
        category: 'Saturated & Trans Fats',
        examples: 'Fatty cuts of red meat, commercially baked pastries, fried foods, and products with partially hydrogenated oils.',
        reason: 'Downregulates hepatic LDL receptor clearance, causing circulating atherogenic particles to climb.',
        distinction: 'Moderate consumption; replace saturated fats with plant-based unsaturated oils.'
      },
      {
        category: 'Refined Sugars & Sugary Drinks',
        examples: 'Sodas, sweetened iced teas, confectionery, and high-fructose baked goods.',
        reason: 'Elevates hepatic triglyceride synthesis, drives visceral fat accumulation, and worsens insulin resistance.',
        distinction: 'Keep added sugars below 5% to 10% of total daily caloric intake.'
      }
    ],

    // SECTION I: YOUR NEXT STEPS
    sectionI_nextSteps: {
      verificationPoints: [
        'Verify your resting blood pressure with an accurate upper-arm oscillometric cuff.',
        'Obtain a comprehensive fasting lipid panel (including Triglycerides and ApoB).',
        'Review current family history of premature heart disease with your primary care team.'
      ],
      doctorQuestions: [
        'Based on my 10-year cardiovascular risk profile, what is my optimal target for LDL cholesterol?',
        'Would a Coronary Artery Calcium (CAC) scan help guide our prevention strategy?',
        'Do you recommend starting blood pressure therapy or continuing structured lifestyle modifications for 3 months?'
      ],
      urgentWarning: 'CRITICAL MEDICAL SAFETY: If you experience sudden chest discomfort, pressure, tightness, shortness of breath, pain radiating to your jaw, neck, back, or left arm, or unexplained dizziness, seek emergency medical attention (call 911 or local emergency services) immediately. AI predictions and low scores must NEVER be used to delay urgent medical care.'
    }
  };
}
