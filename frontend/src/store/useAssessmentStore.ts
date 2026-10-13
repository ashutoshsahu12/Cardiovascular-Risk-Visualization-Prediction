import { create } from 'zustand';
import { AssessmentFormData, FormValidationErrors } from '../types/assessment';

export const INITIAL_FORM_DATA: AssessmentFormData = {
  // Step 1: Basic Information
  age: 45,
  sex: 'Male',
  height: 170,
  weight: 72,
  smokingStatus: 'Never smoked',
  diabetes: 'No',
  familyHistory: 'Yes',
  additionalInfo: 'Previous mild hypertension noted during routine annual checkup.',

  // Step 2: Clinical Measurements
  systolicBP: 145,
  diastolicBP: 92,
  restingHeartRate: 82,
  chestPainType: 'Typical Angina',

  // Step 3: Laboratory Results
  fastingBloodSugar: 105,
  totalCholesterol: 240,
  ldlCholesterol: 160,
  hdlCholesterol: 42,
  triglycerides: 190,
  creatinine: 1.0,
  esr: 14,

  // Step 4: ECG and Echocardiography
  ecgFinding: 'ST Depression',
  qWave: 'No',
  ejectionFraction: 55,
  rwma: 'Hypokinesia'
};

interface AssessmentStore {
  currentStep: number;
  formData: AssessmentFormData;
  errors: FormValidationErrors;
  setCurrentStep: (step: number) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  updateField: <K extends keyof AssessmentFormData>(field: K, value: AssessmentFormData[K]) => void;
  validateCurrentStep: () => boolean;
  resetForm: () => void;
  loadSampleData: () => void;
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  currentStep: 1,
  formData: INITIAL_FORM_DATA,
  errors: {},

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const isValid = get().validateCurrentStep();
    if (isValid && get().currentStep < 5) {
      set({ currentStep: get().currentStep + 1 });
      return true;
    }
    return isValid;
  },

  prevStep: () => {
    if (get().currentStep > 1) {
      set({ currentStep: get().currentStep - 1 });
    }
  },

  updateField: (field, value) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
      errors: { ...state.errors, [field]: '' }
    }));
  },

  validateCurrentStep: () => {
    const { currentStep, formData } = get();
    const newErrors: FormValidationErrors = {};

    if (currentStep === 1) {
      if (!formData.age || formData.age < 18 || formData.age > 120) {
        newErrors.age = 'Age must be between 18 and 120';
      }
      if (!formData.height || formData.height < 80 || formData.height > 250) {
        newErrors.height = 'Please enter a valid height in cm';
      }
      if (!formData.weight || formData.weight < 25 || formData.weight > 300) {
        newErrors.weight = 'Please enter a valid weight in kg';
      }
    } else if (currentStep === 2) {
      if (!formData.systolicBP || formData.systolicBP < 70 || formData.systolicBP > 260) {
        newErrors.systolicBP = 'Systolic BP should be between 70 and 260 mmHg';
      }
      if (!formData.diastolicBP || formData.diastolicBP < 40 || formData.diastolicBP > 160) {
        newErrors.diastolicBP = 'Diastolic BP should be between 40 and 160 mmHg';
      }
      if (!formData.restingHeartRate || formData.restingHeartRate < 35 || formData.restingHeartRate > 220) {
        newErrors.restingHeartRate = 'Resting heart rate should be between 35 and 220 bpm';
      }
    } else if (currentStep === 3) {
      if (!formData.totalCholesterol || formData.totalCholesterol < 80 || formData.totalCholesterol > 600) {
        newErrors.totalCholesterol = 'Total cholesterol should be between 80 and 600 mg/dL';
      }
      if (!formData.ldlCholesterol || formData.ldlCholesterol < 20 || formData.ldlCholesterol > 400) {
        newErrors.ldlCholesterol = 'LDL cholesterol should be between 20 and 400 mg/dL';
      }
      if (!formData.hdlCholesterol || formData.hdlCholesterol < 10 || formData.hdlCholesterol > 150) {
        newErrors.hdlCholesterol = 'HDL cholesterol should be between 10 and 150 mg/dL';
      }
      if (!formData.fastingBloodSugar || formData.fastingBloodSugar < 40 || formData.fastingBloodSugar > 500) {
        newErrors.fastingBloodSugar = 'Fasting blood sugar should be between 40 and 500 mg/dL';
      }
    } else if (currentStep === 4) {
      if (!formData.ejectionFraction || formData.ejectionFraction < 15 || formData.ejectionFraction > 85) {
        newErrors.ejectionFraction = 'Ejection fraction should be between 15% and 85%';
      }
    }

    set({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  },

  resetForm: () => set({ currentStep: 1, formData: INITIAL_FORM_DATA, errors: {} }),
  loadSampleData: () => set({ formData: INITIAL_FORM_DATA, errors: {} })
}));
