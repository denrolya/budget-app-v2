import { Moment } from 'moment';

import { ISO8601Period } from '@/types/global';

export interface TransformedData {
  timestamp: number;
  income: number;
  expenses: number;
  revenue: number;
  date: Moment;
  previousIncome: number;
  previousExpenses: number;
  previousRevenue: number;
}

export interface UseMoneyFlowParams {
  period: ISO8601Period;
  timeframe: { after: Moment; before: Moment };
  previousTimeframe: { after: Moment; before: Moment };
  baseCurrency: string;
}

export interface UseMoneyFlowReturn {
  transformedData: TransformedData[];
  isLoading: boolean;
  error: Error | null;
  refetchData: () => void;
  revenueChangePercent: number;
  totalIncome: number;
  totalExpenses: number;
  totalRevenue: number;
  previousTotalIncome: number;
  previousTotalExpenses: number;
  previousTotalRevenue: number;
  avgPeriodIncome: number;
  avgPeriodExpenses: number;
  incomeChangePercent: number;
  expensesChangePercent: number;
  previousAvgPeriodIncome: number;
  previousAvgPeriodExpenses: number;
}
