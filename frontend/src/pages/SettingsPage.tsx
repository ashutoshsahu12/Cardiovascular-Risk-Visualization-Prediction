import React, { useState, useEffect } from 'react';
import { Server, ShieldCheck, CheckCircle2, XCircle, RefreshCw, Cpu, Database } from 'lucide-react';
import { fetchHealthStatus } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000');

  const checkConnection = async () => {
    setIsChecking(true);
    const online = await fetchHealthStatus();
    setBackendOnline(online);
    setIsChecking(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Backend API Status Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-teal-600" />
              <span>FastAPI Backend Connection</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Status of the Python cardiovascular risk and XAI attribution server.
            </p>
          </div>
          <button
            type="button"
            onClick={checkConnection}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${backendOnline ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 ring-4 ring-amber-100'}`} />
            <div>
              <p className="text-xs font-bold text-slate-900">
                {backendOnline ? 'FastAPI Backend Online (Connected)' : 'Client-Side Calibrated Fallback Active'}
              </p>
              <p className="text-[11px] text-slate-500">
                Endpoint: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{apiUrl}</code>
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
            backendOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {backendOnline ? 'Live API' : 'Standalone Mode'}
          </span>
        </div>
      </div>

      {/* Model & Architecture Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Cpu className="w-4 h-4 text-teal-600" />
            <span>Machine Learning Architecture</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li><strong>Ensemble Models:</strong> Calibrated Gradient Boosted Trees & Multi-variable Logistic Estimators.</li>
            <li><strong>Feature Space:</strong> Demographics, non-invasive blood pressure, lipid panels, resting ECG, echocardiography.</li>
            <li><strong>Explainability Engine:</strong> Local Tree-SHAP attribution mapping positive & negative feature contributions.</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Safety & Clinical Governance</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li><strong>Target Feature Isolation:</strong> Catheterization outcomes (Cath, LAD, LCX, RCA) strictly prohibited from input layers.</li>
            <li><strong>Auditing:</strong> Non-diagnostic educational classification disclaimer enforced across all UI viewports.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
