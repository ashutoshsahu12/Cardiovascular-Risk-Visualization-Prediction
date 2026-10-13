export type InsightCategory = 'all' | 'cardiac' | 'lab' | 'ecg' | 'echo';
export type MetricStatus = 'normal' | 'borderline' | 'elevated' | 'high';

export interface ClinicalMeasurementInsight {
  id: string;
  category: InsightCategory;
  name: string;
  valueDisplay: string;
  numericValue: number;
  unit: string;
  status: MetricStatus;
  statusBadge: string;
  badgeVariant: 'green' | 'amber' | 'red';
  referenceRangeLabel: string;
  referenceMin: number;
  referenceMax: number;
  currentPercentOnScale: number; // 0 to 100 for visual marker
  description: string;
  clinicalContext: string;
  lifestyleGuidance: string;
  limitations: string;
}
