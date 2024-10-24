import { Type as TransactionType } from '@/models/Transaction';

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

export interface CardConfig {
  title: string;
  type: TransactionType;
  categories?: string[];
  timeframe: Interval;
  period?: Interval;
  comparison: ComparisonType;
  statType: StatisticsType;
}

export const cardConfigs: CardConfig[] = [
  // Yearly Income and Expenses
  {
    title: 'Yearly Income',
    type: TransactionType.Income,
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Sum,
  },
  {
    title: 'Avg Monthly Income',
    type: TransactionType.Income,
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    period: { unit: IntervalUnit.Month, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Avg,
  },
  {
    title: 'Yearly Expenses',
    type: TransactionType.Expense,
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Sum,
  },
  {
    title: 'Avg Monthly Expenses',
    type: TransactionType.Expense,
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    period: { unit: IntervalUnit.Month, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Avg,
  },

  // Monthly Expenses
  {
    title: 'Monthly Expenses',
    type: TransactionType.Expense,
    timeframe: { unit: IntervalUnit.Month, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Sum,
  },
  {
    title: 'Avg Groceries',
    type: TransactionType.Expense,
    categories: ['Groceries'],
    timeframe: { unit: IntervalUnit.Month, value: 1 },
    period: { unit: IntervalUnit.Week, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Avg,
  },

  // Daily Statistics
  {
    title: 'Daily Expenses',
    type: TransactionType.Expense,
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    comparison: ComparisonType.SameLastYear,
    statType: StatisticsType.Daily,
  },
  {
    title: 'Daily Food Expenses',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Daily,
  },

  // Category-Specific Statistics
  {
    title: 'Food Expenses',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.Sum,
  },
  {
    title: 'Groceries',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    timeframe: { unit: IntervalUnit.Year, value: 1 },
    period: { unit: IntervalUnit.Month, value: 1 },
    comparison: ComparisonType.Previous,
    statType: StatisticsType.MinMax,
  },
];
