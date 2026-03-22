import moment from 'moment';
import { useMemo } from 'react';

import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';
import type { DisplayCurrency } from '../components/BudgetDisplayCurrency';
import { getAllDescendantIds } from '../utils';

const plannedRollup = (
  category: Category,
  linesMap: Map<number, { plannedAmount: number; plannedCurrency: string }>,
  displayCurrency: string,
  rates: ConvertedValues | null,
): number => {
  const own = linesMap.get(category.id);
  if (own) {
    const rate = getExchangeRate(own.plannedCurrency, displayCurrency, rates);
    return rate !== null ? own.plannedAmount * rate : 0;
  }
  return getAllDescendantIds(category)
    .slice(1)
    .reduce((sum, id) => {
      const line = linesMap.get(id);
      if (!line) return sum;
      const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
      return rate !== null ? sum + line.plannedAmount * rate : sum;
    }, 0);
};

export interface BudgetTotals {
  totalPlannedExpense: number;
  totalPlannedIncome: number;
  totalActualExpense: number;
  totalActualIncome: number;
  remaining: number;
  percentUsed: number;
  netSavings: number;
  daysTotal: number;
  daysElapsed: number;
  daysLeft: number;
}

const useBudgetTotals = (
  budget: BudgetDTO,
  analytics: BudgetAnalyticsItem[],
  displayCurrency: DisplayCurrency,
  rates: ConvertedValues | null,
): BudgetTotals => {
  const { data: catData } = useCategoryList();

  return useMemo(() => {
    const expenseIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? []).flatMap(
        getAllDescendantIds,
      ),
    );
    const incomeIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income) ?? []).flatMap(
        getAllDescendantIds,
      ),
    );

    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));

    const expenseRoots = catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? [];
    const incomeRoots = catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income) ?? [];
    const totalPlannedExpense = expenseRoots.reduce(
      (sum, root) => sum + plannedRollup(root, linesMap, displayCurrency, rates),
      0,
    );
    const totalPlannedIncome = incomeRoots.reduce(
      (sum, root) => sum + plannedRollup(root, linesMap, displayCurrency, rates),
      0,
    );

    let totalActualExpense = 0;
    let totalActualIncome = 0;
    for (const item of analytics) {
      const isExpense = expenseIds.has(item.categoryId);
      const isIncome = incomeIds.has(item.categoryId);
      if (!isExpense && !isIncome) continue;
      const cv = item.convertedValues[displayCurrency];
      if (!cv) continue;
      if (isExpense) totalActualExpense += cv.expense;
      if (isIncome) totalActualIncome += cv.income;
    }

    const remaining = totalPlannedExpense - totalActualExpense;
    const percentUsed = totalPlannedExpense > 0 ? (totalActualExpense / totalPlannedExpense) * 100 : 0;
    const netSavings = totalActualIncome - totalActualExpense;

    const start = moment(budget.startDate);
    const end = moment(budget.endDate);
    const today = moment();

    const daysTotal = end.diff(start, 'days') + 1;
    const daysElapsed = Math.max(0, Math.min(today.diff(start, 'days') + 1, daysTotal));
    const daysLeft = Math.max(0, end.diff(today, 'days'));

    return {
      totalPlannedExpense,
      totalPlannedIncome,
      totalActualExpense,
      totalActualIncome,
      remaining,
      percentUsed,
      netSavings,
      daysTotal,
      daysElapsed,
      daysLeft,
    };
  }, [budget, analytics, displayCurrency, rates, catData]);
};

export default useBudgetTotals;
