import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import toPairs from 'lodash/toPairs';
import moment, { Moment } from 'moment';
import { useCallback, useMemo } from 'react';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
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
                                            }: UseTransactionsAndTransfersOptions): {
  transactions: Transaction[];
  transfers: Transfer[];
  combinedItems: (Transaction | Transfer)[];
  groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  setFilter: <K extends keyof TransferFilters>(type: K, value: TransferFilters[K] | undefined | null) => void;
} => {
  const baseCurrency = useBaseCurrency();
  const {
    transactions,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
    error: errorTransactions,
    setFilter: setTransactionFilter,
  } = useTransactions({
    initialPerPage: 99999,
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
    initialPerPage: 99999,
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

  const groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][] = useMemo(() => toPairs(
    groupBy(
      sortBy(combinedItems, item => -item.executedAt.valueOf()),
      item => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, items]) => {
    let transactionValue = 0;
    let transfersValue = 0;
    let transactionsCount = 0;
    let transfersCount = 0;

    // Iterate through items once to calculate everything
    items.forEach(item => {
      if (item instanceof Transaction) {
        const value = item.convertedValues[baseCurrency] || 0;
        transactionValue += item.isExpense() ? -value : value;
        transactionsCount++;
      } else if (item instanceof Transfer) {
        transfersValue += item.fromExpense.convertedValues[baseCurrency] || 0;
        transfersCount++;
      }
    });

    return [moment(date), items, transactionValue, transfersValue, transactionsCount, transfersCount];
  }), [combinedItems, baseCurrency]);

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
