export type BudgetPeriodType = 'monthly' | 'yearly' | 'custom';

export interface BudgetLineDTO {
  id: number;
  categoryId: number;
  plannedAmount: number;
  plannedCurrency: string;
  note?: string | null;
}

export interface BudgetDTO {
  id: number;
  name: string | null;
  periodType: BudgetPeriodType;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  lines?: BudgetLineDTO[];
}

export interface CreateBudgetDTO {
  periodType: BudgetPeriodType;
  startDate: string;
  endDate: string;
  name?: string;
  copiedFromId?: number;
}

export interface UpdateBudgetDTO {
  name?: string | null;
  periodType?: BudgetPeriodType;
  startDate?: string;
  endDate?: string;
}

export interface UpsertBudgetLineDTO {
  categoryId: number;
  plannedAmount: number;
  plannedCurrency: string;
  note?: string | null;
}

export type BudgetCurrencyValues = { income: number; expense: number };

export interface BudgetAnalyticsItem {
  categoryId: number;
  convertedValues: Record<string, BudgetCurrencyValues>;
}

export interface BudgetHistoryItem extends BudgetAnalyticsItem {
  activeMonths: number; // distinct calendar months with ≥1 transaction
  predictedValues: Record<string, BudgetCurrencyValues>; // recency-weighted monthly prediction per currency
}

export interface BudgetAnalyticsResponse {
  data: BudgetAnalyticsItem[];
}

export interface BudgetHistoryAveragesResponse {
  data: BudgetHistoryItem[];
  months: number;
  after: string;
  before: string;
}

export interface CategoryDayStats {
  day: string;
  convertedValues: Record<string, BudgetCurrencyValues>;
}

export interface CategoryDailyStatsItem {
  categoryId: number;
  days: CategoryDayStats[];
}

export interface CategoryDailyStatsResponse {
  data: CategoryDailyStatsItem[];
}

// ── Budget Insights ──────────────────────────────────────────────────────────

export interface OutlierItem {
  transactionId: number;
  categoryId: number;
  note: string | null;
  executedAt: string;
  amount: number;
  convertedAmount: number;
  median: number;
  deviation: number;
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface CategoryTrendItem {
  categoryId: number;
  direction: TrendDirection;
  changePercent: number;
  recentAverage: number;
  olderAverage: number;
  children?: CategoryTrendItem[];
}

export interface SeasonalItem {
  categoryId: number;
  seasonalFactor: number;
  currentMonthHistoricalAverage: number;
  overallMonthlyAverage: number;
  sampleYears: number;
  children?: SeasonalItem[];
}

export interface BudgetInsightsResponse {
  outliers: OutlierItem[];
  trends: CategoryTrendItem[];
  seasonal: SeasonalItem[];
}

// ── Budget Summaries (sidebar) ───────────────────────────────────────────────

export interface BudgetSummaryItem {
  budgetId: number;
  actualExpense: Record<string, number>;
  actualIncome: Record<string, number>;
  plannedExpense: Record<string, number>;
  plannedIncome: Record<string, number>;
}

export interface BudgetSummariesResponse {
  data: BudgetSummaryItem[];
}
