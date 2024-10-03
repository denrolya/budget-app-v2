import { useMemo, useCallback } from 'react';

import Transaction from '@/models/Transaction.ts';
import Transfer from '@/models/Transfer.ts';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import { TransactionFilters } from '@/models/TransactionFilters';
import { TransferFilters } from '@/models/TransferFilters';

export const useTransactionsAndTransfers = ({
                                              initialTransactionFilters = new TransactionFilters(),
                                              initialTransferFilters = new TransferFilters(),
                                              updateUrl = false,
                                              excludeTransfers = true
                                            }) => {
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

  const setFilter = useCallback((type: string, value: any) => {
    setTransactionFilter(type, value);
    setTransferFilter(type, value);
  }, [setTransactionFilter, setTransferFilter]);

  const combinedItems = useMemo(() => {
    const items = [...transactions, ...transfers];
    return items.sort((a, b) => b.executedAt.diff(a.executedAt));
  }, [transactions, transfers]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: (Transaction | Transfer)[] } = {};
    combinedItems.forEach(item => {
      const dateKey = item.executedAt.format('YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [combinedItems]);

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
