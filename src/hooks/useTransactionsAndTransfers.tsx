import { useCallback, useMemo } from 'react';

import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import Transaction from '@/models/Transaction';
import { TransactionFilters } from '@/models/TransactionFilters';
import Transfer from '@/models/Transfer';
import { TransferFilters } from '@/models/TransferFilters';

interface UseTransactionsAndTransfersOptions {
  initialTransactionFilters?: TransactionFilters;
  initialTransferFilters?: TransferFilters;
  updateUrl?: boolean;
  excludeTransfers?: boolean;
}

export const useTransactionsAndTransfers = ({
                                              initialTransactionFilters = new TransactionFilters(),
                                              initialTransferFilters = new TransferFilters(),
                                              updateUrl = false,
                                              excludeTransfers = true,
                                            }: UseTransactionsAndTransfersOptions) => {
  const {
    transactions,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
    error: errorTransactions,
    setFilter: setTransactionFilter,
  } = useTransactions({
    initialFilters: initialTransactionFilters,
    updateUrl,
    excludeTransfers,
  });

  const {
    transfers,
    isLoading: isLoadingTransfers,
    isError: isErrorTransfers,
    error: errorTransfers,
    setFilter: setTransferFilter,
  } = useTransfers({
    initialFilters: initialTransferFilters,
    updateUrl,
  });

  const isLoading = isLoadingTransactions || isLoadingTransfers;
  const isError = isErrorTransactions || isErrorTransfers;
  const error = errorTransactions || errorTransfers;

  const setFilter = useCallback((type: keyof TransferFilters, value: any) => {
    setTransactionFilter(type, value);
    setTransferFilter(type, value);
  }, [setTransactionFilter, setTransferFilter]);

  const combinedItems = useMemo(() => {
    const items = [...transactions, ...transfers];
    return items.sort((a, b) => b.executedAt.valueOf() - a.executedAt.valueOf());
  }, [transactions, transfers]);

  const groupedItems = useMemo(() => combinedItems
    .reduce<Record<string, (Transaction | Transfer)[]>>((groups, item) => {
      const dateKey = item.executedAt.format('YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
      return groups;
    }, {}), [combinedItems]);

  return {
    transactions,
    transfers,
    combinedItems,
    groupedItems,
    isLoading,
    isError,
    error,
    setFilter,
  };
};
