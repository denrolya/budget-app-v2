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
  from: string;
  to: string;
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
