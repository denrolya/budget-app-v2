import { useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { type DependencyList, useCallback, useEffect, useMemo } from 'react';
import capitalize from 'lodash/capitalize';

import { useBaseCurrency } from '@/features/auth';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { axiosFetcher } from '@/services/api';
import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';
import { type ValueByPeriodData } from '@/types/valueByPeriodStatistics';
import { generateQueryParamsString } from '@/lib/url/generateQueryParamsString';
import { Type as TransactionType } from '@/features/transactions';

const URL = '/api/v2/statistics/category/timeline';

interface TimelineDataPoint {
  date: number;
  value: number;
}

interface TimelineData {
  [category: string]: TimelineDataPoint[];
}

interface TimelineDataProcessed {
  [category: string]: {
    date: moment.Moment;
    value: number;
  }[];
}

interface UseTimelineStatisticsParams {
  after: moment.Moment;
  before: moment.Moment;
  period: string;
  categories: number[];
  queryKey?: string;
  fetchIncomeReference?: boolean;
  fetchExpenseReference?: boolean;
}

interface UseTimelineStatisticsReturn {
  data: TimelineDataProcessed;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useTimelineStatistics = (
  {
    after,
    before,
    period,
    categories,
    queryKey = 'timeline-statistics',
    fetchIncomeReference = false,
    fetchExpenseReference = false,
  }: UseTimelineStatisticsParams,
  dependencies: DependencyList = [],
): UseTimelineStatisticsReturn => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: errorCategories,
    refetch: refetchCategories,
  } = useQuery<TimelineData, Error, TimelineDataProcessed>({
    queryKey: [
      queryKey,
      after.format(BACKEND_DATE_FORMAT),
      before.format(BACKEND_DATE_FORMAT),
      period,
      categories,
      baseCurrency,
      ...dependencies,
    ],
    queryFn: async (): Promise<TimelineData> =>
      (await axiosFetcher(
        `${URL}?${generateQueryParamsString({
          after,
          before,
          period,
          categories,
        })}`,
      )) as TimelineData,
    select: (data: TimelineData): TimelineDataProcessed => {
      const processedData: TimelineDataProcessed = {};
      Object.entries(data).forEach(([category, timelineData]) => {
        processedData[category] = timelineData.map((item) => ({
          date: moment.unix(item.date),
          value: item.value,
        }));
      });
      return processedData;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  const {
    data: expenseData,
    isLoading: isLoadingExpense,
    error: errorExpense,
    refetch: refetchExpense,
  } = useValueByPeriodStatisticsRequest({
    after,
    before,
    period,
    type: TransactionType.Expense,
    queryKey: `${queryKey}-expense`,
    enabled: fetchExpenseReference,
  });

  const {
    data: incomeData,
    isLoading: isLoadingIncome,
    error: errorIncome,
    refetch: refetchIncome,
  } = useValueByPeriodStatisticsRequest({
    after,
    before,
    period,
    type: TransactionType.Income,
    queryKey: `${queryKey}-income`,
    enabled: fetchIncomeReference,
  });

  const processReferenceData = (data: ValueByPeriodData[], type: 'income' | 'expense'): TimelineDataProcessed => {
    const processedData: TimelineDataProcessed = {};
    data.forEach((item) => {
      const key = `Total ${capitalize(type)}`;
      if (!processedData[key]) {
        processedData[key] = [];
      }
      processedData[key].push({
        date: item.after,
        value: type === TransactionType.Income ? item.income : item.expense,
      });
    });
    return processedData;
  };

  const timelineData = useMemo(() => {
    let result: TimelineDataProcessed = {};
    if (fetchExpenseReference && expenseData) {
      const expenseProcessed = processReferenceData(expenseData, TransactionType.Expense);
      result = { ...result, ...expenseProcessed };
    }

    if (fetchIncomeReference && incomeData) {
      const incomeProcessed = processReferenceData(incomeData, TransactionType.Income);
      result = { ...result, ...incomeProcessed };
    }

    result = { ...result, ...categoriesData };

    return result;
  }, [categoriesData, expenseData, incomeData, fetchExpenseReference, fetchIncomeReference]);

  const isLoading =
    isLoadingCategories || (fetchExpenseReference && isLoadingExpense) || (fetchIncomeReference && isLoadingIncome);
  const error: Error | null =
    errorCategories ||
    (fetchExpenseReference ? errorExpense : null) ||
    (fetchIncomeReference ? errorIncome : null) ||
    null;

  const refetch = useCallback(() => {
    refetchCategories();
    if (fetchExpenseReference) {
      refetchExpense();
    }
    if (fetchIncomeReference) {
      refetchIncome();
    }
  }, [refetchCategories, refetchExpense, refetchIncome, fetchExpenseReference, fetchIncomeReference]);

  useEffect(
    () => () => {
      queryClient.cancelQueries({ queryKey: [queryKey] });
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return {
    data: timelineData,
    isLoading,
    error,
    refetch,
  };
};
