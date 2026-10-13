import React from 'react';
import {
  Heart,
  ArrowUpRight,
  Boxes,
  Activity,
  FileText,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import { usePredictionStore } from '../store/usePredictionStore';
import { useHeartStore } from '../store/useHeartStore';
import { useSummaryStore } from '../store/useSummaryStore';
import { VesselRiskCard } from '../components/charts/VesselRiskCard';
import { ShapBarChart } from '../components/charts/ShapBarChart';
import { NavTab } from '../components/layout/Sidebar';
import { VesselId } from '../types/heart';

interface ResultsPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigate }) => {
  const { currentPrediction } = usePredictionStore();
  const { setSelectedVessel } = useHeartStore();
  const { openSummary } = useSummaryStore();

  const handleVesselClick = (vesselId: VesselId) => {
    setSelectedVessel(vesselId);
    onNavigate('explorer');
  };

  return (
    <div className="space-y-6">
      {/* AI Explanation Callout Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-50/90 via-sky-50/70 to-white p-4 sm:px-6 rounded-2xl border border-teal-100/90 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Personalized AI Clinical Explanation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review a comprehensive plain-English breakdown of your assessment, risk factors, and recommended precautions.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openSummary('results')}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explain My Results with AI</span>
        </button>
      </div>

      {/* 1. Top Section (Overall CAD Prediction & Model Confidence) matching reference UI */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Overall CAD Prediction Card (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
            <Heart className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-500 tracking-tight">
              Overall CAD Prediction
            </h4>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentPrediction.overallCadPercentage}%
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border bg-rose-50 text-rose-600 border-rose-200">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{currentPrediction.overallRiskTier}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              {currentPrediction.summaryText}
            </p>
          </div>
        </div>

        {/* Right: Model Confidence Card (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 tracking-tight">
              Model Confidence
            </h4>
            <span className="text-sm font-extrabold text-slate-900">
              {currentPrediction.modelConfidence.toFixed(2)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-3">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${currentPrediction.modelConfidence * 100}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            This prediction is based on the available clinical measurements and has inherent uncertainty.
          </p>
        </div>
      </div>

      {/* 2. Middle Section: Vessel-Specific Predictions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Vessel-Specific Predictions
            </h3>
            <p className="text-xs text-slate-500">
              Coronary artery specific probability estimates derived from clinical features.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explorer')}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/60 transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Open 3D Explorer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VesselRiskCard
            vessel={currentPrediction.vessels.LAD}
            onSelect={() => handleVesselClick('LAD')}
          />
          <VesselRiskCard
            vessel={currentPrediction.vessels.LCX}
            onSelect={() => handleVesselClick('LCX')}
          />
          <VesselRiskCard
            vessel={currentPrediction.vessels.RCA}
            onSelect={() => handleVesselClick('RCA')}
          />
        </div>
      </div>

      {/* 3. Explainability Section (SHAP Bar Chart) */}
      <ShapBarChart contributions={currentPrediction.shapContributions} />

      {/* 4. Clinical Context & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clinical Recommendations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Context-Aware Interpretation</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            {currentPrediction.clinicalInsights.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Model Limitations & Transparency */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Diagnostic Limitations</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            {currentPrediction.limitations.map((lim, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
