export type RiskTier = 'Higher risk' | 'Moderate risk' | 'Lower risk';

export interface VesselPrediction {
  id: 'LAD' | 'LCX' | 'RCA';
  name: string;
  fullName: string;
  probability: number; // 0.0 to 1.0 (e.g. 0.72 for 72%)
  percentage: number; // 72
  riskTier: RiskTier;
  riskBadge: string; // e.g. "+ Potential stenosis" or "+ High risk"
  anatomicalTerritory: string;
  clinicalSummary: string;
  keyDrivers: string[];
}

export interface ShapContribution {
  feature: string;
  displayName: string;
  value: number; // contribution score e.g. +0.18
  direction: 'positive' | 'negative'; // positive increases CAD risk, negative is protective
  category: 'clinical' | 'lab' | 'ecg' | 'lifestyle';
  description: string;
}

export interface PredictionResponse {
  id: string;
  timestamp: string; // ISO date string
  overallCadProbability: number; // e.g. 0.68
  overallCadPercentage: number; // 68
  overallRiskTier: RiskTier;
  modelConfidence: number; // e.g. 0.72
  summaryText: string;
  vessels: {
    LAD: VesselPrediction;
    LCX: VesselPrediction;
    RCA: VesselPrediction;
  };
  shapContributions: ShapContribution[];
  clinicalInsights: {
    bloodPressureStatus: string;
    cholesterolStatus: string;
    cadRiskStatus: string;
    recommendations: string[];
  };
  limitations: string[];
}

export interface HistoricalAssessment {
  id: string;
  date: string; // formatted e.g. "May 14, 2024"
  rawDate: string;
  overallCadPercentage: number;
  overallRiskTier: RiskTier;
  ladPercentage: number;
  lcxPercentage: number;
  rcaPercentage: number;
  keyFindings: string;
  inputs?: Partial<AssessmentFormData>;
}
import { AssessmentFormData } from './assessment';
