import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { MoneyValue } from '@/components/common/MoneyValue';
import { ScrollArea } from '@/components/ui/scroll-area';
import Pagination from '@/components/common/Pagination';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { Button } from '@/components/ui/button';

import { type UseLedgerReturn } from '../hooks/useLedger';

import ListFiltersSheet from './ListFiltersSheet';
import ListingControls from './ListingControls';
import TableListing from './TableListing';
import TableListingSkeleton from './TableListingSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerViewProps = {
  ledger: UseLedgerReturn;
  enableHotkeys?: boolean;
  showControls?: boolean;
  showFooter?: boolean;
  /** Optional reset override for scoped views (e.g. account details). */
  onReset?: () => void;
  /** When false, the internal ListFiltersSheet is suppressed so the parent can render its own. */
  showFiltersSheet?: boolean;
  /** Filters to render as disabled (e.g. when scoped to a specific account). */
  disabledFilters?: string[];
  controlsPortalTarget?: HTMLDivElement | null;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

const ErrorBanner: React.FC<{ error: unknown }> = ({ error }) => {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
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

const EmptyActivityState: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="flex h-full min-h-[280px] w-full items-center justify-center p-6">
    <div className="text-center max-w-md">
      <h3 className="text-base font-semibold text-foreground">No activity found</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        There are no transactions or transfers for the selected range and filters.
      </p>
      <Button variant="outline" className="mt-4" onClick={onReset}>
        Reset filters and period
      </Button>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pure rendering layer for the ledger. Accepts an externally-created `ledger`
 * (from {@link useLedger}) so it can be freely composed with other UI elements.
 */
const LedgerView: React.FC<LedgerViewProps> = ({
  ledger,
  enableHotkeys = true,
  showControls = true,
  showFooter = true,
  onReset,
  showFiltersSheet = true,
  disabledFilters,
  controlsPortalTarget,
}) => {
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  const {
    groupedItems,
    isLoading,
    isFetching,
    isError,
    error,
    timeframe,
    setTimeframe,
    transactionFilters,
    transferFilters,
    setFilter,
    resetAll,
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,
    isReversedOrder,
    setIsReversedOrder,
    showEmptyDays,
    setShowEmptyDays,
    isFiltersOpen,
    setIsFiltersOpen,
    toggleFilters,
    pagination,
    totalValue,
  } = ledger;

  // ─ Hotkeys ────────────────────────────────────────────────────────────────
  const hkPrevPage = enableHotkeys
    ? () => {
        if (pagination.currentPage > 1) pagination.setCurrentPage(pagination.currentPage - 1);
      }
    : () => undefined;
  const hkNextPage = enableHotkeys
    ? () => {
        if (pagination.currentPage < pagination.totalPages) pagination.setCurrentPage(pagination.currentPage + 1);
      }
    : () => undefined;
  const hkFilters = enableHotkeys ? toggleFilters : () => undefined;

  useHotkeys('arrowleft', hkPrevPage, { preventDefault: true }, [hkPrevPage]);
  useHotkeys('arrowright', hkNextPage, { preventDefault: true }, [hkNextPage]);
  useHotkeys('f', hkFilters, { preventDefault: true }, [hkFilters]);

  useEffect(() => {
    if (!enableHotkeys) return;
    const hotkeys = [
      { windows: 'ArrowLeft', mac: 'ArrowLeft', description: 'Previous page' },
      { windows: 'ArrowRight', mac: 'ArrowRight', description: 'Next page' },
      { windows: 'F', mac: 'F', description: 'Toggle Filters Dialog' },
    ];
    addPageHotkeys('Ledger', hotkeys);
    return () => removePageHotkeys('Ledger');
  }, [enableHotkeys, addPageHotkeys, removePageHotkeys]);

  // ─ Layout helpers ─────────────────────────────────────────────────────────
  const hasNoItems = !isLoading && !isError && groupedItems.length === 0;
  const handleReset = onReset ?? resetAll;

  const controlsProps = {
    isReversedOrder,
    setFilter,
    setIsReversedOrder,
    setShowTransactions,
    setShowTransfers,
    setTimeframe,
    showTransactions,
    showTransfers,
    timeframe,
    transactionFilters,
    transferFilters,
    disabledFilters,
  };

  return (
    <>
      <div className="w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col bg-background md:bg-card">
        {/* Controls bar (desktop only) */}
        {showControls && !controlsPortalTarget && (
          <div className="shrink-0 hidden md:block">
            <ListingControls {...controlsProps} />
          </div>
        )}

        {isError && <ErrorBanner error={error} />}

        {/* Empty state */}
        {hasNoItems && <EmptyActivityState onReset={handleReset} />}

        {/* Table listing */}
        {!hasNoItems && (
          <ScrollArea aria-label="Ledger table listing" className="flex-1 min-h-0 w-full min-w-0">
            <div className="min-h-full">
              {isLoading && (
                <TableListingSkeleton
                  after={timeframe.after}
                  before={timeframe.before}
                  showEmptyDays={showEmptyDays}
                />
              )}
              {!isLoading && (
                <TableListing
                  after={timeframe.after}
                  before={timeframe.before}
                  groupedItems={groupedItems}
                  isLoading={isLoading}
                  isReversedOrder={isReversedOrder}
                  showEmptyDays={showEmptyDays}
                />
              )}
            </div>
          </ScrollArea>
        )}

        {/* Period footer */}
        {showFooter && pagination.totalItems > 0 && (
          <div className="shrink-0 px-3 py-1.5 bg-background md:bg-card border-t flex items-center gap-3">
            <Pagination
              currentPage={pagination.currentPage}
              isLoading={isFetching}
              perPage={pagination.perPage}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              onPerPageChange={pagination.setPerPage}
            />
            {totalValue !== 0 && (
              <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                <span>Total:</span>
                <MoneyValue amount={totalValue} className="font-mono text-xs font-medium" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters drawer */}
      {showFiltersSheet && (
        <ListFiltersSheet
          disabledFilters={disabledFilters}
          isOpen={isFiltersOpen}
          setFilter={setFilter}
          setIsOpen={setIsFiltersOpen}
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
          onReset={handleReset}
        />
      )}

      {controlsPortalTarget &&
        showControls &&
        createPortal(<ListingControls {...controlsProps} />, controlsPortalTarget)}
    </>
  );
};

LedgerView.displayName = 'LedgerView';
export default LedgerView;
