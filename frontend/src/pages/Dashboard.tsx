import React from 'react';
import {
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Droplet,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { HeartScene } from '../components/heart/HeartScene';
import { usePredictionStore } from '../store/usePredictionStore';
import { useSummaryStore } from '../store/useSummaryStore';
import { QuoteBanner } from '../components/common/QuoteBanner';
import { NavTab } from '../components/layout/Sidebar';
import { mapPredictionTo3DPayload } from '../utils/vesselColors';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentPrediction } = usePredictionStore();
  const { openSummary } = useSummaryStore();

  const predictionsPayload = React.useMemo(
    () => mapPredictionTo3DPayload(currentPrediction),
    [currentPrediction]
  );

  const summaryCards = [
    {
      title: 'Overall CAD Prediction',
      value: `${currentPrediction.overallCadPercentage}%`,
      badge: currentPrediction.overallRiskTier === 'Higher risk' ? '+ Higher risk' : '+ Moderate risk',
      badgeClass: currentPrediction.overallRiskTier === 'Higher risk' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Heart,
      iconColor: 'text-rose-600 bg-rose-50',
      arrow: ArrowUpRight
    },
    {
      title: 'LAD Prediction',
      value: `${currentPrediction.vessels.LAD.percentage}%`,
      badge: currentPrediction.vessels.LAD.riskBadge,
      badgeClass: 'bg-rose-50 text-rose-600 border-rose-200',
      icon: Activity,
      iconColor: 'text-rose-600 bg-rose-50',
      arrow: ArrowUpRight
    },
    {
      title: 'LCX Prediction',
      value: `${currentPrediction.vessels.LCX.percentage}%`,
      badge: currentPrediction.vessels.LCX.riskBadge,
      badgeClass: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Activity,
      iconColor: 'text-amber-600 bg-amber-50',
      arrow: Minus
    },
    {
      title: 'RCA Prediction',
      value: `${currentPrediction.vessels.RCA.percentage}%`,
      badge: currentPrediction.vessels.RCA.riskBadge,
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      icon: Activity,
      iconColor: 'text-emerald-600 bg-emerald-50',
      arrow: ArrowDownRight
    }
  ];

  return (
    <div className="space-y-6">
      {/* Inspirational Quote Banner */}
      <QuoteBanner />

      {/* 1. Top 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          const ArrowIcon = card.arrow;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 tracking-tight">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${card.badgeClass}`}
                >
                  <ArrowIcon className="w-3 h-3" />
                  <span>{card.badge}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Middle Row: 3D Heart Centerpiece & Health Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive 3D Heart Viewport (7 columns) */}
        <div className="lg:col-span-7 h-[440px] flex flex-col">
          <HeartScene
            isCompact={true}
            onNavigateToExplorer={() => onNavigate('explorer')}
            predictions={predictionsPayload}
            className="w-full h-full"
          />
        </div>

        {/* Right: Personalized Health Insights Card (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Personalized Health Insights
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Based on your latest assessment
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('insights')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Insight List Items matching reference UI */}
            <div className="mt-4 space-y-4">
              {/* Item 1: Blood Pressure */}
              <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Blood pressure is slightly elevated
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Your systolic blood pressure is higher than the usual reference range. Consider monitoring.
                  </p>
                </div>
              </div>

              {/* Item 2: Cholesterol */}
              <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Cholesterol levels require attention
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    LDL cholesterol is above the recommended range.
                  </p>
                </div>
              </div>

              {/* Item 3: Moderate CAD risk */}
              <div className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Moderate CAD risk predicted
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    The model indicates a higher risk of CAD. Review detailed results and explanations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <button
              type="button"
              onClick={() => openSummary('dashboard')}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>View My AI Health Summary</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore Full Clinical Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
