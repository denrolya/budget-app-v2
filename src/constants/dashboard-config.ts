import { TrendingDown, TrendingUp, Utensils } from 'lucide-react';

export interface CardConfig {
  id: string
  type: 'income' | 'expense'
  category: string | null
  period: 'week' | 'month' | 'year'
  comparison: 'previous' | 'same-last-year'
  amount: number
  previousAmount: number
  statType: 'sum' | 'daily' | 'avg' | 'min-max'
  minAmount?: number
  maxAmount?: number
}

export const cardConfigs: CardConfig[] = [
  {
    id: 'total-expenses-month',
    type: 'expense',
    category: null,
    period: 'month',
    comparison: 'previous',
    amount: 3000,
    previousAmount: 2800,
    statType: 'sum',
  },
  {
    id: 'total-income-year',
    type: 'income',
    category: null,
    period: 'year',
    comparison: 'previous',
    amount: 60000,
    previousAmount: 55000,
    statType: 'sum',
  },
  {
    id: 'daily-expenses-month-vs-year',
    type: 'expense',
    category: null,
    period: 'month',
    comparison: 'same-last-year',
    amount: 100,
    previousAmount: 90,
    statType: 'daily',
  },
  {
    id: 'food-expenses-month',
    type: 'expense',
    category: 'Food & Drinks',
    period: 'month',
    comparison: 'previous',
    amount: 600,
    previousAmount: 550,
    statType: 'sum',
  },
  {
    id: 'daily-food-expenses',
    type: 'expense',
    category: 'Food & Drinks',
    period: 'month',
    comparison: 'previous',
    amount: 20,
    previousAmount: 18,
    statType: 'daily',
  },
  {
    id: 'groceries-min-max-month',
    type: 'expense',
    category: 'Groceries',
    period: 'month',
    comparison: 'previous',
    amount: 400,
    previousAmount: 380,
    statType: 'min-max',
    minAmount: 300,
    maxAmount: 500,
  },
  {
    id: 'groceries-avg-check',
    type: 'expense',
    category: 'Groceries',
    period: 'month',
    comparison: 'previous',
    amount: 75,
    previousAmount: 70,
    statType: 'avg',
  },
];
