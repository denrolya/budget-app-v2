import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import DailyList from '@/features/daily-ledger/components/DailyList';
import ListFiltersSheet from '@/features/daily-ledger/components/ListFiltersSheet';
import ListingControls from '@/features/daily-ledger/components/ListingControls';
import TableListing from '@/features/daily-ledger/components/TableListing';
import TableListingSkeleton from '@/features/daily-ledger/components/TableListingSkeleton';
import { TIMEFRAME_STEP_PRESETS } from '@/features/daily-ledger/constants';
import { useTransactionsAndTransfersList } from '@/features/daily-ledger/hooks/useList';
import { useTimeframe } from '@/features/daily-ledger/hooks/useTimeframe';
import { useIsMobile } from '@/hooks/use-mobile';

type ViewMode = 'table' | 'list';

export type ListingHandle = {
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  toggleFilters: () => void;
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
  showControls?: boolean
  initialFilters?: InitialFilters;
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

const ListingContainer = forwardRef<ListingHandle, Props>(
  ({
     updateUrl = true,
     omitTransferTransactions = true,
     enableHotkeys = true,
     showControls = true,
     initialFilters,
   }, ref) => {
    const isMobile = useIsMobile();
    const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

    // timeframe is here now
    const { timeframe, setTimeframe, step, setStep, goToNextPeriod, goToPreviousPeriod, reset: resetTimeframe } =
      useTimeframe({
        onChange: () => undefined,
      });

    // listing-only UI state
    const [showEmptyDays, setShowEmptyDays] = useState(true);
    const [activeView, setActiveView] = useState<ViewMode>('table');
    const [isReversedOrder, setIsReversedOrder] = useState(true);
    const [isCompactTable, setIsCompactTable] = useState(true);

    // filters sheet is owned here
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

    // sync timeframe -> list filters (always)
    useEffect(() => {
      setFilter('after', timeframe.after);
      setFilter('before', timeframe.before);
    }, [setFilter, timeframe.after, timeframe.before]);

    const handleResetFilters = useCallback(() => {
      resetTimeframe();
      resetFilters();
      setShowTransactions(true);
      setShowTransfers(true);
    }, [resetTimeframe, resetFilters, setShowTransactions, setShowTransfers]);

    // expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        goToNextPeriod,
        goToPreviousPeriod,
        toggleFilters,
      }),
      [goToNextPeriod, goToPreviousPeriod, toggleFilters],
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

    const selectedTimeframeStepIndex = useMemo(
      () => TIMEFRAME_STEP_PRESETS.findIndex((p) => p.amount === step?.amount && p.unit === step?.unit),
      [step?.amount, step?.unit],
    );

    const showDesktopTable = !isMobile && activeView === 'table';
    const showDesktopDaily = !isMobile && activeView === 'list';
    const showMobileDaily = isMobile;

    const stepSelectValue = useMemo(() => String(selectedTimeframeStepIndex), [selectedTimeframeStepIndex]);

    return (
      <>
        <div className="w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col bg-background md:bg-card">
          {/* Controls (desktop) */}
          {!isMobile && showControls && (
            <div className="shrink-0">
              <ListingControls
                activeView={activeView}
                handleResetFilters={handleResetFilters}
                isCompactTable={isCompactTable}
                isLoading={isLoading}
                isReversedOrder={isReversedOrder}
                setActiveView={setActiveView}
                setFilter={setFilter}
                setIsCompactTable={setIsCompactTable}
                setIsReversedOrder={setIsReversedOrder}
                setShowEmptyDays={setShowEmptyDays}
                setShowTransactions={setShowTransactions}
                setShowTransfers={setShowTransfers}
                setTimeframe={setTimeframe}
                showEmptyDays={showEmptyDays}
                showTransactions={showTransactions}
                showTransfers={showTransfers}
                timeframe={timeframe}
                transactionFilters={transactionFilters}
                transferFilters={transferFilters}
                onFiltersDialogToggle={toggleFilters}
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
                  isLoading={isLoading} />
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
              value={stepSelectValue}
              onValueChange={(val) => {
                const index = Number.parseInt(val, 10);
                const next = TIMEFRAME_STEP_PRESETS[index];
                if (next) setStep(next);
              }}
            >
              <SelectTrigger aria-label="Select time period" className="w-44">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAME_STEP_PRESETS.map((preset, index) => (
                  <SelectItem value={String(index)} key={`${preset.amount}-${preset.unit}`}>
                    {preset.amount} {preset.unit}
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
        />
      </>
    );
  },
);

ListingContainer.displayName = 'ListingContainer';

export default ListingContainer;
