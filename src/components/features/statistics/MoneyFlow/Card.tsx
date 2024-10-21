import cn from 'classnames';
import {
  ArrowUpDownIcon,
  BarChartIcon,
  Calendar,
  DollarSignIcon,
  InfoIcon,
  LineChartIcon,
  PieChartIcon,
  TrendingUpIcon,
} from 'lucide-react';
import moment from 'moment';
import React, { memo, useMemo, useState } from 'react';

import ArrowChangeIndicator from '@/components/common/ArrowChangeIndicator';
import MoneyValue from '@/components/common/MoneyValue';
import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
import Chart from '@/components/features/statistics/MoneyFlow/Chart';
import SummaryItem from '@/components/features/statistics/MoneyFlow/SummaryItem';
import VeryInformativeTooltip from '@/components/features/statistics/MoneyFlow/VeryInformativeTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { INTERVAL_OPTIONS, TIMEFRAME_OPTIONS, TimeframeOption } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { useMoneyFlow } from '@/hooks/statistics/useMoneyFlowStatistics';
import { formatShortDate } from '@/utils/formatShortDate';

interface Props {
  className?: string;
}

export const MoneyFlowSkeleton: React.FC = () => (
  <div className="w-full">
    <div className="mb-2">
      <Skeleton className="h-6 w-32 mb-1" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="h-[250px] mb-2">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-2">
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  </div>
);

