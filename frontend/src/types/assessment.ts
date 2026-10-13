export type Sex = 'Male' | 'Female';
export type SmokingStatus = 'Never smoked' | 'Former smoker' | 'Current smoker';
export type YesNo = 'Yes' | 'No';
export type ChestPainType = 'None' | 'Typical Angina' | 'Atypical Angina' | 'Non-Anginal Pain';
export type ECGFinding = 'Normal' | 'ST Depression' | 'T Wave Inversion' | 'ST Elevation' | 'Left Ventricular Hypertrophy';
export type RWMAFinding = 'None' | 'Hypokinesia' | 'Akinesia' | 'Dyskinesia';

export interface AssessmentFormData {
  // Step 1: Basic Information
  age: number;
  sex: Sex;
  height: number; // cm
  weight: number; // kg
  smokingStatus: SmokingStatus;
  diabetes: YesNo;
  familyHistory: YesNo;
  additionalInfo?: string;

  // Step 2: Clinical Measurements
  systolicBP: number; // mmHg (e.g. 145)
  diastolicBP: number; // mmHg (e.g. 92)
  restingHeartRate: number; // bpm (e.g. 82)
  chestPainType: ChestPainType;

  // Step 3: Laboratory Results
  fastingBloodSugar: number; // mg/dL (e.g. 105)
  totalCholesterol: number; // mg/dL (e.g. 240)
  ldlCholesterol: number; // mg/dL (e.g. 160)
  hdlCholesterol: number; // mg/dL (e.g. 42)
  triglycerides: number; // mg/dL (e.g. 190)
  creatinine?: number; // mg/dL (e.g. 1.0)
  esr?: number; // mm/hr (e.g. 14)

  // Step 4: ECG and Echocardiography
  ecgFinding: ECGFinding;
  qWave: YesNo;
  ejectionFraction: number; // EF % (e.g. 55)
  rwma: RWMAFinding;
}

export interface FormValidationErrors {
  [key: string]: string;
}
