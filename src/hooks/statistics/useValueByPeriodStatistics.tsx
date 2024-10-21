import { useQuery } from '@tanstack/react-query';
import moment, { Moment } from 'moment';
import qs from 'qs';

import { Interval, PeriodUnit } from '@/constants/dashboard-config';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useCategories } from '@/contexts/FinanceData';
import { Type as TransactionType } from '@/models/Transaction';
import { axiosFetcher } from '@/services/api';
import { generatePreviousTimeframe } from '@/utils/generatePreviousTimeframe';

export enum StatisticsType {
  Sum = 'sum',
  Daily = 'daily',
  Avg = 'avg',
  MinMax = 'min-max',
}

export enum ComparisonType {
  Previous = 'previous',
  SameLastYear = 'same-last-year',
}

export interface CardConfig {
  title: string;
  type: TransactionType;
  categories?: string[];
  interval: Interval;
  period?: Interval;
  comparison: ComparisonType;
  statType: StatisticsType;
}

interface ValueByPeriodParams {
  config: CardConfig;
  after?: Moment;
  before?: Moment;
  dependencies?: any[];
}

interface StatisticsResponseEntry {
  expense: number;
  income: number;
  after: number;
  before: number;
}

interface StatisticsFormattedEntry {
  min: number;
  max: number;
  minDate?: Moment;
  maxDate?: Moment;
}

type StatisticsData = number | StatisticsFormattedEntry;

const getDateRange = (
  interval: Interval,
  after?: Moment,
  before?: Moment,
): [Moment, Moment] => {
  const { value, unit } = interval;
  const end = before || moment().endOf(unit as moment.unitOfTime.StartOf);
  const start = after || end.clone().subtract(value - 1, unit as moment.unitOfTime.DurationConstructor).startOf(unit as moment.unitOfTime.StartOf);
  return [start, end];
};

