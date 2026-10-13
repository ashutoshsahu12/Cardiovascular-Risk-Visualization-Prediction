import { describe, it, expect } from 'vitest';
import {
  getVesselRiskColor,
  interpolateRiskColor,
  evaluateStenosisThreshold,
  classifyRiskTier,
  isValidProbability,
  THREE_COLORS,
} from './vesselColors.ts';
import type { VesselPrediction } from '../types/index.ts';

describe('vesselColors utility tests', () => {
  describe('isValidProbability', () => {
    it('accepts valid probabilities in [0.0, 1.0]', () => {
      expect(isValidProbability(0)).toBe(true);
      expect(isValidProbability(0.5)).toBe(true);
      expect(isValidProbability(1)).toBe(true);
      expect(isValidProbability(0.001)).toBe(true);
      expect(isValidProbability(0.999)).toBe(true);
    });

    it('rejects invalid, null, undefined, and non-finite values', () => {
      expect(isValidProbability(null)).toBe(false);
      expect(isValidProbability(undefined)).toBe(false);
      expect(isValidProbability(NaN)).toBe(false);
      expect(isValidProbability(Infinity)).toBe(false);
      expect(isValidProbability(-Infinity)).toBe(false);
      expect(isValidProbability(-0.1)).toBe(false);
      expect(isValidProbability(1.01)).toBe(false);
      expect(isValidProbability('0.5')).toBe(false);
      expect(isValidProbability({})).toBe(false);
    });
  });

  describe('classifyRiskTier', () => {
    it('classifies probabilities into correct clinical risk tiers', () => {
      expect(classifyRiskTier(0.1)).toBe('low');
      expect(classifyRiskTier(0.29)).toBe('low');
      expect(classifyRiskTier(0.30)).toBe('intermediate');
      expect(classifyRiskTier(0.49)).toBe('intermediate');
      expect(classifyRiskTier(0.50)).toBe('elevated');
      expect(classifyRiskTier(0.69)).toBe('elevated');
      expect(classifyRiskTier(0.70)).toBe('high');
      expect(classifyRiskTier(0.99)).toBe('high');
      expect(classifyRiskTier(null)).toBe('unknown');
      expect(classifyRiskTier(undefined)).toBe('unknown');
      expect(classifyRiskTier(NaN)).toBe('unknown');
    });
  });

  describe('interpolateRiskColor', () => {
    it('returns green near 0% probability', () => {
      const color = interpolateRiskColor(0.0);
      const expected = THREE_COLORS.LOW;
      expect(color.r).toBeCloseTo(expected.r, 2);
      expect(color.g).toBeCloseTo(expected.g, 2);
      expect(color.b).toBeCloseTo(expected.b, 2);
    });

    it('returns yellow near 35% probability', () => {
      const color = interpolateRiskColor(0.35);
      const expected = THREE_COLORS.INTERMEDIATE;
      expect(color.r).toBeCloseTo(expected.r, 2);
      expect(color.g).toBeCloseTo(expected.g, 2);
      expect(color.b).toBeCloseTo(expected.b, 2);
    });

    it('returns orange near 65% probability', () => {
      const color = interpolateRiskColor(0.65);
      const expected = THREE_COLORS.ELEVATED;
      expect(color.r).toBeCloseTo(expected.r, 2);
      expect(color.g).toBeCloseTo(expected.g, 2);
      expect(color.b).toBeCloseTo(expected.b, 2);
    });

    it('returns crimson red at 100% probability', () => {
      const color = interpolateRiskColor(1.0);
      const expected = THREE_COLORS.HIGH;
      expect(color.r).toBeCloseTo(expected.r, 2);
      expect(color.g).toBeCloseTo(expected.g, 2);
      expect(color.b).toBeCloseTo(expected.b, 2);
    });
  });

  describe('getVesselRiskColor with VesselPrediction payloads', () => {
    it('returns neutral gray for missing/null prediction (never default to healthy green!)', () => {
      const color1 = getVesselRiskColor(null);
      expect(color1.getHexString()).toBe(THREE_COLORS.UNKNOWN.getHexString());

      const color2 = getVesselRiskColor(undefined);
      expect(color2.getHexString()).toBe(THREE_COLORS.UNKNOWN.getHexString());
    });

    it('returns neutral gray when probability is null, NaN, or out of range', () => {
      const predNull: VesselPrediction = {
        vesselId: 'LAD',
        predictedProbability: null,
        stenosisPrediction: null,
        stenosisThreshold: 0.5,
      };
      expect(getVesselRiskColor(predNull).getHexString()).toBe(THREE_COLORS.UNKNOWN.getHexString());

      const predNaN: VesselPrediction = {
        vesselId: 'LAD',
        predictedProbability: NaN,
        stenosisPrediction: null,
        stenosisThreshold: 0.5,
      };
      expect(getVesselRiskColor(predNaN).getHexString()).toBe(THREE_COLORS.UNKNOWN.getHexString());

      const predOutOfRange: VesselPrediction = {
        vesselId: 'LAD',
        predictedProbability: 1.5,
        stenosisPrediction: null,
        stenosisThreshold: 0.5,
      };
      expect(getVesselRiskColor(predOutOfRange).getHexString()).toBe(THREE_COLORS.UNKNOWN.getHexString());
    });

    it('returns correct color for low, intermediate, and high risk predictions', () => {
      const lowPred: VesselPrediction = {
        vesselId: 'LAD',
        predictedProbability: 0.05,
        stenosisPrediction: false,
        stenosisThreshold: 0.5,
      };
      const lowColor = getVesselRiskColor(lowPred);
      // Low risk should be heavily green dominated
      expect(lowColor.g).toBeGreaterThan(lowColor.r);

      const highPred: VesselPrediction = {
        vesselId: 'LAD',
        predictedProbability: 0.95,
        stenosisPrediction: true,
        stenosisThreshold: 0.5,
      };
      const highColor = getVesselRiskColor(highPred);
      // High risk should be heavily red dominated
      expect(highColor.r).toBeGreaterThan(highColor.g);
    });
  });

  describe('evaluateStenosisThreshold (Threshold vs Probability Separation)', () => {
    it('preserves explicit binary classification from Member 2 backend', () => {
      const pred: VesselPrediction = {
        vesselId: 'LCX',
        predictedProbability: 0.48, // Probability is 48% (below 50%)
        stenosisPrediction: true,   // But calibrated clinical classifier predicted positive
        stenosisThreshold: 0.5,
      };
      const evaluation = evaluateStenosisThreshold(pred);
      expect(evaluation.isThresholdMet).toBe(true);
      expect(evaluation.statusLabel).toContain('Threshold Met');
      expect(evaluation.badgeVariant).toBe('danger');
    });

    it('correctly evaluates when binary prediction is false and probability is below threshold', () => {
      const pred: VesselPrediction = {
        vesselId: 'RCA',
        predictedProbability: 0.22,
        stenosisPrediction: false,
        stenosisThreshold: 0.5,
      };
      const evaluation = evaluateStenosisThreshold(pred);
      expect(evaluation.isThresholdMet).toBe(false);
      expect(evaluation.statusLabel).toContain('Below Threshold');
      expect(evaluation.badgeVariant).toBe('success');
    });

    it('handles pending / missing predictions gracefully', () => {
      const evaluation = evaluateStenosisThreshold(null);
      expect(evaluation.isThresholdMet).toBe(null);
      expect(evaluation.statusLabel).toBe('Pending Inference');
      expect(evaluation.badgeVariant).toBe('neutral');
    });
  });
});
