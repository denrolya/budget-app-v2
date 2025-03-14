import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import moment, { Moment } from 'moment';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { Sorting } from '@/types/pagination';
import { FetchResponse as FetchTransactionsResponse, transactionService } from '@/services/api/transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import Transaction, { TransactionFactory } from '@/models/Transaction';
import { useListState } from '@/hooks/useListState';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { useBaseCurrency } from '@/contexts/auth';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';

interface UseTransactionsOptions {
  initialPerPage?: number;
  initialFilters?: TransactionFilters;
  initialSort?: Sorting;
  updateUrl?: boolean;
  queryKey?: string;
  excludeTransfers?: boolean;
}

interface TransformedResponse {
  items: Transaction[];
  totalItems: number;
  totalValue: number;
}

export const useTransactions = (options: UseTransactionsOptions = {}): {
  transactions: Transaction[];
  groupedItems: [Moment, Transaction[], number, number][];
  totalValue: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
    setCurrentPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
  };
  filters: TransactionFilters;
  setFilter: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K] | undefined | null) => void;
  resetFilters: () => void;
  sort: Sorting;
  setSort: (sort: Sorting) => void;
  isFetching: boolean;
} => {
  const baseCurrency = useBaseCurrency();
  const {
    initialPerPage = 50,
    initialFilters = new TransactionFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' } as Sorting,
    updateUrl = true,
    queryKey = 'transactions',
    excludeTransfers = false,
  } = options;

  const {
    pagination: { currentPage, perPage },
    filters,
    sort,
    setCurrentPage,
    setPerPage,
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
      totalValue: data?.totalValue || 0,
      totalItems: data?.totalItems || 0,
      items: data.items?.map((item) => createTransaction(item)) || [],
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

  const transactions = useMemo(() => data?.items ?? [], [data]);
  const totalItems = data?.totalItems ?? 0;
  const totalPages = useMemo(() => Math.ceil(totalItems / perPage) || 0, [totalItems, perPage]);
  const totalValue = data?.totalValue || 0;

  const groupedItems: [Moment, Transaction[], number, number][] = useMemo(() => toPairs(
    groupBy(
      sortBy(transactions, item => -item.executedAt.valueOf()),
      item => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, items]) => {
    const totalValue = sumBy(items, item => {
      const value = item.convertedValues[baseCurrency] || 0;
      return item.isExpense() ? -value : value;
    });
    const totalItems = items.length;
    return [moment(date), items, totalValue, totalItems];
  }), [transactions, baseCurrency]);

  return {
    transactions,
    totalValue,
    groupedItems,
    isLoading: isPending,
    isError,
    error: error || null,
    refetch,
    pagination: {
      currentPage,
      perPage,
      totalPages,
      totalItems,
      setCurrentPage,
      setPerPage,
    },
    filters,
    setFilter,
    resetFilters,
    sort,
    setSort,
    isFetching,
  };
};
