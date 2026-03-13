import { Type as TransactionType } from '@/features/transactions';
import { type StatisticsConfig, ComparisonType, IntervalUnit, StatisticsType } from '@/types/statistics';

// ── KPI strip ──────────────────────────────────────────────────────────────────
// Edit this array to add / remove / reorder tiles on the dashboard KPI strip.
// 'net-worth'  → cash balance + debt breakdown (no extra config needed)
// 'stat'       → any StatisticsConfig-based metric with a pct-change indicator
// 'net-revenue'→ income minus expense for a chosen pair of stat configs

export type KpiStatTile = {
  kind: 'stat';
  label: string;
  positiveIsGood: boolean;
  queryKey: string;
  config: StatisticsConfig;
};

export type KpiTileConfig =
  | { kind: 'net-worth' }
  | { kind: 'net-revenue'; incomeConfig: StatisticsConfig; expenseConfig: StatisticsConfig }
  | KpiStatTile;

const monthlyIncomeConfig: StatisticsConfig = {
  title: 'Monthly Incomes',
  type: TransactionType.Income,
  timeframe: { unit: IntervalUnit.Month, value: 1 },
  comparison: ComparisonType.Previous,
  statType: StatisticsType.Sum,
};

const monthlyExpenseConfig: StatisticsConfig = {
  title: 'Monthly Expenses',
  type: TransactionType.Expense,
  timeframe: { unit: IntervalUnit.Month, value: 1 },
  comparison: ComparisonType.Previous,
  statType: StatisticsType.Sum,
};

export const kpiConfig: KpiTileConfig[] = [
  { kind: 'net-worth' },
  {
    kind: 'stat',
    label: 'Income · This Month',
    positiveIsGood: true,
    queryKey: 'kpi-income',
    config: monthlyIncomeConfig,
  },
  {
    kind: 'stat',
    label: 'Expenses · This Month',
    positiveIsGood: false,
    queryKey: 'kpi-expenses',
    config: monthlyExpenseConfig,
  },
  { kind: 'net-revenue', incomeConfig: monthlyIncomeConfig, expenseConfig: monthlyExpenseConfig },
];

// ── Statistics card grids ──────────────────────────────────────────────────────

export const cardConfigs = {
  // Global cards
  global: [
    {
      title: 'Monthly Expenses',
      type: TransactionType.Expense,
      timeframe: { unit: IntervalUnit.Month, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Sum,
    },
    {
      title: 'Monthly Incomes',
      type: TransactionType.Income,
      timeframe: { unit: IntervalUnit.Month, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Sum,
    },
  ],

  // Annual Summary
  annual: [
    {
      title: 'Yearly Income',
      type: TransactionType.Income,
      timeframe: { unit: IntervalUnit.Year, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Sum,
    },
    {
      title: 'Yearly Expenses',
      type: TransactionType.Expense,
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
      title: 'Avg Monthly Expenses',
      type: TransactionType.Expense,
      timeframe: { unit: IntervalUnit.Year, value: 1 },
      period: { unit: IntervalUnit.Month, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Avg,
    },
  ],

  // Weekly/Daily Overview
  daily: [
    {
      title: 'Daily Expenses',
      type: TransactionType.Expense,
      timeframe: { unit: IntervalUnit.Year, value: 1 },
      comparison: ComparisonType.SameLastYear,
      statType: StatisticsType.Daily,
    },
    {
      title: 'Daily Income',
      type: TransactionType.Income,
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
  ],

  // Category-Specific Expenses
  categorySpecific: [
    {
      title: 'Avg Groceries',
      type: TransactionType.Expense,
      categories: ['Groceries'],
      timeframe: { unit: IntervalUnit.Month, value: 1 },
      period: { unit: IntervalUnit.Week, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Avg,
    },
    {
      title: 'Avg Food',
      type: TransactionType.Expense,
      categories: ['Food & Drinks'],
      timeframe: { unit: IntervalUnit.Month, value: 1 },
      period: { unit: IntervalUnit.Week, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Avg,
    },
    {
      title: 'Avg Month Food',
      type: TransactionType.Expense,
      categories: ['Food & Drinks'],
      timeframe: { unit: IntervalUnit.Year, value: 1 },
      period: { unit: IntervalUnit.Month, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Avg,
    },
    {
      title: 'Food Expenses',
      type: TransactionType.Expense,
      categories: ['Food & Drinks'],
      timeframe: { unit: IntervalUnit.Year, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.Sum,
    },
    {
      title: '🛒 Groceries',
      type: TransactionType.Expense,
      categories: ['Food & Drinks'],
      timeframe: { unit: IntervalUnit.Year, value: 1 },
      period: { unit: IntervalUnit.Month, value: 1 },
      comparison: ComparisonType.Previous,
      statType: StatisticsType.MinMax,
    },
  ],
};
