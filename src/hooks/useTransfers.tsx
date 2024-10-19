import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import moment, { Moment } from 'moment/moment';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { useBaseCurrency } from '@/contexts/auth';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { useListState } from '@/hooks/useListState';
import { TransactionFactory } from '@/models/Transaction';
import Transfer from '@/models/Transfer';
import { TransferFilters } from '@/models/TransferFilters';
import { transferService, FetchResponse as FetchTransfersResponse } from '@/services/api/transfer';

interface Sorting {
  field: string;
  direction: 'asc' | 'desc';
}

interface UseTransfersOptions {
  initialPerPage?: number;
  initialFilters?: TransferFilters;
  initialSort?: Sorting;
  updateUrl?: boolean;
  queryKey?: string;
}

interface TransformedResponse {
  items: Transfer[];
  totalItems: number;
}

export const useTransfers = (options: UseTransfersOptions = {}): {
  transfers: Transfer[];
  groupedItems: [Moment, Transfer[], number, number][];
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
  filters: TransferFilters;
  setFilter: <K extends keyof TransferFilters>(key: K, value: TransferFilters[K] | undefined | null) => void;
  resetFilters: () => void;
  sort: Sorting;
  setSort: (sort: Sorting) => void;
  isFetching: boolean;
} => {
  const baseCurrency = useBaseCurrency();

  const {
    initialPerPage = 20,
    initialFilters = new TransferFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' } as Sorting,
    updateUrl = true,
    queryKey = 'transfers',
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
  } = useListState<TransferFilters, Transfer>({
    initialPerPage,
    initialFilters,
    initialSort,
    searchParamKeys: {
      searchTerm: 'q',
      before: 'before',
      after: 'after',
      amountRange: 'amount',
      accounts: 'accounts',
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

  const { data, error, isPending, isError, isFetching, refetch }: UseQueryResult<TransformedResponse, Error> = useQuery({
    queryKey: [queryKey, currentPage, perPage, filters, sort],
    queryFn: async (): Promise<FetchTransfersResponse> => await transferService.fetchTransfers({
      page: currentPage,
      perPage,
      filters,
      sort,
    }),
    select: (data: FetchTransfersResponse): TransformedResponse => ({
      totalItems: data?.totalItems || 0,
      items: data.items?.map((item) => new Transfer({
        ...item,
        transactions: item.transactions.map((transaction) => createTransaction(transaction)),
      })) || [],
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleError = useCallback(() => {
    if (isError) {
      toast.error('Failed to fetch transfers', {
        description: error?.message || 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => refetch(),
        },
      });
    }
  }, [isError, error, refetch]);

  useMemo(handleError, [handleError]);

  const transfers = useMemo(() => data?.items ?? [], [data]);
  const totalItems = data?.totalItems ?? 0;
  const totalPages = useMemo(() => Math.ceil(totalItems / perPage) || 0, [totalItems, perPage]);

  const groupedItems: [Moment, Transfer[], number, number][] = useMemo(() => toPairs(
    groupBy(
      sortBy(transfers, item => -item.executedAt.valueOf()),
      item => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, items]) => {
    const totalValue = sumBy(items, ({ fromExpense }) => fromExpense.convertedValues[baseCurrency] || 0);
    const totalItems = items.length;
    return [moment(date), items, totalValue, totalItems];
  }), [transfers, baseCurrency]);

  return {
    transfers,
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
