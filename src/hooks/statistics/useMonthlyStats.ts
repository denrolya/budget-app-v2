import moment from 'moment';
import { useMemo } from 'react';

import { computeTrend, recencyWeightedAvg, removeOutliers } from '@/lib/statistics';

import { useValueByPeriodStatisticsRequest } from './useValueByPeriodStatisticsRequest';

const MONTHS = 12;
const QUERY_KEY = 'monthly-stats-12m';

export interface MonthlyStats {
  avgIncome: number;
  avgExpense: number;
  incomeTrend: number;
  expenseTrend: number;
  /** Number of income outlier months excluded from average */
  incomeOutliers: number;
  /** Number of expense outlier months excluded from average */
  expenseOutliers: number;
  isLoading: boolean;
}

/**
 * Single source of truth for avg income/expense across the app.
 * Uses 12 months of data with outlier detection, recency-weighted averages,
 * and trend detection. Shared query key ensures one API call even if
 * consumed by multiple features.
 */
export const useMonthlyStats = (): MonthlyStats => {
  const after = useMemo(
    () =>
      moment()
        .subtract(MONTHS - 1, 'months')
        .startOf('month'),
    [],
  );
  const before = useMemo(() => moment().endOf('month'), []);

  const { data, isLoading } = useValueByPeriodStatisticsRequest({
    after,
    before,
    period: 'P1M',
    queryKey: QUERY_KEY,
  });

  return useMemo(() => {
    const empty: MonthlyStats = {
      avgIncome: 0,
      avgExpense: 0,
      incomeTrend: 1,
      expenseTrend: 1,
      incomeOutliers: 0,
      expenseOutliers: 0,
      isLoading,
    };
    if (!data || data.length === 0) return empty;

    const rawIncomes = data.map((d) => d.income);
    const rawExpenses = data.map((d) => d.expense);

    // Filter outliers (e.g. motorcycle purchase) before computing averages
    const incomeResult = removeOutliers(rawIncomes);
    const expenseResult = removeOutliers(rawExpenses);

    // Recency-weighted with trend on cleaned data
    const wI = recencyWeightedAvg(incomeResult.cleaned);
    const wE = recencyWeightedAvg(expenseResult.cleaned);
    const iTrend = computeTrend(incomeResult.cleaned);
    const eTrend = computeTrend(expenseResult.cleaned);

    return {
      avgIncome: Math.round(wI > 0 ? wI * iTrend : 0),
      avgExpense: Math.round(wE > 0 ? wE * eTrend : 0),
      incomeTrend: iTrend,
      expenseTrend: eTrend,
      incomeOutliers: incomeResult.outlierCount,
      expenseOutliers: expenseResult.outlierCount,
      isLoading,
    };
  }, [data, isLoading]);
};
