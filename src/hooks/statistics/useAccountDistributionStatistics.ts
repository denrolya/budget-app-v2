import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Moment } from 'moment';
import { type DependencyList, useEffect } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { type Account } from '@/features/accounts';
import { type Type as TransactionType } from '@/features/transactions';
import { useAccounts } from '@/hooks/financeData';
import { generateQueryParamsString } from '@/lib/url/generateQueryParamsString';
import { axiosFetcher } from '@/services/api';

const URL = '/api/v2/statistics/account-distribution';

interface ApiRow {
  amount: number;
  value: number;
  account: { id: number | string };
}

export interface AccountStat {
  account: Account;
  amount: number;
  value: number;
  percentage: number;
}

interface UseAccountDistributionParams {
  after: Moment;
  before: Moment;
  type: TransactionType;
  queryKey?: string;
}

interface UseAccountDistributionReturn {
  stats: AccountStat[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useAccountDistribution = (
  { after, before, type, queryKey = 'account-distribution' }: UseAccountDistributionParams,
  dependencies: DependencyList = [],
): UseAccountDistributionReturn => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();
  const accounts = useAccounts();

  const { data, isLoading, error, refetch } = useQuery<ApiRow[], Error, { rows: AccountStat[]; total: number }>({
    queryKey: [
      queryKey,
      after.format(BACKEND_DATE_FORMAT),
      before.format(BACKEND_DATE_FORMAT),
      type,
      baseCurrency,
      ...dependencies,
    ],
    queryFn: async (): Promise<ApiRow[]> => {
      const qs = generateQueryParamsString({ after, before, type });
      return (await axiosFetcher(`${URL}?${qs}`)) as ApiRow[];
    },
    select: (rows: ApiRow[]) => {
      const totalAmount = rows.reduce((sum, r) => sum + (r.value ?? 0), 0);

      const stats: AccountStat[] = rows
        .map((r) => {
          const accountId = r.account?.id;
          if (accountId == null) {
            throw new Error('Account ID missing in account-distribution row');
          }

          const account = accounts.find((a) => a.id === accountId);
          if (!account) {
            throw new Error(`Account with id=${accountId} not found in context`);
          }

          const value = Number(r.value ?? 0);
          const total = Number(totalAmount ?? 0);
          const percentage = total > 0 ? value / total : 0;

          return {
            account,
            value,
            amount: r.amount ?? 0,
            percentage,
          };
        })
        .sort((a, b) => b.value - a.value);

      return { rows: stats, total: Number(totalAmount ?? 0) };
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  // same lifecycle as your category hook
  useEffect(
    () => () => {
      queryClient.cancelQueries({ queryKey: [queryKey] });
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, ...dependencies]);

  return {
    stats: data?.rows ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error ?? null,
    refetch,
  };
};
