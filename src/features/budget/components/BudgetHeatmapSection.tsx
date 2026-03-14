import moment, { type Moment } from 'moment';
import React, { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { HeatmapPanel } from '@/features/transactions';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

type HeatmapMode = 'expense' | 'income';

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
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('expense');

  const stats = useMemo(() => {
    const expenseIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? []).flatMap(getAllIds),
    );
    const incomeIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income) ?? []).flatMap(getAllIds),
    );

    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));
    const plannedRollup = (cat: Category): number => {
      const own = linesMap.get(cat.id);
      if (own) {
        const rate = getExchangeRate(own.plannedCurrency, displayCurrency, rates);
        return rate !== null ? own.plannedAmount * rate : 0;
      }
      return getAllIds(cat)
        .slice(1)
        .reduce((sum, id) => {
          const line = linesMap.get(id);
          if (!line) return sum;
          const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
          return rate !== null ? sum + line.plannedAmount * rate : sum;
        }, 0);
    };

    const expenseRoots = catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? [];
    const incomeRoots = catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income) ?? [];
    const totalPlannedExpense = expenseRoots.reduce((sum, root) => sum + plannedRollup(root), 0);
    const totalPlannedIncome = incomeRoots.reduce((sum, root) => sum + plannedRollup(root), 0);

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

    const start = moment(budget.startDate);
    const end = moment(budget.endDate);
    const today = moment();
    const daysTotal = end.diff(start, 'days') + 1;
    const daysElapsed = Math.max(1, Math.min(today.diff(start, 'days') + 1, daysTotal));

    const dailyBudget = daysTotal > 0 ? totalPlannedExpense / daysTotal : 0;
    const dailyAvg = totalActualExpense / daysElapsed;
    const expectedByNow = (daysElapsed / daysTotal) * totalPlannedExpense;
    const paceOffset = totalActualExpense - expectedByNow;

    return {
      dailyBudget,
      dailyAvg,
      paceOffset,
      totalPlannedExpense,
      totalPlannedIncome,
      totalActualExpense,
      totalActualIncome,
    };
  }, [budget, analytics, displayCurrency, rates, catData]);

  const heatmapYear = moment(budget.startDate).year();
  const heatmapAfter: Moment = useMemo(() => moment(budget.startDate).startOf('day'), [budget.startDate]);
  const heatmapBefore: Moment = useMemo(() => moment(budget.endDate).endOf('day'), [budget.endDate]);

  const expensePaceLabel =
    stats.totalPlannedExpense === 0
      ? null
      : stats.paceOffset > 0
        ? { text: `${fmtAmt(stats.paceOffset, displayCurrency)} over pace`, color: 'text-destructive' }
        : stats.paceOffset < -1
          ? { text: `${fmtAmt(Math.abs(stats.paceOffset), displayCurrency)} under pace`, color: 'text-success' }
          : { text: 'On pace', color: 'text-muted-foreground' };

  const statRows: { label: string; value: string; valueClass?: string }[] =
    heatmapMode === 'expense'
      ? [
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
          ...(expensePaceLabel
            ? [{ label: 'Pace', value: expensePaceLabel.text, valueClass: expensePaceLabel.color }]
            : []),
        ]
      : [
          {
            label: 'Planned income',
            value: stats.totalPlannedIncome > 0 ? fmtAmt(stats.totalPlannedIncome, displayCurrency) : '—',
          },
          {
            label: 'Actual income',
            value: fmtAmt(stats.totalActualIncome, displayCurrency),
            valueClass:
              stats.totalPlannedIncome > 0
                ? stats.totalActualIncome >= stats.totalPlannedIncome
                  ? 'text-success'
                  : 'text-destructive'
                : 'text-success',
          },
          ...(stats.totalPlannedIncome > 0
            ? [
                {
                  label: 'Coverage',
                  value: `${Math.round((stats.totalActualIncome / stats.totalPlannedIncome) * 100)}%`,
                  valueClass:
                    stats.totalActualIncome >= stats.totalPlannedIncome
                      ? 'text-success'
                      : 'text-yellow-600 dark:text-yellow-400',
                },
              ]
            : []),
        ];

  return (
    <div className="flex gap-4 items-start">
      {/* Heatmap — view mode toggled externally, locked to budget year */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-1.5">
          {(['expense', 'income'] as HeatmapMode[]).map((mode) => (
            <button
              type="button"
              className={cn(
                'text-xs px-2.5 py-0.5 rounded border transition-colors',
                heatmapMode === mode
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground border-border hover:text-foreground hover:border-foreground/50',
              )}
              key={mode}
              onClick={() => setHeatmapMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <HeatmapPanel
          currency={displayCurrency}
          filters={{ affectingProfit: false }}
          rangeAfter={heatmapAfter}
          rangeBefore={heatmapBefore}
          selectable={false}
          showControls={false}
          showStats={false}
          viewMode={heatmapMode}
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
