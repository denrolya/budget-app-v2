import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { TransactionFilters } from '@/features/transactions';
import { TransferFilters } from '@/features/transfers';
import { useIsMobile } from '@/hooks/use-mobile';
import { Timeframe } from '@/types/global';

import { useTransactionsAndTransfersList } from '../hooks/useList';
import {
  detectPeriod,
  getInitialTimeframe,
  snapToPeriod,
  useTimeframe,
} from '../hooks/useTimeframe';

import DailyList from './DailyList';
import DisplayMenu from './DisplayMenu';
import ListFiltersSheet from './ListFiltersSheet';
import ListingControls from './ListingControls';
import TableListing from './TableListing';
import TableListingSkeleton from './TableListingSkeleton';

type ViewMode = 'table' | 'list';

export type ListingHandle = {
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  toggleFilters: () => void;
  resetFilters: () => void;
  setDateRange: (after: moment.Moment, before: moment.Moment) => void;
};

/**
 * Keep it intentionally loose for now.
 * You can tighten later to `Partial<Record<keyof CombinedFilters, unknown>>`
 * once you expose the real key union.
 */
export type InitialFilters = Record<string, unknown>;

type Props = {
  updateUrl?: boolean;
  omitTransferTransactions?: boolean;
  enableHotkeys?: boolean;
  showControls?: boolean;
  initialFilters?: InitialFilters;
  /**
   * Override the starting timeframe (used by embedded drawer views).
   * When `updateUrl=true` and URL params are present, URL takes precedence.
   */
  initialTimeframe?: Timeframe;
  onActiveCountChange?: (count: number) => void;
  onTimeframeChange?: (after: moment.Moment, before: moment.Moment) => void;
  onVisibleDatesChange?: (dates: string[]) => void;
  displayMenuPortalTarget?: HTMLDivElement | null;
};

const ErrorBanner: React.FC<{ error: unknown }> = ({ error }) => {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as any).message)
      : 'An unexpected error occurred.';

  return (
    <div className="shrink-0 px-4 py-3">
      <div aria-live="polite" role="alert" className="rounded-md bg-destructive/10 p-4 text-destructive">
        <p className="font-medium">Error:</p>
        <p>{message}</p>
      </div>
    </div>
  );
};

/** Read the initial timeframe from search params (stable - call inside useMemo with [] deps). */
const readTimeframeFromParams = (searchParams: URLSearchParams): Timeframe | undefined => {
  const afterRaw = searchParams.get('after');
  const beforeRaw = searchParams.get('before');
  if (!afterRaw || !beforeRaw) return undefined;

  const after = moment(afterRaw, BACKEND_DATE_FORMAT, true);
  const before = moment(beforeRaw, BACKEND_DATE_FORMAT, true);
  if (!after.isValid() || !before.isValid()) return undefined;

  return { after, before };
};

const PERIOD_PRESETS = [
  { value: 'day', label: '1 day' },
  { value: 'week', label: '1 week' },
  { value: 'month', label: '1 month' },
] as const;