export const MoneyFlowCard: React.FC<Props> = ({ className }) => {
  const baseCurrency = useBaseCurrency();
  const [timeframe, setTimeframe] = useState<TimeframeOption['value']>(TIMEFRAME_OPTIONS[6].value);
  const [interval, setInterval] = useState(INTERVAL_OPTIONS[2].value);
  const [isBarChart, setIsBarChart] = useState<boolean>(true);
  const [showRevenue, setShowRevenue] = useState<boolean>(false);

  const selectedTimeframeOption = useMemo(() =>
      TIMEFRAME_OPTIONS.find((t) => t.value === timeframe) || TIMEFRAME_OPTIONS[2]
    , [timeframe]);

  const now = moment();
  const { currentTimeframe, previousTimeframe } = useMemo(() => {
    const currentTimeframe = selectedTimeframeOption.getDateRange(now);
    let previousTimeframe;

    if (selectedTimeframeOption.value === 'WTD') {
      previousTimeframe = {
        after: currentTimeframe.after.clone().subtract(1, 'isoWeek').startOf('isoWeek'),
        before: currentTimeframe.after.clone().subtract(1, 'isoWeek').endOf('isoWeek'),
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
    availableIntervals,
    transformedData,
    isLoading,
    error,
    revenueChange,
    revenueChangePercent,
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    incomeChange,
    incomeChangePercent,
    expensesChange,
    expensesChangePercent,
    avgIntervalIncome,
    avgIntervalExpenses,
    previousAvgIntervalIncome,
    previousAvgIntervalExpenses,
  } = useMoneyFlow({
    interval,
    currentTimeframe,
    previousTimeframe,
    baseCurrency,
  });

  const getIntervalLabel = useMemo(() => {
    const intervalOption = INTERVAL_OPTIONS.find(option => option.value === interval);
    return intervalOption ? intervalOption.label.toLowerCase() : 'interval';
  }, [interval]);

  const getSummaryText = () => {
    const formatChange = (change: number, percent: number) => `${change >= 0 ? 'up' : 'down'} ${Math.abs(percent).toFixed(0)}%`;
    return `Income ${formatChange(incomeChange, incomeChangePercent)}, Expenses ${formatChange(expensesChange, expensesChangePercent)}, Revenue ${formatChange(revenueChange, revenueChangePercent)}, Income per Expense: ${(totalIncome / totalExpenses).toFixed(2)}, Expense Ratio: ${((totalExpenses / totalIncome) * 100).toFixed(1)}%`;
  };

  return (
    <Card className={cn('w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25', className)}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <ResponsiveTooltip
              openDelay={1}
              desktopComponent="hovercard"
              contentClassName="w-full max-w-sm p-4 sm:w-96 bg-transparent border-none shadow-none"
              triggerClassName="cursor-help"
              content={
                <span>
                  <YearDoughnutTimeframeDisplayChart data={[previousTimeframe, currentTimeframe]} />
                </span>
              }
            >
              <>
                <h3 className="text-base font-medium">Money Flow</h3>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {formatShortDate(currentTimeframe.after)} - {formatShortDate(currentTimeframe.before)}
                </span>
              </>
            </ResponsiveTooltip>
          </div>
          <div className="flex items-center gap-1">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[60px] h-7 text-xs">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-[70px] h-7 text-xs">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {availableIntervals.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsBarChart(!isBarChart)}
              aria-label={isBarChart ? 'Switch to line chart' : 'Switch to bar chart'}
            >
              {isBarChart ? <LineChartIcon className="h-3 w-3" /> : <BarChartIcon className="h-3 w-3" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setShowRevenue(!showRevenue)}
              aria-label={showRevenue ? 'Hide revenue' : 'Show revenue'}
            >
              <PieChartIcon className={cn('h-3 w-3', showRevenue ? 'text-primary' : 'text-muted-foreground')} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <MoneyFlowSkeleton />
        ) : totalRevenue ? (
          <>
            <ResponsiveTooltip
              openDelay={0}
              desktopComponent="hovercard"
              contentClassName="w-full max-w-sm p-4 sm:w-96"
              triggerClassName="cursor-help inline-block"
              content={
                <VeryInformativeTooltip
                  currentTimeframe={currentTimeframe}
                  previousTimeframe={previousTimeframe}
                  totalIncome={totalIncome}
                  totalExpenses={totalExpenses}
                  totalRevenue={totalRevenue}
                  previousTotalIncome={previousTotalIncome}
                  previousTotalExpenses={previousTotalExpenses}
                  previousTotalRevenue={previousTotalRevenue}
                  incomeChange={incomeChange}
                  incomeChangePercent={incomeChangePercent}
                  expensesChange={expensesChange}
                  expensesChangePercent={expensesChangePercent}
                  revenueChange={revenueChange}
                  revenueChangePercent={revenueChangePercent}
                />
              }
            >
              <div className="inline-flex flex-col items-start mb-2">
                <h2 className="text-xl sm:text-2xl font-bold">
                  <MoneyValue showSign useColors amount={totalRevenue} />
                </h2>
                <span className={cn('flex items-center text-xs', {
                  'text-success': revenueChange >= 0,
                  'text-destructive': revenueChange < 0,
                })}>
                  {getSummaryText()}
                  <ArrowChangeIndicator className="ml-1" value={revenueChange} />
                  <InfoIcon className="h-3 w-3 ml-1" />
                </span>
              </div>
            </ResponsiveTooltip>

            <div className="overflow-x-auto">
              {error ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs">
                  Error loading data: {error.message}
                </div>
              ) : transformedData.length > 0 && (
                <Chart
                  data={transformedData}
                  interval={interval}
                  isBarChart={isBarChart}
                  showRevenue={showRevenue}
                  currentTimeframe={currentTimeframe}
                  previousTimeframe={previousTimeframe}
                />
              )}
            </div>
          </>
        ) : null}
      </CardContent>

      {/* Stats section */}
      <CardFooter className={cn('flex flex-col gap-4 sm:gap-6 lg:flex-row lg:justify-between p-3 transition-all border-t duration-300 ease-in-out overflow-hidden')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:flex-1 lg:grid-cols-4 w-full">
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
            label={`Avg. ${getIntervalLabel} Income`}
            value={avgIntervalIncome}
            comparisonValue={previousAvgIntervalIncome}
            comparisonPercentage={incomeChangePercent}
          />
          <SummaryItem
            label={`Avg. ${getIntervalLabel} Expenses`}
            value={avgIntervalExpenses}
            comparisonValue={previousAvgIntervalExpenses}
            comparisonPercentage={expensesChangePercent}
          />
        </div>
        <div className="w-full lg:w-1/5">
          <SummaryItem
            colors
            showSign
            label="Net Revenue"
            className="h-full"
            value={totalRevenue}
            comparisonValue={previousTotalRevenue}
            comparisonPercentage={revenueChangePercent}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default memo(MoneyFlowCard);
