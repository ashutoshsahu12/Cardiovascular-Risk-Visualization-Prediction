import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  Plus,
  Calendar,
  History,
  TrendingUp
} from 'lucide-react';
import { usePredictionStore } from '../store/usePredictionStore';
import { RiskTrendChart } from '../components/charts/RiskTrendChart';
import { NavTab } from '../components/layout/Sidebar';
import { HistoricalAssessment } from '../types/prediction';

interface HistoryPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { history, selectHistoryItem } = usePredictionStore();

  const handleViewAssessment = (item: HistoricalAssessment) => {
    selectHistoryItem(item);
    onNavigate('results');
  };

  return (
    <div className="space-y-6">
      {/* 1. Comparison Data Table matching Screen 6 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-4">Overall CAD Risk</th>
                <th className="py-3.5 px-4">LAD</th>
                <th className="py-3.5 px-4">LCX</th>
                <th className="py-3.5 px-4">RCA</th>
                <th className="py-3.5 px-6">Key Findings</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {history.map((row) => {
                const isHigh = row.overallCadPercentage >= 60;
                const isModerate = row.overallCadPercentage >= 40 && row.overallCadPercentage < 60;

                const badgeColor = isHigh
                  ? 'text-rose-600 bg-rose-50 border-rose-200'
                  : isModerate
                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                  : 'text-emerald-600 bg-emerald-50 border-emerald-200';

                const TrendIcon = isHigh ? ArrowUpRight : isModerate ? Minus : ArrowDownRight;

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => handleViewAssessment(row)}
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{row.date}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                        <span>{row.overallCadPercentage}%</span>
                        <TrendIcon className="w-3 h-3" />
                      </span>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <span className={row.ladPercentage >= 60 ? 'text-rose-600 font-bold' : ''}>
                        {row.ladPercentage}%
                      </span>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <span className={row.lcxPercentage >= 50 ? 'text-amber-600 font-bold' : ''}>
                        {row.lcxPercentage}%
                      </span>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <span>{row.rcaPercentage}%</span>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      {row.keyFindings}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAssessment(row);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 border border-teal-200/50 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Longitudinal Risk Trend Over Time Chart matching Screen 6 */}
      <RiskTrendChart history={history} />
    </div>
  );
};
