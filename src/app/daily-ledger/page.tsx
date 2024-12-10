import {
  CalendarArrowDown,
  CalendarArrowUp,
  ArrowRightLeftIcon,
  CalendarIcon,
  ChevronLeft,
  ChevronRight, CreditCardIcon,
  Filter,
  LayoutList,
  ListIcon,
  Plus,
  Receipt,
  RefreshCw,
  Table,
} from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSwipeable } from 'react-swipeable';

import { ROUTES } from '@/constants/routes';
import SummaryBadge from '@/components/common/SummaryBadge';
import MoneyValue from '@/components/common/MoneyValue';
import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { FormType, useForm as useFormContext } from '@/contexts/Form';
import { useHotkeys as useHotkeysContext } from '@/contexts/Hotkeys';
import { useTransactionsAndTransfers } from '@/hooks/useTransactionsAndTransfers';
import TransactionFilters from '@/models/TransactionFilters';
import TransferFilters from '@/models/TransferFilters';


type TimePreset = {
  label: string
  value: string
  getDateRange: () => { startDate: moment.Moment; endDate: moment.Moment }
  step: {
    unit: moment.unitOfTime.DurationConstructor
    amount: number
  }
}

const timePresets: TimePreset[] = [
  {
    label: 'Current Week',
    value: 'current-week',
    getDateRange: () => ({
      startDate: moment().startOf('isoWeek'),
      endDate: moment().endOf('isoWeek'),
    }),
    step: { unit: 'week', amount: 1 },
  },
  {
    label: 'Last Week',
    value: 'last-week',
    getDateRange: () => ({
      startDate: moment().subtract(1, 'week').startOf('isoWeek'),
      endDate: moment().subtract(1, 'week').endOf('isoWeek'),
    }),
    step: { unit: 'week', amount: 1 },
  },
  {
    label: 'Last 2 Weeks',
    value: '2-weeks',
    getDateRange: () => ({
      startDate: moment().subtract(1, 'week').startOf('isoWeek'),
      endDate: moment().endOf('isoWeek'),
    }),
    step: { unit: 'week', amount: 2 },
  },
  {
    label: 'Current Month',
    value: 'current-month',
    getDateRange: () => ({
      startDate: moment().startOf('month'),
      endDate: moment().endOf('month'),
    }),
    step: { unit: 'month', amount: 1 },
  },
  {
    label: 'Last Month',
    value: 'last-month',
    getDateRange: () => ({
      startDate: moment().subtract(1, 'month').startOf('month'),
      endDate: moment().subtract(1, 'month').endOf('month'),
    }),
    step: { unit: 'month', amount: 1 },
  },
  {
    label: 'Last 3 Months',
    value: '3-months',
    getDateRange: () => ({
      startDate: moment().subtract(2, 'month').startOf('month'),
      endDate: moment().endOf('month'),
    }),
    step: { unit: 'month', amount: 3 },
  },
  {
    label: 'Current Year',
    value: 'current-year',
    getDateRange: () => ({
      startDate: moment().startOf('year'),
      endDate: moment().endOf('year'),
    }),
    step: { unit: 'year', amount: 1 },
  },
  {
    label: 'Last Year',
    value: 'last-year',
    getDateRange: () => ({
      startDate: moment().subtract(1, 'year').startOf('year'),
      endDate: moment().subtract(1, 'year').endOf('year'),
    }),
    step: { unit: 'year', amount: 1 },
  },
];

