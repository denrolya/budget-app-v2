import { BarChart2, Calendar as CalendarIcon, LineChart } from 'lucide-react';
import React, { useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MONEYFLOW_PRESETS, TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { useBaseCurrency } from '@/features/auth';
import Chart from '@/features/statistics/components/MoneyFlow/Chart';
import ConfigurationMenu from '@/features/statistics/components/MoneyFlow/ConfigurationMenu';
import MoneyFlowSkeleton from '@/features/statistics/components/MoneyFlow/Skeleton';
import SummaryItem from '@/features/statistics/components/MoneyFlow/SummaryItem';
import { useMoneyFlow } from '@/hooks/statistics/useMoneyFlowStatistics';
import { type UseTimeframeControl, useTimeframeControl } from '@/hooks/useTimeframeControl';
import { formatRange } from '@/lib/datetime/formatShortDate';
import { cn } from '@/lib/utils';

const PERIOD_SHORT: Record<string, string> = {
  P1D: 'D',
  P1W: 'W',
  P1M: 'M',
  P3M: '3M',
  P6M: '6M',
  P1Y: 'Y',
};

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  controlledTimeframe?: UseTimeframeControl;
}

export const MoneyFlowCard: React.FC<Props> = ({ controlledTimeframe, className }) => {
  const baseCurrency = useBaseCurrency();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showPreviousPeriod, setShowPreviousPeriod] = useState(true);

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
    period: rawPeriod = fallback.period,
    setPeriod: rawSetPeriod = fallback.setPeriod,
    availablePeriods: rawAvailablePeriods = fallback.availablePeriods,
  } = controlledTimeframe ?? {};

  const period = rawPeriod ?? fallback.period!;
  const setPeriod = rawSetPeriod ?? fallback.setPeriod!;
  const availablePeriods = rawAvailablePeriods ?? fallback.availablePeriods!;
  const resolvedPreviousTimeframe = previousTimeframe ?? fallback.previousTimeframe!;

  const spanDays = timeframe.before.diff(timeframe.after, 'days');
  const showYearBoundary = spanDays >= 730;
  const showSeasonBoundary = spanDays > 90 && spanDays < 730;
  const showMonthBoundary = spanDays > 21 && spanDays <= 90;

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
  } = useMoneyFlow({ period, timeframe, previousTimeframe: resolvedPreviousTimeframe, baseCurrency });

  return (
    <Card className={cn('w-full min-h-[550px] flex flex-col', className)}>
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground leading-none">
            Money Flow
          </CardTitle>
          <div className="flex items-center gap-2">
            {!controlledTimeframe?.timeframe?.after && (
              <DaterangePickerWithPresets
                after={timeframe.after}
                before={timeframe.before}
                presets={MONEYFLOW_PRESETS}
                onChange={setTimeframe}
              >
                <button className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 leading-none cursor-pointer">
                  <CalendarIcon className="h-2.5 w-2.5" />
                  {formatRange(timeframe)}
                  <span className="text-muted-foreground/50">· vs {formatRange(resolvedPreviousTimeframe)}</span>
                </button>
              </DaterangePickerWithPresets>
            )}
            <ConfigurationMenu setShowPreviousPeriod={setShowPreviousPeriod} showPreviousPeriod={showPreviousPeriod} />
          </div>
        </div>
        <CardDescription className="sr-only">Money flow statistics for the selected period.</CardDescription>
      </CardHeader>

      {/* ── Inline toolbar ── */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
        {/* Period segmented control */}
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          {availablePeriods.map((opt) => (
            <button
              className={cn(
                'h-5 px-2 text-2xs font-medium rounded-sm transition-colors',
                period === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
            >
              {PERIOD_SHORT[opt.value] ?? opt.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Chart type */}
        <div className="flex items-center gap-0.5">
          <button
            className={cn(
              'h-6 w-6 flex items-center justify-center rounded-sm transition-colors',
              chartType === 'bar' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setChartType('bar')}
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
          <button
            className={cn(
              'h-6 w-6 flex items-center justify-center rounded-sm transition-colors',
              chartType === 'line' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setChartType('line')}
          >
            <LineChart className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Series toggles */}
        <div className="flex items-center gap-1">
          <button
            className={cn(
              'h-5 px-2 text-2xs font-medium rounded-sm border transition-colors',
              showIncome
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setShowIncome(!showIncome)}
          >
            Income
          </button>
          <button
            className={cn(
              'h-5 px-2 text-2xs font-medium rounded-sm border transition-colors',
              showExpenses
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setShowExpenses(!showExpenses)}
          >
            Expenses
          </button>
          <button
            className={cn(
              'h-5 px-2 text-2xs font-medium rounded-sm border transition-colors',
              showRevenue
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setShowRevenue(!showRevenue)}
          >
            Revenue
          </button>
        </div>
      </div>

      <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
        {isLoading && <MoneyFlowSkeleton />}

        {!isLoading && totalRevenue && (
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-grow overflow-x-auto overflow-y-hidden h-[375px]">
              {error ? (
                <div className="w-full h-full flex items-center justify-center text-destructive text-xs">
                  Error loading data: {error.message}
                </div>
              ) : (
                transformedData.length > 0 && (
                  <Chart
                    chartType={chartType}
                    currentTimeframe={timeframe}
                    data={transformedData}
                    period={period}
                    previousTimeframe={resolvedPreviousTimeframe}
                    showExpenses={showExpenses}
                    showIncome={showIncome}
                    showMonthBoundary={showMonthBoundary}
                    showPreviousPeriod={showPreviousPeriod}
                    showRevenue={showRevenue}
                    showSeasonBoundary={showSeasonBoundary}
                    showYearBoundary={showYearBoundary}
                  />
                )
              )}
            </div>
          </div>
        )}
      </CardContent>

      {!isLoading && totalRevenue && (
        <CardFooter className="flex flex-col w-full p-0 border-t">
          <div className="hidden lg:flex w-full divide-x divide-border px-2">
            {[
              {
                label: 'Income',
                value: totalIncome,
                comparisonValue: previousTotalIncome,
                comparisonPercentage: incomeChangePercent,
              },
              {
                label: 'Expenses',
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
              <div className="flex-1 px-3 py-2 flex justify-center items-center" key={index}>
                <SummaryItem {...item} className="text-center" />
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MoneyFlowCard;
