import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import moment, { type Moment } from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useBaseCurrency } from '@/features/auth';
import { FormType, useFormSubmitListener } from '@/contexts/Form';
import {
  Transaction,
  TransactionFilters,
  useTransactionFactory,
  queryKeys as transactionQueryKeys,
} from '@/features/transactions';
import { Transfer, TransferFilters, queryKeys as transferQueryKeys } from '@/features/transfers';

import { LEDGER_PARAM_MAP } from '../constants';
import { LEDGER_STALE_TIME, queryKeys as ledgerQueryKeys } from '../api/keys';
import {
  buildLedgerQueryKey,
  isTransactionDTO,
  isTransferDTO,
  ledgerService,
  type LedgerQueryParams,
} from '../api/ledgerService';

interface UseTransactionsAndTransfersListOptions {
  initialTransactionFilters?: TransactionFilters;
  updateUrl?: boolean;
  omitTransactions?: boolean;
  omitTransfers?: boolean;
  initialPerPage?: number;
}

type CombinedItem = Transaction | Transfer;

export type GroupedItem = {
  date: Moment;
  items: CombinedItem[];
  transactionsValue: number;
  transfersValue: number;
  transactionsCount: number;
  transfersCount: number;
};

const isTransactionItem = (item: CombinedItem): item is Transaction => item instanceof Transaction;
const isTransferItem = (item: CombinedItem): item is Transfer => item instanceof Transfer;

const sortDescByExecutedAt = (a: CombinedItem, b: CombinedItem) => b.executedAt.valueOf() - a.executedAt.valueOf();

