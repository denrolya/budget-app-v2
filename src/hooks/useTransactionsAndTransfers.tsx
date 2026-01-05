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

  /**
   * Upper bound for “combined” fetch.
   * If the selected date-range can exceed this, you need a range endpoint or
   * pagination iteration (which breaks the “2 BE calls” constraint).
   */
  perPage?: number;
}

type CombinedItem = Transaction | Transfer;

export type GroupedItem = [
  Moment, // date
  CombinedItem[], // items
  number, // transactionsValue
  number, // transfersValue
  number, // transactionsCount
  number, // transfersCount
];

type CombinedFilters = TransactionFilters & TransferFilters;

const isTransaction = (item: CombinedItem): item is Transaction => item instanceof Transaction;
const isTransfer = (item: CombinedItem): item is Transfer => item instanceof Transfer;

const sortDescByExecutedAt = (a: CombinedItem, b: CombinedItem) => b.executedAt.valueOf() - a.executedAt.valueOf();

const groupByDay = (items: CombinedItem[], baseCurrency: string): GroupedItem[] => {
  // items are expected to be sorted desc
  const groups = new Map<string, GroupedItem>();

  for (const item of items) {
    const dayKey = item.executedAt.format(BACKEND_DATE_FORMAT);

    let entry = groups.get(dayKey);
    if (!entry) {
      entry = [moment(dayKey, BACKEND_DATE_FORMAT), [], 0, 0, 0, 0];
      groups.set(dayKey, entry);
    }

    entry[1].push(item);

    if (isTransaction(item)) {
      const value = item.convertedValues[baseCurrency] || 0;
      entry[2] += item.isExpense() ? -value : value; // transactionsValue
      entry[4] += 1; // transactionsCount
      continue;
    }

    if (isTransfer(item)) {
      entry[3] += item.fromExpense.convertedValues[baseCurrency] || 0; // transfersValue
      entry[5] += 1; // transfersCount
    }
  }

  // Ensure groups are sorted desc by date (Map preserves insertion, not date order)
  return Array.from(groups.values()).sort((a, b) => b[0].valueOf() - a[0].valueOf());
};

export const useTransactionsAndTransfers = ({
                                              initialTransactionFilters = new TransactionFilters(),
                                              initialTransferFilters = new TransferFilters(),
                                              updateUrl = false,
                                              excludeTransfers = true,
                                              perPage = 500,
                                            }: UseTransactionsAndTransfersOptions = {}) => {
  const baseCurrency = useBaseCurrency();

  // UI toggles
  const [showTransactions, setShowTransactions] = useState(true);
  const [showTransfers, setShowTransfers] = useState(true);

  const transactionsState = useTransactions({
    initialPerPage: perPage,
    initialFilters: initialTransactionFilters,
    updateUrl,
    excludeTransfers,
  });

  const transfersState = useTransfers({
    initialPerPage: perPage,
    initialFilters: initialTransferFilters,
    updateUrl,
  });

  const isLoading = transactionsState.isLoading || transfersState.isLoading;
  const isError = transactionsState.isError || transfersState.isError;
  const error = transactionsState.error ?? transfersState.error;

  /**
   * Business rule:
   * When categories are set => transfers are irrelevant => hide transfers.
   */
  const shouldForceHideTransfers = useMemo(() => {
    const categories = transactionsState.filters.categories;
    return Array.isArray(categories) && categories.length > 0;
  }, [transactionsState.filters.categories]);

  const effectiveShowTransfers = showTransfers && !shouldForceHideTransfers;

  /**
   * Unified filter setter:
   * Applies the key to whichever filter models support it.
   * Keep pure (no UI side-effects).
   */
  const setFilter = useCallback(
    <K extends keyof CombinedFilters>(key: K, value: CombinedFilters[K]) => {
      if (TransactionFilters.isApplicable(key)) {
        transactionsState.setFilter(key as keyof TransactionFilters, value as any);
      }
      if (TransferFilters.isApplicable(key)) {
        transfersState.setFilter(key as keyof TransferFilters, value as any);
      }
    },
    [transactionsState.setFilter, transfersState.setFilter],
  );

  /**
   * Merge + sort once.
   */
  const items: CombinedItem[] = useMemo(() => {
    const out: CombinedItem[] = [];
    if (showTransactions) out.push(...(transactionsState.items ?? []));
    if (effectiveShowTransfers) out.push(...(transfersState.items ?? []));
    out.sort(sortDescByExecutedAt);
    return out;
  }, [transactionsState.items, transfersState.items, showTransactions, effectiveShowTransfers]);

  const groupedItems: GroupedItem[] = useMemo(() => groupByDay(items, baseCurrency), [items, baseCurrency]);

  const refetch = useCallback(() => {
    void transactionsState.refetch();
    void transfersState.refetch();
  }, [transactionsState.refetch, transfersState.refetch]);

  /**
   * Correct reset: do NOT call filters.reset() directly (mutates instance, doesn’t update state).
   */
  const resetFilters = useCallback(() => {
    transactionsState.resetFilters();
    transfersState.resetFilters();
  }, [transactionsState.resetFilters, transfersState.resetFilters]);

  return {
    // merged view
    items,
    groupedItems,

    // status
    isLoading,
    isError,
    error,

    // controls
    setFilter,
    refetch,
    resetFilters,

    // visibility toggles
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,

    // derived flags (useful for UI messaging)
    effectiveShowTransfers,
    shouldForceHideTransfers,

    // raw underlying slices
    transactions: transactionsState.items,
    transfers: transfersState.items,
    transactionFilters: transactionsState.filters,
    transferFilters: transfersState.filters,

    // optionally expose underlying state if UI needs it
    transactionsState,
    transfersState,
  };
};
