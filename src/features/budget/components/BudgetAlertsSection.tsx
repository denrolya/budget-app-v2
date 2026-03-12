import { AlertTriangle, ChevronDown, ChevronUp, TrendingDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';

import type { BudgetAnalyticsItem, BudgetDTO } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const getAllIds = (cat: Category): number[] => {
  const ids: number[] = [cat.id];
  for (const child of cat.children) ids.push(...getAllIds(child));
  return ids;
};

const BudgetAlertsSection: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();
  const [unbudgetedOpen, setUnbudgetedOpen] = useState(false);

  const { overspent, unbudgeted } = useMemo(() => {
    if (!catData) return { overspent: [], unbudgeted: [] };

    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));
    const analyticsMap = new Map(analytics.map((a) => [a.categoryId, a]));

    const getActualExpense = (cat: Category): number => {
      let total = 0;
      for (const id of getAllIds(cat)) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        for (const [cur, cv] of Object.entries(item.convertedValues)) {
          const rate = cur === displayCurrency ? 1 : getExchangeRate(cur, displayCurrency, rates);
          if (rate !== null) total += cv.expense * rate;
        }
      }
      return total;
    };

    const overspentList: { name: string; over: number }[] = [];
    const unbudgetedList: { name: string; actual: number }[] = [];

    const expenseCats = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);

    // Overspent: check all depths
    const checkOverspent = (cat: Category) => {
      if (!cat.isAffectingProfit) return;
      const actual = getActualExpense(cat);
      const line = linesMap.get(cat.id);
      if (line) {
        const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
        const planned = rate !== null ? line.plannedAmount * rate : null;
        if (planned !== null && actual > planned && actual > 0) {
          overspentList.push({ name: cat.name, over: actual - planned });
        }
      }
      for (const child of cat.children) checkOverspent(child);
    };

    // Unbudgeted: limit to depth ≤ 1 (root categories and their direct children only)
    const checkUnbudgeted = (cat: Category, depth: number) => {
      if (!cat.isAffectingProfit) return;
      if (depth > 1) return; // skip deeper than second level
      const actual = getActualExpense(cat);
      const line = linesMap.get(cat.id);
      if (!line && actual > 0) {
        unbudgetedList.push({ name: cat.name, actual });
      }
      for (const child of cat.children) checkUnbudgeted(child, depth + 1);
    };

    expenseCats.forEach((cat) => {
      checkOverspent(cat);
      checkUnbudgeted(cat, 0);
    });

    overspentList.sort((a, b) => b.over - a.over);
    unbudgetedList.sort((a, b) => b.actual - a.actual);

    return { overspent: overspentList, unbudgeted: unbudgetedList };
  }, [budget, analytics, displayCurrency, rates, catData]);

  if (overspent.length === 0 && unbudgeted.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2 text-sm">
      {overspent.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-destructive font-medium text-xs mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Overspent ({overspent.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overspent.map((item) => (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-background px-2 py-0.5 text-xs"
                key={item.name}
              >
                <span className="text-muted-foreground">{item.name}</span>
                <span className="text-destructive font-medium">+{fmtAmt(item.over, displayCurrency)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {unbudgeted.length > 0 && (
        <div className={overspent.length > 0 ? 'border-t border-destructive/20 pt-2' : ''}>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-1.5 text-yellow-600 dark:text-yellow-400 font-medium text-xs mb-1.5 hover:opacity-80 transition-opacity"
            onClick={() => setUnbudgetedOpen((o) => !o)}
          >
            <span className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" />
              Unbudgeted spending ({unbudgeted.length})
            </span>
            {unbudgetedOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>
          {unbudgetedOpen && (
            <div className="flex flex-wrap gap-2">
              {unbudgeted.map((item) => (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-yellow-400/30 bg-background px-2 py-0.5 text-xs"
                  key={item.name}
                >
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    {fmtAmt(item.actual, displayCurrency)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetAlertsSection;
