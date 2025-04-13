import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  CopyPlus,
  LayoutList,
  Settings2,
  SquarePlus,
  Table,
} from 'lucide-react';
import { Moment } from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { TIMEFRAME_STEP_PRESETS } from '@/app/daily-ledger/constants';
import { useLedgerHotkeys } from '@/app/daily-ledger/hooks/useHotkeys';
import { useTimeframe } from '@/app/daily-ledger/hooks/useTimeframe';
import FiltersToggleButton from '@/components/common/FiltersToggleButton';
import SummaryBadge from '@/components/common/SummaryBadge';
import DailyList from '@/components/features/daily-ledger/DailyList';
import ListFiltersSheet from '@/components/features/daily-ledger/ListFiltersSheet';
import ListingControls from '@/components/features/daily-ledger/ListingControls';
import TableListing from '@/components/features/daily-ledger/TableListing';
import TableListingSkeleton from '@/components/features/daily-ledger/TableListingSkeleton';
import BulkCreateTableForm from '@/components/features/transactions/BulkCreateTableForm';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useIsMobile } from '@/hooks/useMobile';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';
import { Type as TransactionType } from '@/types/transaction';

export const DailyLedgerPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { openForm } = useFormContext();
  const [showEmpty, setShowEmpty] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'table' | 'list'>('table');
  const [isReversedOrder, setIsReversedOrder] = useState<boolean>(true);
  const [isCompactTable, setIsCompactTable] = useState<boolean>(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [showBulkCreate, setShowBulkCreate] = useState<boolean>(false);
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

  const onAddTransaction = () => openForm(FormType.Transaction);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNextPeriod,
    onSwipedRight: goToPreviousPeriod,
    trackMouse: true,
  });

  const summary = useMemo(() => {
    if (!groupedItems)
      return {
        transactionsCount: 0,
        transfersCount: 0,
        transactionsValue: 0,
        transfersValue: 0,
      };

    let transactionsCount = 0;
    let transfersCount = 0;
    let transfersValue = 0;
    let transactionsValue = 0;

    groupedItems.forEach(
      ([, , groupTransactionsValue, groupTransfersValue, groupTransactionsCount, groupTransfersCount]) => {
        transactionsCount += groupTransactionsCount;
        transfersCount += groupTransfersCount;
        transactionsValue += groupTransactionsValue;
        transfersValue += groupTransfersValue;
      },
    );

    return { transactionsCount, transfersCount, transactionsValue, transfersValue };
  }, [groupedItems]);

  useLedgerHotkeys({
    onPrev: goToPreviousPeriod,
    onNext: goToNextPeriod,
    toggleFilters: () => setIsFiltersOpen(!isFiltersOpen),
    toggleBulkCreate: () => setShowBulkCreate(!showBulkCreate),
  });

  const handleResetFilters = () => {
    resetTimeframe();
    resetFilters();
    setShowTransactions(true);
    setShowTransfers(true);
  };

  const handleTransactionTypeChange = useCallback(
    (type: TransactionType | undefined) => {
      setFilter('type', transactionFilters.type === type ? undefined : type);
      setFilter('categories', []); // Reset categories when changing type
      setShowTransactions(true);
      setShowTransfers(false);
    },
    [setFilter, setShowTransactions, setShowTransfers],
  );

  const selectedTimeframeStepIndex = TIMEFRAME_STEP_PRESETS.findIndex(
    (p) => p.amount === step?.amount && p.unit === step?.unit,
  );

  return (
    <FullHeightPageContent {...swipeHandlers} className="flex flex-col justify-between">
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="flex flex-col space-y-4 p-0 md:p-3 bg-background md:bg-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-2xl font-bold">Ledger</CardTitle>
            <div className="flex flex-wrap justify-end gap-2">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline">
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">View Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {!isMobile && (
                    <>
                      <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={activeView} onValueChange={(v) => setActiveView(v)}>
                        <DropdownMenuRadioItem value="list">
                          <LayoutList className="mr-2 h-4 w-4" /> List
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="table">
                          <Table className="mr-2 h-4 w-4" /> Table
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuCheckboxItem
                        disabled={activeView !== 'table'}
                        checked={showEmpty}
                        onCheckedChange={(v) => setShowEmpty(v)}
                      >
                        Show empty days
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuCheckboxItem
                        disabled={activeView !== 'table'}
                        checked={isCompactTable}
                        onCheckedChange={(v) => setIsCompactTable(v)}
                      >
                        Compact mode
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={showTransactions} onCheckedChange={setShowTransactions}>
                    Transactions
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showTransfers} onCheckedChange={setShowTransfers}>
                    Transfers
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Draft Status</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={
                      transactionFilters.isDraft === true
                        ? 'drafts'
                        : transactionFilters.isDraft === false
                          ? 'noDrafts'
                          : 'all'
                    }
                    onValueChange={(value) => {
                      setFilter('isDraft', value === 'drafts' ? true : value === 'noDrafts' ? false : null);
                      setShowTransfers(value === 'all');
                    }}
                  >
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="drafts">Drafts</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="noDrafts">No Drafts</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    disabled={!showTransactions}
                    checked={
                      showTransactions &&
                      (transactionFilters.type === TransactionType.Income || !transactionFilters.type)
                    }
                    onCheckedChange={() =>
                      handleTransactionTypeChange(
                        transactionFilters.type === TransactionType.Income ? undefined : TransactionType.Income,
                      )
                    }
                  >
                    <ArrowDownCircle className="mr-2 h-4 w-4 text-success" /> Income
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    disabled={!showTransactions}
                    checked={
                      showTransactions &&
                      (transactionFilters.type === TransactionType.Expense || !transactionFilters.type)
                    }
                    onCheckedChange={() =>
                      handleTransactionTypeChange(
                        transactionFilters.type === TransactionType.Expense ? undefined : TransactionType.Expense,
                      )
                    }
                  >
                    <ArrowUpCircle className="mr-2 h-4 w-4 text-destructive" /> Expense
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <FiltersToggleButton
                className="flex md:hidden"
                activeCount={transactionFilters.getModifiedCount()}
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    variant="outline"
                    className="hidden md:flex"
                    pressed={showBulkCreate}
                    onClick={() => setShowBulkCreate(!showBulkCreate)}
                  >
                    <CopyPlus className="h-4 w-4" />
                    <span className="sr-only">Bulk Create</span>
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onAddTransaction}>
                    <SquarePlus className="h-4 w-4" />
                    <span className="sr-only">New Transaction</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="mb-4">
            {!isMobile && (
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
                onFiltersDialogToggle={() => setIsFiltersOpen(!isFiltersOpen)}
              />
            )}

            {showBulkCreate && <BulkCreateTableForm />}

            {isError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md m-4">
                <p className="font-medium">Error:</p>
                <p>{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-background md:bg-card flex-grow overflow-hidden">
          <ScrollArea className="h-full overflow-auto">
            <div className="flex-grow overflow-hidden">
              {/* Desktop View */}
              <div className="hidden md:block h-full overflow-auto">
                {activeView === 'table' && (
                  <>
                    {isLoading && <TableListingSkeleton after={timeframe.after} before={timeframe.before} />}
                    {!isLoading && (
                      <TableListing
                        isLoading={isLoading}
                        showEmptyDays={showEmpty}
                        groupedItems={groupedItems}
                        after={timeframe.after}
                        before={timeframe.before}
                        isReversedOrder={isReversedOrder}
                        compact={isCompactTable}
                      />
                    )}
                  </>
                )}
                {activeView === 'list' && (
                  <DailyList
                    isLoading={isLoading}
                    groupedItems={groupedItems}
                    after={timeframe.after}
                    before={timeframe.before}
                  />
                )}
              </div>

              {/* Mobile View (always uses DailyList) */}
              <div className="md:hidden h-full overflow-auto">
                <DailyList
                  isLoading={isLoading}
                  groupedItems={groupedItems}
                  after={timeframe.after}
                  before={timeframe.before}
                />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end p-4 md:p-6 bg-background md:bg-card">
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button size="icon" variant="outline" onClick={goToPreviousPeriod} disabled={isLoading}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Select
              value={String(selectedTimeframeStepIndex)}
              onValueChange={(val) => {
                const index = parseInt(val, 10);
                setStep(TIMEFRAME_STEP_PRESETS[index]);
              }}
            >
              <SelectTrigger className="w-[180px]">
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
            <Button size="icon" variant="outline" onClick={goToNextPeriod} disabled={isLoading}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
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
