import { useMemo } from 'react';

import { useTotalBalance } from '@/hooks/financeData';

import { DEFAULT_HORIZON, DEFAULT_INCOME_GROWTH_RATE, DEFAULT_INFLATION_RATE, DEFAULT_RETURN_RATE } from '../constants';
import type { ScenarioConfig } from '../models/types';

import { useHistoricalFlows } from './useHistoricalFlows';

export type PredictionMode = 'simple' | 'smart';

/**
 * Aggregates real financial data into a ScenarioConfig with sensible defaults.
 *
 * DECOUPLED from buckets — investment value defaults to 0 and is set by the user
 * via the sidebar. This avoids coupling the forecast feature to localStorage-only
 * bucket data and eliminates the double-counting problem (totalBalance includes
 * investment accounts, bucket value is the same money counted again).
 *
 * The user enters their investment value manually in the Starting Position section.
 * totalBalance = their full net worth (cash + investments combined).
 * currentBalance = totalBalance (the engine tracks cash and investments separately,
 * and the user splits them via the Investment Value control).
 */
export const useFinancialSnapshot = (analysisMonths?: number) => {
  const totalBalance = useTotalBalance();
  const {
    avgIncome,
    avgExpense,
    weightedIncome,
    weightedExpense,
    incomeTrend,
    expenseTrend,
    incomeStdDev,
    expenseStdDev,
    seasonalFactors,
    monthlyFlows,
    isLoading: flowsLoading,
  } = useHistoricalFlows(analysisMonths);

  // Always use actual statistics for totals — budget only covers partial categories
  const useWeighted = weightedIncome > 0;
  const predictedIncome = useWeighted ? weightedIncome : avgIncome;
  const predictedExpense = useWeighted ? weightedExpense : avgExpense;

  const defaults = useMemo<ScenarioConfig>(() => {
    const savingsRate =
      predictedIncome > 0 ? Math.max(0, Math.round(((predictedIncome - predictedExpense) / predictedIncome) * 100)) : 0;

    return {
      currentBalance: totalBalance,
      monthlyIncome: predictedIncome,
      monthlyExpense: predictedExpense,
      savingsRate,
      investmentReturnRate: DEFAULT_RETURN_RATE,
      currentInvestmentValue: 0,
      horizonMonths: DEFAULT_HORIZON,
      events: [],
      incomeStdDev,
      expenseStdDev,
      inflationRate: DEFAULT_INFLATION_RATE,
      incomeGrowthRate: DEFAULT_INCOME_GROWTH_RATE,
      minCashReserveMonths: 0,
      seasonalFactors,
    };
  }, [totalBalance, predictedIncome, predictedExpense, incomeStdDev, expenseStdDev, seasonalFactors]);

  const predictionMode: PredictionMode = useWeighted ? 'smart' : 'simple';

  return {
    defaults,
    monthlyFlows,
    isLoading: flowsLoading,
    predictionMode,
    incomeTrend,
    expenseTrend,
  };
};
