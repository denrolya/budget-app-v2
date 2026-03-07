export type BudgetPeriodType = 'monthly' | 'yearly' | 'custom';

export interface BudgetLineDTO {
  id: number;
  categoryId: number;
  plannedAmount: number;
  plannedCurrency: string;
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
}

export type BudgetCurrencyValues = { income: number; expense: number };

export interface BudgetAnalyticsItem {
  categoryId: number;
  convertedValues: Record<string, BudgetCurrencyValues>;
}

export interface BudgetAnalyticsResponse {
  data: BudgetAnalyticsItem[];
}
