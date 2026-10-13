import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { ShapContribution } from '../../types/prediction';
import { HelpCircle } from 'lucide-react';

interface ShapBarChartProps {
  contributions: ShapContribution[];
}

export const ShapBarChart: React.FC<ShapBarChartProps> = ({ contributions }) => {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-sm">
        No feature attribution data available for this prediction.
      </div>
    );
  }

  const chartData = contributions.map((item) => ({
    name: item.displayName,
    value: item.value,
    direction: item.direction,
    description: item.description,
    category: item.category
  }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Model Explainability (SHAP Feature Contributions)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical attribution showing which measurements increased or decreased predicted risk.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            <span>Elevates Risk (+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal-500" />
            <span>Protective Offset (−)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[-0.2, 0.3]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              width={140}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs max-w-xs border border-slate-700">
                      <p className="font-bold text-slate-100">{data.name}</p>
                      <p className="text-teal-300 font-semibold mt-1">
                        Attribution Score: {data.value > 0 ? `+${data.value.toFixed(2)}` : data.value.toFixed(2)}
                      </p>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        {data.description}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? '#f43f5e' : '#0d9488'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Clinical Caution */}
      <div className="mt-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Scientific Note:</strong> Feature contribution scores reflect statistical correlation within the model's dataset. They do not demonstrate direct biological causation or quantify physical coronary plaque volume.
        </p>
      </div>
    </div>
  );
};