const calculateStatValue = (
  data: { expense: number; income: number; after: Moment; before: Moment }[],
  type: 'income' | 'expense',
  statType: CardConfig['statType'],
  isCurrentPeriod: boolean,
): StatisticsData => {
  if (!data || data.length === 0) {
    return statType === StatisticsType.MinMax ? { min: 0, max: 0 } : 0;
  }

  const values = data.map((item) => (type === 'expense' ? item.expense : item.income));
  const nonZeroValues = values.filter((v) => v > 0);

  switch (statType) {
    case StatisticsType.Sum:
      return values.reduce((a, b) => a + b, 0);
    case StatisticsType.Daily:
      const days = moment(data[data.length - 1].before).diff(moment(data[0].after), 'days') + 1;
      return values.reduce((a, b) => a + b, 0) / days;
    case StatisticsType.Avg:
      return nonZeroValues.length > 0 ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length : 0;
    case StatisticsType.MinMax:
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
};

export const useValueByPeriod = (params: ValueByPeriodParams) => {
  const { config, after, before, dependencies = [] } = params;
  const { type, categories, interval, period, comparison, statType } = config;
  const { list: categoryList } = useCategories();

  const [periodStart, periodEnd] = getDateRange(interval, after, before);
  const isCurrentPeriod = periodEnd.isAfter(moment());

  const categoryIds = categories
    ?.map((categoryName) => {
      const category = categoryList.find((cat) => cat.name === categoryName);
      return category ? category.id : null;
    })
    .filter((id): id is number => id !== null);

  const queryParams = qs.stringify(
    {
      after: periodStart.format(BACKEND_DATE_FORMAT),
      before: periodEnd.format(BACKEND_DATE_FORMAT),
      interval: period ? `${period.value} ${period.unit}` : `${interval.value} ${interval.unit}`,
      type,
      categories: categoryIds,
    },
    { arrayFormat: 'brackets' },
  );

  const {
    data: currentData,
    isLoading: isLoadingCurrent,
    error: errorCurrent,
  } = useQuery<StatisticsResponseEntry[], Error, StatisticsFormattedEntry[]>({
    queryKey: ['valueByPeriod', {
      periodStart,
      periodEnd,
      interval: period || interval,
      type,
      categories,
    }, ...dependencies],
    queryFn: () => axiosFetcher(`/api/v2/statistics/value-by-period?${queryParams}`),
    select: (data: StatisticsResponseEntry[]): StatisticsFormattedEntry[] => data.map((item: StatisticsResponseEntry) => ({
      ...item,
      after: moment.unix(item.after),
      before: moment.unix(item.before),
    })),
  });

  // Map PeriodUnit to the units accepted by generatePreviousTimeframe
  const unitMapping: { [key in PeriodUnit]: 'day' | 'week' | 'month' | 'year' } = {
    day: 'day',
    week: 'week',
    month: 'month',
    quarter: 'month', // Since quarters are 3 months, we'll handle it separately
    year: 'year',
  };

  let comparisonStart: Moment;
  let comparisonEnd: Moment;

  if (comparison === ComparisonType.Previous) {
    if (interval.unit === 'quarter') {
      // Handle 'quarter' separately
      const monthsSpan = interval.value * 3;
      comparisonStart = periodStart.clone().subtract(monthsSpan, 'months').startOf('quarter');
      comparisonEnd = periodEnd.clone().subtract(monthsSpan, 'months').endOf('quarter');
    } else {
      const unitForGeneratePreviousTimeframe = unitMapping[interval.unit];
      const { previousStart, previousEnd } = generatePreviousTimeframe(
        periodStart,
        periodEnd,
        unitForGeneratePreviousTimeframe,
      );
      comparisonStart = previousStart;
      comparisonEnd = previousEnd;
    }
  } else if (comparison === ComparisonType.SameLastYear) {
    comparisonStart = periodStart.clone().subtract(1, 'year');
    comparisonEnd = periodEnd.clone().subtract(1, 'year');
  } else {
    throw new Error('Invalid comparison type');
  }

  const comparisonQueryParams = qs.stringify(
    {
      after: comparisonStart.format(BACKEND_DATE_FORMAT),
      before: comparisonEnd.format(BACKEND_DATE_FORMAT),
      interval: period ? `${period.value} ${period.unit}` : `${interval.value} ${interval.unit}`,
      type,
      categories: categoryIds,
    },
    { arrayFormat: 'brackets' },
  );

  const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    error: errorComparison,
  } = useQuery<StatisticsResponseEntry[], Error, StatisticsFormattedEntry[]>({
    queryKey: [
      'valueByPeriod',
      { comparisonStart, comparisonEnd, interval: period || interval, type, categories },
      ...dependencies,
    ],
    queryFn: () => axiosFetcher(`/api/v2/statistics/value-by-period?${comparisonQueryParams}`),
    select: (data: StatisticsResponseEntry[]): StatisticsFormattedEntry[] =>
      data.map((item: StatisticsResponseEntry) => ({
        ...item,
        after: moment.unix(item.after),
        before: moment.unix(item.before),
      })),
  });

  const currentValue = calculateStatValue(currentData || [], type, statType, isCurrentPeriod);
  const comparisonValue = calculateStatValue(comparisonData || [], type, statType, false);

  const calculateChange = (current: number, comparison: number) => {
    if (comparison === 0) return current === 0 ? 0 : 100;
    return ((current - comparison) / Math.abs(comparison)) * 100;
  };

  let percentageChange: number | { min: number; max: number } = 0;
  let isIncrease: boolean | { min: boolean; max: boolean } = false;

  if (typeof currentValue === 'number' && typeof comparisonValue === 'number') {
    percentageChange = calculateChange(currentValue, comparisonValue);
    isIncrease = currentValue > comparisonValue;
  } else if (typeof currentValue === 'object' && typeof comparisonValue === 'object') {
    percentageChange = {
      min: calculateChange(currentValue.min, comparisonValue.min),
      max: calculateChange(currentValue.max, comparisonValue.max),
    };
    isIncrease = {
      min: currentValue.min > comparisonValue.min,
      max: currentValue.max > comparisonValue.max,
    };
  }

  const isPositive = type === 'income' ? isIncrease : !isIncrease;

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
    error: errorCurrent || errorComparison,
    minDate: typeof currentValue === 'object' ? currentValue.minDate : undefined,
    maxDate: typeof currentValue === 'object' ? currentValue.maxDate : undefined,
    isCurrentPeriod,
  };
};
