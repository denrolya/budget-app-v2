/**
 * Shared statistical computation utilities for income/expense data.
 * Used by both forecast and buckets features to ensure consistent numbers.
 */

/**
 * Recency-weighted average: newer months count more.
 * Weight = index + 1 (oldest=1, newest=N).
 * Only considers non-zero months to avoid diluting with months that
 * genuinely had no income/expense (e.g. account not active yet).
 */
export const recencyWeightedAvg = (values: number[]): number => {
  const nonZero = values.map((v, i) => ({ v, i })).filter(({ v }) => v > 0);
  if (nonZero.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;
  for (const { v, i } of nonZero) {
    const weight = i + 1;
    weightedSum += v * weight;
    weightTotal += weight;
  }

  return weightedSum / weightTotal;
};

/**
 * Simple trend: compare last 3 months average to first 3 months average.
 * Returns a multiplier (e.g. 1.05 = 5% uptrend). Capped at ±20%.
 */
export const computeTrend = (values: number[]): number => {
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length < 6) return 1;

  const early = nonZero.slice(0, 3);
  const late = nonZero.slice(-3);
  const earlyAvg = early.reduce((s, v) => s + v, 0) / early.length;
  const lateAvg = late.reduce((s, v) => s + v, 0) / late.length;

  if (earlyAvg === 0) return 1;
  const ratio = lateAvg / earlyAvg;
  return Math.max(0.8, Math.min(1.2, ratio));
};

/** Population standard deviation of non-zero values */
export const computeStdDev = (values: number[], mean: number): number => {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export interface OutlierResult {
  /** Values with outliers replaced by the median */
  cleaned: number[];
  /** Number of outliers detected */
  outlierCount: number;
  /** Indices of outlier months (0-based) */
  outlierIndices: number[];
}

/**
 * Detect and replace outliers using the IQR method.
 * More robust than stddev for small (12-month) samples.
 * Outlier = value outside [Q1 - 1.5×IQR, Q3 + 1.5×IQR].
 * Outliers are replaced with the median (not removed) to preserve month positions.
 */
export const removeOutliers = (values: number[]): OutlierResult => {
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length < 4) return { cleaned: [...values], outlierCount: 0, outlierIndices: [] };

  const sorted = [...nonZero].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const median = sorted[Math.floor(sorted.length / 2)];

  const outlierIndices: number[] = [];
  const cleaned = values.map((v, i) => {
    if (v > 0 && (v < lower || v > upper)) {
      outlierIndices.push(i);
      return median;
    }
    return v;
  });

  return { cleaned, outlierCount: outlierIndices.length, outlierIndices };
};
