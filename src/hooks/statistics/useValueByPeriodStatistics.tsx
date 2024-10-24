import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import moment, { Moment } from 'moment';

import { ComparisonType, Interval, StatisticsType } from '@/constants/dashboard-config';
import { useCategories } from '@/contexts/FinanceData';
import { useStatistics } from '@/hooks/useStatistics'; // Import the generic hook
import { Type as TransactionType } from '@/models/Transaction';
import { generatePreviousTimeframe } from '@/utils/generatePreviousTimeframe';

interface StatisticsFormattedEntry {
  after: Moment;
  before: Moment;
  income: number;
  expense: number;
}

export interface CardConfig {
  title: string;
  type: TransactionType;
  categories?: string[];
  timeframe: Interval; // Timeframe
  period?: Interval; // Used for grouping
  comparison: ComparisonType;
  statType: StatisticsType;
}

interface ValueByPeriodParams {
  config: CardConfig;
  after?: Moment;
  before?: Moment;
  dependencies?: unknown[]; // Allow any type for dependencies
}

interface MinMaxStatistics {
  min: number;
  max: number;
  minDate?: Moment;
  maxDate?: Moment;
}

type StatisticsData = number | MinMaxStatistics;
type PercentageChange = number | { min: number; max: number };
type IsIncrease = boolean | { min: boolean; max: boolean };

const getDateRange = (
  timeframe: Interval,
  after?: Moment,
  before?: Moment,
): [Moment, Moment] => {
  const { value, unit } = timeframe;
  const end = before || moment().endOf(unit);
  const start = after || end.clone().subtract(value - 1, unit).startOf(unit);
  return [start, end];
};

export const useValueByPeriod = ({
                                   config,
                                   after,
                                   before,
                                   dependencies = [],
                                 }: ValueByPeriodParams): {
  currentData: StatisticsFormattedEntry[] | undefined;
  comparisonData: StatisticsFormattedEntry[] | undefined;
  currentValue: StatisticsData;
  comparisonValue: StatisticsData;
  percentageChange: PercentageChange;
  isIncrease: IsIncrease;
  isPositive: boolean | { min: boolean; max: boolean };
  selectedTimeframe: { after: Moment; before: Moment };
  comparisonTimeframe: { after: Moment; before: Moment };
  isLoading: boolean;
  error: Error | null;
  minDate: Moment | undefined;
  maxDate: Moment | undefined;
  isCurrentPeriod: boolean;
} => {
  const queryClient = useQueryClient();
  const { type, categories, timeframe, period, comparison, statType } = config;
  const { list: categoryList } = useCategories();

  const [periodStart, periodEnd] = getDateRange(timeframe, after, before);
  const isCurrentPeriod = periodEnd.isAfter(moment());

  const categoryIds = useMemo(() =>
      categories
        ?.map((categoryName) => categoryList.find((cat) => cat.name === categoryName)?.id)
        .filter((id): id is number => id !== null) ?? [],
    [categories, categoryList],
  );

  // Fetch current period data
  const { data: currentData, isLoading: isLoadingCurrent, error: errorCurrent } = useStatistics({
    after: periodStart,
    before: periodEnd,
    interval: period ? `${period.value} ${period.unit}` : `${timeframe.value} ${timeframe.unit}`,
    type,
    accounts: [], // Add accounts if necessary
    categories: categoryIds,
  });

  // Determine comparison start and end dates
  const [comparisonStart, comparisonEnd] = useMemo((): [Moment, Moment] => {
    if (comparison === ComparisonType.Previous) {
      const { previousStart, previousEnd } = generatePreviousTimeframe(periodStart, periodEnd, timeframe.unit);
      return [previousStart, previousEnd];
    } else if (comparison === ComparisonType.SameLastYear) {
      return [
        periodStart.clone().subtract(1, 'year'),
        periodEnd.clone().subtract(1, 'year'),
      ];
    }
    throw new Error('Invalid comparison type');
  }, [comparison, timeframe, periodStart, periodEnd]);

  // Fetch comparison period data
  const { data: comparisonData, isLoading: isLoadingComparison, error: errorComparison } = useStatistics({
    after: comparisonStart,
    before: comparisonEnd,
    interval: period ? `${period.value} ${period.unit}` : `${timeframe.value} ${timeframe.unit}`,
    type,
    accounts: [], // Add accounts if necessary
    categories: categoryIds,
  });

  useEffect(() => () => {
      queryClient.cancelQueries({ queryKey: ['value-by-period'] });
    }, [queryClient]);

  const currentValue = calculateStatValue(currentData || [], type, statType, periodStart, periodEnd, isCurrentPeriod);
  const comparisonValue = calculateStatValue(comparisonData || [], type, statType, comparisonStart, comparisonEnd, false);

  const calculateChange = (current: number, comparison: number): number => {
    if (comparison === 0) return current === 0 ? 0 : 100;
    return ((current - comparison) / Math.abs(comparison)) * 100;
  };

  const { percentageChange, isIncrease } = useMemo((): {
    percentageChange: PercentageChange;
    isIncrease: IsIncrease;
  } => {
    if (typeof currentValue === 'number' && typeof comparisonValue === 'number') {
      const change = calculateChange(currentValue, comparisonValue);
      return { percentageChange: change, isIncrease: currentValue > comparisonValue };
    } else if (typeof currentValue === 'object' && typeof comparisonValue === 'object') {
      return {
        percentageChange: {
          min: calculateChange(currentValue.min, comparisonValue.min),
          max: calculateChange(currentValue.max, comparisonValue.max),
        },
        isIncrease: {
          min: currentValue.min > comparisonValue.min,
          max: currentValue.max > comparisonValue.max,
        },
      };
    }
    return { percentageChange: 0, isIncrease: false };
  }, [currentValue, comparisonValue]);

  const isPositive = type === TransactionType.Income ? isIncrease : !isIncrease;

  return {
    currentData,
    comparisonData,
    currentValue,
    comparisonValue,
    percentageChange,
    isIncrease,
    isPositive,
    selectedTimeframe: { after: periodStart, before: periodEnd },
    comparisonTimeframe: { after: comparisonStart, before: comparisonEnd },
    isLoading: isLoadingCurrent || isLoadingComparison,
    error: errorCurrent || errorComparison || null,
    minDate: typeof currentValue === 'object' ? currentValue.minDate : undefined,
    maxDate: typeof currentValue === 'object' ? currentValue.maxDate : undefined,
    isCurrentPeriod,
  };
};

