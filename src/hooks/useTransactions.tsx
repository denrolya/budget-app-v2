import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import moment, { Moment } from 'moment';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { useListState } from '@/hooks/useListState';
import Transaction, { TransactionFactory } from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { FetchResponse as FetchTransactionsResponse, transactionService } from '@/services/api/transaction';

interface UseTransactionsOptions {
  initialPerPage?: number;
  initialFilters?: TransactionFilters;
  initialSort?: { field: string; direction: 'asc' | 'desc' };
  updateUrl?: boolean;
  queryKey?: string;
  excludeTransfers?: boolean;
}

interface TransformedResponse {
  list: Transaction[];
  count: number;
}

export const useTransactions = (options: UseTransactionsOptions = {}): {
  transactions: Transaction[];
  groupedItems: [Moment, Transaction[], number, number][];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
  };
  filters: TransactionFilters;
  setFilter: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => void;
  resetFilters: () => void;
  sort: { field: string; direction: 'asc' | 'desc' };
  setSort: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  isFetching: boolean;
} => {
  const baseCurrency = useBaseCurrency();
  const {
    initialPerPage = 30,
    initialFilters = new TransactionFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' },
    updateUrl = true,
    queryKey = 'transactions',
    excludeTransfers = false,
  } = options;

  const {
    pagination: { currentPage, perPage },
    filters,
    sort,
    setCurrentPage,
    setFilter,
    resetFilters,
    setSort,
  } = useListState<TransactionFilters, Transaction>({
    initialPerPage,
    initialFilters,
    initialSort,
    searchParamKeys: {
      searchTerm: 'q',
      before: 'before',
      after: 'after',
      status: 'status',
      amountRange: 'amount',
      categories: 'categories',
      accounts: 'accounts',
      withNestedCategories: 'withNestedCategories',
      isDraft: 'isDraft',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    updateUrl,
  });

  const queryClient = useQueryClient();
  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  }, [queryClient, queryKey]);
  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);
  const { createTransaction } = TransactionFactory();

  const {
    data,
    error,
    isPending,
    isError,
    isFetching,
    refetch,
  }: UseQueryResult<TransformedResponse, Error> = useQuery({
    queryKey: [queryKey, currentPage, perPage, filters, sort, excludeTransfers],
    queryFn: async (): Promise<FetchTransactionsResponse> =>
      await transactionService.fetchTransactions({
        page: currentPage,
        perPage,
        filters,
        sort,
        excludeTransfers,
      }),
    select: (data: FetchTransactionsResponse): TransformedResponse => ({
      ...data,
      list: data.list.map((item) => createTransaction(item)),
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleError = useCallback(() => {
    if (isError) {
      toast.error('Failed to fetch transactions', {
        description: error?.message || 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => refetch(),
        },
      });
    }
  }, [isError, error, refetch]);

  useMemo(handleError, [handleError]);

  const totalPages = useMemo(() => Math.ceil((data?.count ?? 0) / perPage) || 0, [data?.count, perPage]);

  const transactions = data?.list ?? [];

  const groupedItems: [Moment, Transaction[], number, number][] = useMemo(() => toPairs(
    groupBy(
      sortBy(transactions, item => -item.executedAt.valueOf()),
      item => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, transactions]) => {
    const totalValue = sumBy(transactions, item => {
      const value = item.convertedValues[baseCurrency] || 0;
      return item.isExpense() ? -value : value;
    });
    const totalCount = transactions.length;
    return [moment(date), transactions, totalValue, totalCount];
  }), [transactions, baseCurrency]);


  return {
    transactions,
    groupedItems,
    isLoading: isPending,
    isError,
    error: error || null,
    refetch,
    pagination: {
      currentPage,
      perPage,
      totalPages,
      setCurrentPage,
    },
    filters,
    setFilter,
    resetFilters,
    sort,
    setSort,
    isFetching,
  };
};
