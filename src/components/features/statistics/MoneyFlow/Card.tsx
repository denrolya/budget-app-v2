import cn from 'classnames';
import { Calendar } from 'lucide-react';
import moment from 'moment';
import React, { memo, useMemo, useState } from 'react';

import YearDoughnutTimeframeDisplayChart from '@/components/common/YearDoughnutTimeframeDisplayChart';
import Chart from '@/components/features/statistics/MoneyFlow/Chart';
import ConfigurationMenu from '@/components/features/statistics/MoneyFlow/ConfigurationMenu';
import MoneyFlowSkeleton from '@/components/features/statistics/MoneyFlow/Skeleton';
import SummaryItem from '@/components/features/statistics/MoneyFlow/SummaryItem';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { PERIOD_OPTIONS, TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { useMoneyFlow } from '@/hooks/statistics/useMoneyFlowStatistics';
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


  const selectedTimeframeOption = useMemo(() => TIMEFRAME_OPTIONS
      .find((t) => t.value === timeframe) || TIMEFRAME_OPTIONS[2],
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
    const periodOption = PERIOD_OPTIONS.find(option => option.value === period);
    return periodOption ? periodOption.label.toLowerCase() : 'period';
  }, [period]);

  return (
    <Card className={cn('w-full min-h-[550px] flex flex-col transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25', className)}>
      <CardHeader className="p-4 space-y-0.2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">Money Flow</CardTitle>
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
            period={period}
            setPeriod={(value: PeriodValue) => setPeriod(value)}
            setTimeframe={(value: TimeframeValue) => setTimeframe(value)}
            timeframe={timeframe}
          />
        </div>
        <CardDescription className="sr-only">Money flow statistics for the selected period.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
        <ResponsiveTooltip
          openDelay={1}
          desktopComponent="hovercard"
          contentClassName="bg-transparent border-none shadow-none"
          triggerClassName="cursor-help px-1 inline-flex flex-row"
          content={<YearDoughnutTimeframeDisplayChart data={[previousTimeframe, currentTimeframe]} />}
        >
          <span className="text-xs flex items-center">
            <Calendar className="inline h-3 w-3 mr-1" />
            {formatShortDate(currentTimeframe.after)} - {formatShortDate(currentTimeframe.before)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground flex items-center">
            {' vs '}
            <Calendar className="inline h-3 w-3 mx-1" />
            {formatShortDate(previousTimeframe.after)} - {formatShortDate(previousTimeframe.before)}
          </span>
        </ResponsiveTooltip>

        {isLoading && <MoneyFlowSkeleton />}

        {(!isLoading && totalRevenue) && (
          <div className="flex-grow overflow-hidden flex flex-col mt-2">
            <div className="flex-grow overflow-x-auto overflow-y-hidden h-[375px]">
              {error ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs">
                  Error loading data: {error.message}
                </div>
              ) : transformedData.length > 0 && (
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
                />
              )}
            </div>
          </div>
        )}

      </CardContent>

      {(!isLoading && totalRevenue) && (
        <CardFooter className={cn('flex flex-col gap-4 sm:gap-6 lg:flex-row lg:justify-between p-3 transition-all border-t duration-300 ease-in-out')}>
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
      )}
    </Card>
  );
};

export default memo(MoneyFlowCard);
