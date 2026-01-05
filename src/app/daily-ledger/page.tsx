import { ChevronLeft, ChevronRight, CopyPlus, SquarePlus } from 'lucide-react';
import { Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { TIMEFRAME_STEP_PRESETS } from '@/app/daily-ledger/constants';
import { useLedgerHotkeys } from '@/app/daily-ledger/hooks/useHotkeys';
import { useTimeframe } from '@/app/daily-ledger/hooks/useTimeframe';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import SummaryBadge from '@/components/common/SummaryBadge';
import DailyList from '@/components/features/daily-ledger/DailyList';
import DisplayMenu from '@/components/features/daily-ledger/DisplayMenu';
import ListFiltersSheet from '@/components/features/daily-ledger/ListFiltersSheet';
import ListingControls from '@/components/features/daily-ledger/ListingControls';
import TableListing from '@/components/features/daily-ledger/TableListing';
import TableListingSkeleton from '@/components/features/daily-ledger/TableListingSkeleton';
import BulkCreateTableForm from '@/components/features/transactions/BulkCreateTableForm';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';

type ViewMode = 'table' | 'list';

interface Summary {
  transactionsCount: number;
  transfersCount: number;
  transactionsValue: number;
  transfersValue: number;
}

const computeSummary = (groupedItems: any[] | undefined | null): Summary => {
  if (!groupedItems) return { transactionsCount: 0, transfersCount: 0, transactionsValue: 0, transfersValue: 0 };

  let transactionsCount = 0;
  let transfersCount = 0;
  let transfersValue = 0;
  let transactionsValue = 0;

  groupedItems.forEach(([, , groupTransactionsValue, groupTransfersValue, groupTransactionsCount, groupTransfersCount]) => {
    transactionsCount += groupTransactionsCount;
    transfersCount += groupTransfersCount;
    transactionsValue += groupTransactionsValue;
    transfersValue += groupTransfersValue;
  });

  return { transactionsCount, transfersCount, transactionsValue, transfersValue };
};

export const DailyLedgerPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();

  const [showEmptyDays, setShowEmptyDays] = useState(true);
  const [activeView, setActiveView] = useState<ViewMode>('table');
  const [isReversedOrder, setIsReversedOrder] = useState(true);
  const [isCompactTable, setIsCompactTable] = useState(true);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);

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
  } = useTransactionsAndTransfers({
    updateUrl: true,
    excludeTransfers: true,
  });

  const openNewTransactionForm = useCallback(() => {
    openForm(FormType.Transaction);
  }, [openForm]);

  const toggleFilters = useCallback(() => {
    setIsFiltersOpen((prev) => !prev);
  }, []);

  const toggleBulkCreate = useCallback(() => {
    setIsBulkCreateOpen((prev) => !prev);
  }, []);

  const {
    timeframe,
    setTimeframe,
    step,
    setStep,
    goToNextPeriod,
    goToPreviousPeriod,
    reset: resetTimeframe,
  } = useTimeframe({
    onChange: ({ after, before }: { after: Moment; before: Moment }) => {
      setFilter('after', after);
      setFilter('before', before);
    },
  });

  useLedgerHotkeys({
    onPrev: goToPreviousPeriod,
    onNext: goToNextPeriod,
    toggleFilters,
    toggleBulkCreate,
  });

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNextPeriod,
    onSwipedRight: goToPreviousPeriod,
    trackMouse: true,
  });

  const summary = useMemo(() => computeSummary(groupedItems), [groupedItems]);

  const handleResetFilters = useCallback(() => {
    resetTimeframe();
    resetFilters();
    setShowTransactions(true);
    setShowTransfers(true);
  }, [resetFilters, resetTimeframe, setShowTransactions, setShowTransfers]);

  const selectedTimeframeStepIndex = useMemo(
    () => TIMEFRAME_STEP_PRESETS.findIndex((p) => p.amount === step?.amount && p.unit === step?.unit),
    [step?.amount, step?.unit],
  );

  const bulkCreateAriaLabel = isBulkCreateOpen ? 'Hide bulk create' : 'Show bulk create';
  const filtersToggleAriaLabel = isFiltersOpen ? 'Close filters' : 'Open filters';

  return (
    <FullHeightPageContent {...swipeHandlers}>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        {/* HEADER (unified with TransactionsListPage) */}
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Ledger</CardTitle>

            <div role="toolbar" aria-label="Ledger actions" className="flex flex-wrap items-center gap-2">
              <SummaryBadge
                icon={ROUTES.TRANSACTION_LIST.icon}
                count={summary.transactionsCount}
                value={summary.transactionsValue}
              />
              <SummaryBadge
                useColors={false}
                icon={ROUTES.TRANSFER_LIST.icon}
                count={summary.transfersCount}
                value={summary.transfersValue}
              />

              <DisplayMenu
                activeView={activeView}
                setActiveView={setActiveView}
                setShowEmpty={setShowEmptyDays}
                showEmpty={showEmptyDays}
                isCompactTable={isCompactTable}
                setIsCompactTable={setIsCompactTable}
                showTransactions={showTransactions}
                setShowTransactions={setShowTransactions}
                showTransfers={showTransfers}
                setShowTransfers={setShowTransfers}
                transactionFilters={transactionFilters}
                setFilter={setFilter}
                isReversedOrder={isReversedOrder}
                setIsReversedOrder={setIsReversedOrder}
              />

              <FiltersToggleButton
                className="flex md:hidden"
                activeCount={transactionFilters.activeCount}
                onClick={toggleFilters}
                aria-label={filtersToggleAriaLabel}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    type="button"
                    variant="outline"
                    className="hidden md:flex"
                    pressed={isBulkCreateOpen}
                    onPressedChange={setIsBulkCreateOpen}
                    aria-label={bulkCreateAriaLabel}
                    aria-pressed={isBulkCreateOpen}
                  >
                    <CopyPlus className="h-4 w-4" aria-hidden="true" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={openNewTransactionForm}
                    aria-label="New transaction"
                  >
                    <SquarePlus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        {/* CONTENT (same structural rules as TransactionsListPage) */}
        <CardContent className="p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {!isMobile && (
            <div className="shrink-0">
              <ListingControls
                isLoading={isLoading}
                transactionFilters={transactionFilters}
                transferFilters={transferFilters}
                setFilter={setFilter}
                setShowTransactions={setShowTransactions}
                setShowTransfers={setShowTransfers}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                activeView={activeView}
                isReversedOrder={isReversedOrder}
                setIsReversedOrder={setIsReversedOrder}
                handleResetFilters={handleResetFilters}
                onFiltersDialogToggle={toggleFilters}
              />
            </div>
          )}

          {isBulkCreateOpen && (
            <div className="shrink-0 border-b bg-muted/50 supports-[backdrop-filter]:bg-muted/50">
              <div className="px-4 py-3">
                <BulkCreateTableForm />
              </div>
            </div>
          )}

          {isError && (
            <div className="shrink-0 px-4 py-3">
              <div className="rounded-md bg-destructive/10 p-4 text-destructive" role="alert" aria-live="polite">
                <p className="font-medium">Error:</p>
                <p>{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 min-h-0" aria-label="Ledger listing">
            <div className="min-h-full">
              {!isMobile && activeView === 'table' && (
                <>
                  {isLoading ? (
                    <TableListingSkeleton after={timeframe.after} before={timeframe.before} compact={isCompactTable} />
                  ) : (
                    <TableListing
                      isLoading={isLoading}
                      showEmptyDays={showEmptyDays}
                      groupedItems={groupedItems}
                      after={timeframe.after}
                      before={timeframe.before}
                      isReversedOrder={isReversedOrder}
                      compact={isCompactTable}
                    />
                  )}
                </>
              )}

              {!isMobile && activeView === 'list' && (
                <DailyList
                  isLoading={isLoading}
                  groupedItems={groupedItems}
                  after={timeframe.after}
                  before={timeframe.before}
                />
              )}

              {isMobile && (
                <DailyList
                  isLoading={isLoading}
                  groupedItems={groupedItems}
                  after={timeframe.after}
                  before={timeframe.before}
                />
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex items-center justify-between md:justify-end gap-2 p-2 bg-background md:bg-card border-t">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={goToPreviousPeriod}
            disabled={isLoading}
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Select
            value={String(selectedTimeframeStepIndex)}
            onValueChange={(val) => {
              const index = Number.parseInt(val, 10);
              const next = TIMEFRAME_STEP_PRESETS[index];
              if (next) setStep(next);
            }}
          >
            <SelectTrigger className="w-44" aria-label="Select time period">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAME_STEP_PRESETS.map((preset, index) => (
                <SelectItem key={`${preset.amount}-${preset.unit}`} value={String(index)}>
                  {preset.amount} {preset.unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={goToNextPeriod}
            disabled={isLoading}
            aria-label="Next period">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>

      <ListFiltersSheet
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        transactionFilters={transactionFilters}
        transferFilters={transferFilters}
        setFilter={setFilter}
        showTransactions={showTransactions}
        setShowTransactions={setShowTransactions}
        showTransfers={showTransfers}
        setShowTransfers={setShowTransfers}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />
    </FullHeightPageContent>
  );
};

export default DailyLedgerPage;
