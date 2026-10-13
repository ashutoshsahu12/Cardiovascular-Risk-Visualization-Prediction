import { create } from 'zustand';
import { AssessmentFormData } from '../types/assessment';
import { PredictionResponse, HistoricalAssessment } from '../types/prediction';
import { INITIAL_PREDICTION, INITIAL_HISTORY, postPrediction } from '../services/api';

interface PredictionStore {
  currentPrediction: PredictionResponse;
  history: HistoricalAssessment[];
  isLoading: boolean;
  error: string | null;
  runPrediction: (data: AssessmentFormData) => Promise<boolean>;
  selectHistoryItem: (item: HistoricalAssessment) => void;
  clearError: () => void;
}

export const usePredictionStore = create<PredictionStore>((set, get) => ({
  currentPrediction: INITIAL_PREDICTION,
  history: INITIAL_HISTORY,
  isLoading: false,
  error: null,

  runPrediction: async (data: AssessmentFormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await postPrediction(data);
      const newHistoryItem: HistoricalAssessment = {
        id: response.id,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: new Date().toISOString().split('T')[0],
        overallCadPercentage: response.overallCadPercentage,
        overallRiskTier: response.overallRiskTier,
        ladPercentage: response.vessels.LAD.percentage,
        lcxPercentage: response.vessels.LCX.percentage,
        rcaPercentage: response.vessels.RCA.percentage,
        keyFindings: `SBP ${data.systolicBP}, LDL ${data.ldlCholesterol}`,
        inputs: data
      };

      set((state) => ({
        currentPrediction: response,
        history: [newHistoryItem, ...state.history.filter((h) => h.id !== response.id)],
        isLoading: false
      }));
      return true;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to analyze assessment data.', isLoading: false });
      return false;
    }
  },

  selectHistoryItem: (item: HistoricalAssessment) => {
    // When a past assessment is clicked, update the currentPrediction to reflect it
    const current = get().currentPrediction;
    const updated: PredictionResponse = {
      ...current,
      id: item.id,
      overallCadPercentage: item.overallCadPercentage,
      overallCadProbability: item.overallCadPercentage / 100,
      overallRiskTier: item.overallRiskTier,
      vessels: {
        ...current.vessels,
        LAD: {
          ...current.vessels.LAD,
          percentage: item.ladPercentage,
          probability: item.ladPercentage / 100,
          riskTier: item.ladPercentage >= 60 ? 'Higher risk' : item.ladPercentage >= 35 ? 'Moderate risk' : 'Lower risk'
        },
        LCX: {
          ...current.vessels.LCX,
          percentage: item.lcxPercentage,
          probability: item.lcxPercentage / 100,
          riskTier: item.lcxPercentage >= 60 ? 'Higher risk' : item.lcxPercentage >= 35 ? 'Moderate risk' : 'Lower risk'
        },
        RCA: {
          ...current.vessels.RCA,
          percentage: item.rcaPercentage,
          probability: item.rcaPercentage / 100,
          riskTier: item.rcaPercentage >= 60 ? 'Higher risk' : item.rcaPercentage >= 35 ? 'Moderate risk' : 'Lower risk'
        }
      }
    };
    set({ currentPrediction: updated });
  },

  clearError: () => set({ error: null })
}));
