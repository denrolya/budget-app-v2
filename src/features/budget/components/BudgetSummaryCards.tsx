import moment from 'moment';
import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const fmtAmt = (amount: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const getAllIds = (cat: Category): number[] => {
  const ids: number[] = [cat.id];
  for (const child of cat.children) ids.push(...getAllIds(child));
  return ids;
};

const Divider = () => <span className="text-border select-none">·</span>;

const Stat: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <span className="flex items-baseline gap-1">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className={cn('font-semibold tabular-nums text-sm', className)}>{value}</span>
  </span>
);

function computeHealthScore(
  percentUsed: number,
  daysElapsed: number,
  daysTotal: number,
  totalPlannedIncome: number,
  totalActualIncome: number,
): { score: number; grade: string; gradeColor: string } {
  let score = 100;

  // Overspending penalty
  if (percentUsed > 100) {
    score -= Math.min(40, (percentUsed - 100) * 0.5);
  } else if (percentUsed > 80) {
    score -= 10;
  }

  // Pace penalty (only while budget is in progress)
  if (daysTotal > 0 && daysElapsed > 0 && daysElapsed < daysTotal) {
    const expectedPct = (daysElapsed / daysTotal) * 100;
    if (percentUsed > expectedPct + 10) {
      score -= Math.min(20, (percentUsed - expectedPct - 10) * 0.3);
    }
  }

  // Income shortfall penalty
  if (totalPlannedIncome > 0) {
    const incomePct = (totalActualIncome / totalPlannedIncome) * 100;
    if (incomePct < 90) {
      score -= Math.min(15, (90 - incomePct) * 0.2);
    }
  }

  score = Math.max(0, Math.round(score));

  let grade: string;
  let gradeColor: string;
  if (score >= 90) { grade = 'A'; gradeColor = 'text-green-600 dark:text-green-400'; }
  else if (score >= 75) { grade = 'B'; gradeColor = 'text-green-600 dark:text-green-400'; }
  else if (score >= 60) { grade = 'C'; gradeColor = 'text-yellow-600 dark:text-yellow-400'; }
  else if (score >= 45) { grade = 'D'; gradeColor = 'text-orange-600 dark:text-orange-400'; }
  else { grade = 'F'; gradeColor = 'text-destructive'; }

  return { score, grade, gradeColor };
}

const BudgetSummaryCards: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();

  const stats = useMemo(() => {
    const expenseIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? []).flatMap(getAllIds),
    );
    const incomeIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income) ?? []).flatMap(getAllIds),
    );

    let totalPlannedExpense = 0;
    let totalPlannedIncome = 0;
    for (const line of budget.lines ?? []) {
      const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
      if (rate === null) continue;
      const converted = line.plannedAmount * rate;
      if (expenseIds.has(line.categoryId)) totalPlannedExpense += converted;
      else if (incomeIds.has(line.categoryId)) totalPlannedIncome += converted;
    }

    let totalActualExpense = 0;
    let totalActualIncome = 0;
    for (const item of analytics) {
      for (const [currency, cv] of Object.entries(item.convertedValues)) {
        const rate = currency === displayCurrency ? 1 : getExchangeRate(currency, displayCurrency, rates);
        if (rate !== null) {
          totalActualExpense += cv.expense * rate;
          totalActualIncome += cv.income * rate;
        }
      }
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

  const remainingColor = stats.remaining < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400';
  const pctColor =
    stats.percentUsed > 100
      ? 'text-destructive'
      : stats.percentUsed > 80
        ? 'text-yellow-600 dark:text-yellow-400'
        : undefined;
  const savingsColor = stats.netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive';

  const { score, grade, gradeColor } = computeHealthScore(
    stats.percentUsed,
    stats.daysElapsed,
    stats.daysTotal,
    stats.totalPlannedIncome,
    stats.totalActualIncome,
  );

  return (
    <div className="rounded-lg border bg-card px-4 py-3 space-y-2 text-sm">
      {/* Expense row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground w-16 shrink-0">
          Expenses
        </span>
        <Stat label="planned" value={fmtAmt(stats.totalPlannedExpense, displayCurrency)} />
        <Divider />
        <Stat label="actual" value={fmtAmt(stats.totalActualExpense, displayCurrency)} />
        <Divider />
        <Stat
          label={stats.remaining < 0 ? 'over' : 'left'}
          value={fmtAmt(stats.remaining, displayCurrency)}
          className={remainingColor}
        />
        <Divider />
        <Stat label="used" value={`${stats.percentUsed.toFixed(1)}%`} className={pctColor} />
        <Divider />
        <Stat label="days" value={`${stats.daysElapsed}/${stats.daysTotal}`} />
        {stats.daysLeft > 0 && <span className="text-xs text-muted-foreground">({stats.daysLeft} left)</span>}
      </div>

      {/* Income row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground w-16 shrink-0">Income</span>
        <Stat label="planned" value={fmtAmt(stats.totalPlannedIncome, displayCurrency)} />
        <Divider />
        <Stat
          label="actual"
          value={fmtAmt(stats.totalActualIncome, displayCurrency)}
          className="text-green-600 dark:text-green-400"
        />
        <Divider />
        <Stat
          label="net savings"
          value={`${stats.netSavings >= 0 ? '+' : '-'}${fmtAmt(stats.netSavings, displayCurrency)}`}
          className={savingsColor}
        />
      </div>

      {/* Health score row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground w-16 shrink-0">Health</span>
        <span className={cn('font-bold text-base tabular-nums', gradeColor)}>{grade}</span>
        <span className="text-xs text-muted-foreground">{score}/100</span>
        <Divider />
        <div className="flex items-center gap-1">
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              style={{ width: `${score}%` }}
              className={cn('h-full rounded-full transition-all', gradeColor === 'text-destructive'
                ? 'bg-destructive'
                : gradeColor.includes('yellow') || gradeColor.includes('orange')
                  ? 'bg-yellow-500'
                  : 'bg-green-500')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummaryCards;
