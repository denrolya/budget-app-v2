import moment, { Moment } from 'moment';
import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { TransactionHeatmapChart } from '@/features/transactions';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const getAllIds = (cat: Category): number[] => {
  const ids: number[] = [cat.id];
  for (const child of cat.children) ids.push(...getAllIds(child));
  return ids;
};

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const BudgetHeatmapSection: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();

  const stats = useMemo(() => {
    const expenseIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? []).flatMap(getAllIds),
    );

    let totalPlannedExpense = 0;
    for (const line of budget.lines ?? []) {
      if (!expenseIds.has(line.categoryId)) continue;
      const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
      if (rate !== null) totalPlannedExpense += line.plannedAmount * rate;
    }

    let totalActualExpense = 0;
    for (const item of analytics) {
      for (const [currency, cv] of Object.entries(item.convertedValues)) {
        const rate = currency === displayCurrency ? 1 : getExchangeRate(currency, displayCurrency, rates);
        if (rate !== null) totalActualExpense += cv.expense * rate;
      }
    }

    const start = moment(budget.startDate);
    const end = moment(budget.endDate);
    const today = moment();
    const daysTotal = end.diff(start, 'days') + 1;
    const daysElapsed = Math.max(1, Math.min(today.diff(start, 'days') + 1, daysTotal));

    const dailyBudget = daysTotal > 0 ? totalPlannedExpense / daysTotal : 0;
    const dailyAvg = totalActualExpense / daysElapsed;

    // Expected cumulative by now (linear pace)
    const expectedByNow = (daysElapsed / daysTotal) * totalPlannedExpense;
    const paceOffset = totalActualExpense - expectedByNow; // positive = over pace

    return { dailyBudget, dailyAvg, paceOffset, totalPlannedExpense };
  }, [budget, analytics, displayCurrency, rates, catData]);

  // Heatmap year locked to the budget's start date year; query range locked to budget period
  const heatmapYear = moment(budget.startDate).year();
  const heatmapAfter: Moment = useMemo(() => moment(budget.startDate).startOf('day'), [budget.startDate]);
  const heatmapBefore: Moment = useMemo(() => moment(budget.endDate).endOf('day'), [budget.endDate]);

  const paceLabel =
    stats.totalPlannedExpense === 0
      ? null
      : stats.paceOffset > 0
        ? { text: `${fmtAmt(stats.paceOffset, displayCurrency)} over pace`, color: 'text-destructive' }
        : stats.paceOffset < -1
          ? { text: `${fmtAmt(Math.abs(stats.paceOffset), displayCurrency)} under pace`, color: 'text-success' }
          : { text: 'On pace', color: 'text-muted-foreground' };

  const statRows: { label: string; value: string; valueClass?: string }[] = [
    {
      label: 'Budget / day',
      value: stats.dailyBudget > 0 ? fmtAmt(stats.dailyBudget, displayCurrency) : '—',
    },
    {
      label: 'Avg spend / day',
      value: fmtAmt(stats.dailyAvg, displayCurrency),
      valueClass:
        stats.totalPlannedExpense > 0
          ? stats.dailyAvg > stats.dailyBudget
            ? 'text-destructive'
            : 'text-success'
          : undefined,
    },
    ...(paceLabel ? [{ label: 'Pace', value: paceLabel.text, valueClass: paceLabel.color }] : []),
  ];

  return (
    <div className="flex gap-4 items-start">
      {/* Heatmap — no controls, locked to budget year, expense view */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <TransactionHeatmapChart
          accountIds={[]}
          currency={displayCurrency}
          defaultViewMode="expense"
          rangeAfter={heatmapAfter}
          rangeBefore={heatmapBefore}
          selectable={false}
          showControls={false}
          year={heatmapYear}
        />
      </div>

      {/* Stats panel */}
      <div className="shrink-0 w-44 pt-1 space-y-3">
        {statRows.map(({ label, value, valueClass }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-sm font-semibold tabular-nums', valueClass)}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetHeatmapSection;