const ListingContainer = forwardRef<ListingHandle, Props>(
  (
    {
      updateUrl = true,
      omitTransferTransactions = true,
      enableHotkeys = true,
      showControls = true,
      initialFilters,
      initialTimeframe: initialTimeframeProp,
      onActiveCountChange,
      onTimeframeChange,
      onVisibleDatesChange,
      displayMenuPortalTarget,
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

    /**
     * Capture the initial search params once on mount via a ref, so we can
     * read them in useMemo without triggering exhaustive-deps warnings.
     */
    const initialSearchParamsRef = useRef(useSearchParams()[0]);

    /**
     * Compute the effective initial timeframe ONCE on mount.
     * Priority: URL params > prop > computed default (current ISO week).
     */
    const urlTimeframe = useMemo(() => readTimeframeFromParams(initialSearchParamsRef.current), []);

    const effectiveInitialTimeframe: Timeframe = urlTimeframe ?? initialTimeframeProp ?? getInitialTimeframe();

    /**
     * Pre-seed filters with the effective timeframe so the first fetch uses
     * the correct range immediately (prevents a double-fetch on page load).
     */
    const effectiveInitialTimeframeRef = useRef(effectiveInitialTimeframe);

    const initialTransactionFilters = useMemo(
      () =>
        new TransactionFilters({
          after: effectiveInitialTimeframeRef.current.after,
          before: effectiveInitialTimeframeRef.current.before,
        }),
      [],
    );

    const initialTransferFilters = useMemo(
      () =>
        new TransferFilters({
          after: effectiveInitialTimeframeRef.current.after,
          before: effectiveInitialTimeframeRef.current.before,
        }),
      [],
    );

    // --- Timeframe hook ---
    const {
      timeframe,
      setTimeframe,
      goToNextPeriod,
      goToPreviousPeriod,
      reset: resetTimeframe,
    } = useTimeframe({ initialTimeframe: effectiveInitialTimeframe });

    // --- Listing-only UI state ---
    const [showEmptyDays, setShowEmptyDays] = useState(true);
    const [activeView, setActiveView] = useState<ViewMode>('table');
    const [isReversedOrder, setIsReversedOrder] = useState(true);
    const [isCompactTable, setIsCompactTable] = useState(true);

    // --- Filters sheet ---
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const toggleFilters = useCallback(() => setIsFiltersOpen((p) => !p), []);

    const {
      groupedItems,
      isLoading,
      isError,
      error,
      setFilter,
      resetFilters,
      transactionFilters,
      transferFilters,
      showTransactions,
      setShowTransactions,
      showTransfers,
      setShowTransfers,
    } = useTransactionsAndTransfersList({
      updateUrl,
      omitTransferTransactions,
      initialTransactionFilters,
      initialTransferFilters,
    });

    /**
     * Apply initial filters ONCE.
     * We intentionally do not re-apply if parent passes a new object later.
     */
    const didApplyInitialFiltersRef = useRef(false);

    useEffect(() => {
      if (didApplyInitialFiltersRef.current) return;
      if (!initialFilters) {
        didApplyInitialFiltersRef.current = true;
        return;
      }

      // timeframe is authoritative; ignore any attempt to preset these via initialFilters
      const forbidden = new Set(['after', 'before']);

      for (const [key, value] of Object.entries(initialFilters)) {
        if (forbidden.has(key)) continue;
        if (value === undefined) continue;
        setFilter(key as any, value);
      }

      didApplyInitialFiltersRef.current = true;
    }, [initialFilters, setFilter]);

    // Sync timeframe → list filters (after any timeframe change)
    useEffect(() => {
      setFilter('after', timeframe.after);
      setFilter('before', timeframe.before);
    }, [setFilter, timeframe.after, timeframe.before]);

    // Notify parent when timeframe changes (skips the initial mount)
    const isMountedForTimeframeRef = useRef(false);
    useEffect(() => {
      if (!isMountedForTimeframeRef.current) {
        isMountedForTimeframeRef.current = true;
        return;
      }
      onTimeframeChange?.(timeframe.after, timeframe.before);
    }, [timeframe.after, timeframe.before]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleResetFilters = useCallback(() => {
      resetTimeframe();
      resetFilters();
      setShowTransactions(true);
      setShowTransfers(true);
    }, [resetTimeframe, resetFilters, setShowTransactions, setShowTransfers]);

    // Notify parent of active filter count changes
    useEffect(() => {
      onActiveCountChange?.(transactionFilters.activeCount);
    }, [onActiveCountChange, transactionFilters.activeCount]);

    // Notify parent of visible dates (all calendar days in the current timeframe, including zero-transaction days)
    useEffect(() => {
      const dates: string[] = [];
      const cursor = timeframe.after.clone().startOf('day');
      const end = timeframe.before.clone().startOf('day');
      while (cursor.isSameOrBefore(end, 'day')) {
        dates.push(cursor.format(BACKEND_DATE_FORMAT));
        cursor.add(1, 'day');
      }
      onVisibleDatesChange?.(dates);
    }, [onVisibleDatesChange, timeframe.after, timeframe.before]);

    // expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        goToNextPeriod,
        goToPreviousPeriod,
        toggleFilters,
        resetFilters: handleResetFilters,
        setDateRange: (after, before) => setTimeframe({ after, before }),
      }),
      [goToNextPeriod, goToPreviousPeriod, toggleFilters, handleResetFilters, setTimeframe],
    );

    // Hotkeys: owned by container; disabled in drawer when needed
    const hkPrev = enableHotkeys ? goToPreviousPeriod : () => undefined;
    const hkNext = enableHotkeys ? goToNextPeriod : () => undefined;
    const hkFilters = enableHotkeys ? toggleFilters : () => undefined;

    useHotkeys('arrowleft', hkPrev, { preventDefault: true }, [hkPrev]);
    useHotkeys('arrowright', hkNext, { preventDefault: true }, [hkNext]);
    useHotkeys('f', hkFilters, { preventDefault: true }, [hkFilters]);

    useEffect(() => {
      if (!enableHotkeys) return;

      const hotkeys = [
        { windows: 'ArrowLeft', mac: 'ArrowLeft', description: 'Go to previous period' },
        { windows: 'ArrowRight', mac: 'ArrowRight', description: 'Go to next period' },
        { windows: 'F', mac: 'F', description: 'Toggle Filters Dialog' },
      ];

      addPageHotkeys('Combined Listing', hotkeys);
      return () => removePageHotkeys('Combined Listing');
    }, [enableHotkeys, addPageHotkeys, removePageHotkeys]);

    const activePeriod = useMemo(() => detectPeriod(timeframe), [timeframe]);

    const showDesktopTable = !isMobile && activeView === 'table';
    const showDesktopDaily = !isMobile && activeView === 'list';
    const showMobileDaily = isMobile;

    return (
      <>
        <div className="w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col bg-background md:bg-card">
          {/* Controls (desktop) */}
          {!isMobile && showControls && (
            <div className="shrink-0">
              <ListingControls
                activeView={activeView}
                isReversedOrder={isReversedOrder}
                setFilter={setFilter}
                setIsReversedOrder={setIsReversedOrder}
                setShowTransactions={setShowTransactions}
                setShowTransfers={setShowTransfers}
                setTimeframe={setTimeframe}
                timeframe={timeframe}
                transactionFilters={transactionFilters}
                transferFilters={transferFilters}
              />
            </div>
          )}

          {isError ? <ErrorBanner error={error} /> : null}

          {/* Listing area */}
          {showDesktopTable ? (
            <ScrollArea aria-label="Ledger table listing" className="flex-1 min-h-0 w-full min-w-0">
              <div className="min-h-full w-full min-w-0">
                {isLoading ? (
                  <TableListingSkeleton after={timeframe.after} before={timeframe.before} compact={isCompactTable} />
                ) : (
                  <TableListing
                    after={timeframe.after}
                    before={timeframe.before}
                    compact={isCompactTable}
                    groupedItems={groupedItems}
                    isLoading={isLoading}
                    isReversedOrder={isReversedOrder}
                    showEmptyDays={showEmptyDays}
                  />
                )}
              </div>
            </ScrollArea>
          ) : null}

          {showDesktopDaily ? (
            <div aria-label="Ledger daily columns" className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
              <div className="h-full w-full min-w-0 overflow-x-auto overflow-y-hidden">
                <DailyList
                  after={timeframe.after}
                  before={timeframe.before}
                  groupedItems={groupedItems}
                  isLoading={isLoading}
                />
              </div>
            </div>
          ) : null}

          {showMobileDaily ? (
            <ScrollArea aria-label="Ledger daily list" className="flex-1 min-h-0 w-full min-w-0">
              <DailyList
                reversed
                after={timeframe.after}
                before={timeframe.before}
                groupedItems={groupedItems}
                isLoading={isLoading}
              />
            </ScrollArea>
          ) : null}

          {/* Footer controls */}
          <div className="shrink-0 flex items-center justify-between md:justify-end gap-2 p-2 bg-background md:bg-card border-t">
            <Button
              aria-label="Previous period"
              disabled={isLoading}
              size="icon"
              type="button"
              variant="outline"
              onClick={goToPreviousPeriod}
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </Button>

            <Select
              value={activePeriod === 'custom' ? '' : activePeriod}
              onValueChange={(val) => {
                const preset = val as 'day' | 'week' | 'month';
                setTimeframe(snapToPeriod(timeframe.after, preset));
              }}
            >
              <SelectTrigger aria-label="Select time period" className="w-44">
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_PRESETS.map(({ value, label }) => (
                  <SelectItem value={value} key={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              aria-label="Next period"
              disabled={isLoading}
              size="icon"
              type="button"
              variant="outline"
              onClick={goToNextPeriod}
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ListFiltersSheet
          isOpen={isFiltersOpen}
          setFilter={setFilter}
          setIsOpen={setIsFiltersOpen}
          setShowTransactions={setShowTransactions}
          setShowTransfers={setShowTransfers}
          setTimeframe={setTimeframe}
          showTransactions={showTransactions}
          showTransfers={showTransfers}
          timeframe={timeframe}
          transactionFilters={transactionFilters}
          transferFilters={transferFilters}
          onReset={handleResetFilters}
        />

        {displayMenuPortalTarget &&
          !isMobile &&
          createPortal(
            <DisplayMenu
              activeView={activeView}
              isCompactTable={isCompactTable}
              setActiveView={setActiveView}
              setFilter={setFilter}
              setIsCompactTable={setIsCompactTable}
              setShowEmpty={setShowEmptyDays}
              setShowTransactions={setShowTransactions}
              setShowTransfers={setShowTransfers}
              showEmpty={showEmptyDays}
              showTransactions={showTransactions}
              showTransfers={showTransfers}
              transactionFilters={transactionFilters}
            />,
            displayMenuPortalTarget,
          )}
      </>
    );
  },
);

ListingContainer.displayName = 'ListingContainer';

export default ListingContainer;
