import { ChevronLeft, ChevronRight, CopyPlus, SquarePlus } from 'lucide-react';
import { Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { TIMEFRAME_STEP_PRESETS } from '@/features/daily-ledger/constants';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import SummaryBadge from '@/components/common/SummaryBadge';
import DailyList from '@/features/daily-ledger/components/DailyList';
import DisplayMenu from '@/features/daily-ledger/components/DisplayMenu';
import ListFiltersSheet from '@/features/daily-ledger/components/ListFiltersSheet';
import ListingControls from '@/features/daily-ledger/components/ListingControls';
import TableListing from '@/features/daily-ledger/components/TableListing';
import TableListingSkeleton from '@/features/daily-ledger/components/TableListingSkeleton';
import BulkCreateTableForm from '@/features/transactions/components/BulkCreateTableForm';
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
import { useTimeframe } from '@/features/daily-ledger/hooks/useTimeframe';
import { useLedgerHotkeys } from '@/features/daily-ledger/hooks/useHotkeys';

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

  const { timeframe, setTimeframe, step, setStep, goToNextPeriod, goToPreviousPeriod, reset: resetTimeframe } =
    useTimeframe({
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

  const showDesktopTable = !isMobile && activeView === 'table';
  const showDesktopDaily = !isMobile && activeView === 'list';
  const showMobileDaily = isMobile;

  return (
    <FullHeightPageContent {...swipeHandlers}>
      <Card className="w-full min-w-0 shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="p-0 md:p-3 bg-background md:bg-card md:border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Ledger</CardTitle>

            <div aria-label="Ledger actions" role="toolbar" className="flex flex-wrap items-center gap-2">
              <SummaryBadge
                count={summary.transactionsCount}
                icon={ROUTES.TRANSACTION_LIST.icon}
                value={summary.transactionsValue}
              />
              <SummaryBadge
                count={summary.transfersCount}
                icon={ROUTES.TRANSFER_LIST.icon}
                useColors={false}
                value={summary.transfersValue}
              />

              {!isMobile && (
                <DisplayMenu
                  activeView={activeView}
                  isCompactTable={isCompactTable}
                  isReversedOrder={isReversedOrder}
                  setActiveView={setActiveView}
                  setFilter={setFilter}
                  setIsCompactTable={setIsCompactTable}
                  setIsReversedOrder={setIsReversedOrder}
                  setShowEmpty={setShowEmptyDays}
                  setShowTransactions={setShowTransactions}
                  setShowTransfers={setShowTransfers}
                  showEmpty={showEmptyDays}
                  showTransactions={showTransactions}
                  showTransfers={showTransfers}
                  transactionFilters={transactionFilters}
                />
              )}

              <FiltersToggleButton
                activeCount={transactionFilters.activeCount}
                aria-label={filtersToggleAriaLabel}
                className="flex md:hidden"
                onClick={toggleFilters}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    aria-label={bulkCreateAriaLabel}
                    aria-pressed={isBulkCreateOpen}
                    pressed={isBulkCreateOpen}
                    type="button"
                    variant="outline"
                    className="hidden md:flex"
                    onPressedChange={setIsBulkCreateOpen}
                  >
                    <CopyPlus aria-hidden="true" className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="New transaction"
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={openNewTransactionForm}
                  >
                    <SquarePlus aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="w-full min-w-0 p-0 bg-background md:bg-card flex-1 min-h-0 overflow-hidden flex flex-col">
          {!isMobile && (
            <div className="shrink-0">
              <ListingControls
                activeView={activeView}
                handleResetFilters={handleResetFilters}
                isLoading={isLoading}
                isReversedOrder={isReversedOrder}
                setFilter={setFilter}
                setIsReversedOrder={setIsReversedOrder}
                setShowTransactions={setShowTransactions}
                setShowTransfers={setShowTransfers}
                setTimeframe={setTimeframe}
                timeframe={timeframe}
                transactionFilters={transactionFilters}
                transferFilters={transferFilters}
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
              <div aria-live="polite" role="alert" className="rounded-md bg-destructive/10 p-4 text-destructive">
                <p className="font-medium">Error:</p>
                <p>{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            </div>
          )}

          {showDesktopTable && (
            <ScrollArea aria-label="Ledger table listing" className="flex-1 min-h-0 w-full min-w-0">
              <div className="min-h-full w-full min-w-0">
                {isLoading && (
                  <TableListingSkeleton after={timeframe.after} before={timeframe.before} compact={isCompactTable} />
                )}
                {!isLoading && (
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
          )}

          {showDesktopDaily && (
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
          )}

          {showMobileDaily && (
            <ScrollArea aria-label="Ledger daily list" className="flex-1 min-h-0 w-full min-w-0">
              <DailyList
                reversed
                after={timeframe.after}
                before={timeframe.before}
                groupedItems={groupedItems}
                isLoading={isLoading}
              />
            </ScrollArea>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between md:justify-end gap-2 p-2 bg-background md:bg-card border-t">
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
            value={String(selectedTimeframeStepIndex)}
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
        </CardFooter>
      </Card>

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
    </FullHeightPageContent>
  );
};

DailyLedgerPage.displayName = 'DailyLedgerPage';

export default DailyLedgerPage;
