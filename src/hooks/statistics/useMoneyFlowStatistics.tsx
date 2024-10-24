import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useMemo, useEffect } from 'react';

import { api } from '@/services/api';
import { BACKEND_DATE_FORMAT, INTERVAL_OPTIONS } from '@/constants/datetime';

interface BackendData {
  after: number;
  before: number;
  expense: number;
  income: number;
}

interface TransformedData {
  time: number;
  income: number;
  expenses: number;
  revenue: number;
  date: moment.Moment;
  previousIncome: number;
  previousExpenses: number;
  previousRevenue: number;
}

interface UseMoneyFlowProps {
  interval: string;
  currentTimeframe: { after: moment.Moment; before: moment.Moment };
  previousTimeframe: { after: moment.Moment; before: moment.Moment };
  baseCurrency: string;
}

interface UseMoneyFlowReturn {
  availableIntervals: typeof INTERVAL_OPTIONS;
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
  avgIntervalIncome: number;
  avgIntervalExpenses: number;
  incomeChangePercent: number;
  expensesChangePercent: number;
  previousAvgIntervalIncome: number;
  previousAvgIntervalExpenses: number;
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
    queryKey: ['previousData', previousTimeframe, interval],
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
    const previousStartDate = moment.unix(previousDataBackend[0].after);

    const maxPeriods = Math.max(
      currentDataBackend.length,
      previousDataBackend.length
    );

    return Array.from({ length: maxPeriods }, (_, index) => {
      const currentDate = currentStartDate.clone().add(index, intervalUnit);
      const previousDate = previousStartDate.clone().add(index, intervalUnit);

      const currentItem = currentDataBackend.find(item =>
        moment.unix(item.after).isSame(currentDate, intervalUnit)
      ) || { income: 0, expense: 0, after: currentDate.unix() };

      const previousItem = previousDataBackend.find(item =>
        moment.unix(item.after).isSame(previousDate, intervalUnit)
      ) || { income: 0, expense: 0, after: previousDate.unix() };

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
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    avgIntervalIncome,
    avgIntervalExpenses,
    incomeChangePercent,
    expensesChangePercent,
    previousAvgIntervalIncome,
    previousAvgIntervalExpenses,
  } = useMemo(() => {
    const currentIncome = transformedData.reduce((sum, d) => sum + d.income, 0);
    const currentExpenses = transformedData.reduce((sum, d) => sum + d.expenses, 0);
    const currentRevenue = currentIncome - currentExpenses;

    const previousIncome = transformedData.reduce((sum, d) => sum + d.previousIncome, 0);
    const previousExpenses = transformedData.reduce((sum, d) => sum + d.previousExpenses, 0);
    const previousRevenue = previousIncome - previousExpenses;

    const avgIntervalIncome = transformedData.length > 0 ? currentIncome / transformedData.length : 0;
    const avgIntervalExpenses = transformedData.length > 0 ? currentExpenses / transformedData.length : 0;
    const previousAvgIntervalIncome = transformedData.length > 0 ? previousIncome / transformedData.length : 0;
    const previousAvgIntervalExpenses = transformedData.length > 0 ? previousExpenses / transformedData.length : 0;

    const incomeChange = currentIncome - previousIncome;
    const incomeChangePercent = previousIncome !== 0 ? (incomeChange / Math.abs(previousIncome)) * 100 : 0;

    const expensesChange = currentExpenses - previousExpenses;
    const expensesChangePercent = previousExpenses !== 0 ? (expensesChange / Math.abs(previousExpenses)) * 100 : 0;

    return {
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      totalRevenue: currentRevenue,
      previousTotalIncome: previousIncome,
      previousTotalExpenses: previousExpenses,
      previousTotalRevenue: previousRevenue,
      avgIntervalIncome,
      avgIntervalExpenses,
      incomeChangePercent,
      expensesChangePercent,
      previousAvgIntervalIncome,
      previousAvgIntervalExpenses,
    };
  }, [transformedData]);

  const revenueChangePercent = previousTotalRevenue !== 0
    ? ((totalRevenue - previousTotalRevenue) / Math.abs(previousTotalRevenue)) * 100
    : 0;

  return {
    availableIntervals,
    transformedData,
    isLoading: isCurrentLoading || isPreviousLoading,
    error: currentError || previousError,
    refetchData,
    revenueChangePercent,
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    avgIntervalIncome,
    avgIntervalExpenses,
    incomeChangePercent,
    expensesChangePercent,
    previousAvgIntervalIncome,
    previousAvgIntervalExpenses,
  };
};
