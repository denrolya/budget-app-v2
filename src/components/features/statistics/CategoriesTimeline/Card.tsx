import { Calendar as CalendarIcon } from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useCallback, useEffect, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import Chart from '@/components/features/statistics/CategoriesTimeline/Chart';
import ConfigurationMenu from '@/components/features/statistics/CategoriesTimeline/ConfigurationMenu';
import TransactionsDrawer from '@/components/features/statistics/CategoriesTimeline/TransactionsDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimelineStatistics } from '@/hooks/statistics/useTimelineStatisticsRequest';
import { UseTimeframeControl, useTimeframeControl } from '@/hooks/useTimeframeControl';
import { cn } from '@/lib/utils';
import { Timeframe } from '@/types/global';
import { formatRange } from '@/utils/formatShortDate';

type TransactionsTimeframe = {
  after: Moment;
  before: Moment;
} | null;

interface ChartEvent {
  activeLabel?: string;
  activePayload?: unknown[];
}

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  controlledTimeframe: UseTimeframeControl;
}

export const CategoriesTimelineCard: React.FC<Props> = ({
                                                          controlledTimeframe,
                                                          className,
                                                        }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([1, 6, 73, 147]);
  const [debouncedCategories, setDebouncedCategories] = useState<number[]>(selectedCategories);
  const [showExpenseReference, setShowExpenseReference] = useState<boolean>(false);
  const [showIncomeReference, setShowIncomeReference] = useState<boolean>(false);
  const [showComparisonInTooltip, setShowComparisonInTooltip] = useState<boolean>(true);
  const [useSeparateAxisForTotals, setUseSeparateAxisForTotals] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedTimeframeForTransactions, setSelectedTimeframeForTransactions] = useState<TransactionsTimeframe>(null);
  const [fetchTransactionsFromSubcategories, setFetchTransactionsFromSubcategories] = useState<boolean>(false);


  const fallback = useTimeframeControl({
    defaultPeriod: 'P1M',
    enablePreviousTimeframe: false,
    enablePeriod: true,
    defaultTimeframe: {
      after: moment().subtract(1, 'year').startOf('year'),
      before: moment(),
    },
  });

  const {
    timeframe = fallback.timeframe,
    setTimeframe = fallback.setTimeframe,
    period = fallback.period,
    setPeriod = fallback.setPeriod,
  } = controlledTimeframe ?? {};

  const { data, isLoading, error } = useTimelineStatistics(
    {
      period,
      after: timeframe.after,
      before: timeframe.before,
      categories: debouncedCategories,
      fetchIncomeReference: showIncomeReference,
      fetchExpenseReference: showExpenseReference,
    },
    [period, debouncedCategories],
  );

  const debouncedSetCategories = useCallback((newCategories: number[]) => {
    const timeoutId = setTimeout(() => {
      setDebouncedCategories(newCategories);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

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

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after ? range.after.startOf('day') : timeframe.after,
        before: range.before ? range.before.endOf('day') : timeframe.before,
      });
    },
    [setTimeframe],
  );

  return (
    <>
      <Card
        className={cn(
          'w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25',
          className,
        )}
      >
        <CardHeader className="p-4 pb-0 space-y-0.2">
          <div className="flex justify-between items-start">
            <CardTitle className="tracking-tight text-lg font-bold mb-2">Categories Timeline</CardTitle>
            <ConfigurationMenu
              chartType={chartType}
              setChartType={setChartType}
              selectedPeriod={period}
              setSelectedPeriod={setPeriod}
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
          {!controlledTimeframe?.timeframe?.after && (
            <DaterangePickerWithPresets
              after={timeframe.after}
              before={timeframe.before}
              onChange={handleTimeframeChange}
            >
              <span className="cursor-pointer hover:underline inline-flex flex-row px-4">
                <span className="text-xs flex items-center">
                  <CalendarIcon className="inline h-3 w-3 mr-1" />
                  {formatRange(timeframe)}
                </span>
              </span>
            </DaterangePickerWithPresets>
          )}
          <div className="flex-grow overflow-hidden flex flex-col mt-2">
            <div className="flex-grow overflow-x-auto overflow-y-hidden h-[390px]">
              {isLoading && <Skeleton className="h-full w-full" />}
              {!isLoading && !error && data && (
                <Chart
                  chartType={chartType}
                  data={data}
                  selectedPeriod={period}
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

export default CategoriesTimelineCard;
