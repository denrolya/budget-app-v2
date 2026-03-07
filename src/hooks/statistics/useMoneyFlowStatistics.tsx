import moment from 'moment';
import { useMemo } from 'react';

import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';
import { TransformedData, UseMoneyFlowParams, UseMoneyFlowReturn } from '@/types/statistics/moneyFlow';

export const useMoneyFlow = ({ period, timeframe, previousTimeframe }: UseMoneyFlowParams): UseMoneyFlowReturn => {
  const {
    data: currentDataBackend,
    isLoading: isCurrentLoading,
    error: currentError,
    refetch: refetchCurrentPeriodData,
  } = useValueByPeriodStatisticsRequest({
    period,
    after: timeframe.after,
    before: timeframe.before,
    queryKey: 'money-flow-selected',
  });

  const {
    data: previousDataBackend,
    isLoading: isPreviousLoading,
    error: previousError,
    refetch: refetchPreviousPeriodData,
  } = useValueByPeriodStatisticsRequest({
    period,
    after: previousTimeframe.after,
    before: previousTimeframe.before,
    queryKey: 'money-flow-comparison',
  });

  const transformedData: TransformedData[] = useMemo(() => {
    if (!currentDataBackend?.length || !previousDataBackend?.length) return [];

    const maxLength = Math.max(currentDataBackend.length, previousDataBackend.length);
    const baseDate = currentDataBackend[0]?.after.clone() ?? moment(); // fallback just in case

    const periodUnit = period === 'P1D' ? 'days' : period === 'P1W' ? 'weeks' : 'months';

    return Array.from({ length: maxLength }, (_, index) => {
      const date = baseDate.clone().add(index, periodUnit);

      const currentItem = currentDataBackend[index] || {
        after: timeframe.after.clone(),
        before: timeframe.before.clone(),
        income: 0,
        expense: 0,
      };

      const previousItem = previousDataBackend[index] || {
        after: previousTimeframe.after.clone(),
        before: previousTimeframe.before.clone(),
        income: 0,
        expense: 0,
      };

      return {
        timestamp: date.unix(),
        date,
        currentPeriod: {
          after: currentItem.after.clone(),
          before: currentItem.before.clone(),
        },
        comparisonPeriod: {
          after: previousItem.after.clone(),
          before: previousItem.before.clone(),
        },
        income: currentItem.income,
        expenses: currentItem.expense,
        revenue: currentItem.income - currentItem.expense,
        previousIncome: previousItem.income,
        previousExpenses: previousItem.expense,
        previousRevenue: previousItem.income - previousItem.expense,
      };
    });
  }, [currentDataBackend, previousDataBackend, period, timeframe, previousTimeframe]);

  const {
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    avgPeriodIncome,
    avgPeriodExpenses,
    incomeChangePercent,
    expensesChangePercent,
    previousAvgPeriodIncome,
    previousAvgPeriodExpenses,
  } = useMemo(() => {
    if (!transformedData.length) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalRevenue: 0,
        previousTotalIncome: 0,
        previousTotalExpenses: 0,
        previousTotalRevenue: 0,
        avgPeriodIncome: 0,
        avgPeriodExpenses: 0,
        incomeChangePercent: 0,
        expensesChangePercent: 0,
        previousAvgPeriodIncome: 0,
        previousAvgPeriodExpenses: 0,
      };
    }

    const periodUnit = period === 'P1D' ? 'days' : period === 'P1W' ? 'weeks' : 'months';

    const currentPeriodCount = moment(timeframe.before).diff(moment(timeframe.after), periodUnit);
    const previousPeriodCount = moment(previousTimeframe.before).diff(moment(previousTimeframe.after), periodUnit);

    const currentIncome = transformedData.reduce((sum, d) => sum + d.income, 0);
    const currentExpenses = transformedData.reduce((sum, d) => sum + d.expenses, 0);
    const previousIncome = transformedData.reduce((sum, d) => sum + d.previousIncome, 0);
    const previousExpenses = transformedData.reduce((sum, d) => sum + d.previousExpenses, 0);

    const incomeChange = currentIncome - previousIncome;
    const expensesChange = currentExpenses - previousExpenses;

    return {
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      totalRevenue: currentIncome - currentExpenses,
      previousTotalIncome: previousIncome,
      previousTotalExpenses: previousExpenses,
      previousTotalRevenue: previousIncome - previousExpenses,
      avgPeriodIncome: currentPeriodCount ? currentIncome / currentPeriodCount : 0,
      avgPeriodExpenses: currentPeriodCount ? currentExpenses / currentPeriodCount : 0,
      incomeChangePercent: previousIncome !== 0 ? (incomeChange / Math.abs(previousIncome)) * 100 : 0,
      expensesChangePercent: previousExpenses !== 0 ? (expensesChange / Math.abs(previousExpenses)) * 100 : 0,
      previousAvgPeriodIncome: previousPeriodCount ? previousIncome / previousPeriodCount : 0,
      previousAvgPeriodExpenses: previousPeriodCount ? previousExpenses / previousPeriodCount : 0,
    };
  }, [transformedData, period, timeframe, previousTimeframe]);

  const revenueChangePercent =
    previousTotalRevenue !== 0 ? ((totalRevenue - previousTotalRevenue) / Math.abs(previousTotalRevenue)) * 100 : 0;

  return {
    transformedData,
    isLoading: isCurrentLoading || isPreviousLoading,
    error: currentError || previousError,
    refetchData: () => {
      refetchCurrentPeriodData();
      refetchPreviousPeriodData();
    },
    revenueChangePercent,
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    avgPeriodIncome,
    avgPeriodExpenses,
    incomeChangePercent,
    expensesChangePercent,
    previousAvgPeriodIncome,
    previousAvgPeriodExpenses,
  };
};
