import { History, Loader2 } from 'lucide-react';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import { useBatchCreateBudgetLines, useHistoryAverages } from '../api';
import type { BudgetDTO } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
  autoOpen?: boolean;
}

// Monthly budgets: 6 months of history. Yearly/custom: 12 months for a fuller picture.
const getHistoryMonths = (periodType: string) => (periodType === 'monthly' ? 6 : 12);

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

type SuggestionItem = { cat: Category; suggested: number; activeMonths: number | null };
type GroupedSuggestion = { root: Category; items: SuggestionItem[] };

const findRoot = (cat: Category): Category => {
  let c = cat;
  while (c.parent) c = c.parent;
  return c;
};

// Sum monthly average for cat and all its descendants
const getCumulative = (cat: Category, rawMonthly: Map<number, number>): number => {
  let sum = rawMonthly.get(cat.id) ?? 0;
  for (const child of cat.children) {
    sum += getCumulative(child, rawMonthly);
  }
  return sum;
};

const BudgetFillFromHistoryButton: React.FC<Props> = ({ budget, displayCurrency, rates, autoOpen }) => {
  const [open, setOpen] = useState(autoOpen ?? false);
  const HISTORY_MONTHS = getHistoryMonths(budget.periodType);

  const { data: historyData, isLoading: historyLoading } = useHistoryAverages(open ? budget.id : null, HISTORY_MONTHS);
  const { mutateAsync: batchCreate, isPending: isSaving } = useBatchCreateBudgetLines(budget.id);
  const { data: catData } = useCategoryList();

  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c])), [catData]);

  // Per-category recency-weighted monthly prediction in displayCurrency.
  // Backend returns predictedValues: the weighted monthly estimate per currency.
  // Income categories use cv.income; expense categories use cv.expense.
  // activeMonthsMap: categoryId → how many distinct calendar months had spending (for display only).
  const { rawMonthly, activeMonthsMap } = useMemo(() => {
    const raw = new Map<number, number>();
    const active = new Map<number, number>();
    if (!historyData) return { rawMonthly: raw, activeMonthsMap: active };

    for (const item of historyData.data) {
      const cat = categoryMap.get(item.categoryId);
      if (!cat) continue;

      const isExpense = cat.type === CategoryType.Expense;
      let predicted = 0;
      for (const [cur, cv] of Object.entries(item.predictedValues)) {
        const rate = cur === displayCurrency ? 1 : getExchangeRate(cur, displayCurrency, rates);
        if (rate !== null) {
          predicted += isExpense ? cv.expense * rate : cv.income * rate;
        }
      }
      raw.set(item.categoryId, predicted);
      active.set(item.categoryId, item.activeMonths);
    }
    return { rawMonthly: raw, activeMonthsMap: active };
  }, [historyData, categoryMap, displayCurrency, rates]);

  // Suggestions: only depth 0–1 categories, no existing line, cumulative value > 1.
  // Each value is the rollup of the category + ALL descendants, scaled to budget period.
  const suggestions = useMemo(() => {
    if (!historyData || !catData) return [];

    const budgetDays = moment(budget.endDate).diff(moment(budget.startDate), 'days') + 1;
    const scaleFactor = budgetDays / 30;
    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));

    return (catData.list as Category[])
      .filter((cat) => cat.depth <= 1 && !linesMap.has(cat.id))
      .map((cat) => ({
        categoryId: cat.id,
        suggested: getCumulative(cat, rawMonthly) * scaleFactor,
        // activeMonths: only meaningful for this exact category's own transactions
        activeMonths: activeMonthsMap.get(cat.id) ?? null,
      }))
      .filter((s) => s.suggested > 1);
  }, [historyData, catData, budget, rawMonthly, activeMonthsMap]);

  // Group suggestions by root category, split by expense / income.
  // Sort both groups and items by suggested amount descending.
  const { expenseGroups, incomeGroups } = useMemo(() => {
    const expMap = new Map<number, GroupedSuggestion>();
    const incMap = new Map<number, GroupedSuggestion>();

    for (const s of suggestions) {
      const cat = categoryMap.get(s.categoryId);
      if (!cat) continue;

      const root = findRoot(cat);
      const isExpense = root.type === CategoryType.Expense;
      const map = isExpense ? expMap : incMap;

      if (!map.has(root.id)) map.set(root.id, { root, items: [] });
      map.get(root.id)!.items.push({ cat, suggested: s.suggested, activeMonths: s.activeMonths });
    }

    const sortGroups = (m: Map<number, GroupedSuggestion>): GroupedSuggestion[] =>
      [...m.values()]
        .map((g) => ({ ...g, items: [...g.items].sort((a, b) => b.suggested - a.suggested) }))
        .sort((a, b) => {
          const sumA = a.items.reduce((s, i) => s + i.suggested, 0);
          const sumB = b.items.reduce((s, i) => s + i.suggested, 0);
          return sumB - sumA;
        });

    return { expenseGroups: sortGroups(expMap), incomeGroups: sortGroups(incMap) };
  }, [suggestions, categoryMap]);

  // Totals: use root item per group (which already includes sub-category rollup).
  // Summing all suggestions would double-count children whose root is also in suggestions.
  const totalExpense = useMemo(
    () =>
      expenseGroups.reduce((sum, { root, items }) => {
        const rootItem = items.find((i) => i.cat.id === root.id);
        return sum + (rootItem ? rootItem.suggested : items.reduce((s, i) => s + i.suggested, 0));
      }, 0),
    [expenseGroups],
  );

  const totalIncome = useMemo(
    () =>
      incomeGroups.reduce((sum, { root, items }) => {
        const rootItem = items.find((i) => i.cat.id === root.id);
        return sum + (rootItem ? rootItem.suggested : items.reduce((s, i) => s + i.suggested, 0));
      }, 0),
    [incomeGroups],
  );

  const handleApply = async () => {
    // Root categories get getCumulative (full envelope = total historical spend for the group).
    // Children get their own average (sub-allocation within the root envelope).
    // BudgetTable shows the root's own line directly when it exists (envelope model).
    const lines = suggestions.map((s) => ({
      categoryId: s.categoryId,
      plannedAmount: Math.round(s.suggested),
      plannedCurrency: displayCurrency,
    }));

    const results = await batchCreate(lines);
    setOpen(false);
    toast.success(`Added ${results.length} budget lines from history`);
  };

  const renderGroups = (groups: GroupedSuggestion[], type: 'expense' | 'income') => {
    if (groups.length === 0) return <p className="text-muted-foreground text-center py-4 text-xs">No suggestions</p>;

    const amtCls = type === 'expense' ? 'text-destructive' : 'text-success';

    const FreqBadge = ({ activeMonths }: { activeMonths: number | null }) => {
      if (activeMonths === null) return null;
      const cls =
        activeMonths >= 5 ? 'text-muted-foreground/60' : activeMonths >= 3 ? 'text-amber-500' : 'text-orange-500';
      return (
        <span title="Months active out of 6" className={`text-xs tabular-nums shrink-0 ml-1.5 ${cls}`}>
          {activeMonths}/{HISTORY_MONTHS}mo
        </span>
      );
    };

    return groups.map(({ root, items }) => {
      const rootItem = items.find((i) => i.cat.id === root.id);
      const childItems = items.filter((i) => i.cat.id !== root.id);
      const hasChildren = childItems.length > 0;

      return (
        <div className="mb-3 last:mb-0" key={root.id}>
          {hasChildren ? (
            /* Header row: root name on left, cumulative amount + badge on right.
               No separate bold item row — eliminates the previous duplication. */
            <div className="flex items-center py-1 border-b mb-1 gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 min-w-0 truncate">
                {root.name}
              </span>
              {rootItem && (
                <>
                  <FreqBadge activeMonths={rootItem.activeMonths} />
                  <span className={`font-semibold tabular-nums shrink-0 ml-1 text-sm ${amtCls}`}>
                    {fmtAmt(rootItem.suggested, displayCurrency)}
                  </span>
                </>
              )}
            </div>
          ) : (
            /* Leaf root (no children) — simple item row */
            rootItem && (
              <div className="flex items-center py-1 gap-1">
                <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">{root.name}</span>
                <FreqBadge activeMonths={rootItem.activeMonths} />
                <span className={`font-semibold tabular-nums shrink-0 ml-1 text-sm ${amtCls}`}>
                  {fmtAmt(rootItem.suggested, displayCurrency)}
                </span>
              </div>
            )
          )}

          {/* Depth-1 children */}
          {childItems.map(({ cat, suggested, activeMonths }) => (
            <div className="flex items-center py-0.5 pl-3 gap-1" key={cat.id}>
              <span className="text-sm truncate text-muted-foreground flex-1 min-w-0">{cat.name}</span>
              <FreqBadge activeMonths={activeMonths} />
              <span className={`font-medium tabular-nums shrink-0 ml-1 text-sm ${amtCls}`}>
                {fmtAmt(suggested, displayCurrency)}
              </span>
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Fill from history"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setOpen(true)}
          >
            <History className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fill from last {HISTORY_MONTHS} months</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fill from history</DialogTitle>
            <DialogDescription>
              Recency-weighted predictions from the last {HISTORY_MONTHS} months
              {historyData && (
                <>
                  {' '}
                  ({moment(historyData.after).format('MMM YYYY')} – {moment(historyData.before).format('MMM YYYY')})
                </>
              )}
              . Recent months are weighted higher. Categories active in fewer than 2 months are excluded as one-offs.
              Group totals include all sub-categories. Only categories without an existing line are shown.
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading history…
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-xs">
              No suggestions — all categories already have budget lines, or no historical spending found.
            </p>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-6 px-3 py-2 rounded-md bg-muted/50 text-sm">
                {totalExpense > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">Expenses</span>
                    <span className="font-semibold text-destructive">{fmtAmt(totalExpense, displayCurrency)}</span>
                  </div>
                )}
                {totalIncome > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">Income</span>
                    <span className="font-semibold text-success">{fmtAmt(totalIncome, displayCurrency)}</span>
                  </div>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {suggestions.length} line{suggestions.length !== 1 ? 's' : ''} to add
                </span>
              </div>

              <div className="grid grid-cols-2 gap-0 divide-x max-h-80 overflow-hidden">
                {/* Expenses */}
                <div className="pr-4 overflow-y-auto">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Expenses
                  </div>
                  {renderGroups(expenseGroups, 'expense')}
                </div>

                {/* Income */}
                <div className="pl-4 overflow-y-auto">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Income
                  </div>
                  {renderGroups(incomeGroups, 'income')}
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={suggestions.length === 0 || isSaving || historyLoading} onClick={handleApply}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Apply {suggestions.length > 0 ? `(${suggestions.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BudgetFillFromHistoryButton;
