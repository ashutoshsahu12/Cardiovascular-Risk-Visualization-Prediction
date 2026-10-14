import React, { useState } from 'react';
import {
  Activity,
  Droplet,
  Heart,
  ChevronRight,
  ChevronDown,
  Info,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { InsightCategory } from '../types/insights';

export const HealthInsightsPage: React.FC = () => {
  const { formData } = useAssessmentStore();
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>('bp');

  const categories: { id: InsightCategory; label: string }[] = [
    { id: 'all', label: 'All Measurements' },
    { id: 'cardiac', label: 'Cardiac Risk Factors' },
    { id: 'lab', label: 'Laboratory Results' },
    { id: 'ecg', label: 'ECG Findings' },
    { id: 'echo', label: 'Echocardiography' }
  ];

  const sbp = Number(formData.systolicBP) || 120;
  const dbp = Number(formData.diastolicBP) || 80;
  const tc = Number(formData.totalCholesterol) || 200;
  const hr = Number(formData.restingHeartRate) || 75;
  const ldl = Number(formData.ldlCholesterol) || 100;
  const fbs = Number(formData.fastingBloodSugar) || 90;
  const ef = Number(formData.ejectionFraction) || 55;

  const measurements = [
    {
      id: 'bp',
      category: 'cardiac' as InsightCategory,
      name: 'Blood Pressure',
      valueDisplay: `${formData.systolicBP || '—'} / ${formData.diastolicBP || '—'}`,
      unit: 'mmHg',
      status: sbp >= 140 ? 'elevated' : 'normal',
      statusBadge: sbp >= 140 ? 'Slightly Elevated' : 'Normal',
      badgeClass: sbp >= 140 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      minRef: 90,
      maxRef: 180,
      currentVal: sbp,
      normalMin: 90,
      normalMax: 120,
      description: 'Your blood pressure is above the usual reference range. Consider regular monitoring and lifestyle modifications.',
      clinicalNuance: 'Blood pressure fluctuates with stress, diurnal rhythm, and physical activity. Ambulatory 24-hour monitoring provides higher diagnostic fidelity than isolated clinic checks.',
      questions: [
        'Would home blood pressure monitoring be beneficial?',
        'Are dietary sodium adjustments or DASH guidelines recommended?'
      ],
      icon: Activity,
      iconColor: 'text-teal-600 bg-teal-50'
    },
    {
      id: 'chol',
      category: 'lab' as InsightCategory,
      name: 'Total Cholesterol',
      valueDisplay: `${formData.totalCholesterol || '—'}`,
      unit: 'mg/dL',
      status: tc >= 240 ? 'high' : tc >= 200 ? 'elevated' : 'normal',
      statusBadge: tc >= 240 ? 'High' : tc >= 200 ? 'Borderline' : 'Normal',
      badgeClass: tc >= 240 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200',
      minRef: 120,
      maxRef: 300,
      currentVal: tc,
      normalMin: 120,
      normalMax: 200,
      description: 'Your total cholesterol is higher than the recommended range. This may contribute to increased cardiovascular risk.',
      clinicalNuance: 'Total cholesterol combines LDL, HDL, and VLDL fractions. It should always be evaluated alongside non-HDL and ApoB markers.',
      questions: [
        'Should we evaluate non-HDL or lipoprotein(a) levels?',
        'Do lifestyle modifications suffice, or is statin therapy appropriate?'
      ],
      icon: AlertTriangle,
      iconColor: 'text-rose-600 bg-rose-50'
    },
    {
      id: 'hr',
      category: 'cardiac' as InsightCategory,
      name: 'Resting Heart Rate',
      valueDisplay: `${formData.restingHeartRate || '—'}`,
      unit: 'bpm',
      status: 'normal',
      statusBadge: 'Normal',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      minRef: 40,
      maxRef: 120,
      currentVal: hr,
      normalMin: 60,
      normalMax: 100,
      description: 'Your resting heart rate is within the usual reference range.',
      clinicalNuance: 'Resting pulse reflects autonomic tone. Elite athletes often exhibit resting bradycardia (<60 bpm), whereas sustained resting tachycardia (>90 bpm) can warrant evaluation.',
      questions: [
        'Does my heart rate increase appropriately during exercise?'
      ],
      icon: Heart,
      iconColor: 'text-emerald-600 bg-emerald-50'
    },
    {
      id: 'ldl',
      category: 'lab' as InsightCategory,
      name: 'LDL Cholesterol',
      valueDisplay: `${formData.ldlCholesterol || '—'}`,
      unit: 'mg/dL',
      status: ldl >= 160 ? 'high' : ldl >= 100 ? 'elevated' : 'normal',
      statusBadge: ldl >= 160 ? 'High' : ldl >= 100 ? 'Borderline' : 'Optimal',
      badgeClass: ldl >= 160 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200',
      minRef: 40,
      maxRef: 240,
      currentVal: ldl,
      normalMin: 40,
      normalMax: 100,
      description: 'Your LDL cholesterol is above the optimal range and may increase cardiovascular risk.',
      clinicalNuance: 'LDL is the primary atherogenic lipoprotein particle that crosses into the subendothelial arterial space.',
      questions: [
        'What is my recommended LDL target based on total 10-year risk?'
      ],
      icon: Droplet,
      iconColor: 'text-rose-600 bg-rose-50'
    },
    {
      id: 'fbs',
      category: 'lab' as InsightCategory,
      name: 'Fasting Blood Glucose',
      valueDisplay: `${formData.fastingBloodSugar || '—'}`,
      unit: 'mg/dL',
      status: fbs >= 126 ? 'high' : fbs >= 100 ? 'elevated' : 'normal',
      statusBadge: fbs >= 126 ? 'Elevated' : fbs >= 100 ? 'Prediabetic' : 'Normal',
      badgeClass: fbs >= 100 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      minRef: 60,
      maxRef: 180,
      currentVal: fbs,
      normalMin: 70,
      normalMax: 99,
      description: 'Fasting glucose is slightly above standard normal limits, indicating mild insulin resistance.',
      clinicalNuance: 'Elevated blood sugars impair endothelial nitric oxide synthase, increasing vascular stiffness.',
      questions: [
        'Should an HbA1c test be ordered to evaluate 3-month glycemic control?'
      ],
      icon: Droplet,
      iconColor: 'text-amber-600 bg-amber-50'
    },
    {
      id: 'ef',
      category: 'echo' as InsightCategory,
      name: 'Left Ventricular EF',
      valueDisplay: `${formData.ejectionFraction || '—'}`,
      unit: '%',
      status: ef >= 50 ? 'normal' : 'elevated',
      statusBadge: ef >= 50 ? 'Preserved EF' : 'Reduced EF',
      badgeClass: ef >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
      minRef: 20,
      maxRef: 80,
      currentVal: ef,
      normalMin: 50,
      normalMax: 70,
      description: 'Left ventricular systolic pump function is within preserved normal limits.',
      clinicalNuance: 'Ejection fraction measures the volumetric percentage of blood pumped out with each contraction.',
      questions: [
        'Is diastolic filling function also normal on Doppler imaging?'
      ],
      icon: Activity,
      iconColor: 'text-emerald-600 bg-emerald-50'
    }
  ];

  const filteredMeasurements = selectedCategory === 'all'
    ? measurements
    : measurements.filter((m) => m.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* 1. Header with Assessment Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        {/* Category Pills matching reference UI */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-normal">Latest Assessment:</span>
          <span className="font-bold text-slate-900">May 14, 2024</span>
        </div>
      </div>

      {/* 2. Measurements List matching Screen 5 cards */}
      <div className="space-y-3">
        {filteredMeasurements.map((m) => {
          const Icon = m.icon;
          const isExpanded = expandedCard === m.id;
          const positionPct = Math.min(
            100,
            Math.max(0, ((m.currentVal - m.minRef) / (m.maxRef - m.minRef)) * 100)
          );

          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
            >
              <div
                onClick={() => setExpandedCard(isExpanded ? null : m.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left: Name and Icon */}
                <div className="flex items-center gap-3.5 min-w-[200px]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                      {m.name}
                    </h4>
                  </div>
                </div>

                {/* Center-Left: Value & Badge */}
                <div className="flex items-baseline gap-2 min-w-[160px]">
                  <span className="text-lg font-extrabold text-slate-900">
                    {m.valueDisplay}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {m.unit}
                  </span>
                  <span className={`ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${m.badgeClass}`}>
                    {m.statusBadge}
                  </span>
                </div>

                {/* Center-Right: Visual Reference Slider Range Bar */}
                <div className="w-full md:w-48 flex flex-col justify-center">
                  <div className="relative w-full h-1.5 bg-slate-100 rounded-full">
                    {/* Normal segment highlight */}
                    <div className="absolute left-[20%] right-[35%] h-full bg-emerald-200 rounded-full" />
                    {/* Current value pin */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white shadow-sm"
                      style={{ left: `${positionPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                    <span>{m.minRef}</span>
                    <span className="text-slate-500 font-semibold">Ref Range</span>
                    <span>{m.maxRef}</span>
                  </div>
                </div>

                {/* Right: Description & Chevron */}
                <div className="flex items-center justify-between md:justify-end gap-3 flex-1">
                  <p className="text-xs text-slate-500 leading-snug line-clamp-1 hidden lg:block">
                    {m.description}
                  </p>
                  <button type="button" className="text-slate-400 hover:text-slate-700">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details Section */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/70">
                    <h5 className="font-bold text-slate-800 mb-1">
                      Clinical Significance & Context:
                    </h5>
                    <p className="text-slate-600 leading-relaxed">
                      {m.clinicalNuance}
                    </p>
                  </div>

                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100">
                    <h5 className="font-bold text-teal-900 mb-1">
                      Suggested Questions to Discuss with Your Doctor:
                    </h5>
                    <ul className="space-y-1 text-teal-800">
                      {m.questions.map((q, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