export const DailyLedgerPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'table' | 'list'>('table');
  const [isReversedOrder, setIsReversedOrder] = useState<boolean>(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [showBulkCreate, setShowBulkCreate] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('current-week');
  const [customDateRange, setCustomDateRange] = useState<{
    startDate: moment.Moment
    endDate: moment.Moment
  } | null>(null);
  const { openForm } = useFormContext();
  const { addPageHotkeys, removePageHotkeys } = useHotkeysContext();

  const dateRange = useMemo(() => {
    if (customDateRange) {
      return customDateRange;
    }
    const preset = timePresets.find(p => p.value === selectedPreset);
    return preset ? preset.getDateRange() : timePresets[0].getDateRange();
  }, [selectedPreset, customDateRange]);

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
    initialTransactionFilters: new TransactionFilters(),
    initialTransferFilters: new TransferFilters(),
    updateUrl: false,
    excludeTransfers: true,
  });

  useEffect(() => {
    setFilter('after', dateRange.startDate);
    setFilter('before', dateRange.endDate.clone().endOf('day'));
  }, [dateRange, setFilter]);

  const onAddTransaction = () => openForm(FormType.Transaction);

  const navigatePeriod = useCallback((direction: 'next' | 'previous') => {
    const preset = timePresets.find(p => p.value === selectedPreset);
    if (preset) {
      const { step } = preset;
      const newStartDate = dateRange.startDate.clone()[direction === 'next' ? 'add' : 'subtract'](step.amount, step.unit);
      const newEndDate = dateRange.endDate.clone()[direction === 'next' ? 'add' : 'subtract'](step.amount, step.unit);
      setCustomDateRange({
        startDate: newStartDate,
        endDate: newEndDate,
      });
    } else if (customDateRange) {
      const duration = customDateRange.endDate.diff(customDateRange.startDate);
      if (direction === 'next') {
        setCustomDateRange({
          startDate: customDateRange.endDate.clone().add(1, 'day'),
          endDate: customDateRange.endDate.clone().add(1, 'day').add(duration, 'milliseconds'),
        });
      } else {
        setCustomDateRange({
          startDate: customDateRange.startDate.clone().subtract(duration, 'milliseconds'),
          endDate: customDateRange.startDate.clone().subtract(1, 'millisecond'),
        });
      }
    }
  }, [dateRange, selectedPreset, customDateRange]);

  const goToNextPeriod = useCallback(() => navigatePeriod('next'), [navigatePeriod]);
  const goToPreviousPeriod = useCallback(() => navigatePeriod('previous'), [navigatePeriod]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNextPeriod,
    onSwipedRight: goToPreviousPeriod,
    trackMouse: true,
  });

  const formatDateRange = (startDate: moment.Moment, endDate: moment.Moment) => {
    if (startDate.isSame(endDate, 'month')) {
      return `${startDate.format('MMM D')}-${endDate.format('D, YYYY')}`;
    } else if (startDate.isSame(endDate, 'year')) {
      return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    } else {
      return `${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`;
    }
  };

  const summary = useMemo(() => {
    if (!groupedItems) return {
      transactionsCount: 0,
      transfersCount: 0,
      transactionsValue: 0,
      transfersValue: 0,
    };

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
  }, [groupedItems]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;

    if (dateRange.startDate.format(BACKEND_DATE_FORMAT) !== moment().startOf('week').format(BACKEND_DATE_FORMAT) ||
      dateRange.endDate.format(BACKEND_DATE_FORMAT) !== moment().endOf('week').format(BACKEND_DATE_FORMAT)) count++;
    if (transactionFilters.categories.length > 0) count++;
    if (transactionFilters.accounts.length > 0 || transferFilters.accounts.length > 0) count++;
    if (transactionFilters.amountRange[0] !== undefined || transactionFilters.amountRange[1] !== undefined) count++;
    if (transactionFilters.isDraft !== null) count++;

    return count;
  }, [transactionFilters, transferFilters, dateRange]);

  useHotkeys('arrowleft', goToPreviousPeriod);
  useHotkeys('arrowright', goToNextPeriod);
  useHotkeys('b', () => setShowBulkCreate(!showBulkCreate));
  useHotkeys('f', () => setIsFiltersOpen(!isFiltersOpen), {}, [isFiltersOpen]);

  useEffect(() => {
    const hotkeys = [{
      windows: 'ArrowLeft',
      mac: 'ArrowLeft',
      description: 'Go to previous period',
    }, {
      windows: 'ArrowRight',
      mac: 'ArrowRight',
      description: 'Go to next period',
    }, {
      windows: 'B',
      mac: 'B',
      description: 'Toggle Bulk Create',
    }, {
      windows: 'F',
      mac: 'F',
      description: 'Toggle Filters Dialog',
    }];
    addPageHotkeys('Daily Ledger', hotkeys);

    return () => {
      removePageHotkeys('Daily Ledger');
    };
  }, [addPageHotkeys, removePageHotkeys]);

  return (
    <FullHeightPageContent {...swipeHandlers}>
      <Card className="shadow-none md:shadow-lg rounded-lg overflow-hidden border-0 md:border md:bg-card md:text-card-foreground h-full flex flex-col">
        <CardHeader className="flex flex-col space-y-4 p-0 md:p-6 bg-background md:bg-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <ResponsiveTooltip
              openDelay={1}
              desktopComponent="hovercard"
              contentClassName="bg-transparent border-none shadow-none"
              triggerClassName="cursor-help"
              content={
                <YearDoughnutTimeframeDisplayChart
                  data={[{
                    after: dateRange.startDate,
                    before: dateRange.endDate,
                  }]} />
              }
            >
              <div className="flex flex-col">
                <CardTitle className="text-xl font-semibold flex items-center space-x-4">
                  <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
                  {formatDateRange(dateRange.startDate, dateRange.endDate)}
                  <SummaryBadge icon={ROUTES.TRANSACTION_LIST.icon} count={summary.transactionsCount} value={summary.transactionsValue} />
                  <SummaryBadge useColors={false} icon={ROUTES.TRANSFER_LIST.icon} count={summary.transfersCount} value={summary.transfersValue} />
                </CardTitle>
              </div>
            </ResponsiveTooltip>
            <div className="flex flex-wrap justify-between gap-2">
              {activeView === 'table' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hidden md:flex"
                      onClick={() => setIsReversedOrder(!isReversedOrder)}>
                      {isReversedOrder && (<CalendarArrowDown className="h-4 w-4" />)}
                      {!isReversedOrder && (<CalendarArrowUp className="h-4 w-4" />)}
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
                    variant="outline"
                    className="hidden md:flex"
                    onClick={() => setActiveView(activeView === 'table' ? 'list' : 'table')}>
                    {activeView === 'table' && <LayoutList className="h-4 w-4" />}
                    {activeView === 'list' && <Table className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle {activeView === 'table' ? 'List' : 'Table'} View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={onAddTransaction}>
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">New Transaction</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Transaction</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex"
                    onClick={() => setShowBulkCreate(!showBulkCreate)}>
                    <ListIcon className="h-4 w-4" />
                    <span className="sr-only">Bulk Create</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bulk Create</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" onClick={refetch}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Filter</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 px-1 py-0.5 text-[0.6rem] min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filters</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-background md:bg-card flex-grow overflow-hidden">
          <ScrollArea className="h-full">
            {showBulkCreate && (
              <div className="border-b bg-muted/50 supports-[backdrop-filter]:bg-muted/50">
                <div className="px-4 py-3">
                  <BulkCreateTableForm />
                </div>
              </div>
            )}

            {isError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md m-4">
                <p className="font-medium">Error:</p>
                <p>{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            )}

            <div className="flex-grow overflow-hidden">
              {/* Desktop View */}
              <div className="hidden md:block h-full overflow-auto">
                {(activeView === 'table') && (
                  <>
                    {isLoading && (
                      <TableListingSkeleton
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                      />
                    )}
                    {(!isLoading) && (
                      <TableListing
                        isLoading={isLoading}
                        groupedItems={groupedItems}
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        isReversedOrder={isReversedOrder}
                      />
                    )}
                  </>
                )}
                {(activeView === 'list') && (
                  <DailyList
                    isReversedOrder={isReversedOrder}
                    isLoading={isLoading}
                    groupedItems={groupedItems}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                  />
                )}
              </div>

              {/* Mobile View (always uses DailyList) */}
              <div className="md:hidden h-full overflow-auto">
                <DailyList
                  isLoading={isLoading}
                  groupedItems={groupedItems}
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-end gap-2">
            <Button size="icon" variant="outline" onClick={goToPreviousPeriod} disabled={isLoading}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Select
              value={selectedPreset}
              onValueChange={(value) => {
                setSelectedPreset(value);
                setCustomDateRange(null);
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
        dateRange={dateRange}
        setCustomDateRange={setCustomDateRange}
      />
    </FullHeightPageContent>
  );
};

export default DailyLedgerPage;
