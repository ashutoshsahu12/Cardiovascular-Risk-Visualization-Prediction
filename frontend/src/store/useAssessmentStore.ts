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
  validateAll: () => boolean;
  getSubmissionData: () => AssessmentFormData;
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
      if (formData.age === '' || formData.age === undefined || formData.age === null) {
        newErrors.age = 'Age is required';
      } else if (Number(formData.age) < 18 || Number(formData.age) > 120) {
        newErrors.age = 'Age must be between 18 and 120';
      }

      if (formData.height === '' || formData.height === undefined || formData.height === null) {
        newErrors.height = 'Height is required';
      } else if (Number(formData.height) < 80 || Number(formData.height) > 250) {
        newErrors.height = 'Please enter a valid height (80–250 cm)';
      }

      if (formData.weight === '' || formData.weight === undefined || formData.weight === null) {
        newErrors.weight = 'Weight is required';
      } else if (Number(formData.weight) < 25 || Number(formData.weight) > 300) {
        newErrors.weight = 'Please enter a valid weight (25–300 kg)';
      }
    } else if (currentStep === 2) {
      if (formData.systolicBP === '' || formData.systolicBP === undefined || formData.systolicBP === null) {
        newErrors.systolicBP = 'Systolic blood pressure is required';
      } else if (Number(formData.systolicBP) < 70 || Number(formData.systolicBP) > 260) {
        newErrors.systolicBP = 'Systolic BP should be between 70 and 260 mmHg';
      }

      if (formData.diastolicBP === '' || formData.diastolicBP === undefined || formData.diastolicBP === null) {
        newErrors.diastolicBP = 'Diastolic blood pressure is required';
      } else if (Number(formData.diastolicBP) < 40 || Number(formData.diastolicBP) > 160) {
        newErrors.diastolicBP = 'Diastolic BP should be between 40 and 160 mmHg';
      }

      if (formData.restingHeartRate === '' || formData.restingHeartRate === undefined || formData.restingHeartRate === null) {
        newErrors.restingHeartRate = 'Resting heart rate is required';
      } else if (Number(formData.restingHeartRate) < 35 || Number(formData.restingHeartRate) > 220) {
        newErrors.restingHeartRate = 'Resting heart rate should be between 35 and 220 bpm';
      }
    } else if (currentStep === 3) {
      if (formData.totalCholesterol === '' || formData.totalCholesterol === undefined || formData.totalCholesterol === null) {
        newErrors.totalCholesterol = 'Total cholesterol is required';
      } else if (Number(formData.totalCholesterol) < 80 || Number(formData.totalCholesterol) > 600) {
        newErrors.totalCholesterol = 'Total cholesterol should be between 80 and 600 mg/dL';
      }

      if (formData.ldlCholesterol === '' || formData.ldlCholesterol === undefined || formData.ldlCholesterol === null) {
        newErrors.ldlCholesterol = 'LDL cholesterol is required';
      } else if (Number(formData.ldlCholesterol) < 20 || Number(formData.ldlCholesterol) > 400) {
        newErrors.ldlCholesterol = 'LDL cholesterol should be between 20 and 400 mg/dL';
      }

      if (formData.hdlCholesterol === '' || formData.hdlCholesterol === undefined || formData.hdlCholesterol === null) {
        newErrors.hdlCholesterol = 'HDL cholesterol is required';
      } else if (Number(formData.hdlCholesterol) < 10 || Number(formData.hdlCholesterol) > 150) {
        newErrors.hdlCholesterol = 'HDL cholesterol should be between 10 and 150 mg/dL';
      }

      if (formData.fastingBloodSugar === '' || formData.fastingBloodSugar === undefined || formData.fastingBloodSugar === null) {
        newErrors.fastingBloodSugar = 'Fasting blood sugar is required';
      } else if (Number(formData.fastingBloodSugar) < 40 || Number(formData.fastingBloodSugar) > 500) {
        newErrors.fastingBloodSugar = 'Fasting blood sugar should be between 40 and 500 mg/dL';
      }

      if (formData.triglycerides !== '' && formData.triglycerides !== undefined && formData.triglycerides !== null) {
        if (Number(formData.triglycerides) < 30 || Number(formData.triglycerides) > 1000) {
          newErrors.triglycerides = 'Triglycerides should be between 30 and 1000 mg/dL';
        }
      }

      if (formData.creatinine !== '' && formData.creatinine !== undefined && formData.creatinine !== null) {
        if (Number(formData.creatinine) < 0.2 || Number(formData.creatinine) > 15) {
          newErrors.creatinine = 'Serum creatinine should be between 0.2 and 15 mg/dL';
        }
      }
    } else if (currentStep === 4) {
      if (formData.ejectionFraction === '' || formData.ejectionFraction === undefined || formData.ejectionFraction === null) {
        newErrors.ejectionFraction = 'Ejection fraction is required';
      } else if (Number(formData.ejectionFraction) < 15 || Number(formData.ejectionFraction) > 85) {
        newErrors.ejectionFraction = 'Ejection fraction should be between 15% and 85%';
      }
    }

    set({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  },

  validateAll: () => {
    const { formData } = get();
    const newErrors: FormValidationErrors = {};
    let firstInvalidStep: number | null = null;

    // Step 1
    if (formData.age === '' || formData.age === undefined || formData.age === null) {
      newErrors.age = 'Age is required';
      if (!firstInvalidStep) firstInvalidStep = 1;
    } else if (Number(formData.age) < 18 || Number(formData.age) > 120) {
      newErrors.age = 'Age must be between 18 and 120';
      if (!firstInvalidStep) firstInvalidStep = 1;
    }

    if (formData.height === '' || formData.height === undefined || formData.height === null) {
      newErrors.height = 'Height is required';
      if (!firstInvalidStep) firstInvalidStep = 1;
    } else if (Number(formData.height) < 80 || Number(formData.height) > 250) {
      newErrors.height = 'Please enter a valid height (80–250 cm)';
      if (!firstInvalidStep) firstInvalidStep = 1;
    }

    if (formData.weight === '' || formData.weight === undefined || formData.weight === null) {
      newErrors.weight = 'Weight is required';
      if (!firstInvalidStep) firstInvalidStep = 1;
    } else if (Number(formData.weight) < 25 || Number(formData.weight) > 300) {
      newErrors.weight = 'Please enter a valid weight (25–300 kg)';
      if (!firstInvalidStep) firstInvalidStep = 1;
    }

    // Step 2
    if (formData.systolicBP === '' || formData.systolicBP === undefined || formData.systolicBP === null) {
      newErrors.systolicBP = 'Systolic blood pressure is required';
      if (!firstInvalidStep) firstInvalidStep = 2;
    } else if (Number(formData.systolicBP) < 70 || Number(formData.systolicBP) > 260) {
      newErrors.systolicBP = 'Systolic BP should be between 70 and 260 mmHg';
      if (!firstInvalidStep) firstInvalidStep = 2;
    }

    if (formData.diastolicBP === '' || formData.diastolicBP === undefined || formData.diastolicBP === null) {
      newErrors.diastolicBP = 'Diastolic blood pressure is required';
      if (!firstInvalidStep) firstInvalidStep = 2;
    } else if (Number(formData.diastolicBP) < 40 || Number(formData.diastolicBP) > 160) {
      newErrors.diastolicBP = 'Diastolic BP should be between 40 and 160 mmHg';
      if (!firstInvalidStep) firstInvalidStep = 2;
    }

    if (formData.restingHeartRate === '' || formData.restingHeartRate === undefined || formData.restingHeartRate === null) {
      newErrors.restingHeartRate = 'Resting heart rate is required';
      if (!firstInvalidStep) firstInvalidStep = 2;
    } else if (Number(formData.restingHeartRate) < 35 || Number(formData.restingHeartRate) > 220) {
      newErrors.restingHeartRate = 'Resting heart rate should be between 35 and 220 bpm';
      if (!firstInvalidStep) firstInvalidStep = 2;
    }

    // Step 3
    if (formData.totalCholesterol === '' || formData.totalCholesterol === undefined || formData.totalCholesterol === null) {
      newErrors.totalCholesterol = 'Total cholesterol is required';
      if (!firstInvalidStep) firstInvalidStep = 3;
    } else if (Number(formData.totalCholesterol) < 80 || Number(formData.totalCholesterol) > 600) {
      newErrors.totalCholesterol = 'Total cholesterol should be between 80 and 600 mg/dL';
      if (!firstInvalidStep) firstInvalidStep = 3;
    }

    if (formData.ldlCholesterol === '' || formData.ldlCholesterol === undefined || formData.ldlCholesterol === null) {
      newErrors.ldlCholesterol = 'LDL cholesterol is required';
      if (!firstInvalidStep) firstInvalidStep = 3;
    } else if (Number(formData.ldlCholesterol) < 20 || Number(formData.ldlCholesterol) > 400) {
      newErrors.ldlCholesterol = 'LDL cholesterol should be between 20 and 400 mg/dL';
      if (!firstInvalidStep) firstInvalidStep = 3;
    }

    if (formData.hdlCholesterol === '' || formData.hdlCholesterol === undefined || formData.hdlCholesterol === null) {
      newErrors.hdlCholesterol = 'HDL cholesterol is required';
      if (!firstInvalidStep) firstInvalidStep = 3;
    } else if (Number(formData.hdlCholesterol) < 10 || Number(formData.hdlCholesterol) > 150) {
      newErrors.hdlCholesterol = 'HDL cholesterol should be between 10 and 150 mg/dL';
      if (!firstInvalidStep) firstInvalidStep = 3;
    }

    if (formData.fastingBloodSugar === '' || formData.fastingBloodSugar === undefined || formData.fastingBloodSugar === null) {
      newErrors.fastingBloodSugar = 'Fasting blood sugar is required';
      if (!firstInvalidStep) firstInvalidStep = 3;
    } else if (Number(formData.fastingBloodSugar) < 40 || Number(formData.fastingBloodSugar) > 500) {
      newErrors.fastingBloodSugar = 'Fasting blood sugar should be between 40 and 500 mg/dL';
      if (!firstInvalidStep) firstInvalidStep = 3;
    }

    // Step 4
    if (formData.ejectionFraction === '' || formData.ejectionFraction === undefined || formData.ejectionFraction === null) {
      newErrors.ejectionFraction = 'Ejection fraction is required';
      if (!firstInvalidStep) firstInvalidStep = 4;
    } else if (Number(formData.ejectionFraction) < 15 || Number(formData.ejectionFraction) > 85) {
      newErrors.ejectionFraction = 'Ejection fraction should be between 15% and 85%';
      if (!firstInvalidStep) firstInvalidStep = 4;
    }

    set({ errors: newErrors });
    if (firstInvalidStep) {
      set({ currentStep: firstInvalidStep });
      return false;
    }
    return true;
  },

  getSubmissionData: (): AssessmentFormData => {
    const { formData } = get();
    return {
      ...formData,
      age: formData.age === '' ? 0 : Number(formData.age),
      height: formData.height === '' ? 0 : Number(formData.height),
      weight: formData.weight === '' ? 0 : Number(formData.weight),
      systolicBP: formData.systolicBP === '' ? 0 : Number(formData.systolicBP),
      diastolicBP: formData.diastolicBP === '' ? 0 : Number(formData.diastolicBP),
      restingHeartRate: formData.restingHeartRate === '' ? 0 : Number(formData.restingHeartRate),
      fastingBloodSugar: formData.fastingBloodSugar === '' ? 0 : Number(formData.fastingBloodSugar),
      totalCholesterol: formData.totalCholesterol === '' ? 0 : Number(formData.totalCholesterol),
      ldlCholesterol: formData.ldlCholesterol === '' ? 0 : Number(formData.ldlCholesterol),
      hdlCholesterol: formData.hdlCholesterol === '' ? 0 : Number(formData.hdlCholesterol),
      triglycerides: formData.triglycerides === '' || formData.triglycerides === undefined ? 150 : Number(formData.triglycerides),
      creatinine: formData.creatinine === '' || formData.creatinine === undefined ? undefined : Number(formData.creatinine),
      esr: formData.esr === '' || formData.esr === undefined ? undefined : Number(formData.esr),
      ejectionFraction: formData.ejectionFraction === '' ? 0 : Number(formData.ejectionFraction),
    };
  },

  resetForm: () => set({ currentStep: 1, formData: INITIAL_FORM_DATA, errors: {} }),
  loadSampleData: () => set({ formData: INITIAL_FORM_DATA, errors: {} })
}));
