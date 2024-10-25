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
  UseValueByPeriodReturn,
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

const calculateStatisticsValues = <T extends StatisticsType>(
  data: ValueByPeriodData[],
  type: TransactionType,
  statType: T,
  after: Moment,
  before: Moment,
  isCurrentPeriod: boolean,
): StatisticsData<T> => {
  if (!data || data.length === 0) {
    return (statType === StatisticsType.MinMax ? { min: 0, max: 0 } : 0) as StatisticsData<T>;
  }

  const values = data.map((item) => (type === TransactionType.Expense ? item.expense : item.income));
  const nonZeroValues = values.filter((v) => v > 0);
  const adjustedEnd = before.isAfter(moment()) ? moment() : before;

  switch (statType) {
    case StatisticsType.Sum:
      return values.reduce((a, b) => a + b, 0) as StatisticsData<T>;
    case StatisticsType.Daily: {
      const totalDays = adjustedEnd.diff(after, 'days') + 1;
      return (totalDays > 0 ? values.reduce((a, b) => a + b, 0) / totalDays : 0) as StatisticsData<T>;
    }
    case StatisticsType.Avg:
      return (nonZeroValues.length > 0 ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length : 0) as StatisticsData<T>;
    case StatisticsType.MinMax: {
      if (isCurrentPeriod && nonZeroValues.length === 0) {
        return { min: 0, max: 0 } as StatisticsData<T>;
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
      } as StatisticsData<T>;
    }
    default:
      return 0 as StatisticsData<T>;
  }
};

export const useValueByPeriod = <T extends StatisticsType>(
  { config, after, before }: ValueByPeriodParams & { config: { statType: T } },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dependencies: any[] = [],
  queryKey: string = 'value-by-period',
): UseValueByPeriodReturn<T> => {
  const { type, categories, timeframe, period, comparison, statType } = config;
  const { list: categoryList } = useCategories();

  const [periodStart, periodEnd] = getDateRange(timeframe, after, before);
  const isCurrentPeriod = periodEnd.isAfter(moment());

  const categoryIds = useMemo(
    () =>
      categories
        ?.map((category) =>
          typeof category === 'string'
            ? categoryList.find((cat) => cat.name === category)?.id
            : categoryList.find((cat) => cat.id === category)?.id,
        )
        .filter((id): id is number => id !== null && id !== undefined) ?? [],
    [categories, categoryList],
  );

  const periodString = useMemo(() => (period ? `${period.value} ${period.unit}` : `${timeframe.value} ${timeframe.unit}`), [period, timeframe]);

  const { data: currentData, isLoading: isLoadingCurrent, error: errorCurrent } = useValueByPeriodStatisticsRequest({
    type,
    queryKey: `${queryKey}-selected`,
    after: periodStart,
    before: periodEnd,
    period: periodString,
    accounts: [],
    categories: categoryIds,
  });

  const [comparisonStart, comparisonEnd] = useMemo((): [Moment, Moment] => {
    if (comparison === ComparisonType.Previous) {
      const { previousStart, previousEnd } = generatePreviousTimeframe(periodStart, periodEnd, timeframe.unit);
      return [previousStart, previousEnd];
    } else if (comparison === ComparisonType.SameLastYear) {
      return [periodStart.clone().subtract(1, 'year'), periodEnd.clone().subtract(1, 'year')];
    }
    throw new Error('Invalid comparison type');
  }, [comparison, timeframe, periodStart, periodEnd]);

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
    accounts: [],
    categories: categoryIds,
  });

  const currentValue = calculateStatisticsValues<T>(currentData || [], type, statType, periodStart, periodEnd, isCurrentPeriod);
  const comparisonValue = calculateStatisticsValues<T>(comparisonData || [], type, statType, comparisonStart, comparisonEnd, false);

  const calculateChange = (current: number, comparison: number): number => {
    if (comparison === 0) return current === 0 ? 0 : 100;
    return ((current - comparison) / Math.abs(comparison)) * 100;
  };

  const { percentageChange, isIncrease } = useMemo(() => {
    if (typeof currentValue === 'number' && typeof comparisonValue === 'number') {
      const change = calculateChange(currentValue, comparisonValue);
      return {
        percentageChange: change as PercentageChange<T>,
        isIncrease: (currentValue > comparisonValue) as IsIncrease<T>,
      };
    } else if (typeof currentValue === 'object' && typeof comparisonValue === 'object') {
      return {
        percentageChange: {
          min: calculateChange(currentValue.min, comparisonValue.min),
          max: calculateChange(currentValue.max, comparisonValue.max),
        } as PercentageChange<T>,
        isIncrease: {
          min: currentValue.min > comparisonValue.min,
          max: currentValue.max > comparisonValue.max,
        } as IsIncrease<T>,
      };
    }
    return { percentageChange: 0 as PercentageChange<T>, isIncrease: false as IsIncrease<T> };
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
