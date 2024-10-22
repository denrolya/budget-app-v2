import { Interval } from '@/constants/dashboard-config';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { useCategories } from '@/contexts/FinanceData';
import { Type as TransactionType } from '@/models/Transaction';
import { axiosFetcher } from '@/services/api';
import { generatePreviousTimeframe } from '@/utils/generatePreviousTimeframe';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import moment, { Moment } from 'moment';
import qs from 'qs';
import { useEffect, useMemo } from 'react';

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
  dependencies?: unknown[];
}

interface StatisticsResponseEntry {
  expense: number;
  income: number;
  after: number;
  before: number;
}

interface StatisticsFormattedEntry {
  expense: number;
  income: number;
  after: Moment;
  before: Moment;
}

interface MinMaxStatistics {
  min: number;
  max: number;
  minDate?: Moment;
  maxDate?: Moment;
}

type StatisticsData = number | MinMaxStatistics

type PercentageChange = number | { min: number; max: number }
type IsIncrease = boolean | { min: boolean; max: boolean }

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
  data: StatisticsFormattedEntry[],
  type: TransactionType,
  statType: StatisticsType,
  isCurrentPeriod: boolean,
): StatisticsData => {
  if (!data || data.length === 0) {
    return statType === StatisticsType.MinMax ? { min: 0, max: 0 } : 0;
  }

  const values = data.map((item) => (type === TransactionType.Expense ? item.expense : item.income));
  const nonZeroValues = values.filter((v) => v > 0);

  switch (statType) {
    case StatisticsType.Sum:
      return values.reduce((a, b) => a + b, 0);
    case StatisticsType.Daily: {
      const days = data[data.length - 1].before.diff(data[0].after, 'days') + 1;
      return values.reduce((a, b) => a + b, 0) / days;
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
  }
};

const queryKey = 'value-by-period';

export const useValueByPeriod = ({ config, after, before, dependencies = [] }: ValueByPeriodParams): {
  currentData: StatisticsFormattedEntry[] | undefined
  comparisonData: StatisticsFormattedEntry[] | undefined
  currentValue: StatisticsData
  comparisonValue: StatisticsData
  percentageChange: PercentageChange
  isIncrease: IsIncrease
  isPositive: boolean | { min: boolean; max: boolean }
  selectedTimeframe: { after: Moment; before: Moment }
  comparisonTimeframe: { after: Moment; before: Moment }
  isLoading: boolean
  error: Error | null
  minDate: Moment | undefined
  maxDate: Moment | undefined
  isCurrentPeriod: boolean
} => {
  const queryClient = useQueryClient();
  const { type, categories, interval, period, comparison, statType } = config;
  const { list: categoryList } = useCategories();

  const [periodStart, periodEnd] = getDateRange(interval, after, before);
  const isCurrentPeriod = periodEnd.isAfter(moment());

  const categoryIds = useMemo(() =>
      categories
        ?.map((categoryName) => categoryList.find((cat) => cat.name === categoryName)?.id)
        .filter((id): id is number => id !== null) ?? [],
    [categories, categoryList],
  );

  const createQueryParams = (start: Moment, end: Moment): string => qs.stringify(
    {
      after: start.format(BACKEND_DATE_FORMAT),
      before: end.format(BACKEND_DATE_FORMAT),
      interval: period ? `${period.value} ${period.unit}` : `${interval.value} ${interval.unit}`,
      type,
      categories: categoryIds,
    },
    { arrayFormat: 'brackets' },
  );

  const fetchData = async (start: Moment, end: Moment): Promise<StatisticsResponseEntry[]> => {
    const queryParams = createQueryParams(start, end);
    return axiosFetcher(`/api/v2/statistics/value-by-period?${queryParams}`);
  };

  const useStatisticsQuery = (start: Moment, end: Moment): UseQueryResult<StatisticsFormattedEntry[], Error> =>
    useQuery<StatisticsResponseEntry[], Error, StatisticsFormattedEntry[]>({
      queryKey: [queryKey, { start, end, interval: period || interval, type, categories }, ...dependencies],
      queryFn: () => fetchData(start, end),
      select: (data: StatisticsResponseEntry[]): StatisticsFormattedEntry[] =>
        data.map((item: StatisticsResponseEntry) => ({
          ...item,
          after: moment.unix(item.after),
          before: moment.unix(item.before),
        })),
    });

  const {
    data: currentData,
    isLoading: isLoadingCurrent,
    error: errorCurrent,
  } = useStatisticsQuery(periodStart, periodEnd);

  const [comparisonStart, comparisonEnd] = useMemo((): [Moment, Moment] => {
    if (comparison === ComparisonType.Previous) {
      if (interval.unit === 'quarter') {
        const monthsSpan = interval.value * 3;
        return [
          periodStart.clone().subtract(monthsSpan, 'months').startOf('quarter'),
          periodEnd.clone().subtract(monthsSpan, 'months').endOf('quarter'),
        ];
      } else {
        const { previousStart, previousEnd } = generatePreviousTimeframe(
          periodStart,
          periodEnd,
          interval.unit as 'day' | 'week' | 'month' | 'year',
        );
        return [previousStart, previousEnd];
      }
    } else if (comparison === ComparisonType.SameLastYear) {
      return [
        periodStart.clone().subtract(1, 'year'),
        periodEnd.clone().subtract(1, 'year'),
      ];
    }
    throw new Error('Invalid comparison type');
  }, [comparison, interval, periodStart, periodEnd]);

  const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    error: errorComparison,
  } = useStatisticsQuery(comparisonStart, comparisonEnd);

  useEffect(() => () => {
    queryClient.cancelQueries({ queryKey: [queryKey] });
  }, [queryClient]);

  const currentValue = calculateStatValue(currentData || [], type, statType, isCurrentPeriod);
  const comparisonValue = calculateStatValue(comparisonData || [], type, statType, false);

  const calculateChange = (current: number, comparison: number): number => {
    if (comparison === 0) return current === 0 ? 0 : 100;
    return ((current - comparison) / Math.abs(comparison)) * 100;
  };

  const { percentageChange, isIncrease } = useMemo((): {
    percentageChange: PercentageChange;
    isIncrease: IsIncrease
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
