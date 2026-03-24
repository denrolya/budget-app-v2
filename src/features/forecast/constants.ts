import type { TimeHorizon } from './models/types';

/** Blended annual return rate based on user's current portfolio allocation */
export const DEFAULT_RETURN_RATE = 6.6;

/** Default annual inflation rate (%) — applied to expense growth */
export const DEFAULT_INFLATION_RATE = 3.0;

/** Default annual income growth rate (%) — matches inflation by default */
export const DEFAULT_INCOME_GROWTH_RATE = 3.0;

export const DEFAULT_HORIZON: TimeHorizon = 12;

export const TIME_HORIZONS: TimeHorizon[] = [6, 12, 24, 60, 120, 180, 240, 360];

export const TIME_HORIZON_LABELS: Record<TimeHorizon, string> = {
  6: '6m',
  12: '1y',
  24: '2y',
  60: '5y',
  120: '10y',
  180: '15y',
  240: '20y',
  360: '30y',
};

export const FORECAST_STORAGE_KEY = 'forecast-config';

export const FORECAST_EVENTS_KEY = 'forecast-events';

export const SCENARIOS_STORAGE_KEY = 'forecast-scenarios';

export const MAX_SAVED_SCENARIOS = 10;

/** StdDev multiplier for confidence bands (± multiplier * sqrt(monthIndex) * combinedStdDev) */
export const CONFIDENCE_MULTIPLIER = 1.5;

/** Default analysis window for SMART prediction mode */
export const DEFAULT_ANALYSIS_MONTHS = 24;

/** Available analysis window options */
export const ANALYSIS_WINDOWS = [3, 6, 12, 24, 36] as const;
export type AnalysisWindow = (typeof ANALYSIS_WINDOWS)[number];

/** @deprecated Use DEFAULT_ANALYSIS_MONTHS */
export const HISTORICAL_MONTHS = DEFAULT_ANALYSIS_MONTHS;

/** 4% safe withdrawal rate → need 25× annual expenses */
export const computeFiTarget = (monthlyExpense: number): number => (monthlyExpense > 0 ? monthlyExpense * 12 * 25 : 0);

/** Shared X-axis tick formatter for forecast charts */
export const formatChartTick = (ts: number): string => {
  const d = new Date(ts * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
};
