import moment, { Moment } from 'moment';
import { useMemo } from 'react';

import { useCategories } from '@/contexts/FinanceData';
import { useValueByPeriodStatisticsRequest } from '@/hooks/statistics/useValueByPeriodStatisticsRequest';
import { ComparisonType, Interval, StatisticsType } from '@/types/statistics';
import { Type as TransactionType } from '@/types/transaction';
import {
  IsIncrease,
  PercentageChange,
  StatisticsData,
  ValueByPeriodData,
  ValueByPeriodParams,
} from '@/types/valueByPeriodStatistics';
import { generatePreviousTimeframe } from '@/utils/generatePreviousTimeframe';

const getDateRange = (timeframe: Interval, after?: Moment, before?: Moment): [Moment, Moment] => {
  const { value, unit } = timeframe;
  const end = before || moment().endOf(unit);
  const start = after || end.clone().subtract(value - 1, unit).startOf(unit);
  return [start, end];
};

const calculateStatisticsValues = (
  data: ValueByPeriodData[],
  type: TransactionType,
  statType: StatisticsType,
  after: Moment,
  before: Moment,
  isCurrentPeriod: boolean,
): StatisticsData => {
  if (!data || data.length === 0) {
    return statType === StatisticsType.MinMax ? { min: 0, max: 0 } : 0;
  }

  const values = data.map((item) => (type === TransactionType.Expense ? item.expense : item.income));
  const nonZeroValues = values.filter((v) => v > 0);

  // Adjust the end date to today if it is in the future
  const adjustedEnd = before.isAfter(moment()) ? moment() : before;

  switch (statType) {
    case StatisticsType.Sum:
      return values.reduce((a, b) => a + b, 0);
    case StatisticsType.Daily: {
      const totalDays = adjustedEnd.diff(after, 'days') + 1; // Calculate the total number of days
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
      return 0;
  }
};

export const useValueByPeriod = ({ config, after, before }: ValueByPeriodParams, dependencies: any[] = [], queryKey: string = 'value-by-period'): {
  currentData: ValueByPeriodData[] | undefined;
  comparisonData: ValueByPeriodData[] | undefined;
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
  const { type, categories, timeframe, period, comparison, statType } = config;
  const { list: categoryList } = useCategories();

  const [periodStart, periodEnd] = getDateRange(timeframe, after, before);
  const isCurrentPeriod = periodEnd.isAfter(moment());

  const categoryIds = useMemo(() =>
      categories
        ?.map((categoryName: string) => categoryList.find((cat) => cat.name === categoryName)?.id)
        .filter((id: number): id is number => id !== null) ?? [],
    [categories, categoryList],
  );

  const periodString = useMemo(() => period ? `${period.value} ${period.unit}` : `${timeframe.value} ${timeframe.unit}`, [period, timeframe]);

  // Fetch current period data
  const { data: currentData, isLoading: isLoadingCurrent, error: errorCurrent } = useValueByPeriodStatisticsRequest({
    type,
    queryKey: `${queryKey}-selected`,
    after: periodStart,
    before: periodEnd,
    period: periodString,
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
  const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    error: errorComparison,
  } = useValueByPeriodStatisticsRequest({
    type,
    queryKey: `${queryKey}-comparison`,
    after: comparisonStart,
    before: comparisonEnd,
    period: periodString,
    accounts: [], // Add accounts if necessary
    categories: categoryIds,
  });

  const currentValue = calculateStatisticsValues(currentData || [], type, statType, periodStart, periodEnd, isCurrentPeriod);
  const comparisonValue = calculateStatisticsValues(comparisonData || [], type, statType, comparisonStart, comparisonEnd, false);

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
