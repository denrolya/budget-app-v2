import moment, { Moment } from 'moment';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { TransactionFilters } from '@/features/transactions';
import { TransferFilters } from '@/features/transfers';
import { Timeframe } from '@/types/global';

import { type GroupedItem, useTransactionsAndTransfersList } from './useList';
import { detectPeriod, getInitialTimeframe, useTimeframe } from './useTimeframe';

// ─── Public types ──────────────────────────────────────────────────────────────

export type LedgerViewMode = 'table' | 'list';

export type UseLedgerOptions = {
  updateUrl?: boolean;
  /** Exclude transactions entirely (e.g. transfers-only listing page). */
  omitTransactions?: boolean;
  /** Exclude transfers entirely (e.g. account details page). */
  omitTransfers?: boolean;
  /**
   * Filters applied once on mount (excluding `after`/`before` — use `initialTimeframe` for that).
   * Changing this after mount has no effect.
   */
  initialFilters?: Record<string, unknown>;
  /** Starting timeframe. When `updateUrl=true`, URL params take precedence. */
  initialTimeframe?: Timeframe;
  /** Initial fetch size per type. Defaults to 500. */
  initialPerPage?: number;
  /** Whether empty days are shown in the listing. Defaults to true. */
  initialShowEmptyDays?: boolean;
  // Convenience callbacks — same values are also available on the return object
  onActiveCountChange?: (count: number) => void;
  onTimeframeChange?: (after: Moment, before: Moment) => void;
  onVisibleDatesChange?: (dates: string[]) => void;
};

