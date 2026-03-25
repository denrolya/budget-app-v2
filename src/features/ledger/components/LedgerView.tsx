import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';

import { MoneyValue } from '@/components/common/MoneyValue';
import { ScrollArea } from '@/components/ui/scroll-area';
import Pagination from '@/components/common/Pagination';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { confirm } from '@/lib/confirmation';
import { type Transaction, useMutations as useTransactionsMutations } from '@/features/transactions';
import type { Transfer } from '@/features/transfers';

import { type UseLedgerReturn } from '../hooks/useLedger';
import { buildDateList, itemKey, sortItems } from '../utils';

import ItemDetailPanel from './ItemDetailPanel';
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

const EmptyActivityState: React.FC<{ onReset: () => void; activeFilterCount: number }> = ({
  onReset,
  activeFilterCount,
}) => (
  <div className="flex h-full min-h-[280px] w-full items-center justify-center p-6">
    <div className="text-center max-w-md">
      <h2 className="text-base font-semibold text-foreground">No activity found</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {activeFilterCount > 0
          ? `No transactions match your active filters (${activeFilterCount} active).`
          : 'There are no transactions or transfers for the selected period.'}
      </p>
      <Button variant="outline" className="mt-4" onClick={onReset}>
        {activeFilterCount > 0 ? 'Reset filters and period' : 'Go to current month'}
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
  const { openForm } = useFormContext();
  const { update: updateTransaction } = useTransactionsMutations();

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
    activeFilterCount,
    pagination,
    totalValue,
  } = ledger;

  // ─ Pagination hotkeys ─────────────────────────────────────────────────────
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
      { windows: 'E', mac: 'E', description: 'Edit selected item' },
      { windows: 'D', mac: 'D', description: 'Toggle draft status of selected transaction' },
    ];
    addPageHotkeys('Ledger', hotkeys);
    return () => removePageHotkeys('Ledger');
  }, [enableHotkeys, addPageHotkeys, removePageHotkeys]);

  // ─ Master-detail selection ────────────────────────────────────────────────
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Flat list that mirrors TableListing's exact visual render order.
  const flatItems = useMemo(
    () =>
      buildDateList(timeframe.after, timeframe.before, isReversedOrder).flatMap((date) => {
        const group = groupedItems.find((g) => g.date.isSame(date, 'day'));
        return group ? sortItems(group.items, isReversedOrder) : [];
      }),
    [groupedItems, isReversedOrder, timeframe],
  );

  const selectedItem = useMemo(
    () => flatItems.find((item) => itemKey(item) === selectedKey) ?? null,
    [flatItems, selectedKey],
  );

  const handleSelectItem = useCallback((item: Transaction | Transfer) => {
    const key = itemKey(item);
    setSelectedKey((prev) => (prev === key ? null : key));
  }, []);

  // Auto-select the first item once data initially loads.
  const didAutoSelectRef = useRef(false);
  useEffect(() => {
    if (didAutoSelectRef.current || flatItems.length === 0) return;
    didAutoSelectRef.current = true;
    setSelectedKey(itemKey(flatItems[0]));
  }, [flatItems]);

  // Close panel only when the selected item is no longer in the current dataset
  // (page change, filter change, deletion). Does NOT close on background refetch
  // when the same items are returned.
  useEffect(() => {
    if (!selectedKey) return;
    if (!flatItems.some((item) => itemKey(item) === selectedKey)) setSelectedKey(null);
  }, [flatItems, selectedKey]);

  // Keyboard navigation: ↑↓ navigate, Esc close
  useEffect(() => {
    if (!enableHotkeys || flatItems.length === 0) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedKey(null);
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();

      if (!selectedKey) {
        setSelectedKey(itemKey(flatItems[0]));
        return;
      }

      const idx = flatItems.findIndex((item) => itemKey(item) === selectedKey);
      if (idx === -1) return;

      const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      if (next >= 0 && next < flatItems.length) setSelectedKey(itemKey(flatItems[next]));
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enableHotkeys, selectedKey, flatItems]);

  // Row hotkeys: E → edit selected, D → toggle draft on selected transaction
  const handleEditHotkey = useCallback(() => {
    if (!selectedItem) return;
    if (selectedKey?.startsWith('xfr-')) openForm(FormType.Transfer, selectedItem as Transfer);
    else openForm(FormType.Transaction, selectedItem as Transaction);
  }, [selectedItem, selectedKey, openForm]);

  const handleDraftHotkey = useCallback(async () => {
    if (!selectedItem || selectedKey?.startsWith('xfr-')) return;
    const tx = selectedItem as Transaction;
    const newDraftState = !tx.isDraft;
    const confirmed = await confirm({
      title: newDraftState ? 'Mark as draft?' : 'Mark as confirmed?',
      description: newDraftState
        ? 'This will mark the transaction as a draft.'
        : 'This will remove the draft status and mark the transaction as confirmed.',
      confirmText: newDraftState ? 'Mark as draft' : 'Mark as confirmed',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    try {
      await updateTransaction({ id: tx.id, updates: { ...tx, isDraft: newDraftState }, originalTransaction: tx });
      toast.success(newDraftState ? 'Marked as draft' : 'Marked as confirmed');
    } catch {
      toast.error('Failed to update draft status. Please try again.');
    }
  }, [selectedItem, selectedKey, updateTransaction]);

  useHotkeys('e', handleEditHotkey, { preventDefault: true }, [handleEditHotkey]);
  useHotkeys(
    'd',
    () => {
      void handleDraftHotkey();
    },
    { preventDefault: true },
    [handleDraftHotkey],
  );

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
        {hasNoItems && <EmptyActivityState activeFilterCount={activeFilterCount} onReset={handleReset} />}

        {/* Table listing + detail panel */}
        {!hasNoItems && (
          <div
            className={cn(
              'flex flex-1 min-h-0 overflow-hidden transition-opacity duration-150',
              isFetching && !isLoading && 'opacity-50 pointer-events-none',
            )}
          >
            {/* Scrollable table */}
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
              <ScrollArea aria-label="Ledger table listing" className="h-full w-full min-w-0">
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
                      isReversedOrder={isReversedOrder}
                      selectedKey={selectedKey}
                      showEmptyDays={showEmptyDays}
                      onSelectItem={handleSelectItem}
                    />
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Persistent detail panel — slides in from right */}
            <div
              className={cn(
                'shrink-0 border-l bg-card overflow-hidden transition-[width] duration-150 ease-out',
                selectedItem ? 'w-[320px]' : 'w-0',
              )}
            >
              {selectedItem && <ItemDetailPanel item={selectedItem} onClose={() => setSelectedKey(null)} />}
            </div>
          </div>
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
