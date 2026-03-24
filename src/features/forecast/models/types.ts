export interface ProjectionPoint {
  /** ISO date 'YYYY-MM-01' (first-of-period, monthly for now) */
  date: string;
  /** Running cash balance in baseCurrency */
  balance: number;
  /** Confidence band upper bound */
  balanceUpper: number;
  /** Confidence band lower bound */
  balanceLower: number;
  /** Cumulative investment portfolio value */
  investmentValue: number;
  /** Monthly income used for this period */
  income: number;
  /** Monthly expense used for this period */
  expense: number;
  /** income - expense */
  netFlow: number;
  /** Amount moved to investments this month */
  investmentContribution: number;
  /** true = projected future, false = reconstructed history */
  isForecast: boolean;
}

export interface ScenarioEvent {
  id: string;
  label: string;
  /** ISO date 'YYYY-MM-01' — when the event starts */
  month: string;
  /** Positive = inflow, negative = outflow */
  amount: number;
  type: 'income' | 'expense' | 'investment' | 'withdrawal';
  isActive: boolean;
  /** If true, the amount applies every month from `month` onward (e.g. salary raise) */
  recurring?: boolean;
  /** For income events: % of the amount that goes directly to investments (0-100). Undefined = use global savings rate. */
  investPercent?: number;
}

export interface ScenarioConfig {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  /** 0–100, percentage of surplus directed to investments */
  savingsRate: number;
  /** Annual percentage, e.g. 6.6 */
  investmentReturnRate: number;
  currentInvestmentValue: number;
  horizonMonths: TimeHorizon;
  events: ScenarioEvent[];
  incomeStdDev: number;
  expenseStdDev: number;
  /** Annual inflation rate, e.g. 3.0 for 3%. Grows expenses over time. */
  inflationRate: number;
  /** Annual income growth rate, e.g. 3.0 for 3%. Defaults to inflationRate (income keeps pace). Set higher for career growth, lower for stagnation. */
  incomeGrowthRate: number;
  /** Minimum cash reserve in months of expenses (e.g. 6 = 6 months). Multiplied by monthlyExpense to get the actual floor. 0 = no floor. */
  minCashReserveMonths: number;
  /** Per calendar month (0-11) income/expense multiplier vs average. 1.0 = average month. */
  seasonalFactors: Record<number, { income: number; expense: number }>;
}

export interface SimulationResult {
  points: ProjectionPoint[];
  finalBalance: number;
  finalInvestmentValue: number;
  /** Months until balance hits 0 (null = never within horizon) */
  runwayMonths: number | null;
  /** Years until investment income covers monthly expenses (null = never within horizon) */
  breakEvenYears: number | null;
}

export interface HistoricalFlow {
  /** ISO date 'YYYY-MM-01' */
  date: string;
  income: number;
  expense: number;
}

export type TimeHorizon = 6 | 12 | 24 | 60 | 120 | 180 | 240 | 360;

export interface StrategyMetrics {
  savingsRate: number;
  monthsCovered: number;
  runway: number | null;
  netWorthEoH: number;
  fiProgress: number;
  fiEta: number | null;
  investmentYield: number;
  totalContributions: number;
  maxExpenseShock: number;
  incomeLossTolerance: number;
  inflationDrag: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  horizon: TimeHorizon;
  overrides: Partial<ScenarioConfig>;
  events: ScenarioEvent[];
}

export interface ReferenceLine {
  id: string;
  label: string;
  value: number;
  color: 'success' | 'warning' | 'destructive' | 'primary' | 'muted';
}

export type DiagnosticStatus = 'pass' | 'warn' | 'fail';

export interface DiagnosticResult {
  id: string;
  title: string;
  status: DiagnosticStatus;
  detail: string;
  suggestion: string | null;
}
