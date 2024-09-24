import { useQuery, UseQueryResult } from '@tanstack/react-query';
import moment from 'moment';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useListState } from '@/hooks/useListState';
import { TransactionFactory } from '@/models/Transaction';
import Transfer from '@/models/Transfer';
import { TransferFilters } from '@/models/TransferFilters';
import { axiosFetcher } from '@/services/api';

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

export const useTransfers = (options: UseTransfersOptions = {}): {
  transfers: Transfer[];
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
  filters: TransferFilters;
  setFilter: (key: string, value: any) => void;
  sort: { field: string; direction: 'asc' | 'desc' };
  setSort: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  isFetching: boolean;
} => {
  const {
    initialPerPage = 30,
    initialFilters = new TransferFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' },
    updateUrl = true,
    queryKey = 'transfers',
  } = options;

  const { createTransaction } = TransactionFactory();
  const [totalPages, setTotalPages] = useState(0);

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

  const url = useMemo(() => {
    const query = new URLSearchParams();

    const addParam = (key: string, value: unknown) => {
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isEmptyValue = value === undefined || value === null || value === '';

      if (!isEmptyValue && !isEmptyArray) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            query.append(`${key}[]`, item.toString());
          });
        } else if (typeof value === 'boolean') {
          query.set(key, value ? '1' : '0');
        } else if (moment.isMoment(value)) {
          query.set(`executedAt[${key}]`, key === 'before' ? value.clone().endOf('day').toISOString() : value.format(BACKEND_DATE_FORMAT));
        } else {
          query.set(key, value.toString());
        }
      }
    };

    query.set('perPage', perPage.toString());
    query.set('page', currentPage.toString());

    Object.entries(filters).forEach(([key, value]) => {
      addParam(key, value);
    });

    if (sort.field) query.set('sortField', sort.field as string);
    if (sort.direction) query.set('sortDirection', sort.direction);

    return `/api/transfers?${query.toString()}`;
  }, [filters, currentPage, perPage, sort]);

  const {
    data,
    error,
    isPending,
    isError,
    isFetching,
    refetch,
  }: UseQueryResult<TransformedResponse, Error> = useQuery({
    queryKey: [queryKey, url],
    queryFn: async (): Promise<TransformedResponse> => {
      const result = await axiosFetcher(url);
      return {
        list: result['hydra:member'].map(t => new Transfer({
          ...t,
          transactions: t.transactions.map(createTransaction),
        })),
        count: result['hydra:totalItems'],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleError = useCallback(() => {
    if (isError) {
      // setTotalPages(0);
      toast.error('Failed to fetch transfers', {
        description: error?.message || 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => refetch(),
        },
      });
    } else if (data) {
      // setTotalPages(Math.ceil(data.count / perPage) || 0);
    }
  }, [isError, error, data, perPage, refetch]);

  // Call handleError whenever relevant dependencies change
  useMemo(handleError, [handleError]);

  return {
    transfers: data?.list || [],
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
