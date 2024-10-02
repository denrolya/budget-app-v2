import { useQuery } from '@tanstack/react-query';
import cn from 'classnames';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CalendarIcon,
  DollarSignIcon,
  InfoIcon,
  TrendingUpIcon,
} from 'lucide-react';
import moment, { Moment } from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import Chart from '@/components/features/statistics/MoneyFlow/Chart';
import SummaryItem from '@/components/features/statistics/MoneyFlow/SummaryItem';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  BACKEND_DATE_FORMAT,
  COMMON_PERIODS,
  INTERVAL_OPTIONS,
  PERIOD_OPTIONS,
  PeriodOption,
} from '@/constants/datetime';
import { useBaseCurrency } from '@/contexts/auth';
import { api } from '@/services/api';

interface BackendData {
  after: number;
  before: number;
  expense: number;
  income: number;
}

interface TransformedData {
  time: number;
  income: number;
  expenses: number;
  revenue: number;
  date: Moment;
  previousIncome: number;
  previousExpenses: number;
  previousRevenue: number;
}

interface Props {
  className?: string;
}

export const MoneyFlowCard: React.FC<Props> = ({ className }) => {
  const [period, setPeriod] = useState<PeriodOption['value']>(PERIOD_OPTIONS[2].value);
  const [interval, setInterval] = useState(INTERVAL_OPTIONS[1].value); // Default to '1 day'
  const [isBarChart, setIsBarChart] = useState(true);
  const baseCurrency = useBaseCurrency();

  const selectedPeriodOption = useMemo(() =>
      PERIOD_OPTIONS.find((p) => p.value === period) || PERIOD_OPTIONS[2]
    , [period]);

  const now = moment();
  const { currentDateRange, previousDateRange } = useMemo(() => {
    const currentRange = selectedPeriodOption.getDateRange(now);

    let previousRange;

    // Check for special cases
    if (selectedPeriodOption.value === 'WTD') {
      // For WTD, get the previous week
      previousRange = {
        after: currentRange.after.clone().subtract(1, 'isoWeek').startOf('isoWeek'),
        before: currentRange.after.clone().subtract(1, 'isoWeek').endOf('isoWeek'),
      };
    } else if (selectedPeriodOption.value === 'MTD') {
      // For MTD, get the previous month
      previousRange = {
        after: currentRange.after.clone().subtract(1, 'month').startOf('month'),
        before: currentRange.after.clone().subtract(1, 'month').endOf('month'),
      };
    } else if (selectedPeriodOption.value === 'YTD') {
      // For YTD, get the previous year
      previousRange = {
        after: currentRange.after.clone().subtract(1, 'year').startOf('year'),
        before: currentRange.after.clone().subtract(1, 'year').endOf('year'),
      };
    } else {
      // Default behavior for other periods
      const duration = moment.duration(currentRange.before.diff(currentRange.after));
      previousRange = {
        after: currentRange.after.clone().subtract(duration),
        before: currentRange.after.clone().subtract(1, 'second'),
      };
    }

    return { currentDateRange: currentRange, previousDateRange: previousRange };
  }, [selectedPeriodOption, now]);

  const availableIntervals = useMemo(() => {
    const durationInDays = currentDateRange.before.diff(currentDateRange.after, 'days');
    return INTERVAL_OPTIONS.filter(option => {
      if (durationInDays <= 1) return option.value === '1 day';
      if (durationInDays <= 7) return ['1 hour', '1 day'].includes(option.value);
      if (durationInDays <= 31) return ['1 day', '1 week'].includes(option.value);
      return true;
    });
  }, [currentDateRange]);

  useEffect(() => {
    if (!availableIntervals.some(option => option.value === interval)) {
      setInterval(availableIntervals[0].value);
    }
  }, [availableIntervals, interval]);

  const {
    data: currentDataBackend,
    isLoading: isCurrentLoading,
    error: currentError,
    refetch: refetchCurrentPeriodData,
  } = useQuery<BackendData[]>({
    queryKey: ['currentData', period, interval],
    queryFn: async () => {
      const response = await api.get('/api/v2/statistics/value-by-period', {
        params: {
          after: currentDateRange.after.format(BACKEND_DATE_FORMAT),
          before: currentDateRange.before.format(BACKEND_DATE_FORMAT),
          interval,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1h
  });

  const {
    data: previousDataBackend,
    isLoading: isPreviousLoading,
    error: previousError,
    refetch: refetchPreviousPeriodData,
  } = useQuery<BackendData[]>({
    queryKey: ['previousData', period, interval],
    queryFn: async () => {
      const response = await api.get('/api/v2/statistics/value-by-period', {
        params: {
          after: previousDateRange.after.format(BACKEND_DATE_FORMAT),
          before: previousDateRange.before.format(BACKEND_DATE_FORMAT),
          interval,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 240 * 60 * 1000, // Example: data is fresh for 4 hours
  });

  useEffect(() => {
    refetchCurrentPeriodData();
    refetchPreviousPeriodData();
  }, [baseCurrency, refetchPreviousPeriodData, refetchCurrentPeriodData]);

  const transformedData: TransformedData[] = useMemo(() => {
    if (!currentDataBackend || !previousDataBackend) return [];

    return currentDataBackend.map((currentItem, index) => {
      const previousItem = previousDataBackend[index] || {
        expense: 0,
        income: 0,
      };

      const revenue = currentItem.income - currentItem.expense;
      const previousRevenue = previousItem.income - previousItem.expense;

      return {
        time: currentItem.after * 1000, // Convert to milliseconds
        income: currentItem.income,
        expenses: currentItem.expense,
        revenue: revenue,
        date: moment.unix(currentItem.after),
        previousIncome: previousItem.income,
        previousExpenses: previousItem.expense,
        previousRevenue: previousRevenue,
      };
    });
  }, [currentDataBackend, previousDataBackend]);

  useEffect(() => {
    const durationInDays = currentDateRange.before.diff(currentDateRange.after, 'days');
    let defaultInterval;

    if (['WTD', '1M', 'MTD'].includes(period) || durationInDays <= 31) {
      defaultInterval = '1 day';
    } else if (period === '3M' || (durationInDays > 31 && durationInDays <= 90)) {
      defaultInterval = '1 week';
    } else {
      defaultInterval = '1 month';
    }

    if (availableIntervals.some(option => option.value === defaultInterval)) {
      setInterval(defaultInterval);
    } else {
      setInterval(availableIntervals[0].value);
    }
  }, [period, currentDateRange, availableIntervals]);

  const {
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
  } = useMemo(() => {
    const currentIncome = transformedData.reduce((sum, d) => sum + d.income, 0);
    const currentExpenses = transformedData.reduce((sum, d) => sum + d.expenses, 0);
    const currentRevenue = currentIncome - currentExpenses;

    const previousIncome = transformedData.reduce((sum, d) => sum + d.previousIncome, 0);
    const previousExpenses = transformedData.reduce((sum, d) => sum + d.previousExpenses, 0);
    const previousRevenue = previousIncome - previousExpenses;

    const revenueChange = currentRevenue - previousRevenue;
    const revenueChangePercent = previousRevenue !== 0 ? (revenueChange / Math.abs(previousRevenue)) * 100 : 0;

    const incomeChange = currentIncome - previousIncome;
    const incomeChangePercent = previousIncome !== 0 ? (incomeChange / Math.abs(previousIncome)) * 100 : 0;

    const expensesChange = currentExpenses - previousExpenses;
    const expensesChangePercent = previousExpenses !== 0 ? (expensesChange / Math.abs(previousExpenses)) * 100 : 0;

    const dataLength = transformedData.length;
    const avgIncome = dataLength > 0 ? currentIncome / dataLength : 0;
    const avgExpenses = dataLength > 0 ? currentExpenses / dataLength : 0;

    return {
      change: revenueChange,
      changePercent: revenueChangePercent,
      totalIncome: currentIncome,
      totalExpenses: currentExpenses,
      totalRevenue: currentRevenue,
      previousTotalIncome: previousIncome,
      previousTotalExpenses: previousExpenses,
      previousTotalRevenue: previousRevenue,
      incomeChange,
      incomeChangePercent,
      expensesChange,
      expensesChangePercent,
      avgDailyIncome: avgIncome,
      avgDailyExpenses: avgExpenses,
    };
  }, [transformedData]);

  const formatShortDate = (date: Moment) => date.format('MMM D');

  const renderChangeIndicator = (value: number) => value >= 0 ? (
    <ArrowUpIcon className="h-4 w-4 text-primary" />
  ) : (
    <ArrowDownIcon className="h-4 w-4 text-destructive" />
  );

  const VeryImportantTooltip = () => (
    <>
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">Comparison Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className="font-medium">Current period:</span>
          </div>
          <p>
            {formatShortDate(currentDateRange.after)} - {formatShortDate(currentDateRange.before)}
          </p>
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className="font-medium">Previous period:</span>
          </div>
          <p>
            {formatShortDate(previousDateRange.after)} - {formatShortDate(previousDateRange.before)}
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center">
            <ArrowRightIcon className="h-4 w-4 mr-2" />
            Current vs Previous
          </h4>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-sm">
            <p className="font-medium">Metric</p>
            <p className="font-medium text-right">Current</p>
            <p className="font-medium text-right">Previous</p>
            <p>Income</p>
            <p className="text-right">
              <MoneyValue amount={totalIncome} className="font-medium" useColors={false} />
            </p>
            <p className="text-right">
              <MoneyValue amount={previousTotalIncome} useColors={false} />
            </p>
            <p>Expenses</p>
            <p className="text-right">
              <MoneyValue amount={totalExpenses} className="font-medium" useColors={false} />
            </p>
            <p className="text-right">
              <MoneyValue amount={previousTotalExpenses} useColors={false} />
            </p>
            <p>Revenue</p>
            <p className="text-right">
              <MoneyValue amount={totalRevenue} className="font-medium" useColors />
            </p>
            <p className="text-right">
              <MoneyValue amount={previousTotalRevenue} useColors />
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center">
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            Changes
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span>Income:</span>
              <span className="flex items-center">
                <MoneyValue amount={incomeChange} showSign useColors />
                {' '}
                ({incomeChangePercent.toFixed(2)}%)
                {renderChangeIndicator(incomeChange)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Expenses:</span>
              <span className="flex items-center">
                <MoneyValue amount={expensesChange} showSign useColors={false} />
                {' '}
                ({expensesChangePercent.toFixed(2)}%)
                {renderChangeIndicator(-expensesChange)}
              </span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Revenue:</span>
              <span className="flex items-center">
                <MoneyValue amount={change} showSign useColors />
                {' '}
                ({changePercent.toFixed(2)}%)
                {renderChangeIndicator(change)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Card className={cn('w-full', 'transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25', className)}>
      <CardContent className="pt-6">
        <div className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-normal">
            Money Flow
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup type="single" size="sm" value={period} onValueChange={(value) => value && setPeriod(value)}>
              {COMMON_PERIODS.map((p) => {
                const option = PERIOD_OPTIONS.find((o) => o.value === p);
                return (
                  <ToggleGroupItem key={p} value={p} aria-label={option?.label} className="w-10">
                    {option?.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue placeholder="More" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.filter((p) => !COMMON_PERIODS.includes(p.value)).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {availableIntervals.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch id="chart-type" checked={isBarChart} onCheckedChange={setIsBarChart} />
              <Label htmlFor="chart-type" className="text-xs">
                {isBarChart ? 'Bar' : 'Line'}
              </Label>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-4xl font-bold">
            <MoneyValue showSign amount={totalRevenue} />
          </h2>
          <ResponsiveTooltip openDelay={0}
                             desktopComponent="hovercard"
                             contentClassName="w-full max-w-sm p-4 sm:w-96"
                             content={(
                               <VeryImportantTooltip />
                             )}>
            <div
              className={cn('flex items-center text-sm cursor-help', {
                'text-primary': change >= 0,
                'text-destructive': change < 0,
              })}
            >
              <span className="mr-2">
                <MoneyValue useColors={false} amount={change} showSign />
                {' '}
                ({changePercent.toFixed(1)}%)
              </span>
              {renderChangeIndicator(change)}
              <span className="ml-2">vs. {formatShortDate(previousDateRange.after)} - {formatShortDate(previousDateRange.before)}</span>
              <InfoIcon className="h-4 w-4 ml-1" />
            </div>
          </ResponsiveTooltip>
        </div>
        <div className="h-[300px] mb-4">
          {(isCurrentLoading || isPreviousLoading) && <div>Loading...</div>}

          {(currentError || previousError) && (
            <div>
              {currentError && <p>Error loading current data: {currentError.message}</p>}
              {previousError && <p>Error loading previous data: {previousError.message}</p>}
            </div>
          )}

          {!isCurrentLoading && !isPreviousLoading && !currentError && !previousError && (
            <Chart data={transformedData} isBarChart={isBarChart} />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
          <ResponsiveTooltip content={(
            <p>Total income
               for {formatShortDate(currentDateRange.after)} - {formatShortDate(currentDateRange.before)}</p>
          )}>
            <div>
              <SummaryItem value={totalIncome} icon={DollarSignIcon} label="Total Income" />
            </div>
          </ResponsiveTooltip>
          <ResponsiveTooltip content={(
            <p>Total expenses
               for {formatShortDate(currentDateRange.after)} - {formatShortDate(currentDateRange.before)}</p>
          )}>
            <div>
              <SummaryItem value={totalExpenses} icon={DollarSignIcon} label="Total Expenses" />
            </div>
          </ResponsiveTooltip>
          <ResponsiveTooltip content={(
            <p>Net revenue (Income - Expenses)
               for {formatShortDate(currentDateRange.after)} - {formatShortDate(currentDateRange.before)}</p>
          )}>
            <div>
              <SummaryItem value={totalRevenue} icon={TrendingUpIcon} label="Net Revenue" />
            </div>
          </ResponsiveTooltip>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <ResponsiveTooltip content={(
            <p>Average daily income
               for {formatShortDate(currentDateRange.after)} - {formatShortDate(currentDateRange.before)}</p>
          )}>
            <div>
              <SummaryItem value={avgDailyIncome} icon={DollarSignIcon} label="Avg. Daily Income" />
            </div>
          </ResponsiveTooltip>
          <ResponsiveTooltip content={(
            <p>Average daily expenses
               for {formatShortDate(currentDateRange.after)} - {formatShortDate(currentDateRange.before)}</p>
          )}>
            <div>
              <SummaryItem value={avgDailyExpenses} icon={DollarSignIcon} label="Avg. Daily Expenses" />
            </div>
          </ResponsiveTooltip>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoneyFlowCard;
