import { useEffect, useMemo } from 'react';

import { PERIOD_OPTIONS } from '@/constants/datetime';
import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';
import { TransformedData, UseMoneyFlowParams, UseMoneyFlowReturn } from '@/types/statistics/moneyFlow';

export const useMoneyFlow = ({
                               period,
                               currentTimeframe,
                               previousTimeframe,
                               baseCurrency,
                             }: UseMoneyFlowParams): UseMoneyFlowReturn => {

  const availablePeriods = useMemo(() => {
    const durationInDays = currentTimeframe.before.diff(currentTimeframe.after, 'days');
    return PERIOD_OPTIONS.filter(option => {
      if (durationInDays <= 1) return option.value === 'P1D';
      if (durationInDays <= 7) return ['PT1H', 'P1D'].includes(option.value);
      if (durationInDays <= 31) return ['P1D', 'P1W'].includes(option.value);
      return true;
    });
  }, [currentTimeframe]);

  const {
    data: currentDataBackend,
    isLoading: isCurrentLoading,
    error: currentError,
    refetch: refetchCurrentPeriodData,
  } = useValueByPeriodStatisticsRequest({
    period,
    after: currentTimeframe.after,
    before: currentTimeframe.before,
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

  useEffect(() => {
    refetchCurrentPeriodData();
    refetchPreviousPeriodData();
  }, [baseCurrency]);

  const transformedData: TransformedData[] = useMemo(() => {
    if (!currentDataBackend?.length || !previousDataBackend?.length) return [];

    const periodUnit = period.includes('P1D') ? 'days' : period.includes('P1W') ? 'weeks' : 'months';

    const maxPeriods = Math.max(currentDataBackend.length, previousDataBackend.length);

    return Array.from({ length: maxPeriods }, (_, index) => {
      const currentDate = currentDataBackend[0].after.clone().add(index, periodUnit);
      const previousDate = previousDataBackend[0].after.clone().add(index, periodUnit);

      const currentItem = currentDataBackend.find(item => item.after.isSame(currentDate, periodUnit)) || {
        income: 0,
        expense: 0,
        after: currentDate,
      };
      const previousItem = previousDataBackend.find(item => item.after.isSame(previousDate, periodUnit)) || {
        income: 0,
        expense: 0,
        after: previousDate,
      };

      return {
        timestamp: currentItem.after.unix(),
        income: currentItem.income,
        expenses: currentItem.expense,
        revenue: currentItem.income - currentItem.expense,
        date: currentItem.after,
        previousIncome: previousItem.income,
        previousExpenses: previousItem.expense,
        previousRevenue: previousItem.income - previousItem.expense,
      };
    });
  }, [currentDataBackend, previousDataBackend, period]);

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
      avgPeriodIncome: currentIncome / transformedData.length,
      avgPeriodExpenses: currentExpenses / transformedData.length,
      incomeChangePercent: previousIncome !== 0 ? (incomeChange / Math.abs(previousIncome)) * 100 : 0,
      expensesChangePercent: previousExpenses !== 0 ? (expensesChange / Math.abs(previousExpenses)) * 100 : 0,
      previousAvgPeriodIncome: previousIncome / transformedData.length,
      previousAvgPeriodExpenses: previousExpenses / transformedData.length,
    };
  }, [transformedData]);

  const revenueChangePercent = previousTotalRevenue !== 0
    ? ((totalRevenue - previousTotalRevenue) / Math.abs(previousTotalRevenue)) * 100
    : 0;

  return {
    availablePeriods,
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
