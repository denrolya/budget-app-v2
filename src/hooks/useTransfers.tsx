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
import { TransactionFactory } from '@/models/Transaction';
import Transfer from '@/models/Transfer';
import { TransferFilters } from '@/models/TransferFilters';
import { transferService } from '@/services/api/transfer';
import { type Sorting } from '@/types/pagination';

interface UseTransfersOptions {
  initialPerPage?: number;
  initialFilters?: TransferFilters;
  initialSort?: Sorting;
  updateUrl?: boolean;
  queryKeyBase?: string;
}

interface TransformedResponse {
  items: Transfer[];
  totalItems: number;
  totalValue: number;
}

export type UseTransfersReturn = Omit<UseListReturn<TransferFilters, TransformedResponse>, 'data'> & {
  items: Transfer[];
  groupedItems: [Moment, Transfer[], number, number][];
  totalValue: number;
};

const groupTransfersByDay = (items: Transfer[], baseCurrency: string): [Moment, Transfer[], number, number][] => toPairs(
    groupBy(
      sortBy(items, (item) => -item.executedAt.valueOf()),
      (item) => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, dayItems]) => {
    const totalValue = sumBy(dayItems, ({ fromExpense }) => fromExpense.convertedValues?.[baseCurrency] || 0);
    return [moment(date), dayItems, totalValue, dayItems.length];
  });

export const useTransfers = (options: UseTransfersOptions = {}): UseTransfersReturn => {
  const baseCurrency = useBaseCurrency();

  const {
    initialPerPage = 20,
    initialFilters = new TransferFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' } as Sorting,
    updateUrl = true,
    queryKeyBase = 'transfers',
  } = options;

  // Must be created before queryFn uses it
  const { createTransaction } = TransactionFactory();

  const { data, ...listState } = useListState<TransferFilters, TransformedResponse>({
    initialPerPage,
    initialFilters,
    initialSort,
    updateUrl,
    queryKeyBase,
    searchParamKeys: {
      searchTerm: 'q',
      before: 'before',
      after: 'after',
      amountRange: 'amount',
      accounts: 'accounts',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    queryFn: async (page, perPage, filters, sort) => {
      const response = await transferService.fetchTransfers({ page, perPage, filters, sort });

      const items =
        response.items?.map(
          (item) =>
            new Transfer({
              ...item,
              transactions: item.transactions?.map((tx) => createTransaction(tx)) ?? [],
            }),
        ) ?? [];

      // totalValue for transfers: sum of "from" expense converted into base currency (same logic you used per-day)
      const totalValue = sumBy(items, ({ fromExpense }) => fromExpense.convertedValues?.[baseCurrency] || 0);

      return {
        items,
        totalItems: response?.totalItems || 0,
        totalValue,
      };
    },
  });

  // Refetch after Transaction/Transfer form submits
  const queryClient = useQueryClient();
  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
  }, [queryClient, queryKeyBase]);
  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);

  // Toast on error (kept consistent with useTransactions)
  useEffect(() => {
    if (!listState.isError) return;

    toast.error('Failed to fetch transfers', {
      description: listState.error?.message || 'An unexpected error occurred.',
      action: {
        label: 'Retry',
        onClick: () => listState.refetch(),
      },
    });
  }, [listState.isError, listState.error, listState.refetch]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const totalValue = data?.totalValue ?? 0;

  const groupedItems = useMemo(() => groupTransfersByDay(items, baseCurrency), [items, baseCurrency]);

  return {
    ...listState,
    items,
    groupedItems,
    totalValue,
  };
};
