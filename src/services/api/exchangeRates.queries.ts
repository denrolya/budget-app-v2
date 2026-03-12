import { useQuery } from '@tanstack/react-query';

import { type ConvertedValues } from '@/features/transactions';
import { axiosFetcher } from '@/services/api';

export type ExchangeRatesData = {
  fixer: ConvertedValues;
  mono: ConvertedValues;
  wise: ConvertedValues;
};

const ENDPOINTS = {
  fixer: '/api/v2/exchange-rates/fixer',
  mono: '/api/v2/exchange-rates/monobank',
  wise: '/api/v2/exchange-rates/wise',
} as const;

export const exchangeRatesQueryKey = ['exchangeRates'] as const;

export const useExchangeRatesQuery = () =>
  useQuery<ExchangeRatesData, Error>({
    queryKey: exchangeRatesQueryKey,
    queryFn: async () => {
      const [fixer, mono, wise] = await Promise.all([
        axiosFetcher(ENDPOINTS.fixer),
        axiosFetcher(ENDPOINTS.mono),
        axiosFetcher(ENDPOINTS.wise),
      ]);

      return {
        fixer: fixer?.rates ?? {},
        mono: mono?.rates ?? {},
        wise: wise?.rates ?? {},
      };
    },
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 6, // 6h
    retry: 3,
  });
