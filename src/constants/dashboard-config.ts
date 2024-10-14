import { Type as TransactionType } from '@/models/Transaction';

export type PeriodUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface Interval {
  unit: PeriodUnit;
  value: number;
}

export type ComparisonType = 'previous' | 'same-last-year';

export type StatType = 'sum' | 'daily' | 'avg' | 'min-max';

export interface CardConfig {
  title: string;
  type: TransactionType;
  categories?: string[];
  interval: Interval;
  period?: Interval;
  comparison: ComparisonType;
  statType: StatType;
}

export const cardConfigs: CardConfig[] = [
  // Yearly Income and Expenses
  {
    title: 'Yearly Income',
    type: TransactionType.Income,
    interval: { unit: 'year', value: 1 },
    comparison: 'previous',
    statType: 'sum',
  },
  {
    title: 'Avg Monthly Income',
    type: TransactionType.Income,
    interval: { unit: 'year', value: 1 },
    period: { unit: 'month', value: 1 },
    comparison: 'previous',
    statType: 'avg',
  },
  {
    title: 'Yearly Expenses',
    type: TransactionType.Expense,
    interval: { unit: 'year', value: 1 },
    comparison: 'previous',
    statType: 'sum',
  },
  {
    title: 'Avg Monthly Expenses',
    type: TransactionType.Expense,
    interval: { unit: 'year', value: 1 },
    period: { unit: 'month', value: 1 },
    comparison: 'previous',
    statType: 'avg',
  },

  // Monthly Expenses
  {
    title: 'Monthly Expenses',
    type: TransactionType.Expense,
    interval: { unit: 'month', value: 1 },
    comparison: 'previous',
    statType: 'sum',
  },
  {
    title: 'Avg Groceries',
    type: TransactionType.Expense,
    categories: ['Groceries'],
    interval: { unit: 'month', value: 1 },
    period: { unit: 'week', value: 1 },
    comparison: 'previous',
    statType: 'avg',
  },

  // Daily Statistics
  {
    title: 'Daily Expenses',
    type: TransactionType.Expense,
    interval: { unit: 'year', value: 1 },
    comparison: 'same-last-year',
    statType: 'daily',
  },
  {
    title: 'Daily Food Expenses',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    interval: { unit: 'year', value: 1 },
    comparison: 'previous',
    statType: 'daily',
  },

  // Category-Specific Statistics
  {
    title: 'Food Expenses',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    interval: { unit: 'year', value: 1 },
    comparison: 'previous',
    statType: 'sum',
  },
  {
    title: 'Groceries',
    type: TransactionType.Expense,
    categories: ['Food & Drinks'],
    interval: { unit: 'year', value: 1 },
    period: { unit: 'month', value: 1 },
    comparison: 'previous',
    statType: 'min-max',
  },
];
