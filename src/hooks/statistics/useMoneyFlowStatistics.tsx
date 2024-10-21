import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useMemo, useEffect } from 'react';

import { api } from '@/services/api';
import { BACKEND_DATE_FORMAT, INTERVAL_OPTIONS } from '@/constants/datetime';

interface BackendData {
  after: number
  before: number
  expense: number
  income: number
}

interface TransformedData {
  time: number
  income: number
  expenses: number
  revenue: number
  date: moment.Moment
  previousIncome: number
  previousExpenses: number
  previousRevenue: number
}

interface UseMoneyFlowProps {
  interval: string
  currentTimeframe: { after: moment.Moment; before: moment.Moment }
  previousTimeframe: { after: moment.Moment; before: moment.Moment }
  baseCurrency: string
}

interface UseMoneyFlowReturn {
  availableIntervals: typeof INTERVAL_OPTIONS
  transformedData: TransformedData[]
  isLoading: boolean
  error: Error | null
  refetchData: () => void
  setInterval: (newInterval: string) => void
  revenueChange: number
  revenueChangePercent: number
  totalIncome: number
  totalExpenses: number
  totalRevenue: number
  previousTotalIncome: number
  previousTotalExpenses: number
  previousTotalRevenue: number
  incomeChange: number
  incomeChangePercent: number
  expensesChange: number
  expensesChangePercent: number
  previousAvgIntervalIncome: number
  previousAvgIntervalExpenses: number
  avgIntervalIncome: number
  avgIntervalExpenses: number
}

