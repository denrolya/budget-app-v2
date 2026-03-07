import { Type as TransactionType } from '@/features/transactions';

export enum IntervalUnit {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Year = 'year',
}

export interface Interval {
  unit: IntervalUnit;
  value: number;
}

export enum ComparisonType {
  Previous = 'previous',
  SameLastYear = 'same-last-year',
}

export enum StatisticsType {
  Sum = 'sum',
  Daily = 'daily',
  Avg = 'avg',
  MinMax = 'min-max',
}

export interface StatisticsConfig {
  title: string;
  type: TransactionType;
  categories?: (number | string)[];
  accounts?: (number | string)[];
  timeframe: Interval;
  period?: Interval;
  comparison: ComparisonType;
  statType: StatisticsType;
}
