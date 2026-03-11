import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHotkeys } from 'react-hotkeys-hook';

import { ScrollArea } from '@/components/ui/scroll-area';
import Pagination from '@/components/common/Pagination';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

import { type UseLedgerReturn } from '../hooks/useLedger';

import DailyList from './DailyList';
import DisplayMenu from './DisplayMenu';
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
  displayMenuPortalTarget?: HTMLDivElement | null;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

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
  displayMenuPortalTarget,
}) => {
  const isMobile = useIsMobile();
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
    pagination,
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
    addPageHotkeys('Combined Listing', hotkeys);
    return () => removePageHotkeys('Combined Listing');
  }, [enableHotkeys, addPageHotkeys, removePageHotkeys]);

  // ─ Layout helpers ─────────────────────────────────────────────────────────
  const showDesktopTable = !isMobile && viewMode === 'table';
  const showDesktopDaily = !isMobile && viewMode === 'list';
  const showMobileDaily = isMobile;
  const hasNoItems = !isLoading && !isError && groupedItems.length === 0;
  const handleReset = onReset ?? resetAll;

  return (
    <>
      <div className="w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col bg-background md:bg-card">
        {/* Controls bar (desktop only) */}
        {!isMobile && showControls && (
          <div className="shrink-0">
            <ListingControls
              activeView={viewMode}
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

        {/* Empty state */}
        {hasNoItems ? <EmptyActivityState onReset={handleReset} /> : null}

        {/* Table view (desktop) */}
        {showDesktopTable && !hasNoItems ? (
          <ScrollArea aria-label="Ledger table listing" className="flex-1 min-h-0 w-full min-w-0">
            <div className="min-h-full">
              {isLoading ? (
                <TableListingSkeleton after={timeframe.after} before={timeframe.before} compact={isCompactTable} showEmptyDays={showEmptyDays} />
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

        {/* Daily column view (desktop) */}
        {showDesktopDaily && !hasNoItems ? (
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

        {/* Daily list (mobile) */}
        {showMobileDaily && !hasNoItems ? (
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

        {/* Period footer */}
        {showFooter && pagination.totalItems > 0 && (
          <div className="shrink-0 px-3 py-2 bg-background md:bg-card border-t">
            <Pagination
              currentPage={pagination.currentPage}
              isLoading={isFetching}
              perPage={pagination.perPage}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              onPerPageChange={pagination.setPerPage}
            />
          </div>
        )}
      </div>

      {/* Filters sheet */}
      {showFiltersSheet && (
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
          onReset={handleReset}
        />
      )}

      {/* Display menu — portaled into the header toolbar */}
      {displayMenuPortalTarget &&
        !isMobile &&
        createPortal(
          <DisplayMenu
            activeView={viewMode}
            isCompactTable={isCompactTable}
            setActiveView={setViewMode}
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
};

LedgerView.displayName = 'LedgerView';
export default LedgerView;
