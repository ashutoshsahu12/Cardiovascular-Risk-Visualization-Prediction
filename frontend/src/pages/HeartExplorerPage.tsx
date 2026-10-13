import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2
} from 'lucide-react';
import { HeartScene } from '../components/heart/HeartScene';
import { useHeartStore } from '../store/useHeartStore';
import { usePredictionStore } from '../store/usePredictionStore';
import { NavTab } from '../components/layout/Sidebar';
import { VesselId } from '../types/heart';
import { mapPredictionTo3DPayload } from '../utils/vesselColors';

interface HeartExplorerPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const HeartExplorerPage: React.FC<HeartExplorerPageProps> = ({ onNavigate }) => {
  const { selectedVessel, setSelectedVessel, viewMode } = useHeartStore();
  const { currentPrediction } = usePredictionStore();

  const predictionsPayload = React.useMemo(
    () => mapPredictionTo3DPayload(currentPrediction),
    [currentPrediction]
  );

  const currentVesselData = currentPrediction.vessels[selectedVessel];

  const vesselTabs: { id: VesselId; label: string }[] = [
    { id: 'LAD', label: 'LAD' },
    { id: 'LCX', label: 'LCX' },
    { id: 'RCA', label: 'RCA' },
  ];

  const getRiskStyle = (pct: number) => {
    if (pct >= 60) return { badge: 'bg-rose-50 text-rose-600 border-rose-200', text: 'text-rose-600', icon: ArrowUpRight };
    if (pct >= 35) return { badge: 'bg-amber-50 text-amber-600 border-amber-200', text: 'text-amber-600', icon: Minus };
    return { badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', text: 'text-emerald-600', icon: ArrowDownRight };
  };

  const style = getRiskStyle(currentVesselData.percentage);
  const Icon = style.icon;

  return (
    <div className="space-y-6">
      {/* Main 3D Canvas & Vessel Info Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Viewport (8 columns) */}
        <div className="lg:col-span-8 h-[540px] flex flex-col">
          <HeartScene
            predictions={predictionsPayload}
            selectedVessel={selectedVessel}
            onVesselSelect={(vesselId) => {
              if (vesselId) setSelectedVessel(vesselId);
            }}
            className="w-full h-full"
          />
        </div>

        {/* Right: Vessel Information Panel (4 columns) matching reference UI */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Vessel Information
              </h3>
            </div>

            {/* Vessel Tabs */}
            <div className="flex items-center gap-2 my-4 p-1 bg-slate-100 rounded-xl">
              {vesselTabs.map((tab) => {
                const isActive = selectedVessel === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedVessel(tab.id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Selected Vessel Details matching reference UI */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {currentVesselData.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {currentVesselData.fullName}
                </p>
              </div>

              {/* Percentage & Badge */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {currentVesselData.percentage}%
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${style.badge}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{currentVesselData.riskBadge}</span>
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentVesselData.clinicalSummary}
              </p>

              {/* Key Drivers */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
                <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Associated Clinical Drivers:
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {currentVesselData.keyDrivers.map((driver, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Anatomical Territory */}
              <div className="text-xs text-slate-500">
                <strong className="text-slate-700">Perfusion Territory:</strong>{' '}
                {currentVesselData.anatomicalTerritory}
              </div>
            </div>
          </div>

          {/* Action CTA to View Detailed Explanation */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
            >
              <span>View Detailed Explanation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Anatomical Notice */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs text-slate-500">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-800">Clinical Visualization Note:</strong> The 3D heart highlights vessel territories based on statistical machine-learning risk predictions derived from non-invasive clinical biomarkers. It does not represent anatomical CT angiography or invasive catheterization geometry.
        </p>
      </div>
    </div>
  );
};
