import { useQueryClient } from '@tanstack/react-query';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import toPairs from 'lodash/toPairs';
import moment, { Moment } from 'moment/moment';
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

export type UseTransfersReturn = Omit<UseListReturn<TransferFilters, TransformedResponse>, 'data'> & {
  items: Transfer[];
  groupedItems: [Moment, Transfer[], number, number][];
  totalValue: number;
};

export const useTransfers = (options: UseTransfersOptions = {}): UseTransfersReturn => {
  const baseCurrency = useBaseCurrency();

  const {
    initialPerPage = 20,
    initialFilters = new TransferFilters(),
    initialSort = { field: 'executedAt', direction: 'desc' } as Sorting,
    updateUrl = true,
    queryKey = 'transfers',
  } = options;

  const { data, ...listState } = useListState<TransferFilters, TransformedResponse, Transfer>({
    initialPerPage,
    initialFilters,
    initialSort,
    updateUrl,
    searchParamKeys: {
      searchTerm: 'q',
      before: 'before',
      after: 'after',
      amountRange: 'amount',
      accounts: 'accounts',
    },
    formatMoment: BACKEND_DATE_FORMAT,
    queryFn: async (
      page: number,
      perPage: number,
      filters: TransferFilters,
      sort: Sorting,
    ): Promise<TransformedResponse> => {
      const response = await transferService.fetchTransfers({
        page,
        perPage,
        filters,
        sort,
      });

      return {
        totalItems: response?.totalItems || 0,
        items:
          response.items?.map(
            (item) =>
              new Transfer({
                ...item,
                transactions: item.transactions.map((transaction) => createTransaction(transaction)),
              }),
          ) || [],
      };
    },
  });

  const queryClient = useQueryClient();
  const handleFormSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  }, [queryClient, queryKey]);
  useFormSubmitListener([FormType.Transaction, FormType.Transfer], handleFormSubmit);
  const { createTransaction } = TransactionFactory();

  useEffect(() => {
    if (listState.isError) {
      toast.error('Failed to fetch transfers', {
        description: listState.error?.message || 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => listState.refetch(),
        },
      });
    }
  }, [listState.isError, listState.error, listState.refetch]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const groupedItems: [Moment, Transfer[], number, number][] = useMemo(
    () =>
      toPairs(
        groupBy(
          sortBy(items, (item) => -item.executedAt.valueOf()),
          (item) => item.executedAt.format(BACKEND_DATE_FORMAT),
        ),
      ).map(([date, items]) => {
        const totalValue = sumBy(items, ({ fromExpense }) => fromExpense.convertedValues[baseCurrency] || 0);
        const totalItems = items.length;
        return [moment(date), items, totalValue, totalItems];
      }),
    [items, baseCurrency],
  );

  return {
    ...listState,
    items,
    groupedItems,
  };
};
