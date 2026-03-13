import { Info } from 'lucide-react';
import moment from 'moment';
import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ConvertedValues } from '@/features/transactions';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

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

const computeHealthScore = (
  percentUsed: number,
  daysElapsed: number,
  daysTotal: number,
  totalPlannedIncome: number,
  totalActualIncome: number,
): { score: number; grade: string; gradeColor: string } => {
  let score = 100;

  if (percentUsed > 100) {
    score -= Math.min(40, (percentUsed - 100) * 0.5);
  } else if (percentUsed > 80) {
    score -= 10;
  }

  if (daysTotal > 0 && daysElapsed > 0 && daysElapsed < daysTotal) {
    const expectedPct = (daysElapsed / daysTotal) * 100;
    if (percentUsed > expectedPct + 10) {
      score -= Math.min(20, (percentUsed - expectedPct - 10) * 0.3);
    }
  }

  if (totalPlannedIncome > 0) {
    const incomePct = (totalActualIncome / totalPlannedIncome) * 100;
    if (incomePct < 90) {
      score -= Math.min(15, (90 - incomePct) * 0.2);
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

const MiniBar: React.FC<{ value: number; max?: number; colorClass: string }> = ({ value, max = 100, colorClass }) => (
  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden min-w-0">
    <div
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      className={cn('h-full rounded-full transition-all', colorClass)}
    />
  </div>
);

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

  const pctColor =
    stats.percentUsed > 100
      ? 'text-destructive'
      : stats.percentUsed > 80
        ? 'text-warning'
        : undefined;

  const pctBarColor =
    stats.percentUsed > 100 ? 'bg-destructive' : stats.percentUsed > 80 ? 'bg-warning' : 'bg-primary';

  const remainingColor = stats.remaining < 0 ? 'text-destructive' : 'text-success';
  const savingsColor = stats.netSavings >= 0 ? 'text-success' : 'text-destructive';

  const { score, grade, gradeColor } = computeHealthScore(
    stats.percentUsed,
    stats.daysElapsed,
    stats.daysTotal,
    stats.totalPlannedIncome,
    stats.totalActualIncome,
  );

  const gradeBarColor =
    gradeColor === 'text-destructive'
      ? 'bg-destructive'
      : gradeColor.includes('warning')
        ? 'bg-warning'
        : 'bg-success';

  const daysPct = stats.daysTotal > 0 ? (stats.daysElapsed / stats.daysTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border -mx-4 border-t text-sm">
      {/* Expenses */}
      <div className="px-4 py-2.5 space-y-1.5">
        <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Expenses</div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className={cn('font-semibold tabular-nums truncate', pctColor)}>
            {fmtAmt(stats.totalActualExpense, displayCurrency)}
          </span>
          <span className="text-2xs text-muted-foreground shrink-0">
            / {fmtAmt(stats.totalPlannedExpense, displayCurrency)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MiniBar colorClass={pctBarColor} value={stats.percentUsed} />
          <span className={cn('text-2xs tabular-nums font-medium shrink-0', pctColor)}>
            {stats.percentUsed.toFixed(0)}%
          </span>
        </div>
        <div className={cn('text-2xs font-medium tabular-nums truncate', remainingColor)}>
          {stats.remaining < 0
            ? `${fmtAmt(Math.abs(stats.remaining), displayCurrency)} over`
            : `${fmtAmt(stats.remaining, displayCurrency)} left`}
        </div>
      </div>

      {/* Income */}
      <div className="px-4 py-2.5 space-y-1.5">
        <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Income</div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="font-semibold tabular-nums text-success truncate">
            {fmtAmt(stats.totalActualIncome, displayCurrency)}
          </span>
          {stats.totalPlannedIncome > 0 && (
            <span className="text-2xs text-muted-foreground shrink-0">
              / {fmtAmt(stats.totalPlannedIncome, displayCurrency)}
            </span>
          )}
        </div>
        {stats.totalPlannedIncome > 0 && (
          <MiniBar colorClass="bg-success" max={stats.totalPlannedIncome} value={stats.totalActualIncome} />
        )}
        <div className={cn('text-2xs font-medium tabular-nums truncate', savingsColor)}>
          {stats.netSavings >= 0 ? '+' : '-'}
          {fmtAmt(Math.abs(stats.netSavings), displayCurrency)} net
        </div>
      </div>

      {/* Health */}
      <div className="px-4 py-2.5 flex items-center gap-3">
        <span className={cn('font-bold text-2xl tabular-nums leading-none shrink-0', gradeColor)}>{grade}</span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1">
            <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Health</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs space-y-1.5 p-3">
                <p className="font-semibold text-sm">Budget Health Score</p>
                <p>Starts at 100 and deducts points for:</p>
                <ul className="space-y-0.5 pl-1">
                  <li>Spending &gt;100% of budget: up to −40</li>
                  <li>Spending &gt;80% of budget: −10</li>
                  <li>Pace ahead of schedule: up to −20</li>
                  <li>Income below 90% of planned: up to −15</li>
                </ul>
                <p className="font-medium mt-1">Grade thresholds:</p>
                <ul className="space-y-0.5 pl-1">
                  <li><span className="text-success font-bold">A</span> ≥ 90 — excellent</li>
                  <li><span className="text-success/75 font-bold">B</span> ≥ 75 — good</li>
                  <li><span className="text-warning font-bold">C</span> ≥ 60 — fair</li>
                  <li><span className="text-warning/75 font-bold">D</span> ≥ 45 — needs work</li>
                  <li><span className="text-destructive font-bold">F</span> &lt; 45 — critical</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <MiniBar colorClass={gradeBarColor} value={score} />
            <span className="text-2xs tabular-nums text-muted-foreground shrink-0">{score}</span>
          </div>
        </div>
      </div>

      {/* Period */}
      <div className="px-4 py-2.5 space-y-1.5">
        <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Period</div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="font-semibold tabular-nums">{stats.daysElapsed}</span>
          <span className="text-2xs text-muted-foreground">/ {stats.daysTotal} days</span>
        </div>
        <div className="flex items-center gap-2">
          <MiniBar colorClass="bg-primary" value={daysPct} />
          {stats.daysLeft > 0 && (
            <span className="text-2xs tabular-nums text-muted-foreground shrink-0">{stats.daysLeft} left</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetSummaryCards;
