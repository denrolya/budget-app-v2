import { BarChart, Calendar as CalendarIcon, Calendar } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import Chart from '@/components/features/statistics/MoneyFlow/Chart';
import ConfigurationMenu from '@/components/features/statistics/MoneyFlow/ConfigurationMenu';
import MoneyFlowSkeleton from '@/components/features/statistics/MoneyFlow/Skeleton';
import SummaryItem from '@/components/features/statistics/MoneyFlow/SummaryItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PERIOD_OPTIONS, TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { useMoneyFlow } from '@/hooks/statistics/useMoneyFlowStatistics';
import { UseTimeframeControl, useTimeframeControl } from '@/hooks/useTimeframeControl';
import { cn } from '@/lib/utils';
import { PeriodValue, TimeframeValue } from '@/types/global';
import { formatRange } from '@/utils/formatShortDate';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  controlledTimeframe: UseTimeframeControl;
}

export const MoneyFlowCard: React.FC<Props> = ({ controlledTimeframe, className }) => {
  const baseCurrency = useBaseCurrency();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [showIncome, setShowIncome] = useState<boolean>(true);
  const [showExpenses, setShowExpenses] = useState<boolean>(true);
  const [showRevenue, setShowRevenue] = useState<boolean>(false);
  const [showPreviousPeriod, setShowPreviousPeriod] = useState<boolean>(true);
  const [showYearBoundary, setShowYearBoundary] = useState<boolean>(true);
  const [showMonthBoundary, setShowMonthBoundary] = useState<boolean>(true);
  const [showSeasonBoundary, setShowSeasonBoundary] = useState<boolean>(true);

  const fallback = useTimeframeControl({
    defaultPreset: TIMEFRAME_OPTIONS[6].value,
    presets: TIMEFRAME_OPTIONS,
    enablePreviousTimeframe: true,
    enablePeriod: true,
  });

  const {
    timeframe = fallback.timeframe,
    previousTimeframe = fallback.previousTimeframe,
    setTimeframe = fallback.setTimeframe,
    preset = fallback.preset,
    setPreset = fallback.setPreset,
    period = fallback.period,
    setPeriod = fallback.setPeriod,
    availablePeriods = fallback.availablePeriods,
  } = controlledTimeframe ?? {};

  const {
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
    timeframe,
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
            setTimeframe={(value: TimeframeValue) => setPreset(value)}
            timeframe={preset}
          />
        </div>
        <CardDescription className="sr-only">Money flow statistics for the selected period.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
        {!controlledTimeframe?.timeframe?.after && (
          <DaterangePickerWithPresets
            after={timeframe.after}
            before={timeframe.before}
            onChange={setTimeframe}
          >
            <span className="cursor-pointer hover:underline inline-flex flex-row px-4">
              <span className="text-xs flex items-center">
                <CalendarIcon className="inline h-3 w-3 mr-1" />
                {formatRange(timeframe)}
                <span className="ml-1 text-muted-foreground flex items-center">
                  {' vs '}
                  <Calendar className="inline h-3 w-3 mx-1" />
                  {formatRange(previousTimeframe)}
                </span>
              </span>
            </span>
          </DaterangePickerWithPresets>
        )}

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
                    currentTimeframe={timeframe}
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
                />
                <SummaryItem
                  label={`Avg. ${getPeriodLabel} Expenses`}
                  value={avgPeriodExpenses}
                  comparisonValue={previousAvgPeriodExpenses}
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

export default MoneyFlowCard;
