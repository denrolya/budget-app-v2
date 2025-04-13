import { useQueryClient } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import moment, { Moment } from 'moment';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { UseListReturn, useListState } from '@/hooks/useListState';
import Transaction, { TransactionFactory } from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import { transactionService } from '@/services/api/transaction';
import { Sorting } from '@/types/pagination';

interface UseTransactionsOptions {
  initialPerPage?: number;
  initialFilters?: TransactionFilters;
  initialSort?: Sorting;
  updateUrl?: boolean;
  queryKeyBase?: string;
  excludeTransfers?: boolean;
}

interface TransformedResponse {
  items: Transaction[];
  totalItems: number;
  totalValue: number;
}

export type UseTransactionsReturn = Omit<UseListReturn<TransactionFilters, TransformedResponse>, 'data'> & {
  items: Transaction[];
  groupedItems: [Moment, Transaction[], number, number][];
  totalValue: number;
};

export const useTransactions = (options: UseTransactionsOptions = {}): UseTransactionsReturn => {
  const baseCurrency = useBaseCurrency();
  const {
    initialPerPage = 50,
    initialFilters = new TransactionFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' } as Sorting,
    updateUrl = true,
    queryKeyBase = 'transactions',
    excludeTransfers = false,
  } = options;

  const { data, ...listState } = useListState<TransactionFilters, TransformedResponse, Transaction>({
    initialPerPage,
    initialFilters,
    initialSort,
    updateUrl,
    queryKeyBase,
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
    queryFn: async (
      page: number,
      perPage: number,
      filters: TransactionFilters,
      sort: Sorting,
    ): Promise<TransformedResponse> => {
      const response = await transactionService.fetchTransactions({
        page,
        perPage,
        filters,
        sort,
        excludeTransfers,
      });

      return {
        items: response.items?.map((item) => createTransaction(item)) || [],
        totalValue: response?.totalValue || 0,
        totalItems: response?.totalItems || 0,
      };
    },
  });

  const queryClient = useQueryClient();
  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
  }, [queryClient, queryKeyBase]);
  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);
  const { createTransaction } = TransactionFactory();

  useEffect(() => {
    if (listState.isError) {
      toast.error('Failed to fetch transactions', {
        description: listState.error?.message || 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => listState.refetch(),
        },
      });
    }
  }, [listState.isError, listState.error, listState.refetch]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const totalValue = data?.totalValue || 0;
  const groupedItems: [Moment, Transaction[], number, number][] = useMemo(
    () =>
      toPairs(
        groupBy(
          sortBy(items, (item) => -item.executedAt.valueOf()),
          (item) => item.executedAt.format(BACKEND_DATE_FORMAT),
        ),
      ).map(([date, items]) => {
        const totalValue = sumBy(items, (item) => {
          const value = item.convertedValues[baseCurrency] || 0;
          return item.isExpense() ? -value : value;
        });
        const totalItems = items.length;
        return [moment(date), items, totalValue, totalItems];
      }),
    [items, baseCurrency],
  );

  return {
    ...listState,
    items,
    groupedItems,
    totalValue,
  };
};
