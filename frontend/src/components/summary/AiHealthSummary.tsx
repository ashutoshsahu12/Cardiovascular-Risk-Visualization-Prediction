import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Heart,
  Activity,
  ShieldCheck,
  Utensils,
  Ban,
  ArrowRight,
  Info,
  Clock,
  HelpCircle,
  FileQuestion,
  Plus
} from 'lucide-react';
import { useAssessmentStore } from '../../store/useAssessmentStore';
import { usePredictionStore } from '../../store/usePredictionStore';
import { buildHealthSummary, AiHealthSummaryPayload } from '../../services/summaryService';
import { SummaryEntryPoint } from '../../store/useSummaryStore';

interface AiHealthSummaryProps {
  entryPoint?: SummaryEntryPoint;
  onNavigateToAssessment?: () => void;
  onClose?: () => void;
}

export const AiHealthSummary: React.FC<AiHealthSummaryProps> = ({
  entryPoint = 'dashboard',
  onNavigateToAssessment,
  onClose
}) => {
  const { formData } = useAssessmentStore();
  const { currentPrediction, isLoading } = usePredictionStore();

  // Accordion section state (Section A open by default, users can toggle any)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sectionA: true,
    sectionB: true,
    sectionC: false,
    sectionD: false,
    sectionE: false,
    sectionF: false,
    sectionG: false,
    sectionH: false,
    sectionI: true
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const expandAll = () => {
    setOpenSections({
      sectionA: true,
      sectionB: true,
      sectionC: true,
      sectionD: true,
      sectionE: true,
      sectionF: true,
      sectionG: true,
      sectionH: true,
      sectionI: true
    });
  };

  const collapseAll = () => {
    setOpenSections({
      sectionA: true,
      sectionB: false,
      sectionC: false,
      sectionD: false,
      sectionE: false,
      sectionF: false,
      sectionG: false,
      sectionH: false,
      sectionI: false
    });
  };

  // Build the structured summary payload using centralized rules engine / backend contract
  const summary: AiHealthSummaryPayload | null = buildHealthSummary(formData, currentPrediction);

  // Missing data state handling: if neither assessment inputs nor predictions are present
  if (!formData && !currentPrediction) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">No Assessment Recorded Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            To generate your Personal AI Health Summary, please complete a clinical assessment first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            onNavigateToAssessment?.();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Start New Assessment</span>
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. Header & Source Transparency Badge */}
      <div className="bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-transparent p-5 rounded-2xl border border-teal-500/20 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Your Personal AI Health Summary
              </h2>
              <p className="text-xs text-slate-500">
                Clear, evidence-supported clinical synthesis of your measurements and model estimates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] self-start sm:self-auto">
            <button
              type="button"
              onClick={expandAll}
              className="text-teal-700 hover:underline font-semibold"
            >
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-slate-500 hover:underline"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Integration notice */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-md border border-teal-200/60 font-semibold text-teal-800">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>CardioVision Clinical Rules Synthesis</span>
          </span>
          <span className="text-slate-400">• Generated {summary.generatedAt}</span>
          <span className="text-slate-400">• Entry: {entryPoint.toUpperCase()}</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION A: YOUR CONDITION AT A GLANCE */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionA')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              A
            </span>
            <span className="text-sm font-bold text-slate-900">
              {summary.sectionA_overview.title}
            </span>
          </div>
          {openSections.sectionA ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionA && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-100 text-teal-950 font-semibold">
              {summary.sectionA_overview.headline}
            </div>
            <p className="text-slate-600">
              {summary.sectionA_overview.narrative}
            </p>
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>{summary.sectionA_overview.diagnosticDisclaimer}</p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION B: UNDERSTANDING YOUR MEASUREMENTS */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionB')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              B
            </span>
            <span className="text-sm font-bold text-slate-900">
              Understanding Your Measurements
            </span>
          </div>
          {openSections.sectionB ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionB && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.sectionB_measurements.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="font-extrabold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                      {m.value}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-snug">{m.clinicalMeaning}</p>
                  <p className="text-slate-500 text-[11px]"><strong className="text-slate-700">Reference Context:</strong> {m.referenceContext}</p>
                  <p className="text-teal-700 text-[11px]"><strong className="text-teal-900">Next Step:</strong> {m.nextStep}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION C: UNDERSTANDING YOUR AI RESULTS */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionC')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              C
            </span>
            <span className="text-sm font-bold text-slate-900">
              Understanding Your AI Results
            </span>
          </div>
          {openSections.sectionC ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionC && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs leading-relaxed">
            <p className="text-slate-700 font-medium">{summary.sectionC_aiResults.cadExplanation}</p>
            <div className="space-y-2.5">
              {summary.sectionC_aiResults.vesselDetails.map((v) => (
                <div key={v.vessel} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{v.vessel}</span>
                    <span className="font-bold text-slate-800">{v.percentage}% Risk Score</span>
                  </div>
                  <p className="text-slate-600"><strong className="text-slate-700">Anatomical Role:</strong> {v.anatomicalRole}</p>
                  <p className="text-slate-600"><strong className="text-slate-700">Interpretation:</strong> {v.interpretation}</p>
                  <p className="text-slate-500 text-[11px]"><strong className="text-slate-700">Model Limitation:</strong> {v.limitation}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 italic">{summary.sectionC_aiResults.calibrationDisclaimer}</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION D: WHAT INFLUENCED YOUR RESULTS? (SHAP) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionD')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              D
            </span>
            <span className="text-sm font-bold text-slate-900">
              What Influenced Your Results? (Model Attributions)
            </span>
          </div>
          {openSections.sectionD ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionD && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs leading-relaxed">
            <p className="text-slate-600">{summary.sectionD_shapInfluence.explanation}</p>
            <div className="space-y-2">
              {summary.sectionD_shapInfluence.topFactors.map((f, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{f.displayName}</p>
                    <p className="text-slate-600 text-[11px]">{f.plainEnglishReason}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 ${
                    f.direction === 'increases-risk' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}>
                    {f.magnitudeLabel}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px] flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p>{summary.sectionD_shapInfluence.causationDisclaimer}</p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION E: YOUR OVERALL HEALTH CONTEXT */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionE')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              E
            </span>
            <span className="text-sm font-bold text-slate-900">
              Your Overall Health Context
            </span>
          </div>
          {openSections.sectionE ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionE && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs leading-relaxed">
            <p className="text-slate-700">{summary.sectionE_overallContext.synthesis}</p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
              <span className="font-bold text-slate-800">Diagnostic Tests Not Available in Tabular Assessment:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                {summary.sectionE_overallContext.missingDiagnostics.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION F: PRECAUTIONS TO CONSIDER */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionF')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              F
            </span>
            <span className="text-sm font-bold text-slate-900">
              Precautions to Consider
            </span>
          </div>
          {openSections.sectionF ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionF && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-2 text-xs leading-relaxed">
            <ul className="space-y-2 text-slate-700">
              {summary.sectionF_precautions.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION G: FOODS TO EAT MORE OFTEN */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionG')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              G
            </span>
            <span className="text-sm font-bold text-slate-900">
              Foods to Eat More Often
            </span>
          </div>
          {openSections.sectionG ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionG && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.sectionG_foodsToEat.map((food, i) => (
                <div key={i} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{food.category}</span>
                  </div>
                  <p className="text-slate-700"><strong className="text-slate-800">Examples:</strong> {food.examples}</p>
                  <p className="text-slate-600 text-[11px]">{food.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION H: FOODS TO LIMIT OR AVOID */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionH')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
              H
            </span>
            <span className="text-sm font-bold text-slate-900">
              Foods to Limit or Moderate
            </span>
          </div>
          {openSections.sectionH ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionH && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-3 text-xs leading-relaxed">
            <div className="space-y-2.5">
              {summary.sectionH_foodsToLimit.map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                    <span>{item.category}</span>
                  </div>
                  <p className="text-slate-600"><strong className="text-slate-700">Examples:</strong> {item.examples}</p>
                  <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Rationale:</strong> {item.reason}</p>
                  <p className="text-amber-800 text-[11px] font-medium">{item.distinction}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION I: YOUR NEXT STEPS & URGENT SAFETY NOTICE */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sectionI')}
          className="w-full p-4 px-5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              I
            </span>
            <span className="text-sm font-bold text-slate-900">
              Your Next Steps & Questions for Your Doctor
            </span>
          </div>
          {openSections.sectionI ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.sectionI && (
          <div className="p-5 pt-0 border-t border-slate-100 space-y-4 text-xs leading-relaxed">
            {/* Critical Urgent Warning Banner */}
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-900">Emergency Care Guidance</p>
                <p className="text-rose-800 leading-relaxed">
                  {summary.sectionI_nextSteps.urgentWarning}
                </p>
              </div>
            </div>

            {/* Verification checklist */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800">Recommended Follow-up Verifications:</span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {summary.sectionI_nextSteps.verificationPoints.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>

            {/* Questions to ask doctor */}
            <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
              <span className="font-bold text-teal-950">Questions to Discuss with Your Primary Care Physician:</span>
              <ul className="space-y-1.5 text-teal-900">
                {summary.sectionI_nextSteps.doctorQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
