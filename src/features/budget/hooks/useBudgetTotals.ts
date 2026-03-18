import moment from 'moment';
import { useMemo } from 'react';

import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';
import type { DisplayCurrency } from '../components/BudgetDisplayCurrency';

const getAllIds = (category: Category): number[] => {
  const ids: number[] = [category.id];
  for (const child of category.children) ids.push(...getAllIds(child));
  return ids;
};

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
  return getAllIds(category)
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

export interface HealthResult {
  score: number;
  grade: string;
  gradeColor: string;
}

export const computeHealthScore = (
  percentUsed: number,
  daysElapsed: number,
  daysTotal: number,
  totalPlannedIncome: number,
  totalActualIncome: number,
): HealthResult => {
  let score = 100;

  // Overspend penalty: 2pts per % over budget (e.g. 106% → -12, 120% → -40)
  if (percentUsed > 100) {
    score -= Math.min(50, (percentUsed - 100) * 2);
  } else if (percentUsed > 85) {
    // Approaching limit: mild penalty
    score -= Math.round((percentUsed - 85) * 0.5);
  }

  // Pace penalty: spending ahead of schedule (only for active budgets)
  if (daysTotal > 0 && daysElapsed > 0 && daysElapsed < daysTotal) {
    const expectedPct = (daysElapsed / daysTotal) * 100;
    if (percentUsed > expectedPct + 5) {
      score -= Math.min(20, (percentUsed - expectedPct - 5) * 0.5);
    }
  }

  // Income shortfall penalty
  if (totalPlannedIncome > 0) {
    const incomePct = (totalActualIncome / totalPlannedIncome) * 100;
    if (incomePct < 90) {
      score -= Math.min(15, (90 - incomePct) * 0.3);
    }
  }

  score = Math.max(0, Math.round(score));

  let grade: string;
  let gradeColor: string;
  if (score >= 90) {
    grade = 'A';
    gradeColor = 'text-success';
  } else if (score >= 75) {
    grade = 'B';
    gradeColor = 'text-success/75';
  } else if (score >= 60) {
    grade = 'C';
    gradeColor = 'text-warning';
  } else if (score >= 45) {
    grade = 'D';
    gradeColor = 'text-warning/75';
  } else {
    grade = 'F';
    gradeColor = 'text-destructive';
  }

  return { score, grade, gradeColor };
};

export const fmtBudgetAmt = (amount: number, currency: string): string => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const useBudgetTotals = (
  budget: BudgetDTO,
  analytics: BudgetAnalyticsItem[],
  displayCurrency: DisplayCurrency,
  rates: ConvertedValues | null,
): BudgetTotals => {
  const { data: catData } = useCategoryList();

  return useMemo(() => {
    const expenseIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? []).flatMap(getAllIds),
    );
    const incomeIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income) ?? []).flatMap(getAllIds),
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
