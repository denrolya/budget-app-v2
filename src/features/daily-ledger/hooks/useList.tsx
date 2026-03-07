import { useQueryClient } from '@tanstack/react-query';
import moment, { Moment } from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/features/auth';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import { Transaction, TransactionFilters, useList as useTransactionsList } from '@/features/transactions';
import { Transfer, TransferFilters, useList as useTransfersList } from '@/features/transfers';

interface UseTransactionsAndTransfersListOptions {
  initialTransactionFilters?: TransactionFilters;
  initialTransferFilters?: TransferFilters;
  updateUrl?: boolean;
  omitTransferTransactions?: boolean;
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

export const useTransactionsAndTransfersList = ({
  initialTransactionFilters = new TransactionFilters(),
  initialTransferFilters = new TransferFilters(),
  updateUrl = false,
  omitTransferTransactions = true,
  perPage = 500,
}: UseTransactionsAndTransfersListOptions = {}) => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();

  // UI toggles
  const [showTransactions, setShowTransactions] = useState(true);
  const [showTransfers, setShowTransfers] = useState(true);

  // Sub-hooks use isolated cache keys so they never collide with the standalone
  // transactions/transfers list pages that use the default 'transactions'/'transfers' keys.
  const transactionsState = useTransactionsList({
    initialPerPage: perPage,
    initialFilters: initialTransactionFilters,
    updateUrl: false,
    omitTransferTransactions,
    queryKeyBase: 'ledger_transactions',
  });

  const transfersState = useTransfersList({
    initialPerPage: perPage,
    initialFilters: initialTransferFilters,
    updateUrl: false,
    queryKeyBase: ['ledger_transfers'],
  });

  // Cross-invalidate standalone caches on form submit so navigating to the
  // transactions/transfers pages always shows fresh data.
  useFormSubmitListener([FormType.Transaction, FormType.Transfer], () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
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
    (key: string, value: unknown) => {
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

  // URL ownership: write filter state when updateUrl=true.
  // TransactionFilters is a superset of TransferFilters, so TX filters cover all URL keys.
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!updateUrl) return;

    const f = transactionsState.filters;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        // Clear all filter-owned keys before rewriting
        [
          'after',
          'before',
          'q',
          'categories',
          'accounts',
          'currencies',
          'amount',
          'isDraft',
          'withNestedCategories',
          'type',
        ].forEach((k) => next.delete(k));

        // Write after/before only when they differ from the default (current ISO week).
        // This keeps the URL clean on initial load.
        const defaultAfter = moment().startOf('isoWeek');
        const defaultBefore = moment().endOf('isoWeek');
        if (!f.after.isSame(defaultAfter, 'day') || !f.before.isSame(defaultBefore, 'day')) {
          next.set('after', f.after.format(BACKEND_DATE_FORMAT));
          next.set('before', f.before.format(BACKEND_DATE_FORMAT));
        }

        // Optional filters — omit when empty/default
        if (f.searchTerm) next.set('q', f.searchTerm);
        if (f.categories?.length) next.set('categories', (f.categories as Array<string | number>).join(','));
        if (f.accounts?.length) next.set('accounts', f.accounts.join(','));
        if (f.currencies?.length) next.set('currencies', f.currencies.join(','));
        if (f.amountRange?.length) next.set('amount', f.amountRange.join(','));
        if (f.isDraft !== undefined) next.set('isDraft', String(f.isDraft));
        if (f.withNestedCategories) next.set('withNestedCategories', 'true');
        if (f.type) next.set('type', f.type);

        return next;
      },
      { replace: true },
    );
  }, [updateUrl, transactionsState.filters, setSearchParams]);

  return {
    items,
    groupedItems,
    isLoading,
    isError,
    error,
    setFilter,
    refetch,
    resetFilters,
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,
    effectiveShowTransfers,
    shouldForceHideTransfers,
    transactions: transactionsState.items,
    transfers: transfersState.items,
    transactionFilters: transactionsState.filters,
    transferFilters: transfersState.filters,
    transactionsState,
    transfersState,
  };
};
