import moment from 'moment';
import { useMemo } from 'react';

import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';
import { computeStdDev, computeTrend, recencyWeightedAvg, removeOutliers } from '@/lib/statistics';

import { DEFAULT_ANALYSIS_MONTHS } from '../constants';
import type { HistoricalFlow } from '../models/types';

/**
 * Forecast-specific hook for historical income/expense data.
 * Accepts a configurable analysis window (months).
 * Adds monthly flows (for balance reconstruction), seasonal factors, and stdDev.
 */
export const useHistoricalFlows = (analysisMonths: number = DEFAULT_ANALYSIS_MONTHS) => {
  const after = useMemo(
    () =>
      moment()
        .subtract(analysisMonths - 1, 'months')
        .startOf('month'),
    [analysisMonths],
  );
  const before = useMemo(() => moment().endOf('month'), []);

  const { data, isLoading } = useValueByPeriodStatisticsRequest({
    after,
    before,
    period: 'P1M',
    queryKey: `forecast-stats-${analysisMonths}m`,
  });

  const monthlyFlows = useMemo<HistoricalFlow[]>(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({
      date: d.after.format('YYYY-MM-01'),
      income: d.income,
      expense: d.expense,
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        avgIncome: 0,
        avgExpense: 0,
        weightedIncome: 0,
        weightedExpense: 0,
        incomeTrend: 1,
        expenseTrend: 1,
        incomeStdDev: 0,
        expenseStdDev: 0,
        seasonalFactors: {} as Record<number, { income: number; expense: number }>,
      };
    }

    const rawIncomes = data.map((d) => d.income);
    const rawExpenses = data.map((d) => d.expense);

    // Filter outliers before computing averages and stddev
    const { cleaned: incomes } = removeOutliers(rawIncomes);
    const { cleaned: expenses } = removeOutliers(rawExpenses);

    const nonZeroIncome = incomes.filter((v) => v > 0);
    const nonZeroExpense = expenses.filter((v) => v > 0);

    // Simple averages (on cleaned data)
    const avgI = nonZeroIncome.length > 0 ? nonZeroIncome.reduce((s, v) => s + v, 0) / nonZeroIncome.length : 0;
    const avgE = nonZeroExpense.length > 0 ? nonZeroExpense.reduce((s, v) => s + v, 0) / nonZeroExpense.length : 0;

    // Recency-weighted (on cleaned data)
    const weightedI = recencyWeightedAvg(incomes);
    const weightedE = recencyWeightedAvg(expenses);

    const incomeTrend = computeTrend(incomes);
    const expenseTrend = computeTrend(expenses);

    // Seasonal factors: per calendar month ratio vs simple average (use raw data for seasonality
    // since outlier months may genuinely be seasonal — e.g. December gifts)
    const seasonalFactors: Record<number, { income: number; expense: number }> = {};
    const byMonth = new Map<number, { incomes: number[]; expenses: number[] }>();
    for (const d of data) {
      const m = d.after.month();
      const entry = byMonth.get(m) ?? { incomes: [], expenses: [] };
      if (d.income > 0) entry.incomes.push(d.income);
      if (d.expense > 0) entry.expenses.push(d.expense);
      byMonth.set(m, entry);
    }
    for (const [m, vals] of byMonth) {
      const avgMonthIncome =
        vals.incomes.length > 0 ? vals.incomes.reduce((s, v) => s + v, 0) / vals.incomes.length : 0;
      const avgMonthExpense =
        vals.expenses.length > 0 ? vals.expenses.reduce((s, v) => s + v, 0) / vals.expenses.length : 0;
      seasonalFactors[m] = {
        income: avgI > 0 ? avgMonthIncome / avgI : 1,
        expense: avgE > 0 ? avgMonthExpense / avgE : 1,
      };
    }

    return {
      avgIncome: Math.round(avgI),
      avgExpense: Math.round(avgE),
      weightedIncome: Math.round(weightedI * incomeTrend),
      weightedExpense: Math.round(weightedE * expenseTrend),
      incomeTrend,
      expenseTrend,
      incomeStdDev: Math.round(computeStdDev(nonZeroIncome, avgI)),
      expenseStdDev: Math.round(computeStdDev(nonZeroExpense, avgE)),
      seasonalFactors,
    };
  }, [data]);

  return { monthlyFlows, ...stats, isLoading };
};
