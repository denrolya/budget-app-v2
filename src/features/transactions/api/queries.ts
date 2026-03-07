import { useQueryClient } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import moment, { type Moment } from 'moment';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { type Sorting } from '@/types/pagination';
import { type UseListReturn, useListState } from '@/hooks/useListState';
import { TransactionFilters } from '@/features/transactions/models/TransactionFilters';
import Transaction, { TransactionFactory } from '@/features/transactions/models/Transaction';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { useBaseCurrency } from '@/features/auth';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';

import { transactionService } from './service';
import { queryKeys } from './keys';

interface UseTransactionsListOptions {
  initialPerPage?: number;
  initialFilters?: TransactionFilters;
  initialSort?: Sorting;
  updateUrl?: boolean;
  omitTransferTransactions?: boolean;

  /**
   * If you need different invalidation scope (e.g. ledger combined view),
   * override this; otherwise defaults to txKeys.all[0] ("transactions").
   */
  queryKeyBase?: string;
}

interface TransformedResponse {
  items: Transaction[];
  totalItems: number;
  totalValue: number;
}

export type GroupedTransactions = [Moment, Transaction[], number, number][];

export type UseTransactionsListReturn = Omit<UseListReturn<TransactionFilters, TransformedResponse>, 'data'> & {
  items: Transaction[];
  groupedItems: GroupedTransactions;
  totalValue: number;
};

const groupTransactionsByDay = (
  items: Transaction[],
  baseCurrency: string,
  direction: 'asc' | 'desc' = 'desc',
): GroupedTransactions =>
  toPairs(
    groupBy(
      sortBy(items, (item) => (direction === 'asc' ? item.executedAt.valueOf() : -item.executedAt.valueOf())),
      (item) => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, dayItems]) => {
    const totalValue = sumBy(dayItems, (item) => {
      const value = item.convertedValues?.[baseCurrency] || 0;
      return item.isExpense() ? -value : value;
    });

    return [moment(date), dayItems, totalValue, dayItems.length];
  });

export const useList = (options: UseTransactionsListOptions = {}): UseTransactionsListReturn => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();

  const {
    initialPerPage = 50,
    initialFilters = new TransactionFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' } as Sorting,
    updateUrl = true,
    omitTransferTransactions = false,
    queryKeyBase = queryKeys.all[0], // "transactions"
  } = options;

  // Must exist before queryFn uses it
  const { createTransaction } = TransactionFactory();

  const { data, ...listState } = useListState<TransactionFilters, TransformedResponse>({
    initialPerPage,
    initialFilters,
    initialSort,
    updateUrl,
    queryKeyBase,
    searchParamKeys: {
      searchTerm: 'note',
      before: 'before',
      after: 'after',
      status: 'status',
      amountRange: 'amount',
      categories: 'categories',
      accounts: 'accounts',
      withNestedCategories: 'withNestedCategories',
      isDraft: 'isDraft',
      currencies: 'currencies',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    queryFn: async (page, perPage, filters, sort) => {
      const response = await transactionService.fetchList({
        page,
        perPage,
        filters,
        sort,
        omitTransferTransactions,
      });

      return {
        items: response.items?.map((dto) => createTransaction(dto)) ?? [],
        totalValue: response.totalValue ?? 0,
        totalItems: response.totalItems ?? 0,
      };
    },
  });

  // Refetch after Transaction/Transfer form submits
  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
  }, [queryClient, queryKeyBase]);

  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);

  // Toast on error
  useEffect(() => {
    if (!listState.isError) return;

    toast.error('Failed to fetch transactions', {
      description: listState.error?.message || 'An unexpected error occurred.',
      action: { label: 'Retry', onClick: () => listState.refetch() },
    });
  }, [listState.isError, listState.error, listState.refetch]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const totalValue = data?.totalValue ?? 0;
  const groupedItems = useMemo(
    () => groupTransactionsByDay(items, baseCurrency, listState.sort.direction),
    [items, baseCurrency, listState.sort.direction],
  );

  return {
    ...listState,
    items,
    groupedItems,
    totalValue,
  };
};
