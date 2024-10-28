import { ArrowRightLeftIcon, CalendarIcon, ChevronLeft, ChevronRight, LayoutList, Receipt, Table } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSwipeable } from 'react-swipeable';

import MoneyValue from '@/components/common/MoneyValue';
import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
import DailyList from '@/components/features/daily-ledger/DailyList';
import ListFilters from '@/components/features/daily-ledger/ListFilters';
import TableListing from '@/components/features/daily-ledger/TableListing';
import TableListingSkeleton from '@/components/features/daily-ledger/TableListingSkeleton';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedPreset, setSelectedPreset] = useState<string>('current-week');
  const [customDateRange, setCustomDateRange] = useState<{
    startDate: moment.Moment
    endDate: moment.Moment
  } | null>(null);

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

  useHotkeys('arrowleft', goToPreviousPeriod);
  useHotkeys('arrowright', goToNextPeriod);

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

  return (
    <section className="flex flex-col h-screen md:h-[calc(100vh-2rem)] overflow-hidden pb-16 md:pb-0" {...swipeHandlers}>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
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
              <h4 className="text-xl font-semibold flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0" />
                {formatDateRange(dateRange.startDate, dateRange.endDate)}
              </h4>
              <div className="flex flex-wrap gap-4 text-sm justify-center">
                <div className="flex items-center">
                  <ArrowRightLeftIcon className="mr-1 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium mr-1">{summary.transfersCount}</span>
                  <span className="text-muted-foreground truncate">
                    (<MoneyValue useColors={false} amount={summary.transfersValue} />)
                  </span>
                </div>
                <div className="flex items-center">
                  <Receipt className="mr-1 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium mr-1">{summary.transactionsCount}</span>
                  <span className="text-muted-foreground truncate">
                    (<MoneyValue amount={summary.transactionsValue} />)
                  </span>
                </div>
              </div>
            </div>
          </ResponsiveTooltip>
          <div className="hidden md:block">
            <Button
              onClick={() => setActiveView(activeView === 'table' ? 'list' : 'table')}
              variant="outline"
              size="sm"
            >
              {activeView === 'table' ? (
                <LayoutList className="h-4 w-4" />
              ) : (
                <Table className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <ListFilters
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
      </div>

      {isError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md m-4">
          <p className="font-medium">Error:</p>
          <p>{error?.message || 'An unexpected error occurred.'}</p>
        </div>
      )}

      <div className="flex-grow overflow-hidden">
        {activeView === 'table' && isLoading && (
          <div className="h-full overflow-auto">
            <TableListingSkeleton startDate={dateRange.startDate} endDate={dateRange.endDate} />
          </div>
        )}

        <div className="md:hidden h-full overflow-auto">
          <DailyList
            isLoading={isLoading}
            groupedItems={groupedItems}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>
        <div className="hidden md:block h-full overflow-auto">
          {activeView === 'table' ? (
            <TableListing
              isLoading={isLoading}
              groupedItems={groupedItems}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          ) : (
            <DailyList
              isLoading={isLoading}
              groupedItems={groupedItems}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          )}
        </div>
      </div>

      <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-center gap-2">
          <Button onClick={goToPreviousPeriod} disabled={isLoading} size="icon" variant="outline">
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
          <Button onClick={goToNextPeriod} disabled={isLoading} size="icon" variant="outline">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DailyLedgerPage;
