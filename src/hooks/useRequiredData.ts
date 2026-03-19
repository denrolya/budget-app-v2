import { useQueryClient } from '@tanstack/react-query';

import { queryKeys as accountsQueryKeys, useList as useAccountsQuery } from '@/features/accounts';
import { queryKeys as categoriesQueryKeys, useList as useCategoriesQuery } from '@/features/categories';
import { queryKeys as debtsQueryKeys, useList as useDebtsQuery } from '@/features/debts';
import { exchangeRatesQueryKey, useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

export type InitStatus = 'idle' | 'loading' | 'success' | 'error';

export type InitEntry = {
  key: 'rates' | 'accounts' | 'categories' | 'debts';
  label: string;
  endpoint: string;
  status: InitStatus;
  detail: string | null;
  error: Error | null;
};

type QueryShape = { isLoading: boolean; isSuccess: boolean; isError: boolean };

const resolveStatus = (q: QueryShape): InitStatus => {
  if (q.isSuccess) return 'success';
  if (q.isError) return 'error';
  if (q.isLoading) return 'loading';
  return 'idle';
};

export const useRequiredData = () => {
  const qc = useQueryClient();

  const rates = useExchangeRatesQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const debts = useDebtsQuery();

  const categoriesDetail = (() => {
    if (!categories.isSuccess) return null;
    const d = categories.data as { list?: unknown[] } | null;
    const count = d?.list?.length;
    return count !== undefined ? `${count} loaded` : 'loaded';
  })();

  const entries: InitEntry[] = [
    {
      key: 'rates',
      label: 'Exchange rates',
      endpoint: '/api/v2/exchange-rates',
      status: resolveStatus(rates),
      detail: rates.isSuccess ? '3 providers' : null,
      error: rates.error,
    },
    {
      key: 'accounts',
      label: 'Accounts',
      endpoint: '/api/v2/accounts',
      status: resolveStatus(accounts),
      detail: accounts.data ? `${accounts.data.length} loaded` : null,
      error: accounts.error,
    },
    {
      key: 'categories',
      label: 'Categories',
      endpoint: '/api/categories',
      status: resolveStatus(categories),
      detail: categoriesDetail,
      error: categories.error,
    },
    {
      key: 'debts',
      label: 'Debts',
      endpoint: '/api/debts',
      status: resolveStatus(debts),
      detail: debts.data ? `${debts.data.length} loaded` : null,
      error: debts.error,
    },
  ];

  const isLoading = rates.isLoading || accounts.isPending || categories.isLoading || debts.isPending;
  const hasError = rates.isError || accounts.isError || categories.isError || debts.isError;

  const retry = (key?: InitEntry['key']) => {
    if (!key || key === 'rates') void qc.invalidateQueries({ queryKey: exchangeRatesQueryKey });
    if (!key || key === 'accounts') void qc.invalidateQueries({ queryKey: accountsQueryKeys.all });
    if (!key || key === 'categories') void qc.invalidateQueries({ queryKey: categoriesQueryKeys.all });
    if (!key || key === 'debts') void qc.invalidateQueries({ queryKey: debtsQueryKeys.all });
  };

  return { entries, isLoading, hasError, retry };
};