export const useMoneyFlow = ({
                               interval,
                               currentTimeframe,
                               previousTimeframe,
                               baseCurrency,
                             }: UseMoneyFlowProps): UseMoneyFlowReturn => {
  const availableIntervals = useMemo(() => {
    const durationInDays = currentTimeframe.before.diff(currentTimeframe.after, 'days');
    return INTERVAL_OPTIONS.filter(option => {
      if (durationInDays <= 1) return option.value === '1 day';
      if (durationInDays <= 7) return ['1 hour', '1 day'].includes(option.value);
      if (durationInDays <= 31) return ['1 day', '1 week'].includes(option.value);
      return true;
    });
  }, [currentTimeframe]);

  const {
    data: currentDataBackend,
    isLoading: isCurrentLoading,
    error: currentError,
    refetch: refetchCurrentPeriodData,
  } = useQuery<BackendData[]>({
    queryKey: ['currentData', currentTimeframe, interval],
    queryFn: async () => {
      const response = await api.get('/api/v2/statistics/value-by-period', {
        params: {
          after: currentTimeframe.after.format(BACKEND_DATE_FORMAT),
          before: currentTimeframe.before.format(BACKEND_DATE_FORMAT),
          interval,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  const {
    data: previousDataBackend,
    isLoading: isPreviousLoading,
    error: previousError,
    refetch: refetchPreviousPeriodData,
  } = useQuery<BackendData[]>({
    queryKey: ['previousData', currentTimeframe, interval],
    queryFn: async () => {
      const response = await api.get('/api/v2/statistics/value-by-period', {
        params: {
          after: previousTimeframe.after.format(BACKEND_DATE_FORMAT),
          before: previousTimeframe.before.format(BACKEND_DATE_FORMAT),
          interval,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 240 * 60 * 1000, // Example: data is fresh for 4 hours
  });

  const refetchData = () => {
    refetchCurrentPeriodData();
    refetchPreviousPeriodData();
  };

  useEffect(() => {
    refetchData();
  }, [baseCurrency]);

  const transformedData: TransformedData[] = useMemo(() => {
    if (!currentDataBackend || !previousDataBackend) return [];

    const getIntervalUnit = (interval: string) => {
      if (interval.includes('day')) return 'days';
      if (interval.includes('week')) return 'weeks';
      if (interval.includes('month')) return 'months';
      return 'days'; // default to days if unknown
    };

    const intervalUnit = getIntervalUnit(interval);

    const currentStartDate = moment.unix(currentDataBackend[0].after);
    const currentEndDate = moment.unix(currentDataBackend[currentDataBackend.length - 1].before);
    const previousStartDate = moment.unix(previousDataBackend[0].after);
    const previousEndDate = moment.unix(previousDataBackend[previousDataBackend.length - 1].before);

    const maxPeriods = Math.max(
      currentEndDate.diff(currentStartDate, intervalUnit) + 1,
      previousEndDate.diff(previousStartDate, intervalUnit) + 1
    );

    return Array.from({ length: maxPeriods }, (_, index) => {
      const currentDate = currentStartDate.clone().add(index, intervalUnit);
      const previousDate = previousStartDate.clone().add(index, intervalUnit);

      const currentItem = currentDataBackend.find(item =>
        moment.unix(item.after).isSame(currentDate, intervalUnit)
      ) || { income: 0, expense: 0, after: currentDate.unix(), before: currentDate.clone().endOf(intervalUnit).unix() };

      const previousItem = previousDataBackend.find(item =>
        moment.unix(item.after).isSame(previousDate, intervalUnit)
      ) || { income: 0, expense: 0, after: previousDate.unix(), before: previousDate.clone().endOf(intervalUnit).unix() };

      const currentRevenue = currentItem.income - currentItem.expense;
      const previousRevenue = previousItem.income - previousItem.expense;

      return {
        time: currentItem.after * 1000, // Convert to milliseconds
        income: currentItem.income,
        expenses: currentItem.expense,
        revenue: currentRevenue,
        date: moment.unix(currentItem.after),
        previousIncome: previousItem.income,
        previousExpenses: previousItem.expense,
        previousRevenue: previousRevenue,
      };
    });
  }, [currentDataBackend, previousDataBackend, interval]);

  const {
    revenueChange,
    revenueChangePercent,
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    incomeChange,
    incomeChangePercent,
    expensesChange,
    expensesChangePercent,
    avgIntervalIncome,
    avgIntervalExpenses,
    previousAvgIntervalIncome,
    previousAvgIntervalExpenses,
  } = useMemo(() => {
    const currentIncome = transformedData.reduce((sum, d) => sum + d.income, 0);
    const currentExpenses = transformedData.reduce((sum, d) => sum + d.expenses, 0);
    const currentRevenue = currentIncome - currentExpenses;

    const previousIncome = transformedData.reduce((sum, d) => sum + d.previousIncome, 0);
    const previousExpenses = transformedData.reduce((sum, d) => sum + d.previousExpenses, 0);
    const previousRevenue = previousIncome - previousExpenses;

    const revenueChange = currentRevenue - previousRevenue;
    const revenueChangePercent = previousRevenue !== 0 ? (revenueChange / Math.abs(previousRevenue)) * 100 : 0;

    const incomeChange = currentIncome - previousIncome;
    const incomeChangePercent = previousIncome !== 0 ? (incomeChange / Math.abs(previousIncome)) * 100 : 0;

    const expensesChange = currentExpenses - previousExpenses;
    const expensesChangePercent = previousExpenses !== 0 ? (expensesChange / Math.abs(previousExpenses)) * 100 : 0;

    // Calculate the number of intervals in the current period
    const intervalCount = transformedData.length;

    // Calculate average per interval
    const avgIntervalIncome = intervalCount > 0 ? currentIncome / intervalCount : 0;
    const avgIntervalExpenses = intervalCount > 0 ? currentExpenses / intervalCount : 0;
    const previousAvgIntervalIncome = intervalCount > 0 ? previousIncome / intervalCount : 0;
    const previousAvgIntervalExpenses = intervalCount > 0 ? previousExpenses / intervalCount : 0;

    return {
      revenueChange,
      revenueChangePercent,
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      totalRevenue: currentRevenue,
      previousTotalIncome: previousIncome,
      previousTotalExpenses: previousExpenses,
      previousTotalRevenue: previousRevenue,
      incomeChange,
      incomeChangePercent,
      expensesChange,
      expensesChangePercent,
      avgIntervalIncome,
      avgIntervalExpenses,
      previousAvgIntervalIncome,
      previousAvgIntervalExpenses,
    };
  }, [transformedData]);

  return {
    availableIntervals,
    transformedData,
    isLoading: isCurrentLoading || isPreviousLoading,
    error: currentError || previousError,
    refetchData,
    setInterval: (newInterval: string) => {
      // This function is a placeholder. The actual setInterval function should be implemented in the component using this hook.
    },
    revenueChange,
    revenueChangePercent,
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    incomeChange,
    incomeChangePercent,
    expensesChange,
    expensesChangePercent,
    avgIntervalIncome,
    avgIntervalExpenses,
    previousAvgIntervalIncome,
    previousAvgIntervalExpenses,
  };
};
