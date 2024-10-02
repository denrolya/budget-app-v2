import cn from 'classnames';
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon, InfoIcon, TrendingUpIcon } from 'lucide-react';
import moment from 'moment';
import React, { memo, useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import MoneyValue from '@/components/common/MoneyValue';
import Chart from '@/components/features/statistics/MoneyFlow/Chart';
import SummaryItem from '@/components/features/statistics/MoneyFlow/SummaryItem';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { COMMON_PERIODS, INTERVAL_OPTIONS, PERIOD_OPTIONS, PeriodOption } from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { useMoneyFlow } from '@/hooks/useMoneyFlowStatistics';
import VeryInformativeTooltip from '@/components/features/statistics/MoneyFlow/VeryInformativeTooltip';

interface Props {
  className?: string;
}

export const MoneyFlowCard: React.FC<Props> = ({ className }) => {
  const baseCurrency = useBaseCurrency();
  const [period, setPeriod] = useState<PeriodOption['value']>(PERIOD_OPTIONS[4].value);
  const [interval, setInterval] = useState(INTERVAL_OPTIONS[1].value);
  const [isBarChart, setIsBarChart] = useState<boolean>(true);
  const [showRevenue, setShowRevenue] = useState<boolean>(false);

  const selectedPeriodOption = useMemo(() =>
      PERIOD_OPTIONS.find((p) => p.value === period) || PERIOD_OPTIONS[2]
    , [period]);

  const now = moment();
  const { currentDateRange, previousDateRange } = useMemo(() => {
    const currentRange = selectedPeriodOption.getDateRange(now);

    let previousRange;

    if (selectedPeriodOption.value === 'WTD') {
      previousRange = {
        after: currentRange.after.clone().subtract(1, 'isoWeek').startOf('isoWeek'),
        before: currentRange.after.clone().subtract(1, 'isoWeek').endOf('isoWeek'),
      };
    } else if (selectedPeriodOption.value === 'MTD') {
      previousRange = {
        after: currentRange.after.clone().subtract(1, 'month').startOf('month'),
        before: currentRange.after.clone().subtract(1, 'month').endOf('month'),
      };
    } else if (selectedPeriodOption.value === 'YTD') {
      previousRange = {
        after: currentRange.after.clone().subtract(1, 'year').startOf('year'),
        before: currentRange.after.clone().subtract(1, 'year').endOf('year'),
      };
    } else {
      const duration = moment.duration(currentRange.before.diff(currentRange.after));
      previousRange = {
        after: currentRange.after.clone().subtract(duration),
        before: currentRange.after.clone().subtract(1, 'second'),
      };
    }

    return { currentDateRange: currentRange, previousDateRange: previousRange };
  }, [selectedPeriodOption, now]);

  const {
    availableIntervals,
    transformedData,
    isLoading,
    error,
    refetchData,
    change,
    changePercent,
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
    avgDailyIncome,
    avgDailyExpenses,
  } = useMoneyFlow({
    period,
    interval,
    currentDateRange,
    previousDateRange,
    baseCurrency,
  });

  const formatShortDate = (date: moment.Moment) => {
    const currentYear = now.year();
    return date.year() === currentYear ? date.format('MMM D') : date.format('MMM D, YYYY');
  };

  const renderChangeIndicator = (value: number) => value >= 0
    ? <ArrowUpIcon className="h-4 w-4 text-primary" />
    : <ArrowDownIcon className="h-4 w-4 text-destructive" />;

  return (
    <Card className={cn('w-full transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25', className)}>
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <h3 className="text-lg font-normal mb-2 sm:mb-0">Money Flow</h3>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              className="mb-2 sm:mb-0"
              value={period}
              onValueChange={(value) => value && setPeriod(value)}
            >
              {COMMON_PERIODS.map((p) => {
                const option = PERIOD_OPTIONS.find((o) => o.value === p);
                return (
                  <ToggleGroupItem key={p} value={p} aria-label={option?.label} className="w-8 sm:w-10">
                    {option?.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="More" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.filter((p) => !COMMON_PERIODS.includes(p.value)).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent>
                  {availableIntervals.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Switch id="chart-type" checked={isBarChart} onCheckedChange={setIsBarChart} />
            <Label htmlFor="chart-type" className="text-xs">{isBarChart ? 'Bar' : 'Line'}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="show-revenue" checked={showRevenue} onCheckedChange={setShowRevenue} />
            <Label htmlFor="show-revenue" className="text-xs">Revenue</Label>
          </div>
        </div>
        <div className="mb-4">
          {isLoading ? (
            <Skeleton className="h-10 w-40 mb-2" />
          ) : (
            <h2 className="text-2xl sm:text-4xl font-bold">
              <MoneyValue showSign amount={totalRevenue} useColors />
            </h2>
          )}
          <ResponsiveTooltip
            openDelay={0}
            desktopComponent="hovercard"
            contentClassName="w-full max-w-sm p-4 sm:w-96"
            content={
              <VeryInformativeTooltip
                currentDateRange={currentDateRange}
                previousDateRange={previousDateRange}
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
                change={change}
                changePercent={changePercent}
              />
            }
          >
            {isLoading ? (
              <Skeleton className="h-6 w-60" />
            ) : (
              <div className={cn('flex items-center text-sm cursor-help', {
                'text-primary': change >= 0,
                'text-destructive': change < 0,
              })}>
                <span className="mr-2">
                  <MoneyValue useColors={false} amount={change} showSign /> ({changePercent.toFixed(0)}%)
                </span>
                {renderChangeIndicator(change)}
                <span className="ml-2 hidden sm:inline">vs. {formatShortDate(previousDateRange.after)} - {formatShortDate(previousDateRange.before)}</span>
                <InfoIcon className="h-4 w-4 ml-1" />
              </div>
            )}
          </ResponsiveTooltip>
        </div>
        <div className="h-[200px] sm:h-[300px] mb-4">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center text-destructive">
              Error loading data: {error.message}
            </div>
          ) : (
            <Chart data={transformedData} isBarChart={isBarChart} showRevenue={showRevenue} />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
          {isLoading ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : (
            <>
              <SummaryItem value={totalIncome} icon={DollarSignIcon} label="Total Income" />
              <SummaryItem value={totalExpenses} icon={DollarSignIcon} label="Total Expenses" />
              <SummaryItem value={totalRevenue} icon={TrendingUpIcon} label="Net Revenue" />
            </>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {isLoading ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : (
            <>
              <SummaryItem value={avgDailyIncome} icon={DollarSignIcon} label="Avg. Daily Income" />
              <SummaryItem value={avgDailyExpenses} icon={DollarSignIcon} label="Avg. Daily Expenses" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(MoneyFlowCard);
