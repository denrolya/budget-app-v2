import { Calendar as CalendarIcon } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useEffect, useState } from 'react';

import Chart from '@/components/features/statistics/CategoriesTimeline/Chart';
import ConfigurationMenu from '@/components/features/statistics/CategoriesTimeline/ConfigurationMenu';
import TransactionsDrawer from '@/components/features/statistics/CategoriesTimeline/TransactionsDrawer';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { useTimelineStatistics } from '@/hooks/statistics/useTimelineStatisticsRequest';
import { useScreenSize } from '@/hooks/useScreenSize';
import { cn } from '@/lib/utils';
import { ISO8601Period, Timeframe } from '@/types/global';
import { formatShortDate } from '@/utils/formatShortDate';

type TransactionsTimeframe = {
  after: Moment;
  before: Moment;
} | null;

interface ChartEvent {
  activeLabel?: string;
  activePayload?: unknown[];
}

export const CategoriesTimelineCard: React.FC<React.ComponentPropsWithoutRef<'div'>> = ({ className }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedPeriod, setSelectedPeriod] = useState<ISO8601Period>('P1Y');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([1, 6, 73, 147]);
  const [debouncedCategories, setDebouncedCategories] = useState<number[]>(selectedCategories);
  const [showExpenseReference, setShowExpenseReference] = useState<boolean>(true);
  const [showIncomeReference, setShowIncomeReference] = useState<boolean>(true);
  const [showComparisonInTooltip, setShowComparisonInTooltip] = useState<boolean>(true);
  const [useSeparateAxisForTotals, setUseSeparateAxisForTotals] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedTimeframeForTransactions, setSelectedTimeframeForTransactions] = useState<TransactionsTimeframe>(null);
  const [fetchTransactionsFromSubcategories, setFetchTransactionsFromSubcategories] = useState<boolean>(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState<boolean>(false);
  const isDesktop = useScreenSize();
  const [timeframe, setTimeframe] = useState<Timeframe>({
    after: moment().subtract(10, 'year'),
    before: moment(),
  });

  const { data, isLoading, error } = useTimelineStatistics(
    {
      after: timeframe.after,
      before: timeframe.before,
      period: selectedPeriod,
      categories: debouncedCategories,
      fetchIncomeReference: showIncomeReference,
      fetchExpenseReference: showExpenseReference,
    },
    [selectedPeriod, debouncedCategories],
  );

  const debouncedSetCategories = useCallback(
    (newCategories: number[]) => {
      const timeoutId = setTimeout(() => {
        setDebouncedCategories(newCategories);
      }, 1000);
      return () => clearTimeout(timeoutId);
    },
    [],
  );

  useEffect(() => {
    debouncedSetCategories(selectedCategories);
  }, [selectedCategories, debouncedSetCategories]);

  const onChartClick = (chartEvent: ChartEvent) => {
    if (!chartEvent.activeLabel) {
      return;
    }

    const clickedDate = moment(chartEvent.activeLabel);

    let startDate: Moment;
    let endDate: Moment;

    switch (selectedPeriod) {
      case 'P1D':
        startDate = clickedDate.clone().startOf('day');
        endDate = clickedDate.clone().endOf('day');
        break;

      case 'P1W':
        startDate = clickedDate.clone().startOf('isoWeek');
        endDate = clickedDate.clone().endOf('isoWeek');
        break;

      case 'P1M':
      case 'P3M':
        startDate = clickedDate.clone().startOf('month');
        endDate = clickedDate.clone().endOf('month');
        break;

      case 'P1Y':
        startDate = clickedDate.clone().startOf('year');
        endDate = clickedDate.clone().endOf('year');
        break;

      default:
        console.error('Unsupported period:', selectedPeriod);
        return;
    }

    setSelectedTimeframeForTransactions({
      after: startDate,
      before: endDate,
    });

    setIsDrawerOpen(true);
  };

  const handleTimeframeChange = useCallback((range: Timeframe) => {
    setTimeframe({
      after: range.after ? moment(range.after).startOf('day') : timeframe.after,
      before: range.before ? moment(range.before).endOf('day') : timeframe.before,
    });
  }, [setTimeframe]);

  return (
    <>
      <Card className={cn('w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25', className)}>
        <CardHeader className="p-4 pb-0 space-y-0.2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-medium">Categories Timeline</CardTitle>
            <ConfigurationMenu
              chartType={chartType}
              setChartType={setChartType}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              showExpenseReference={showExpenseReference}
              setShowExpenseReference={setShowExpenseReference}
              showIncomeReference={showIncomeReference}
              setShowIncomeReference={setShowIncomeReference}
              showComparisonInTooltip={showComparisonInTooltip}
              setShowComparisonInTooltip={setShowComparisonInTooltip}
              fetchTransactionsFromSubcategories={fetchTransactionsFromSubcategories}
              setFetchTransactionsFromSubcategories={setFetchTransactionsFromSubcategories}
              useSeparateAxisForTotals={useSeparateAxisForTotals}
              setUseSeparateAxisForTotals={setUseSeparateAxisForTotals}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <span className="cursor-pointer hover:underline inline-flex flex-row px-4">
                <span className="text-xs flex items-center">
                  <CalendarIcon className="inline h-3 w-3 mr-1" />
                  {formatShortDate(timeframe.after)} - {formatShortDate(timeframe.before)}
                </span>
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={timeframe.after?.toDate() || moment().toDate()}
                selected={{
                  from: timeframe.after?.toDate(),
                  to: timeframe.before?.toDate(),
                }}
                onSelect={({ from, to }) => handleTimeframeChange({ after: from, before: to })}
                numberOfMonths={isDesktop ? 2 : 1}
                className="border-b"
              />
              <div className="p-3 space-y-3">
                <h4 className="font-medium text-sm text-primary">Presets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {DASHBOARD_TIMEFRAME_OPTIONS.map(({ label, range }) => (
                    <Button
                      key={label}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => handleTimeframeChange(range)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex-grow overflow-hidden flex flex-col mt-2">
            <div className="flex-grow overflow-x-auto overflow-y-hidden h-[390px]">
              {isLoading && <Skeleton className="h-full w-full" />}
              {!isLoading && !error && data && (
                <Chart
                  chartType={chartType}
                  data={data}
                  selectedPeriod={selectedPeriod}
                  showComparisonInTooltip={showComparisonInTooltip}
                  onClick={onChartClick}
                  useSeparateAxisForTotals={useSeparateAxisForTotals}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTimeframeForTransactions && (
        <TransactionsDrawer
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          selectedCategories={debouncedCategories}
          timeframe={selectedTimeframeForTransactions}
          fetchFromSubcategories={fetchTransactionsFromSubcategories}
        />
      )}
    </>
  );
};

interface StatisticItemProps {
  label: string;
  value: string;
}

const StatisticItem: React.FC<StatisticItemProps> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-lg font-bold">{value}</span>
  </div>
);

export default CategoriesTimelineCard;

