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
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSwipeable } from 'react-swipeable';

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
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { useIsMobile } from '@/hooks/useMobile';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';
import { Type as TransactionType } from '@/types/transaction';

type TimePreset = {
  label: string;
  value: string;
  getTimeframe: () => { after: moment.Moment; before: moment.Moment };
  step: {
    unit: moment.unitOfTime.DurationConstructor;
    amount: number;
  };
};

const timePresets: TimePreset[] = [
  {
    label: 'Current Week',
    value: 'current-week',
    getTimeframe: () => ({
      after: moment().startOf('isoWeek'),
      before: moment().endOf('isoWeek'),
    }),
    step: { unit: 'week', amount: 1 },
  },
  {
    label: 'Last Week',
    value: 'last-week',
    getTimeframe: () => ({
      after: moment().subtract(1, 'week').startOf('isoWeek'),
      before: moment().subtract(1, 'week').endOf('isoWeek'),
    }),
    step: { unit: 'week', amount: 1 },
  },
  {
    label: 'Last 2 Weeks',
    value: '2-weeks',
    getTimeframe: () => ({
      after: moment().subtract(1, 'week').startOf('isoWeek'),
      before: moment().endOf('isoWeek'),
    }),
    step: { unit: 'week', amount: 2 },
  },
  {
    label: 'Current 30 Days',
    value: '30-days',
    getTimeframe: () => ({
      after: moment().subtract(30, 'days').startOf('day'),
      before: moment().endOf('day'),
    }),
    step: { unit: 'day', amount: 30 },
  },
  {
    label: 'Current Month',
    value: 'current-month',
    getTimeframe: () => ({
      after: moment().startOf('month'),
      before: moment().endOf('month'),
    }),
    step: { unit: 'month', amount: 1 },
  },
  {
    label: 'Last Month',
    value: 'last-month',
    getTimeframe: () => ({
      after: moment().subtract(1, 'month').startOf('month'),
      before: moment().subtract(1, 'month').endOf('month'),
    }),
    step: { unit: 'month', amount: 1 },
  },
  {
    label: 'Last 3 Months',
    value: '3-months',
    getTimeframe: () => ({
      after: moment().subtract(2, 'month').startOf('month'),
      before: moment().endOf('month'),
    }),
    step: { unit: 'month', amount: 3 },
  },
  {
    label: 'Current Year',
    value: 'current-year',
    getTimeframe: () => ({
      after: moment().startOf('year'),
      before: moment().endOf('year'),
    }),
    step: { unit: 'year', amount: 1 },
  },
  {
    label: 'Last Year',
    value: 'last-year',
    getTimeframe: () => ({
      after: moment().subtract(1, 'year').startOf('year'),
      before: moment().subtract(1, 'year').endOf('year'),
    }),
    step: { unit: 'year', amount: 1 },
  },
];

const DEFAULT_TIMEFRAME_PRESET = '30-days';

