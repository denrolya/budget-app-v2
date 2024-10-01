import { Type as TransactionType } from '@/models/Transaction';

export type PeriodUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface Interval {
  unit: PeriodUnit;
  value: number;
}

export type ComparisonType = 'previous' | 'same-last-year';

export type StatType = 'sum' | 'daily' | 'avg' | 'min-max';

export interface CardConfig {
  id: string;
  title: string;
  type: TransactionType;
  categories?: string[];
  interval: Interval;
  period?: Interval;
  comparison: ComparisonType;
  statType: StatType;
}

export const cardConfigs: CardConfig[] = [
  {
    id: 'total-expenses-month',
    title: 'Monthly Expenses',
    type: TransactionType.Expense,
    interval: {
      unit: 'month',
      value: 1,
    },
    comparison: 'previous',
    statType: 'sum',
  },
  {
    id: 'total-income-year',
    title: 'Yearly Income',
    type: TransactionType.Income,
    interval: {
      unit: 'year',
      value: 1,
    },
    comparison: 'previous',
    statType: 'sum',
  },
  {
    id: 'daily-expenses-month-vs-year',
    title: 'Daily Expenses',
    type: TransactionType.Expense,
    interval: {
      unit: 'month',
      value: 1,
    },
    comparison: 'same-last-year',
    statType: 'daily',
  },
  {
    id: 'food-expenses-month',
    title: 'Food Expenses',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    interval: {
      unit: 'year',
      value: 1,
    },
    comparison: 'previous',
    statType: 'sum',
  },
  {
    id: 'daily-food-expenses',
    title: 'Daily Food Expenses',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    interval: {
      unit: 'month',
      value: 1,
    },
    comparison: 'previous',
    statType: 'daily',
  },
  {
    id: 'groceries-min-max-month',
    title: 'Groceries',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    interval: {
      unit: 'year',
      value: 1,
    },
    period: {
      unit: 'month',
      value: 1,
    },
    comparison: 'previous',
    statType: 'min-max',
  },
  {
    id: 'groceries-avg-check',
    title: 'Avg Groceries',
    type: TransactionType.Expense,
    categories: ['Groceries'],
    interval: {
      unit: 'month',
      value: 1,
    },
    period: {
      unit: 'week',
      value: 1,
    },
    comparison: 'previous',
    statType: 'avg',
  },
];
