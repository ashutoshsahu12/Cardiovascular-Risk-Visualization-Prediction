import React from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { usePredictionStore } from '../store/usePredictionStore';
import { useSummaryStore } from '../store/useSummaryStore';
import { NavTab } from '../components/layout/Sidebar';
import { Sex, SmokingStatus, YesNo, ChestPainType, ECGFinding, RWMAFinding } from '../types/assessment';

interface AssessmentPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ onNavigate }) => {
  const { openSummary } = useSummaryStore();
  const {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    formData,
    updateField,
    errors,
    resetForm,
    loadSampleData
  } = useAssessmentStore();

  const { runPrediction, isLoading } = usePredictionStore();

  const steps = [
    { number: 1, title: 'Basic Information' },
    { number: 2, title: 'Clinical Measurements' },
    { number: 3, title: 'Laboratory Results' },
    { number: 4, title: 'ECG & Echocardiography' },
    { number: 5, title: 'Review & Submit' }
  ];

  const handleSubmit = async () => {
    const success = await runPrediction(formData);
    if (success) {
      onNavigate('results');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Multi-Step Progress Stepper matching reference UI */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="relative flex items-center justify-between">
          {/* Background Connecting Line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />

          {steps.map((s) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;

            return (
              <div
                key={s.number}
                className="relative z-10 flex flex-col items-center group cursor-pointer"
                onClick={() => {
                  if (s.number < currentStep) setCurrentStep(s.number);
                }}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.number}
                </div>
                <span
                  className={`text-[11px] mt-2 font-medium hidden sm:block whitespace-nowrap ${
                    isCurrent ? 'text-teal-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Step Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {/* Sample Data Quick Loader */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentStep === 1 && 'Provide your basic details to begin the assessment.'}
              {currentStep === 2 && 'Enter standard vitals and resting clinical measurements.'}
              {currentStep === 3 && 'Provide lipid panel and biochemical laboratory findings.'}
              {currentStep === 4 && 'Enter diagnostic electrocardiographic and echocardiographic parameters.'}
              {currentStep === 5 && 'Verify all measurements before generating AI predictions.'}
            </p>
          </div>
          <button
            type="button"
            onClick={loadSampleData}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Reference Clinical Profile</span>
          </button>
        </div>

        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Age *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateField('age', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      years
                    </span>
                  </div>
                  {errors.age && <p className="text-[11px] text-rose-500 mt-1">{errors.age}</p>}
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sex *
                  </label>
                  <div className="flex items-center gap-4 py-2">
                    {(['Male', 'Female'] as Sex[]).map((gender) => (
                      <label key={gender} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="radio"
                          name="sex"
                          checked={formData.sex === gender}
                          onChange={() => updateField('sex', gender)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span>{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Height
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => updateField('height', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Weight
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Additional Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Smoking */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Smoking Status
                  </label>
                  <select
                    value={formData.smokingStatus}
                    onChange={(e) => updateField('smokingStatus', e.target.value as SmokingStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  >
                    <option value="Never smoked">Never smoked</option>
                    <option value="Former smoker">Former smoker</option>
                    <option value="Current smoker">Current smoker</option>
                  </select>
                </div>

                {/* Diabetes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Diabetes
                  </label>
                  <select
                    value={formData.diabetes}
                    onChange={(e) => updateField('diabetes', e.target.value as YesNo)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Family History */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Family History of Heart Disease
                  </label>
                  <select
                    value={formData.familyHistory}
                    onChange={(e) => updateField('familyHistory', e.target.value as YesNo)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Other info */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Other Relevant Information (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. previous medical conditions, current medications..."
                  value={formData.additionalInfo || ''}
                  onChange={(e) => updateField('additionalInfo', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Clinical Measurements */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Systolic BP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Systolic Blood Pressure *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.systolicBP}
                    onChange={(e) => updateField('systolicBP', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mmHg
                  </span>
                </div>
                {errors.systolicBP && <p className="text-[11px] text-rose-500 mt-1">{errors.systolicBP}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Normal standard: 90–120 mmHg</p>
              </div>

              {/* Diastolic BP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Diastolic Blood Pressure *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.diastolicBP}
                    onChange={(e) => updateField('diastolicBP', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mmHg
                  </span>
                </div>
                {errors.diastolicBP && <p className="text-[11px] text-rose-500 mt-1">{errors.diastolicBP}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Normal standard: 60–80 mmHg</p>
              </div>

              {/* Resting Heart Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resting Heart Rate *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.restingHeartRate}
                    onChange={(e) => updateField('restingHeartRate', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    bpm
                  </span>
                </div>
                {errors.restingHeartRate && <p className="text-[11px] text-rose-500 mt-1">{errors.restingHeartRate}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Normal resting rate: 60–100 bpm</p>
              </div>

              {/* Chest Pain Classification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chest Pain / Angina Classification
                </label>
                <select
                  value={formData.chestPainType}
                  onChange={(e) => updateField('chestPainType', e.target.value as ChestPainType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                >
                  <option value="None">None (Asymptomatic)</option>
                  <option value="Typical Angina">Typical Angina (Exertional chest discomfort)</option>
                  <option value="Atypical Angina">Atypical Angina</option>
                  <option value="Non-Anginal Pain">Non-Anginal Pain</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Laboratory Results */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Cholesterol */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Total Cholesterol *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.totalCholesterol}
                    onChange={(e) => updateField('totalCholesterol', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mg/dL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Desirable: &lt; 200 mg/dL</p>
              </div>

              {/* LDL Cholesterol */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  LDL Cholesterol *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.ldlCholesterol}
                    onChange={(e) => updateField('ldlCholesterol', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mg/dL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Optimal: &lt; 100 mg/dL</p>
              </div>

              {/* HDL Cholesterol */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  HDL Cholesterol *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.hdlCholesterol}
                    onChange={(e) => updateField('hdlCholesterol', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mg/dL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Desirable: &gt; 40–50 mg/dL</p>
              </div>

              {/* Triglycerides */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Triglycerides
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.triglycerides}
                    onChange={(e) => updateField('triglycerides', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mg/dL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Normal: &lt; 150 mg/dL</p>
              </div>

              {/* Fasting Blood Sugar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fasting Blood Sugar *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.fastingBloodSugar}
                    onChange={(e) => updateField('fastingBloodSugar', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mg/dL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Normal: 70–99 mg/dL</p>
              </div>

              {/* Serum Creatinine */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Serum Creatinine
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.creatinine || 1.0}
                    onChange={(e) => updateField('creatinine', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    mg/dL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Normal: 0.7–1.3 mg/dL</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ECG and Echocardiography */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ECG Findings */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resting ECG ST-T Wave Findings
                </label>
                <select
                  value={formData.ecgFinding}
                  onChange={(e) => updateField('ecgFinding', e.target.value as ECGFinding)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                >
                  <option value="Normal">Normal sinus repolarization</option>
                  <option value="ST Depression">ST Depression (subendocardial ischemia pattern)</option>
                  <option value="T Wave Inversion">T Wave Inversion</option>
                  <option value="ST Elevation">ST Elevation</option>
                  <option value="Left Ventricular Hypertrophy">Left Ventricular Hypertrophy (LVH)</option>
                </select>
              </div>

              {/* Pathological Q Wave */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pathological Q Wave Present
                </label>
                <select
                  value={formData.qWave}
                  onChange={(e) => updateField('qWave', e.target.value as YesNo)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {/* Ejection Fraction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Left Ventricular Ejection Fraction (LVEF) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.ejectionFraction}
                    onChange={(e) => updateField('ejectionFraction', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
                {errors.ejectionFraction && <p className="text-[11px] text-rose-500 mt-1">{errors.ejectionFraction}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Normal EF: 50%–70%</p>
              </div>

              {/* RWMA */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Regional Wall Motion Abnormality (RWMA)
                </label>
                <select
                  value={formData.rwma}
                  onChange={(e) => updateField('rwma', e.target.value as RWMAFinding)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                >
                  <option value="None">None (Normal uniform contractility)</option>
                  <option value="Hypokinesia">Hypokinesia (Diminished regional wall motion)</option>
                  <option value="Akinesia">Akinesia (Absence of systolic thickening)</option>
                  <option value="Dyskinesia">Dyskinesia</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review and Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-950 space-y-1">
                <p className="font-bold">Feature Contract Compliance Verified</p>
                <p className="text-teal-800">
                  Target catheterization labels (LAD, LCX, RCA, Cath) are strictly excluded from input features. Model inferences will be generated solely from demographic, clinical, lipid, and diagnostic observations.
                </p>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800">Basic & Vitals</span>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-teal-600 hover:underline">Edit</button>
                </div>
                <p><span className="text-slate-500">Demographics:</span> {formData.age} yrs, {formData.sex}, {formData.height} cm, {formData.weight} kg</p>
                <p><span className="text-slate-500">Blood Pressure:</span> {formData.systolicBP} / {formData.diastolicBP} mmHg</p>
                <p><span className="text-slate-500">Heart Rate:</span> {formData.restingHeartRate} bpm</p>
                <p><span className="text-slate-500">Smoking / Diabetes:</span> {formData.smokingStatus} / Diabetes: {formData.diabetes}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800">Labs & Diagnostics</span>
                  <button type="button" onClick={() => setCurrentStep(3)} className="text-teal-600 hover:underline">Edit</button>
                </div>
                <p><span className="text-slate-500">Lipid Panel:</span> Total {formData.totalCholesterol}, LDL {formData.ldlCholesterol}, HDL {formData.hdlCholesterol} mg/dL</p>
                <p><span className="text-slate-500">Blood Glucose:</span> {formData.fastingBloodSugar} mg/dL</p>
                <p><span className="text-slate-500">ECG Findings:</span> {formData.ecgFinding} (Q wave: {formData.qWave})</p>
                <p><span className="text-slate-500">Echocardiography:</span> LVEF {formData.ejectionFraction}%, RWMA: {formData.rwma}</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Action Buttons at Bottom */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all hover:shadow"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => openSummary('assessment')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/70 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Summarize My Condition</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all hover:shadow disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Risk with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Risk Predictions</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
