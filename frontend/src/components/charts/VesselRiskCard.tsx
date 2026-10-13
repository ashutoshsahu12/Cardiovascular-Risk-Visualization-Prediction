import React from 'react';
import { VesselPrediction } from '../../types/prediction';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface VesselRiskCardProps {
  vessel: VesselPrediction;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const VesselRiskCard: React.FC<VesselRiskCardProps> = ({
  vessel,
  isSelected = false,
  onSelect
}) => {
  const getBadgeStyle = () => {
    if (vessel.percentage >= 60) {
      return {
        bg: 'bg-rose-50 text-rose-600 border-rose-200',
        bar: 'bg-rose-500',
        stroke: '#f43f5e',
        icon: ArrowUpRight
      };
    }
    if (vessel.percentage >= 35) {
      return {
        bg: 'bg-amber-50 text-amber-600 border-amber-200',
        bar: 'bg-amber-500',
        stroke: '#f59e0b',
        icon: Minus
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      bar: 'bg-emerald-500',
      stroke: '#10b981',
      icon: ArrowDownRight
    };
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-500/20'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900 tracking-tight">
              {vessel.name}
            </h4>
            <p className="text-xs text-slate-500">
              {vessel.fullName}
            </p>
          </div>

          {/* SVG Vascular Branch Miniature Graphic */}
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <path
                d="M20 5 C 20 15, 18 22, 14 35"
                stroke={style.stroke}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M19 16 C 24 20, 28 26, 30 33"
                stroke={style.stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.8"
              />
              <circle cx="20" cy="5" r="2.5" fill={style.stroke} />
            </svg>
          </div>
        </div>

        {/* Score & Badge */}
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {vessel.percentage}%
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${style.bg}`}
          >
            <Icon className="w-3 h-3" />
            <span>{vessel.riskBadge}</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
            style={{ width: `${Math.min(100, vessel.percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
