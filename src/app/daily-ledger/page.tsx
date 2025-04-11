import {
  CalendarArrowDown,
  CalendarArrowUp,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  FoldVertical,
  LayoutList,
  ListIcon,
  Plus,
  RefreshCw,
  RotateCcw,
  Table2,
  UnfoldVertical,
} from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSwipeable } from 'react-swipeable';

import { useIsMobile } from '@/hooks/useMobile';
import SummaryBadge from '@/components/common/SummaryBadge';
import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
import CompactInlineFilters from '@/components/features/daily-ledger/CompactInlineFilters';
import DailyList from '@/components/features/daily-ledger/DailyList';
import ListFiltersSheet from '@/components/features/daily-ledger/ListFiltersSheet';
import TableListing from '@/components/features/daily-ledger/TableListing';
import TableListingSkeleton from '@/components/features/daily-ledger/TableListingSkeleton';
import BulkCreateTableForm from '@/components/features/transactions/BulkCreateTableForm';
import FullHeightPageContent from '@/components/layout/FullHeightPageContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { ROUTES } from '@/constants/routes';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';

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

export const DailyLedgerPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<'table' | 'list'>('table');
  const [isReversedOrder, setIsReversedOrder] = useState<boolean>(true);
  const [isCompactTable, setIsCompactTable] = useState<boolean>(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [showBulkCreate, setShowBulkCreate] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('30-days');
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
    transactionFilters,
    transferFilters,
    showTransactions,
    setShowTransactions,
    showTransfers,
    setShowTransfers,
    refetch,
  } = useTransactionsAndTransfers({
    updateUrl: true,
    excludeTransfers: true,
  });

  useEffect(() => {
    setFilter('after', timeframe.after);
    setFilter('before', timeframe.before.clone().endOf('day'));
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

  const formatTimeframe = (after: moment.Moment, before: moment.Moment) => {
    if (after.isSame(before, 'month')) {
      return `${after.format('MMM D')}-${before.format('D, YYYY')}`;
    } else if (after.isSame(before, 'year')) {
      return `${after.format('MMM D')} - ${before.format('MMM D, YYYY')}`;
    } else {
      return `${after.format('MMM D, YYYY')} - ${before.format('MMM D, YYYY')}`;
    }
  };

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

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;

    if (
      timeframe.after.format(BACKEND_DATE_FORMAT) !== moment().startOf('week').format(BACKEND_DATE_FORMAT) ||
      timeframe.before.format(BACKEND_DATE_FORMAT) !== moment().endOf('week').format(BACKEND_DATE_FORMAT)
    )
      count++;
    if (transactionFilters.categories.length > 0) count++;
    if (transactionFilters.accounts.length > 0 || transferFilters.accounts.length > 0) count++;
    if (transactionFilters.amountRange[0] !== undefined || transactionFilters.amountRange[1] !== undefined) count++;
    if (transactionFilters.isDraft !== null) count++;

    return count;
  }, [transactionFilters, transferFilters, timeframe]);

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
    setFilter('amountRange', [undefined, undefined]);
    setFilter('categories', []);
    setFilter('accounts', []);
    setFilter('isDraft', null);
    setFilter('type', undefined);
    setCustomTimeframe(null);
    setShowTransactions(true);
    setShowTransfers(true);
  };

  return (
    <FullHeightPageContent {...swipeHandlers} className="flex flex-col justify-between">
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="flex flex-col space-y-4 p-0 md:p-3 bg-background md:bg-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <ResponsiveTooltip
              openDelay={1}
              desktopComponent="hovercard"
              contentClassName="bg-transparent border-none shadow-none"
              triggerClassName="cursor-help"
              content={
                <YearDoughnutTimeframeDisplayChart
                  data={[
                    {
                      after: timeframe.after,
                      before: timeframe.before,
                    },
                  ]}
                />
              }
            >
              <div className="flex flex-col">
                <CardTitle className="text-xl font-semibold flex items-center space-x-4">
                  <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
                  {formatTimeframe(timeframe.after, timeframe.before)}
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
                </CardTitle>
              </div>
            </ResponsiveTooltip>
            <div className="flex flex-wrap justify-between gap-2">
              {activeView === 'table' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hidden md:flex"
                      onClick={() => setIsReversedOrder(!isReversedOrder)}
                    >
                      {isReversedOrder && <CalendarArrowDown className="h-4 w-4" />}
                      {!isReversedOrder && <CalendarArrowUp className="h-4 w-4" />}
                      <span className="sr-only">Toggle ordering</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle ordering</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hidden md:flex data-[state=active]:bg-accent/20 data-[state=active]:ring-2 data-[state=active]:ring-accent"
                    onClick={() => setActiveView(activeView === 'table' ? 'list' : 'table')}
                  >
                    {activeView === 'table' && <LayoutList className="h-4 w-4" />}
                    {activeView === 'list' && <Table2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle {activeView === 'table' ? 'List' : 'Table'} View</TooltipContent>
              </Tooltip>
              {activeView === 'table' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle className="hidden md:flex" pressed={isCompactTable} onPressedChange={setIsCompactTable}>
                      {isCompactTable && <UnfoldVertical className="h-4 w-4" />}
                      {!isCompactTable && <FoldVertical className="h-4 w-4" />}
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>Toggle compact view</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onAddTransaction}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">New Transaction</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    className="hidden md:flex"
                    pressed={showBulkCreate}
                    onClick={() => setShowBulkCreate(!showBulkCreate)}
                  >
                    <ListIcon className="h-4 w-4" />
                    <span className="sr-only">Bulk Create</span>
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={refetch}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle className="relative" pressed={isFiltersOpen} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Filter</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 px-1 py-0.5 text-[0.6rem] min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Filters</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleResetFilters}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all filters</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="mb-4">
            {!isMobile && (
              <CompactInlineFilters
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
