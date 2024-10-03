import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { useListState } from '@/hooks/useListState';
import { TransactionFactory } from '@/models/Transaction.ts';
import Transfer from '@/models/Transfer';
import { TransferFilters } from '@/models/TransferFilters';
import { transferService, FetchResponse as FetchTransfersResponse } from '@/services/api/transfer';

interface UseTransfersOptions {
  initialPerPage?: number;
  initialFilters?: TransferFilters;
  initialSort?: { field: string; direction: 'asc' | 'desc' };
  updateUrl?: boolean;
  queryKey?: string;
}

interface TransformedResponse {
  list: Transfer[];
  count: number;
}

export const useTransfers = (options: UseTransfersOptions = {}) => {
  const {
    initialPerPage = 30,
    initialFilters = new TransferFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' },
    updateUrl = true,
    queryKey = 'transfers',
  } = options;

  const {
    pagination: { currentPage, perPage },
    filters,
    sort,
    setCurrentPage,
    setFilter,
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
      ...data,
      list: data.list.map((item) => new Transfer({
        ...item,
        transactions: item.transactions.map((transaction) => createTransaction(transaction)),
      })),
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

  const totalPages = useMemo(() => Math.ceil((data?.count ?? 0) / perPage) || 0, [data?.count, perPage]);

  return {
    transfers: data?.list ?? [],
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
    sort,
    setSort,
    isFetching,
  };
};