export type UseLedgerReturn = {
  // ─ Data ──────────────────────────────────────────────────────────────────
  groupedItems: GroupedItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;

  // ─ Pagination ─────────────────────────────────────────────────────────────
  pagination: {
    totalItems: number;
    totalPages: number;
    perPage: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
  };

  // ─ Sub-states (for accessing pagination, totalValue, etc.) ───────────────
  transactionsState: {
    isFetching: boolean;
    isLoading: boolean;
    pagination: {
      totalItems: number;
      totalPages: number;
      perPage: number;
      currentPage: number;
      setCurrentPage: (page: number) => void;
      setPerPage: (perPage: number) => void;
    };
    totalValue: number;
    filters: TransactionFilters;
    setFilter: (key: keyof TransactionFilters, value: unknown) => void;
    resetFilters: () => void;
  };
  transfersState: {
    isFetching: boolean;
    pagination: {
      totalItems: number;
      totalPages: number;
      perPage: number;
      currentPage: number;
      setCurrentPage: (page: number) => void;
      setPerPage: (perPage: number) => void;
    };
    totalValue: number;
    filters: TransferFilters;
    setFilter: (key: keyof TransferFilters, value: unknown) => void;
    resetFilters: () => void;
  };

  // ─ Timeframe ─────────────────────────────────────────────────────────────
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  /** Snapped period name, or `'custom'` for arbitrary ranges. */
  activePeriod: ReturnType<typeof detectPeriod>;

  // ─ Filters ───────────────────────────────────────────────────────────────
  transactionFilters: TransactionFilters;
  transferFilters: TransferFilters;
  setFilter: (key: string, value: unknown) => void;
  /** Reset filters only — keeps current timeframe and visibility toggles. */
  resetFilters: () => void;
  /** Reset filters + timeframe + visibility toggles back to defaults. */
  resetAll: () => void;

  // ─ Visibility toggles ────────────────────────────────────────────────────
  showTransactions: boolean;
  setShowTransactions: (v: boolean) => void;
  showTransfers: boolean;
  setShowTransfers: (v: boolean) => void;

  // ─ Display state (UI preferences — easy to lift out later if needed) ─────
  viewMode: LedgerViewMode;
  setViewMode: (v: LedgerViewMode) => void;
  isCompactTable: boolean;
  setIsCompactTable: (v: boolean) => void;
  isReversedOrder: boolean;
  setIsReversedOrder: (v: boolean) => void;
  showEmptyDays: boolean;
  setShowEmptyDays: (v: boolean) => void;

  // ─ Filters sheet ─────────────────────────────────────────────────────────
  isFiltersOpen: boolean;
  setIsFiltersOpen: (v: boolean) => void;
  toggleFilters: () => void;

  // ─ Derived ───────────────────────────────────────────────────────────────
  /** Number of active (non-default) transaction filters. */
  activeFilterCount: number;
  /** All calendar days in the current timeframe (ISO date strings). */
  visibleDates: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const readTimeframeFromParams = (searchParams: URLSearchParams): Timeframe | undefined => {
  const afterRaw = searchParams.get('after');
  const beforeRaw = searchParams.get('before');
  if (!afterRaw || !beforeRaw) return undefined;

  const after = moment(afterRaw, BACKEND_DATE_FORMAT, true);
  const before = moment(beforeRaw, BACKEND_DATE_FORMAT, true);
  if (!after.isValid() || !before.isValid()) return undefined;

  return { after, before };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLedger = ({
  updateUrl = true,
  omitTransactions = false,
  omitTransfers = false,
  initialFilters,
  initialTimeframe: initialTimeframeProp,
  initialPerPage = 30,
  initialShowEmptyDays = true,
  onActiveCountChange,
  onTimeframeChange,
  onVisibleDatesChange,
}: UseLedgerOptions = {}): UseLedgerReturn => {
  // Capture initial search params once — never re-read to avoid spurious re-renders
  const initialSearchParamsRef = useRef(useSearchParams()[0]);

  const updateUrlRef = useRef(updateUrl);
  const urlTimeframe = useMemo(
    () => (updateUrlRef.current ? readTimeframeFromParams(initialSearchParamsRef.current) : undefined),
    [], // intentionally empty — read once at mount
  );

  const effectiveInitialTimeframe: Timeframe = urlTimeframe ?? initialTimeframeProp ?? getInitialTimeframe();
  const effectiveInitialTimeframeRef = useRef(effectiveInitialTimeframe);

  const normalizedInitialFilters = useMemo(() => {
    if (!initialFilters) return {} as Record<string, unknown>;

    const forbidden = new Set(['after', 'before']);
    return Object.fromEntries(Object.entries(initialFilters).filter(([k, v]) => !forbidden.has(k) && v !== undefined));
  }, [initialFilters]);

  const initialTransactionFilters = useMemo(
    () =>
      new TransactionFilters({
        after: effectiveInitialTimeframeRef.current.after,
        before: effectiveInitialTimeframeRef.current.before,
        ...(normalizedInitialFilters as any),
      }),
    [normalizedInitialFilters],
  );

  // ─ Timeframe ──────────────────────────────────────────────────────────────
  const {
    timeframe,
    setTimeframe,
    goToNextPeriod,
    goToPreviousPeriod,
    reset: resetTimeframe,
  } = useTimeframe({ initialTimeframe: effectiveInitialTimeframe });

  // ─ Display state ──────────────────────────────────────────────────────────
  const [showEmptyDays, setShowEmptyDays] = useState(initialShowEmptyDays);
  const [viewMode, setViewMode] = useState<LedgerViewMode>('table');
  const [isReversedOrder, setIsReversedOrder] = useState(true);
  const [isCompactTable, setIsCompactTable] = useState(true);

  // ─ Filters sheet ──────────────────────────────────────────────────────────
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const toggleFilters = useCallback(() => setIsFiltersOpen((p) => !p), []);

  // ─ Data ───────────────────────────────────────────────────────────────────
  const {
    groupedItems,
    isLoading,
    isError,
    error,
    setFilter,
    refetch,
    resetFilters,
    transactionFilters,
    transferFilters,
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,
    pagination,
    transactionsState,
    transfersState,
  } = useTransactionsAndTransfersList({
    updateUrl,
    omitTransactions,
    omitTransfers,
    initialTransactionFilters,
    initialPerPage,
  });

  // ─ Sync timeframe → filter params ─────────────────────────────────────────
  useEffect(() => {
    setFilter('after', timeframe.after);
    setFilter('before', timeframe.before);
  }, [setFilter, timeframe.after, timeframe.before]);

  const resetAll = useCallback(() => {
    resetTimeframe();
    resetFilters();
    setShowTransactions(true);
    setShowTransfers(true);
  }, [resetTimeframe, resetFilters, setShowTransactions, setShowTransfers]);

  // ─ Callbacks ──────────────────────────────────────────────────────────────
  const isMountedForTimeframeRef = useRef(false);
  useEffect(() => {
    if (!isMountedForTimeframeRef.current) {
      isMountedForTimeframeRef.current = true;
      return;
    }
    onTimeframeChange?.(timeframe.after, timeframe.before);
  }, [timeframe.after, timeframe.before]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onActiveCountChange?.(transactionFilters.activeCount);
  }, [onActiveCountChange, transactionFilters.activeCount]);

  // ─ Derived ────────────────────────────────────────────────────────────────
  const activePeriod = useMemo(() => detectPeriod(timeframe), [timeframe]);

  const visibleDates = useMemo((): string[] => {
    const dates: string[] = [];
    const cursor = timeframe.after.clone().startOf('day');
    const end = timeframe.before.clone().startOf('day');
    while (cursor.isSameOrBefore(end, 'day')) {
      dates.push(cursor.format(BACKEND_DATE_FORMAT));
      cursor.add(1, 'day');
    }
    return dates;
  }, [timeframe.after, timeframe.before]);

  useEffect(() => {
    onVisibleDatesChange?.(visibleDates);
  }, [onVisibleDatesChange, visibleDates]);

  return {
    groupedItems,
    isLoading,
    isFetching: transactionsState.isFetching || transfersState.isFetching,
    isError,
    error,
    refetch,
    pagination,
    transactionsState,
    transfersState,
    timeframe,
    setTimeframe,
    goToNextPeriod,
    goToPreviousPeriod,
    activePeriod,
    transactionFilters,
    transferFilters,
    setFilter,
    resetFilters,
    resetAll,
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,
    viewMode,
    setViewMode,
    isCompactTable,
    setIsCompactTable,
    isReversedOrder,
    setIsReversedOrder,
    showEmptyDays,
    setShowEmptyDays,
    isFiltersOpen,
    setIsFiltersOpen,
    toggleFilters,
    activeFilterCount: transactionFilters.activeCount,
    visibleDates,
  };
};
