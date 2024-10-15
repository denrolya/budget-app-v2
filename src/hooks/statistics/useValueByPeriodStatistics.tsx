import { useQuery } from '@tanstack/react-query';
import moment, { Moment } from 'moment';
import qs from 'qs';

import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useCategories } from '@/contexts/FinanceData';
import { Interval } from '@/constants/dashboard-config';
import { axiosFetcher } from '@/services/api';
import { Type as TransactionType } from '@/models/Transaction';

export type PeriodUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

export enum StatisticsType {
  Sum = 'sum',
  Daily = 'daily',
  Avg ='avg',
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

const getDateRange = (interval: Interval, after?: Moment, before?: Moment): [Moment, Moment] => {
  const { value, unit } = interval;
  const end = before || moment().endOf(unit);
  const start = after || end.clone().subtract(value - 1, unit).startOf(unit);
  return [start, end];
};

const calculateStatValue = (
  data: { expense: number; income: number; after: Moment; before: Moment }[],
  type: 'income' | 'expense',
  statType: CardConfig['statType'],
  isCurrentPeriod: boolean
): StatisticsData => {
  if (!data || data.length === 0) {
    return statType === StatisticsType.MinMax ? { min: 0, max: 0 } : 0;
  }

  const values = data.map(item => (type === 'expense' ? item.expense : item.income));
  const nonZeroValues = values.filter(v => v > 0);

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
        maxDate: data[maxIndex].after
      };
  }
};

export const useValueByPeriod = (params: ValueByPeriodParams) => {
  const { config, after, before, dependencies = [] } = params;
  const { type, categories, interval, period, comparison, statType } = config;
  const { list: categoryList } = useCategories();

  const [periodStart, periodEnd] = getDateRange(interval, after, before);
  const isCurrentPeriod = periodEnd.isAfter(moment());

  const categoryIds = categories?.map(categoryName => {
    const category = categoryList.find(cat => cat.name === categoryName);
    return category ? category.id : null;
  }).filter((id): id is number => id !== null);

  const queryParams = qs.stringify({
    after: periodStart.format(BACKEND_DATE_FORMAT),
    before: periodEnd.format(BACKEND_DATE_FORMAT),
    interval: period ? `${period.value} ${period.unit}` : `${interval.value} ${interval.unit}`,
    type,
    categories: categoryIds,
  }, { arrayFormat: 'brackets' });

  const { data: currentData, isLoading: isLoadingCurrent, error: errorCurrent } = useQuery<StatisticsResponseEntry[], Error, StatisticsFormattedEntry[]>({
    queryKey: ['valueByPeriod', { periodStart, periodEnd, interval: period || interval, type, categories }, ...dependencies],
    queryFn: () => axiosFetcher(`/api/v2/statistics/value-by-period?${queryParams}`),
    select: (data: StatisticsResponseEntry[]): StatisticsFormattedEntry[] => data.map((item: StatisticsResponseEntry) => ({
      ...item,
      after: moment.unix(item.after),
      before: moment.unix(item.before),
    })),
  });

  const [comparisonStart, comparisonEnd] = comparison === ComparisonType.Previous
    ? [periodStart.clone().subtract(interval.value, interval.unit), periodEnd.clone().subtract(interval.value, interval.unit)]
    : [periodStart.clone().subtract(1, 'year'), periodEnd.clone().subtract(1, 'year')];

  const comparisonQueryParams = qs.stringify({
    after: comparisonStart.format(BACKEND_DATE_FORMAT),
    before: comparisonEnd.format(BACKEND_DATE_FORMAT),
    interval: period ? `${period.value} ${period.unit}` : `${interval.value} ${interval.unit}`,
    type,
    categories: categoryIds,
  }, { arrayFormat: 'brackets' });

  const { data: comparisonData, isLoading: isLoadingComparison, error: errorComparison } = useQuery<StatisticsResponseEntry[], Error, StatisticsFormattedEntry[]>({
    queryKey: ['valueByPeriod', { comparisonStart, comparisonEnd, interval: period || interval, type, categories }, ...dependencies],
    queryFn: () => axiosFetcher(`/api/v2/statistics/value-by-period?${comparisonQueryParams}`),
    select: (data: StatisticsResponseEntry[]): StatisticsFormattedEntry[] => data.map((item: StatisticsResponseEntry) => ({
      ...item,
      after: moment.unix(item.after),
      before: moment.unix(item.before),
    })),
  });

  const currentValue = calculateStatValue(currentData || [], type, statType, isCurrentPeriod);
  const comparisonValue = calculateStatValue(comparisonData || [], type, statType, false);

  const calculateChange = (current: number, comparison: number) => {
    if (comparison === 0) return current === 0 ? 0 : 100;
    return ((comparison - current) / comparison) * 100;
  };

  let percentageChange: number | { min: number; max: number } = 0;
  let isIncrease: boolean | { min: boolean; max: boolean } = false;

  if (typeof currentValue === 'number' && typeof comparisonValue === 'number') {
    percentageChange = calculateChange(currentValue, comparisonValue);
    isIncrease = currentValue > comparisonValue;
  } else if (typeof currentValue === 'object' && typeof comparisonValue === 'object') {
    percentageChange = {
      min: calculateChange(currentValue.min, comparisonValue.min),
      max: calculateChange(currentValue.max, comparisonValue.max)
    };
    isIncrease = {
      min: currentValue.min > comparisonValue.min,
      max: currentValue.max > comparisonValue.max
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
    isLoading: isLoadingCurrent || isLoadingComparison,
    error: errorCurrent || errorComparison,
    minDate: typeof currentValue === 'object' ? currentValue.minDate : undefined,
    maxDate: typeof currentValue === 'object' ? currentValue.maxDate : undefined,
    isCurrentPeriod,
  };
};
