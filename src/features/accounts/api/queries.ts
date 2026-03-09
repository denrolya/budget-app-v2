import { useQuery } from '@tanstack/react-query';
import type { Moment } from 'moment';

import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

import Account from '../models/Account';

import { queryKeys } from './keys';
import { accountService, type BalanceHistoryResponse, type DailyStatsResponse, type HeatmapFilters } from './service';

export const useGlobalDailyStats = (filters: HeatmapFilters, after: Moment, before: Moment) => {
  const afterStr = after.format('YYYY-MM-DD');
  const beforeStr = before.format('YYYY-MM-DD');

  return useQuery<DailyStatsResponse, Error>({
    queryKey: queryKeys.globalDailyStats(filters, afterStr, beforeStr),
    queryFn: () => accountService.fetchGlobalDailyStats(filters, afterStr, beforeStr),
    staleTime: 1000 * 60 * 5,
  });
};

export const useList = () => {
  const exchangeRatesQuery = useExchangeRatesQuery();

  return useQuery<Account[], Error>({
    queryKey: queryKeys.list(),
    enabled: !!exchangeRatesQuery.data,
    queryFn: async () => {
      const data = exchangeRatesQuery.data;
      if (!data) throw new Error('Exchange rates not available');
      return accountService.fetchList(data.fixer);
    },
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });
};

export const useBalanceHistory = (accountId: number, after: Moment, before: Moment, interval: string) => {
  const afterStr = after.format('YYYY-MM-DD');
  const beforeStr = before.format('YYYY-MM-DD');

  return useQuery<BalanceHistoryResponse, Error>({
    queryKey: queryKeys.balanceHistory(accountId, afterStr, beforeStr, interval),
    queryFn: () => accountService.fetchBalanceHistory(accountId, afterStr, beforeStr, interval),
    staleTime: 1000 * 60 * 2,
  });
};