const groupByDay = (items: CombinedItem[], baseCurrency: string): GroupedItem[] => {
  const groups = new Map<string, GroupedItem>();

  for (const item of items) {
    const dayKey = item.executedAt.format(BACKEND_DATE_FORMAT);

    let entry = groups.get(dayKey);
    if (!entry) {
      entry = {
        date: moment(dayKey, BACKEND_DATE_FORMAT),
        items: [],
        transactionsValue: 0,
        transfersValue: 0,
        transactionsCount: 0,
        transfersCount: 0,
      };
      groups.set(dayKey, entry);
    }

    entry.items.push(item);

    if (isTransactionItem(item)) {
      const value = item.convertedValues[baseCurrency] || 0;
      entry.transactionsValue += item.isExpense() ? -value : value;
      entry.transactionsCount += 1;
      continue;
    }

    if (isTransferItem(item)) {
      entry.transfersValue += item.fromExpense.convertedValues[baseCurrency] || 0;
      entry.transfersCount += 1;
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.date.valueOf() - a.date.valueOf());
};

export const useTransactionsAndTransfersList = ({
  initialTransactionFilters = new TransactionFilters(),
  updateUrl = false,
  omitTransactions = false,
  omitTransfers = false,
  initialPerPage = 50,
}: UseTransactionsAndTransfersListOptions = {}) => {
  const baseCurrency = useBaseCurrency();
  const queryClient = useQueryClient();

  // ─ Pagination state ───────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(initialPerPage);

  const setPerPage = useCallback((newPerPage: number) => {
    setPerPageState(newPerPage);
    setPage(1);
  }, []);

  // ─ UI toggles ─────────────────────────────────────────────────────────────
  const [showTransactions, setShowTransactions] = useState(true);
  const [showTransfers, setShowTransfers] = useState(true);

  // ─ Single unified filter state (TransactionFilters is the superset) ────────
  const [transactionFilters, setTransactionFiltersState] = useState<TransactionFilters>(
    () => initialTransactionFilters,
  );

  const setFilter = useCallback((key: string, value: unknown) => {
    setTransactionFiltersState((prev) =>
      prev.setFilter(key as keyof TransactionFilters, value as TransactionFilters[keyof TransactionFilters]),
    );
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setTransactionFiltersState(initialTransactionFilters);
    setPage(1);
  }, [initialTransactionFilters]);

  // Derive TransferFilters from the unified filter state for backward-compat
  const transferFilters = useMemo(
    () =>
      new TransferFilters({
        after: transactionFilters.after,
        before: transactionFilters.before,
        accounts: transactionFilters.accounts as string[],
        searchTerm: transactionFilters.searchTerm,
      }),
    [transactionFilters],
  );

  // ─ Determine backend `type` param ─────────────────────────────────────────
  // omitTransactions: true → ask backend for transfers only
  // omitTransfers: true    → post-filter in JS (no special backend param needed)
  const backendType = omitTransactions
    ? ('transfer' as const)
    : ((transactionFilters.type as 'expense' | 'income' | undefined) ?? undefined);

  // ─ Build query params ──────────────────────────────────────────────────────
  const queryParams: LedgerQueryParams = useMemo(
    () => ({
      after: transactionFilters.after,
      before: transactionFilters.before,
      type: backendType,
      accounts: transactionFilters.accounts?.map(Number) ?? undefined,
      categories: transactionFilters.categories?.map(Number) ?? undefined,
      debts: transactionFilters.debts?.map(Number) ?? undefined,
      note: transactionFilters.searchTerm || undefined,
      isDraft: transactionFilters.isDraft,
      withNestedCategories: transactionFilters.withNestedCategories || undefined,
      currencies: transactionFilters.currencies?.length ? (transactionFilters.currencies as string[]) : undefined,
      amountGte: Number.isFinite(transactionFilters.amountRange?.[0]) ? transactionFilters.amountRange![0] : undefined,
      amountLte: Number.isFinite(transactionFilters.amountRange?.[1]) ? transactionFilters.amountRange![1] : undefined,
      page,
      perPage,
    }),
    [transactionFilters, backendType, page, perPage],
  );

  const queryKey = useMemo(() => [...ledgerQueryKeys.all, buildLedgerQueryKey(queryParams)] as const, [queryParams]);

  // ─ Factory (must be called unconditionally as a hook) ─────────────────────
  const { createTransaction } = useTransactionFactory();

  // ─ Single unified query ────────────────────────────────────────────────────
  const query = useQuery({
    queryKey,
    queryFn: () => ledgerService.fetchList(queryParams),
    staleTime: LEDGER_STALE_TIME,
    placeholderData: keepPreviousData,
  });

  // Invalidate on form create/edit so ledger always reflects latest data
  useFormSubmitListener([FormType.Transaction, FormType.Transfer], () => {
    queryClient.invalidateQueries({ queryKey: ledgerQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: transferQueryKeys.all });
  });

  // ─ Discriminate response items ─────────────────────────────────────────────
  const allItems = query.data?.list ?? [];

  const transactionItems = useMemo(
    () => allItems.filter(isTransactionDTO).map((dto) => createTransaction(dto)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allItems derived inline from query.data; keying on query.data avoids unnecessary model re-creation
    [query.data],
  );

  const transferItems = useMemo(
    () =>
      allItems.filter(isTransferDTO).map(
        (dto) =>
          new Transfer({
            id: dto.id,
            rate: dto.rate,
            note: dto.note,
            executedAt: dto.executedAt,
            transactions: dto.transactions.map((t) => createTransaction(t)),
          }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allItems derived inline from query.data; keying on query.data avoids unnecessary model re-creation
    [query.data],
  );

  // ─ Business rule: hide transfers when categories are filtered ──────────────
  const shouldForceHideTransfers = useMemo(() => {
    const categories = transactionFilters.categories;
    return Array.isArray(categories) && categories.length > 0;
  }, [transactionFilters.categories]);

  const effectiveShowTransfers = !omitTransfers && showTransfers && !shouldForceHideTransfers;
  const effectiveShowTransactions = showTransactions && !omitTransactions;

  // ─ Merge + sort ────────────────────────────────────────────────────────────
  const items: CombinedItem[] = useMemo(() => {
    const out: CombinedItem[] = [];
    if (effectiveShowTransactions) out.push(...transactionItems);
    if (effectiveShowTransfers) out.push(...transferItems);
    out.sort(sortDescByExecutedAt);
    return out;
  }, [transactionItems, transferItems, effectiveShowTransactions, effectiveShowTransfers]);

  const groupedItems: GroupedItem[] = useMemo(() => groupByDay(items, baseCurrency), [items, baseCurrency]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  // ─ Totals ──────────────────────────────────────────────────────────────────
  const totalCount = query.data?.count ?? 0;
  const totalValue = query.data?.totalValue ?? 0;

  const pagination = useMemo(
    () => ({
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / perPage),
      perPage,
      currentPage: page,
      setCurrentPage: setPage,
      setPerPage,
    }),
    [totalCount, perPage, page, setPage, setPerPage],
  );

  // ─ Backward-compat sub-state stubs ────────────────────────────────────────
  const transactionsState = useMemo(
    () => ({
      isFetching: query.isFetching,
      isLoading: query.isLoading,
      pagination,
      totalValue,
      filters: transactionFilters,
      setFilter: (key: keyof TransactionFilters, value: unknown) => setFilter(key as string, value),
      resetFilters,
    }),
    [query.isFetching, query.isLoading, pagination, totalValue, transactionFilters, setFilter, resetFilters],
  );

  const transfersState = useMemo(
    () => ({
      isFetching: query.isFetching,
      pagination,
      totalValue,
      filters: transferFilters,
      setFilter: (key: keyof TransferFilters, value: unknown) => setFilter(key as string, value),
      resetFilters,
    }),
    [query.isFetching, pagination, totalValue, transferFilters, setFilter, resetFilters],
  );

  // ─ URL sync (write when managed by this hook) ─────────────────────────────
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!updateUrl) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const params = transactionFilters.toUrlParams(LEDGER_PARAM_MAP);

        for (const [key, value] of Object.entries(params)) {
          next.delete(key);
          if (value !== null) next.set(key, value);
        }

        return next;
      },
      { replace: true },
    );
  }, [updateUrl, transactionFilters, setSearchParams]);

  return {
    items,
    groupedItems,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    setFilter,
    refetch,
    resetFilters,
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,
    effectiveShowTransfers,
    shouldForceHideTransfers,
    transactions: transactionItems,
    transfers: transferItems,
    transactionFilters,
    transferFilters,
    pagination,
    totalValue,
    transactionsState,
    transfersState,
  };
};
