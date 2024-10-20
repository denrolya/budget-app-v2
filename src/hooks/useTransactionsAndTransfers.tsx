import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import toPairs from 'lodash/toPairs';
import moment, { Moment } from 'moment';
import { useCallback, useMemo, useState } from 'react';

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

type CombinedFilters = TransactionFilters & TransferFilters;

export const useTransactionsAndTransfers = ({
                                              initialTransactionFilters = new TransactionFilters(),
                                              initialTransferFilters = new TransferFilters(),
                                              updateUrl = false,
                                              excludeTransfers = true,
                                            }: UseTransactionsAndTransfersOptions) => {
  const [showTransactions, setShowTransactions] = useState<boolean>(true);
  const [showTransfers, setShowTransfers] = useState<boolean>(true);
  const baseCurrency = useBaseCurrency();
  const {
    transactions,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
    error: errorTransactions,
    filters: transactionFilters,
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
    filters: transferFilters,
    setFilter: setTransferFilter,
  } = useTransfers({
    initialPerPage: 99999,
    initialFilters: initialTransferFilters,
    updateUrl,
  });

  const isLoading = isLoadingTransactions || isLoadingTransfers;
  const isError = isErrorTransactions || isErrorTransfers;
  const error = errorTransactions || errorTransfers;

  const setFilter = useCallback((type: keyof CombinedFilters, value: any) => {
    console.log(type, value);

    if (TransactionFilters.isApplicable(type)) {
      setTransactionFilter(type as keyof TransactionFilters, value);
      if (type === 'categories' && value.length > 0) {
        setShowTransfers(false);
      }
    }
    if (TransferFilters.isApplicable(type)) {
      setTransferFilter(type as keyof TransferFilters, value);
    }
  }, [setTransactionFilter, setTransferFilter]);

  const filteredItems = useMemo(() => {
    let items: (Transaction | Transfer)[] = [];
    if (showTransactions) items = items.concat(transactions);
    if (showTransfers) items = items.concat(transfers);
    return items.sort((a, b) => b.executedAt.valueOf() - a.executedAt.valueOf());
  }, [transactions, transfers, showTransactions, showTransfers]);

  const groupedItems: [Moment, (Transaction | Transfer)[], number, number, number, number][] = useMemo(() => toPairs(
    groupBy(
      sortBy(filteredItems, item => -item.executedAt.valueOf()),
      item => item.executedAt.format(BACKEND_DATE_FORMAT),
    ),
  ).map(([date, items]) => {
    let transactionsValue = 0;
    let transfersValue = 0;
    let transactionsCount = 0;
    let transfersCount = 0;

    items.forEach(item => {
      if (item instanceof Transaction) {
        const value = item.convertedValues[baseCurrency] || 0;
        transactionsValue += item.isExpense() ? -value : value;
        transactionsCount++;
      } else if (item instanceof Transfer) {
        transfersValue += item.fromExpense.convertedValues[baseCurrency] || 0;
        transfersCount++;
      }
    });

    return [moment(date), items, transactionsValue, transfersValue, transactionsCount, transfersCount];
  }), [filteredItems, baseCurrency]);

  return {
    transactions,
    transfers,
    filteredItems,
    groupedItems,
    isLoading,
    isError,
    error,
    setFilter,
    transactionFilters,
    transferFilters,
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,
  };
};
