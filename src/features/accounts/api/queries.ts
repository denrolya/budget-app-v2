import { useQuery } from '@tanstack/react-query';

import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

import Account from '../models/Account';

import { queryKeys } from './keys';
import { accountService } from './service';

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
