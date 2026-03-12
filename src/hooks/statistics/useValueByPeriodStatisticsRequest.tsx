import { useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useEffect } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { axiosFetcher } from '@/services/api';
import {
  type UseStatisticsParams,
  type UseStatisticsReturn,
  type ValueByPeriodData,
  type ValueByPeriodDataDTO,
} from '@/types/valueByPeriodStatistics';
import { generateQueryParamsString } from '@/lib/url/generateQueryParamsString';

const URL = '/api/v2/statistics/value-by-period';

export const useValueByPeriodStatisticsRequest = ({
  after,
  before,
  period,
  type,
  accounts,
  categories,
  queryKey = 'value-by-period',
  enabled = true,
}: UseStatisticsParams): UseStatisticsReturn => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery<ValueByPeriodDataDTO[], Error, ValueByPeriodData[]>({
    enabled,
    queryKey: [
      queryKey,
      after?.format(BACKEND_DATE_FORMAT),
      before?.format(BACKEND_DATE_FORMAT),
      period,
      type,
      accounts,
      categories,
      baseCurrency,
    ],
    queryFn: async (): Promise<ValueByPeriodDataDTO[]> => {
      const response = (await axiosFetcher(
        `${URL}?${generateQueryParamsString({
          after,
          before,
          period,
          type,
          accounts,
          categories,
        })}`,
      )) as ValueByPeriodDataDTO;
      return response as unknown as ValueByPeriodDataDTO[];
    },
    select: (data: ValueByPeriodDataDTO[]): ValueByPeriodData[] =>
      data.map((item: ValueByPeriodDataDTO) => ({
        after: moment.unix(item.after),
        before: moment.unix(item.before),
        expense: item.expense,
        income: item.income,
      })),
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  useEffect(
    () => () => {
      queryClient.cancelQueries({ queryKey: [queryKey] });
    },
    [queryClient, queryKey],
  );

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};
