import { ArrowDownIcon, ArrowUpIcon, BarChart2, Calendar as CalendarIcon, LineChart } from 'lucide-react';
import React, { useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import MoneyValue from '@/components/common/MoneyValue';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { MONEYFLOW_PRESETS, TIMEFRAME_OPTIONS } from '@/constants/datetime';
import { useBaseCurrency } from '@/features/auth';
import Chart from '@/features/statistics/components/MoneyFlow/Chart';
import MoneyFlowSkeleton from '@/features/statistics/components/MoneyFlow/Skeleton';
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
  const [showForecast, setShowForecast] = useState(true);

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

  const isControlled = Boolean(controlledTimeframe?.timeframe?.after);

  const {
    transformedData,
    isLoading,
    error,
    refetchData,
    totalIncome,
    totalExpenses,
    totalRevenue,
    previousTotalIncome,
    previousTotalExpenses,
    previousTotalRevenue,
    incomeChangePercent,
    expensesChangePercent,
    revenueChangePercent,
    avgIncome,
    avgExpense,
  } = useMoneyFlow({ period, timeframe, previousTimeframe: resolvedPreviousTimeframe, baseCurrency });

  let chartContent: React.ReactNode = null;
  if (error) {
    chartContent = (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <span className="text-xs font-mono text-muted-foreground/60">Failed to load chart data</span>
        <button
          type="button"
          className="text-2xs font-mono text-muted-foreground hover:text-foreground border border-border/60 rounded px-2 py-0.5 transition-colors"
          onClick={refetchData}
        >
          Retry
        </button>
      </div>
    );
  } else if (!isLoading && transformedData.length === 0) {
    chartContent = (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-xs font-mono text-muted-foreground/50">No data in the selected time range</span>
      </div>
    );
  } else if (transformedData.length > 0) {
    chartContent = (
      <Chart
        avgExpense={avgExpense}
        avgIncome={avgIncome}
        chartType={chartType}
        currentTimeframe={timeframe}
        data={transformedData}
        period={period}
        previousTimeframe={resolvedPreviousTimeframe}
        showExpenses={showExpenses}
        showForecast={showForecast}
        showIncome={showIncome}
        showMonthBoundary={showMonthBoundary}
        showPreviousPeriod={showPreviousPeriod}
        showRevenue={showRevenue}
        showSeasonBoundary={showSeasonBoundary}
        showYearBoundary={showYearBoundary}
      />
    );
  }

  return (
    <div className={cn('flex flex-col w-full min-h-[550px] border rounded-lg overflow-hidden bg-card', className)}>
      {/* Single dense toolbar — matches Donut style */}
      <div className="shrink-0 flex items-center gap-1 px-2 border-b h-8 bg-card">
        {/* Period segmented control */}
        <div className="flex items-center gap-0.5 bg-muted rounded p-0.5">
          {availablePeriods.map((opt) => (
            <button
              aria-label={opt.label}
              aria-pressed={period === opt.value}
              type="button"
              className={cn(
                'h-5 px-1.5 text-2xs font-medium rounded-sm transition-colors',
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

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Chart type */}
        <div className="flex items-center gap-0 bg-muted rounded p-0.5">
          <button
            aria-label="Bar chart"
            type="button"
            className={cn(
              'h-5 w-5 flex items-center justify-center rounded-sm transition-colors',
              chartType === 'bar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setChartType('bar')}
          >
            <BarChart2 className="h-3 w-3" />
          </button>
          <button
            aria-label="Line chart"
            type="button"
            className={cn(
              'h-5 w-5 flex items-center justify-center rounded-sm transition-colors',
              chartType === 'line' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setChartType('line')}
          >
            <LineChart className="h-3 w-3" />
          </button>
        </div>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Series toggles */}
        <div className="flex items-center gap-0.5">
          <button
            aria-label="Toggle income series"
            aria-pressed={showIncome}
            type="button"
            className={cn(
              'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
              showIncome
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setShowIncome(!showIncome)}
          >
            Inc
          </button>
          <button
            aria-label="Toggle expenses series"
            aria-pressed={showExpenses}
            type="button"
            className={cn(
              'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
              showExpenses
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setShowExpenses(!showExpenses)}
          >
            Exp
          </button>
          <button
            aria-label="Toggle revenue series"
            aria-pressed={showRevenue}
            type="button"
            className={cn(
              'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
              showRevenue
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setShowRevenue(!showRevenue)}
          >
            Rev
          </button>
        </div>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Previous period toggle */}
        <button
          aria-label="Compare previous period"
          aria-pressed={showPreviousPeriod}
          type="button"
          className={cn(
            'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
            showPreviousPeriod
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setShowPreviousPeriod(!showPreviousPeriod)}
        >
          /prev
        </button>

        {/* Forecast toggle */}
        <button
          aria-label="Toggle forecast"
          aria-pressed={showForecast}
          type="button"
          className={cn(
            'h-5 px-1.5 text-2xs font-medium rounded-sm border transition-colors',
            showForecast
              ? 'border-muted-foreground/40 bg-muted-foreground/10 text-muted-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setShowForecast(!showForecast)}
        >
          /fcast
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Date picker (uncontrolled only) */}
        {!isControlled && (
          <>
            <DaterangePickerWithPresets
              after={timeframe.after}
              before={timeframe.before}
              presets={MONEYFLOW_PRESETS}
              onChange={setTimeframe}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground rounded px-1.5 py-0.5 leading-none cursor-pointer transition-colors"
              >
                <CalendarIcon className="h-2.5 w-2.5" />
                {formatRange(timeframe)}
              </button>
            </DaterangePickerWithPresets>
            <div className="h-4 w-px bg-border mx-0.5" />
          </>
        )}

        {/* Pinned total */}
        {!isLoading && totalRevenue != null && (
          <MoneyValue
            showSign
            useColors
            amount={totalRevenue}
            className="text-2xs font-semibold font-mono tabular-nums pr-0.5"
          />
        )}
      </div>

      {/* Chart content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {isLoading && <MoneyFlowSkeleton />}
        {!isLoading && (
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden" key={chartType}>
            {chartContent}
          </div>
        )}
      </div>

      {/* Summary footer — trading terminal style */}
      {!isLoading && totalRevenue != null && (
        <div className="chart-enter shrink-0 hidden lg:flex items-center border-t h-7 divide-x divide-border bg-card">
          {[
            { label: 'Inc', value: totalIncome, prevValue: previousTotalIncome, pct: incomeChangePercent },
            { label: 'Exp', value: totalExpenses, prevValue: previousTotalExpenses, pct: expensesChangePercent },
            {
              label: 'Rev',
              value: totalRevenue,
              prevValue: previousTotalRevenue,
              pct: revenueChangePercent,
              colored: true,
              signed: true,
            },
          ].map((item) => {
            const ArrowIcon = item.pct != null && item.pct >= 0 ? ArrowUpIcon : ArrowDownIcon;
            return (
              <div className="flex-1 flex items-center justify-center gap-1.5 px-2" key={item.label}>
                <span className="text-2xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <MoneyValue
                  amount={item.value}
                  showSign={item.signed}
                  useColors={item.colored}
                  className="text-2xs font-mono tabular-nums font-semibold"
                />
                {item.pct != null && (
                  <ResponsiveTooltip
                    desktopComponent="hovercard"
                    content={
                      <span className="flex items-center gap-1 font-mono text-xs">
                        vs <MoneyValue useColors amount={item.prevValue} className="tabular-nums" />
                      </span>
                    }
                    contentClassName="p-2 w-auto"
                  >
                    <span
                      className={cn('flex items-center text-2xs font-mono font-semibold cursor-help', {
                        'text-success': item.pct >= 0,
                        'text-destructive': item.pct < 0,
                      })}
                    >
                      <ArrowIcon className="h-3 w-3" />
                      {Math.abs(item.pct).toFixed()}%
                    </span>
                  </ResponsiveTooltip>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoneyFlowCard;
