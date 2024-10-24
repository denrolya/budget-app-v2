import { Type as TransactionType } from '@/types/transaction';
import { StatisticsConfig, ComparisonType, IntervalUnit, StatisticsType } from '@/types/statistics';

export const cardConfigs: StatisticsConfig[] = [
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
