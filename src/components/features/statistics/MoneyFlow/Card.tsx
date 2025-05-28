import { BarChart, Calendar as CalendarIcon, Calendar } from 'lucide-react';
import moment from 'moment';
import React, { memo, useMemo, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
import Chart from '@/components/features/statistics/MoneyFlow/Chart';
import ConfigurationMenu from '@/components/features/statistics/MoneyFlow/ConfigurationMenu';
import MoneyFlowSkeleton from '@/components/features/statistics/MoneyFlow/Skeleton';
import SummaryItem from '@/components/features/statistics/MoneyFlow/SummaryItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { PERIOD_OPTIONS, TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { useMoneyFlow } from '@/hooks/statistics/useMoneyFlowStatistics';
import { cn } from '@/lib/utils';
import { ISO8601Period, PeriodValue, TimeframeValue } from '@/types/global';
import { formatShortDate } from '@/utils/formatShortDate';

export const MoneyFlowCard: React.FC<React.ComponentPropsWithoutRef<'div'>> = ({ className }) => {
  const baseCurrency = useBaseCurrency();
  const [timeframe, setTimeframe] = useState<TimeframeValue>(TIMEFRAME_OPTIONS[6].value);
  const [period, setPeriod] = useState<ISO8601Period>(PERIOD_OPTIONS[2].value);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [showIncome, setShowIncome] = useState<boolean>(true);
  const [showExpenses, setShowExpenses] = useState<boolean>(true);
  const [showRevenue, setShowRevenue] = useState<boolean>(false);
  const [showPreviousPeriod, setShowPreviousPeriod] = useState<boolean>(true);
  const [showYearBoundary, setShowYearBoundary] = useState<boolean>(true);
  const [showMonthBoundary, setShowMonthBoundary] = useState<boolean>(true);
  const [showSeasonBoundary, setShowSeasonBoundary] = useState<boolean>(true);

  const selectedTimeframeOption = useMemo(
    () => TIMEFRAME_OPTIONS.find((t) => t.value === timeframe) || TIMEFRAME_OPTIONS[2],
    [timeframe],
  );

  const now = moment();
  const { currentTimeframe, previousTimeframe } = useMemo(() => {
    const currentTimeframe = selectedTimeframeOption.getDateRange(now);
    let previousTimeframe;

    if (selectedTimeframeOption.value === 'WTD') {
      previousTimeframe = {
        after: currentTimeframe.after.clone().subtract(1, 'week').startOf('isoWeek'),
        before: currentTimeframe.after.clone().subtract(1, 'week').endOf('isoWeek'),
      };
    } else if (selectedTimeframeOption.value === 'MTD') {
      previousTimeframe = {
        after: currentTimeframe.after.clone().subtract(1, 'month').startOf('month'),
        before: currentTimeframe.after.clone().subtract(1, 'month').endOf('month'),
      };
    } else if (selectedTimeframeOption.value === 'YTD') {
      previousTimeframe = {
        after: currentTimeframe.after.clone().subtract(1, 'year').startOf('year'),
        before: currentTimeframe.after.clone().subtract(1, 'year').endOf('year'),
      };
    } else {
      const duration = moment.duration(currentTimeframe.before.diff(currentTimeframe.after));
      previousTimeframe = {
        after: currentTimeframe.after.clone().subtract(duration),
        before: currentTimeframe.after.clone().subtract(1, 'second'),
      };
    }

    return { currentTimeframe, previousTimeframe };
  }, [selectedTimeframeOption, now]);

  const {
    availablePeriods,
    transformedData,
    isLoading,
    error,
    revenueChangePercent,
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    incomeChangePercent,
    expensesChangePercent,
    avgPeriodIncome,
    avgPeriodExpenses,
    previousAvgPeriodIncome,
    previousAvgPeriodExpenses,
  } = useMoneyFlow({
    period,
    currentTimeframe,
    previousTimeframe,
    baseCurrency,
  });

  const getPeriodLabel = useMemo(() => {
    const periodOption = PERIOD_OPTIONS.find((option) => option.value === period);
    return periodOption ? periodOption.label.toLowerCase() : 'period';
  }, [period]);

  return (
    <Card
      className={cn(
        'w-full min-h-[550px] flex flex-col transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25',
        className,
      )}
    >
      <CardHeader className="p-4 pb-0 space-y-0.2">
        <div className="flex justify-between items-start">
          <CardTitle className="tracking-tight text-lg font-bold mb-2">Money Flow</CardTitle>
          <ConfigurationMenu
            chartType={chartType}
            setChartType={setChartType}
            showIncome={showIncome}
            setShowIncome={setShowIncome}
            showExpenses={showExpenses}
            setShowExpenses={setShowExpenses}
            showRevenue={showRevenue}
            setShowRevenue={setShowRevenue}
            showPreviousPeriod={showPreviousPeriod}
            setShowPreviousPeriod={setShowPreviousPeriod}
            availablePeriods={availablePeriods}
            showYearBoundary={showYearBoundary}
            showSeasonBoundary={showSeasonBoundary}
            showMonthBoundary={showMonthBoundary}
            setShowMonthBoundary={setShowMonthBoundary}
            setShowYearBoundary={setShowYearBoundary}
            setShowSeasonBoundary={setShowSeasonBoundary}
            period={period}
            setPeriod={(value: PeriodValue) => setPeriod(value)}
            setTimeframe={(value: TimeframeValue) => setTimeframe(value)}
            timeframe={timeframe}
          />
        </div>
        <CardDescription className="sr-only">Money flow statistics for the selected period.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
        <DaterangePickerWithPresets
          after={currentTimeframe.after}
          before={currentTimeframe.before}
          onChange={() => {}}
        >
          <span className="cursor-pointer hover:underline inline-flex flex-row px-4">
            <span className="text-xs flex items-center">
              <CalendarIcon className="inline h-3 w-3 mr-1" />
              {formatShortDate(currentTimeframe.after)} - {formatShortDate(currentTimeframe.before)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground flex items-center">
              {' vs '}
              <Calendar className="inline h-3 w-3 mx-1" />
              {formatShortDate(previousTimeframe.after)} - {formatShortDate(previousTimeframe.before)}
            </span>
          </span>
        </DaterangePickerWithPresets>

        {isLoading && <MoneyFlowSkeleton />}

        {!isLoading && totalRevenue && (
          <div className="flex-grow overflow-hidden flex flex-col mt-2">
            <div className="flex-grow overflow-x-auto overflow-y-hidden h-[375px]">
              {error ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs">
                  Error loading data: {error.message}
                </div>
              ) : (
                transformedData.length > 0 && (
                  <Chart
                    data={transformedData}
                    period={period}
                    chartType={chartType}
                    showIncome={showIncome}
                    showExpenses={showExpenses}
                    showRevenue={showRevenue}
                    currentTimeframe={currentTimeframe}
                    previousTimeframe={previousTimeframe}
                    showPreviousPeriod={showPreviousPeriod}
                    showYearBoundary={showYearBoundary}
                    showSeasonBoundary={showSeasonBoundary}
                    showMonthBoundary={showMonthBoundary}
                  />
                )
              )}
            </div>
          </div>
        )}
      </CardContent>

      {!isLoading && totalRevenue && (
        <CardFooter className="flex flex-col w-full p-0 border-t text-sm">
          {/* Desktop summary row with bottom border */}
          <div className="hidden lg:flex w-full divide-x divide-muted-foreground/20 border-b border-muted px-2">
            {[
              {
                label: 'Total Income',
                value: totalIncome,
                comparisonValue: previousTotalIncome,
                comparisonPercentage: incomeChangePercent,
              },
              {
                label: 'Total Expenses',
                value: totalExpenses,
                comparisonValue: previousTotalExpenses,
                comparisonPercentage: expensesChangePercent,
              },
              {
                label: 'Net Revenue',
                value: totalRevenue,
                comparisonValue: previousTotalRevenue,
                comparisonPercentage: revenueChangePercent,
                colors: true,
                showSign: true,
              },
            ].map((item, index) => (
              <div key={index} className="flex-1 px-3 py-2 flex justify-center items-center">
                <SummaryItem {...item} className="text-center" />
              </div>
            ))}
          </div>

          {/* Dialog + Full-width trigger button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground py-2 px-3 flex justify-center items-center gap-1 rounded-none rounded-b-xl"
              >
                <BarChart className="h-4 w-4" />
                <span>Show Summary</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Summary Statistics</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-3 text-sm">
                <SummaryItem
                  label="Total Income"
                  value={totalIncome}
                  comparisonValue={previousTotalIncome}
                  comparisonPercentage={incomeChangePercent}
                />
                <SummaryItem
                  label="Total Expenses"
                  value={totalExpenses}
                  comparisonValue={previousTotalExpenses}
                  comparisonPercentage={expensesChangePercent}
                />
                <SummaryItem
                  label={`Avg. ${getPeriodLabel} Income`}
                  value={avgPeriodIncome}
                  comparisonValue={previousAvgPeriodIncome}
                  comparisonPercentage={incomeChangePercent}
                />
                <SummaryItem
                  label={`Avg. ${getPeriodLabel} Expenses`}
                  value={avgPeriodExpenses}
                  comparisonValue={previousAvgPeriodExpenses}
                  comparisonPercentage={expensesChangePercent}
                />
                <SummaryItem
                  label="Net Revenue"
                  value={totalRevenue}
                  comparisonValue={previousTotalRevenue}
                  comparisonPercentage={revenueChangePercent}
                  colors
                  showSign
                />
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
};

export default memo(MoneyFlowCard);
