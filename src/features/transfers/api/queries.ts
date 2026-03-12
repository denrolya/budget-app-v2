import { useQueryClient } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import moment, { Moment } from 'moment';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/features/auth';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { useTransactionFactory } from '@/features/transactions';
import { queryKeys } from '@/features/transfers/api/keys';
import { transferService } from '@/features/transfers/api/service';
import Transfer from '@/features/transfers/models/Transfer';
import { TransferFilters } from '@/features/transfers/models/TransferFilters';
import { UseListReturn, useListState } from '@/hooks/useListState';
import { type Sorting } from '@/types/pagination';

interface UseTransfersListOptions {
  initialPerPage?: number;
  initialFilters?: TransferFilters;
  initialSort?: Sorting;
  updateUrl?: boolean;
  enabled?: boolean;
  omitTransferTransactions?: never; // guard: transfers list shouldn't have this option
  queryKeyBase?: readonly unknown[];
}

interface TransformedResponse {
  items: Transfer[];
  totalItems: number;
  totalValue: number;
}

export type GroupedTransfers = [Moment, Transfer[], number, number][];

export type UseTransfersListReturn = Omit<UseListReturn<TransferFilters, TransformedResponse>, 'data'> & {
  items: Transfer[];
  groupedItems: GroupedTransfers;
  totalValue: number;
};

const groupTransfersByDay = (
  items: Transfer[],
  baseCurrency: string,
  direction: 'asc' | 'desc' = 'desc',
): GroupedTransfers =>
  toPairs(
    groupBy(
      sortBy(items, (item) => (direction === 'asc' ? item.executedAt.valueOf() : -item.executedAt.valueOf())),
      (item) => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, dayItems]) => {
    const totalValue = sumBy(dayItems, ({ fromExpense }) => fromExpense.convertedValues?.[baseCurrency] || 0);
    return [moment(date), dayItems, totalValue, dayItems.length];
  });

export const useList = (options: UseTransfersListOptions = {}): UseTransfersListReturn => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();

  const {
    initialPerPage = 20,
    initialFilters = new TransferFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' } as Sorting,
    updateUrl = true,
    enabled = true,
    queryKeyBase = queryKeys.all,
  } = options;

  const { createTransaction } = useTransactionFactory();

  const { data, ...listState } = useListState<TransferFilters, TransformedResponse>({
    enabled,
    initialPerPage,
    initialFilters,
    initialSort,
    updateUrl,
    queryKeyBase: String(queryKeyBase?.[0] ?? 'transfers'),
    searchParamKeys: {
      searchTerm: 'note',
      before: 'before',
      after: 'after',
      amountRange: 'amount',
      accounts: 'accounts',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    queryFn: async (page, perPage, filters, sort) => {
      const response = await transferService.fetchList({ page, perPage, filters, sort });

      const items =
        response.items?.map(
          (item: any) =>
            new Transfer({
              ...item,
              transactions: item.transactions?.map((tx: any) => createTransaction(tx)) ?? [],
            }),
        ) ?? [];

      const totalValue = sumBy(items, ({ fromExpense }) => fromExpense.convertedValues?.[baseCurrency] || 0);

      return {
        items,
        totalItems: response.totalItems ?? 0,
        totalValue,
      };
    },
  });

  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeyBase });
  }, [queryClient, queryKeyBase]);

  useFormSubmitListener([FormType.Transaction, FormType.Transfer, FormType.BulkTransaction], handleFormSubmit);

  useEffect(() => {
    if (!listState.isError) return;

    toast.error('Failed to fetch transfers', {
      description: listState.error?.message || 'An unexpected error occurred.',
      action: { label: 'Retry', onClick: () => listState.refetch() },
    });
  }, [listState.isError, listState.error, listState.refetch]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const totalValue = data?.totalValue ?? 0;
  const groupedItems = useMemo(
    () => groupTransfersByDay(items, baseCurrency, listState.sort.direction),
    [items, baseCurrency, listState.sort.direction],
  );

  return { ...listState, items, groupedItems, totalValue };
};
