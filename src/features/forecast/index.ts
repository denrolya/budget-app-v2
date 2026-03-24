// Types
export type {
  HistoricalFlow,
  ProjectionPoint,
  ScenarioConfig,
  ScenarioEvent,
  SimulationResult,
  TimeHorizon,
} from './models/types';

// Engine
export { computeInvestmentGrowth, projectCashFlow, reconstructHistoricalBalance } from './lib/scenarioEngine';

// Hooks
export { useFinancialSnapshot } from './hooks/useFinancialSnapshot';
export { useHistoricalFlows } from './hooks/useHistoricalFlows';

// Page
export { default as ForecastPage } from './routes/ForecastPage';

// Constants
export {
  CONFIDENCE_MULTIPLIER,
  DEFAULT_HORIZON,
  DEFAULT_RETURN_RATE,
  FORECAST_EVENTS_KEY,
  FORECAST_STORAGE_KEY,
  HISTORICAL_MONTHS,
  TIME_HORIZON_LABELS,
  TIME_HORIZONS,
} from './constants';