export const DailyLedgerPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<'table' | 'list'>('table');
  const [isReversedOrder, setIsReversedOrder] = useState<boolean>(true);
  const [isCompactTable, setIsCompactTable] = useState<boolean>(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [showBulkCreate, setShowBulkCreate] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(DEFAULT_TIMEFRAME_PRESET);
  const [customTimeframe, setCustomTimeframe] = useState<{
    after: moment.Moment;
    before: moment.Moment;
  } | null>(null);
  const { openForm } = useFormContext();
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  const timeframe = useMemo(() => {
    if (customTimeframe) {
      return customTimeframe;
    }
    const preset = timePresets.find((p) => p.value === selectedPreset);
    return preset ? preset.getTimeframe() : timePresets[0].getTimeframe();
  }, [selectedPreset, customTimeframe]);

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

  useEffect(() => {
    setFilter('after', timeframe.after);
    setFilter('before', timeframe.before);
  }, [timeframe, setFilter]);

  const onAddTransaction = () => openForm(FormType.Transaction);

  const navigatePeriod = useCallback(
    (direction: 'next' | 'previous') => {
      const preset = timePresets.find((p) => p.value === selectedPreset);
      if (preset) {
        const { step } = preset;
        const newStartDate = timeframe.after.clone()[direction === 'next' ? 'add' : 'subtract'](step.amount, step.unit);
        const newEndDate = timeframe.before.clone()[direction === 'next' ? 'add' : 'subtract'](step.amount, step.unit);
        setCustomTimeframe({
          after: newStartDate,
          before: newEndDate,
        });
      } else if (customTimeframe) {
        const duration = customTimeframe.before.diff(customTimeframe.after);
        if (direction === 'next') {
          setCustomTimeframe({
            after: customTimeframe.before.clone().add(1, 'day'),
            before: customTimeframe.before.clone().add(1, 'day').add(duration, 'milliseconds'),
          });
        } else {
          setCustomTimeframe({
            after: customTimeframe.after.clone().subtract(duration, 'milliseconds'),
            before: customTimeframe.after.clone().subtract(1, 'millisecond'),
          });
        }
      }
    },
    [timeframe, selectedPreset, customTimeframe],
  );

  const goToNextPeriod = () => navigatePeriod('next');
  const goToPreviousPeriod = () => navigatePeriod('previous');

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

  useHotkeys('arrowleft', goToPreviousPeriod);
  useHotkeys('arrowright', goToNextPeriod);
  useHotkeys('b', () => setShowBulkCreate(!showBulkCreate));
  useHotkeys('f', () => setIsFiltersOpen(!isFiltersOpen), {}, [isFiltersOpen]);

  useEffect(() => {
    const hotkeys = [
      {
        windows: 'ArrowLeft',
        mac: 'ArrowLeft',
        description: 'Go to previous period',
      },
      {
        windows: 'ArrowRight',
        mac: 'ArrowRight',
        description: 'Go to next period',
      },
      {
        windows: 'B',
        mac: 'B',
        description: 'Toggle Bulk Create',
      },
      {
        windows: 'F',
        mac: 'F',
        description: 'Toggle Filters Dialog',
      },
    ];
    addPageHotkeys('Daily Ledger', hotkeys);

    return () => {
      removePageHotkeys('Daily Ledger');
    };
  }, [addPageHotkeys, removePageHotkeys]);

  const handleResetFilters = () => {
    resetFilters();
    setCustomTimeframe(null);
    setShowTransactions(true);
    setShowTransfers(true);
  };

  const handleTransactionVisibilityToggle = useCallback(
    (visible: boolean) => {
      setShowTransactions(visible);
      if (!visible) {
        setFilter('categories', []);
        setFilter('type', undefined);
        setFilter('isDraft', null);
      }
    },
    [setShowTransactions, setFilter],
  );

  const handleTransactionTypeChange = useCallback(
    (type: TransactionType | undefined) => {
      setFilter('type', transactionFilters.type === type ? undefined : type);
      setFilter('categories', []); // Reset categories when changing type
      setShowTransactions(true);
      setShowTransfers(false);
    },
    [setFilter, setShowTransactions, setShowTransfers],
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
                        checked={isCompactTable}
                        onCheckedChange={(v) => setIsCompactTable(v)}
                      >
                        Compact mode
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={showTransactions}
                    onCheckedChange={handleTransactionVisibilityToggle}
                  >
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
                    checked={transactionFilters.type === TransactionType.Income || !transactionFilters.type}
                    onCheckedChange={() =>
                      handleTransactionTypeChange(
                        transactionFilters.type === TransactionType.Income ? undefined : TransactionType.Income,
                      )
                    }
                  >
                    <ArrowDownCircle className="mr-2 h-4 w-4 text-success" /> Income
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={transactionFilters.type === TransactionType.Expense || !transactionFilters.type}
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
                setCustomTimeframe={setCustomTimeframe}
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
              value={selectedPreset}
              onValueChange={(value) => {
                setSelectedPreset(value);
                setCustomTimeframe(null);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {timePresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
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
        setCustomTimeframe={setCustomTimeframe}
      />
    </FullHeightPageContent>
  );
};

export default DailyLedgerPage;