const calculateStatValue = (
  data: StatisticsFormattedEntry[],
  type: TransactionType,
  statType: StatisticsType,
  start: Moment,
  end: Moment,
  isCurrentPeriod: boolean,
): StatisticsData => {
  if (!data || data.length === 0) {
    return statType === StatisticsType.MinMax ? { min: 0, max: 0 } : 0;
  }

  const values = data.map((item) => (type === TransactionType.Expense ? item.expense : item.income));
  const nonZeroValues = values.filter((v) => v > 0);

  // Adjust the end date to today if it is in the future
  const adjustedEnd = end.isAfter(moment()) ? moment() : end;

  switch (statType) {
    case StatisticsType.Sum:
      return values.reduce((a, b) => a + b, 0);
    case StatisticsType.Daily: {
      const totalDays = adjustedEnd.diff(start, 'days') + 1; // Calculate the total number of days
      return totalDays > 0 ? values.reduce((a, b) => a + b, 0) / totalDays : 0;
    }
    case StatisticsType.Avg:
      return nonZeroValues.length > 0 ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length : 0;
    case StatisticsType.MinMax: {
      if (isCurrentPeriod && nonZeroValues.length === 0) {
        return { min: 0, max: 0 };
      }
      const minValue = Math.min(...nonZeroValues);
      const maxValue = Math.max(...values);
      const minIndex = values.indexOf(minValue);
      const maxIndex = values.indexOf(maxValue);
      return {
        min: minValue,
        max: maxValue,
        minDate: data[minIndex].after,
        maxDate: data[maxIndex].after,
      };
    }
    default:
      return 0; // Fallback in case of an unknown statType
  }
};
