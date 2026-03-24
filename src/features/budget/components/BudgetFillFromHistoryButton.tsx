import { History, Loader2 } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import { useBatchCreateBudgetLines, useHistoryAverages } from '../api';
import type { BudgetDTO, CategoryTrendItem, SeasonalItem } from '../api/types';
import { formatBudgetAmount, formatPercent } from '../utils';

import BudgetAdjustmentTooltip from './BudgetAdjustmentTooltip';
import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
  autoOpen?: boolean;
  seasonal?: SeasonalItem[];
  trends?: CategoryTrendItem[];
}

// Monthly budgets: 6 months of history. Yearly/custom: 12 months for a fuller picture.
const getHistoryMonths = (periodType: string) => (periodType === 'monthly' ? 6 : 12);

type SuggestionItem = { cat: Category; suggested: number; activeMonths: number | null };
type GroupedSuggestion = { root: Category; items: SuggestionItem[] };

const findRoot = (cat: Category): Category => {
  let current = cat;
  while (current.parent) current = current.parent;
  return current;
};

// Sum monthly average for cat and all its descendants
const getCumulative = (cat: Category, rawMonthly: Map<number, number>): number => {
  let sum = rawMonthly.get(cat.id) ?? 0;
  for (const child of cat.children) {
    sum += getCumulative(child, rawMonthly);
  }
  return sum;
};

// Max active months across cat and all its descendants
const getMaxActiveMonths = (cat: Category, activeMonthsMap: Map<number, number>): number | null => {
  let max = activeMonthsMap.get(cat.id) ?? 0;
  for (const child of cat.children) {
    const childMax = getMaxActiveMonths(child, activeMonthsMap);
    if (childMax !== null && childMax > max) max = childMax;
  }
  return max > 0 ? max : null;
};

// ── Column header ────────────────────────────────────────────────────────────

const ColumnHeader: React.FC = () => (
  <div className="flex items-center gap-1 text-2xs text-muted-foreground/60 border-b border-border/30 pb-1 mb-1.5 tabular-nums">
    <span className="flex-1">CATEGORY</span>
    <span className="w-[52px] text-right">TREND</span>
    <span className="w-[40px] text-right">FREQ</span>
    <span className="w-[72px] text-right">AMOUNT</span>
    <span className="w-3" />
  </div>
);

// ── Shared props for suggestion display components ────────────────────────────

interface SharedSuggestionProps {
  historyMonths: number;
  trendsMap: Map<number, CategoryTrendItem>;
  getAdjustedAmount: (id: number, base: number) => number;
  getAdjustmentFactor: (id: number) => { trendFactor: number; seasonalFactor: number; total: number };
  seasonalMap: Map<number, SeasonalItem>;
  budgetMonth: string;
  displayCurrency: string;
}

interface SuggestionRowProps extends SharedSuggestionProps {
  name: string;
  categoryId: number;
  baseAmount: number;
  activeMonths: number | null;
  isRoot: boolean;
  type: 'expense' | 'income';
}

const SuggestionRow: React.FC<SuggestionRowProps> = ({
  name,
  categoryId,
  baseAmount,
  activeMonths,
  isRoot,
  type,
  historyMonths,
  trendsMap,
  getAdjustedAmount,
  getAdjustmentFactor,
  seasonalMap,
  budgetMonth,
  displayCurrency,
}) => {
  const trend = trendsMap.get(categoryId);
  const adjusted = getAdjustedAmount(categoryId, baseAmount);
  const hasTrend = trend && trend.direction !== 'stable';
  const amountColor = type === 'expense' ? 'text-destructive' : 'text-success';

  let trendColor = '';
  if (hasTrend && trend) {
    if (type === 'expense') {
      trendColor = trend.direction === 'up' ? 'text-destructive' : 'text-success';
    } else {
      trendColor = trend.direction === 'up' ? 'text-success' : 'text-destructive';
    }
  }

  let frequencyColor = '';
  if (activeMonths !== null) {
    if (activeMonths >= 5) {
      frequencyColor = 'text-muted-foreground/60';
    } else if (activeMonths >= 3) {
      frequencyColor = 'text-warning/70';
    } else {
      frequencyColor = 'text-warning';
    }
  }

  return (
    <div className={cn('flex items-center gap-1', { 'py-1': isRoot, 'py-0.5 pl-3': !isRoot })}>
      <span
        className={cn('truncate min-w-0 flex-1 text-sm', { 'font-medium': isRoot, 'text-muted-foreground': !isRoot })}
      >
        {name}
      </span>

      <span className="w-[52px] text-right text-2xs tabular-nums shrink-0">
        {hasTrend && trend && <span className={trendColor}>{formatPercent(trend.changePercent)}</span>}
      </span>

      <span className="w-[40px] text-right text-2xs tabular-nums shrink-0">
        {activeMonths !== null && (
          <span className={frequencyColor}>
            {activeMonths}/{historyMonths}
          </span>
        )}
      </span>

      <span className={cn('w-[72px] text-right font-medium tabular-nums shrink-0 text-sm', amountColor)}>
        {formatBudgetAmount(adjusted, displayCurrency)}
      </span>

      <span className="w-3 shrink-0">
        <BudgetAdjustmentTooltip
          baseAmount={baseAmount}
          budgetMonth={budgetMonth}
          displayCurrency={displayCurrency}
          seasonal={seasonalMap.get(categoryId)}
          seasonalFactor={getAdjustmentFactor(categoryId).seasonalFactor}
          trendFactor={getAdjustmentFactor(categoryId).trendFactor}
        />
      </span>
    </div>
  );
};

interface SuggestionGroupsProps extends SharedSuggestionProps {
  groups: GroupedSuggestion[];
  type: 'expense' | 'income';
}

const SuggestionGroups: React.FC<SuggestionGroupsProps> = ({
  groups,
  type,
  historyMonths,
  trendsMap,
  getAdjustedAmount,
  getAdjustmentFactor,
  seasonalMap,
  budgetMonth,
  displayCurrency,
}) => {
  if (groups.length === 0) {
    return <p className="text-muted-foreground text-center py-4 text-xs">No suggestions</p>;
  }

  const amountColor = type === 'expense' ? 'text-destructive' : 'text-success';
  const sharedRowProps: SharedSuggestionProps = {
    historyMonths,
    trendsMap,
    getAdjustedAmount,
    getAdjustmentFactor,
    seasonalMap,
    budgetMonth,
    displayCurrency,
  };

  return (
    <>
      {groups.map(({ root, items }) => {
        const rootItem = items.find((item) => item.cat.id === root.id);
        const childItems = items.filter((item) => item.cat.id !== root.id);
        const hasChildren = childItems.length > 0;

        if (!hasChildren) {
          if (!rootItem) return null;
          return (
            <div className="mb-2 last:mb-0" key={root.id}>
              <SuggestionRow
                {...sharedRowProps}
                isRoot
                activeMonths={rootItem.activeMonths}
                baseAmount={rootItem.suggested}
                categoryId={root.id}
                name={root.name}
                type={type}
              />
            </div>
          );
        }

        return (
          <div className="mb-2 last:mb-0" key={root.id}>
            <div className="flex items-center py-1 border-b border-border/30 mb-0.5">
              <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 min-w-0 truncate">
                {root.name}
              </span>
              {rootItem && (
                <span className={cn('font-semibold tabular-nums text-sm', amountColor)}>
                  {formatBudgetAmount(getAdjustedAmount(root.id, rootItem.suggested), displayCurrency)}
                </span>
              )}
            </div>
            {childItems.map(({ cat, suggested, activeMonths }) => (
              <SuggestionRow
                key={cat.id}
                {...sharedRowProps}
                activeMonths={activeMonths}
                baseAmount={suggested}
                categoryId={cat.id}
                isRoot={false}
                name={cat.name}
                type={type}
              />
            ))}
          </div>
        );
      })}
    </>
  );
};

const BudgetFillFromHistoryButton: React.FC<Props> = ({
  budget,
  displayCurrency,
  rates,
  autoOpen,
  seasonal,
  trends,
}) => {
  const [open, setOpen] = useState(autoOpen ?? false);
  const HISTORY_MONTHS = getHistoryMonths(budget.periodType);

  const { data: historyData, isLoading: historyLoading } = useHistoryAverages(open ? budget.id : null, HISTORY_MONTHS);
  const { mutateAsync: batchCreate, isPending: isSaving } = useBatchCreateBudgetLines(budget.id);
  const { data: catData } = useCategoryList();

  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c])), [catData]);

  const seasonalMap = useMemo(() => {
    const map = new Map<number, SeasonalItem>();
    (seasonal ?? []).forEach((item) => map.set(item.categoryId, item));
    return map;
  }, [seasonal]);

  const trendsMap = useMemo(() => {
    const map = new Map<number, CategoryTrendItem>();
    if (!trends) return map;
    for (const trend of trends) {
      map.set(trend.categoryId, trend);
      for (const child of trend.children ?? []) {
        map.set(child.categoryId, child);
      }
    }
    return map;
  }, [trends]);

  const budgetMonth = moment(budget.startDate).format('MMM');

  const getAdjustmentFactor = useCallback(
    (categoryId: number): { trendFactor: number; seasonalFactor: number; total: number } => {
      const trend = trendsMap.get(categoryId);
      const season = seasonalMap.get(categoryId);
      const trendFactor = trend ? 1 + trend.changePercent / 100 : 1;
      const seasonalFactor = season ? season.seasonalFactor : 1;
      return { trendFactor, seasonalFactor, total: trendFactor * seasonalFactor };
    },
    [trendsMap, seasonalMap],
  );

  const getAdjustedAmount = useCallback(
    (categoryId: number, baseAmount: number): number => {
      const { total } = getAdjustmentFactor(categoryId);
      return Math.round(baseAmount * total);
    },
    [getAdjustmentFactor],
  );

  // Per-category recency-weighted monthly prediction in displayCurrency.
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
        activeMonths: getMaxActiveMonths(cat, activeMonthsMap),
      }))
      .filter((s) => s.suggested > 1);
  }, [historyData, catData, budget, rawMonthly, activeMonthsMap]);

  // Group by root category, split expense / income
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

    const sortGroups = (m: Map<number, GroupedSuggestion>): GroupedSuggestion[] => [...m.values()];

    return { expenseGroups: sortGroups(expMap), incomeGroups: sortGroups(incMap) };
  }, [suggestions, categoryMap]);

  const totalExpense = useMemo(
    () =>
      expenseGroups.reduce((sum, { root, items }) => {
        const rootItem = items.find((i) => i.cat.id === root.id);
        const base = rootItem ? rootItem.suggested : items.reduce((s, i) => s + i.suggested, 0);
        const categoryId = rootItem ? root.id : (items[0]?.cat.id ?? root.id);
        return sum + getAdjustedAmount(categoryId, base);
      }, 0),
    [expenseGroups, getAdjustedAmount],
  );

  const totalIncome = useMemo(
    () =>
      incomeGroups.reduce((sum, { root, items }) => {
        const rootItem = items.find((i) => i.cat.id === root.id);
        const base = rootItem ? rootItem.suggested : items.reduce((s, i) => s + i.suggested, 0);
        const categoryId = rootItem ? root.id : (items[0]?.cat.id ?? root.id);
        return sum + getAdjustedAmount(categoryId, base);
      }, 0),
    [incomeGroups, getAdjustedAmount],
  );

  const handleApply = async () => {
    const lines = suggestions.map((s) => {
      const { total } = getAdjustmentFactor(s.categoryId);
      return {
        categoryId: s.categoryId,
        plannedAmount: Math.round(s.suggested * total),
        plannedCurrency: displayCurrency,
      };
    });

    const results = await batchCreate(lines);
    setOpen(false);
    toast.success(`Added ${results.length} budget lines from history`);
  };

  const periodLabel = historyData
    ? `${moment(historyData.after).format('MMM YYYY')} – ${moment(historyData.before).format('MMM YYYY')}`
    : `last ${HISTORY_MONTHS} months`;

  const sharedSuggestionProps: SharedSuggestionProps = {
    historyMonths: HISTORY_MONTHS,
    trendsMap,
    getAdjustedAmount,
    getAdjustmentFactor,
    seasonalMap,
    budgetMonth,
    displayCurrency,
  };

  const applyLabel = suggestions.length > 0 ? `Apply (${suggestions.length})` : 'Apply';

  let dialogBody: React.ReactNode;
  if (historyLoading) {
    dialogBody = (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Analyzing spending history…
      </div>
    );
  } else if (suggestions.length === 0) {
    dialogBody = (
      <p className="text-muted-foreground text-center py-10 text-xs">
        No suggestions — all categories already have budget lines, or no historical spending found.
      </p>
    );
  } else {
    dialogBody = (
      <>
        {/* Summary bar */}
        <div className="flex items-center gap-6 px-3 py-2 rounded-md bg-muted/50 text-sm">
          {totalExpense > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Expenses</span>
              <span className="font-semibold text-destructive tabular-nums">
                {formatBudgetAmount(totalExpense, displayCurrency)}
              </span>
            </div>
          )}
          {totalIncome > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Income</span>
              <span className="font-semibold text-success tabular-nums">
                {formatBudgetAmount(totalIncome, displayCurrency)}
              </span>
            </div>
          )}
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {suggestions.length} {suggestions.length !== 1 ? 'lines' : 'line'}
          </span>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:divide-x flex-1 min-h-0 overflow-hidden">
          <div className="pr-0 sm:pr-4 overflow-y-auto max-h-[40vh]">
            <ColumnHeader />
            <SuggestionGroups {...sharedSuggestionProps} groups={expenseGroups} type="expense" />
          </div>
          <div className="pl-0 sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 overflow-y-auto max-h-[40vh]">
            <ColumnHeader />
            <SuggestionGroups {...sharedSuggestionProps} groups={incomeGroups} type="income" />
          </div>
        </div>
      </>
    );
  }

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
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Fill budget from spending history</DialogTitle>
          </DialogHeader>

          {/* How it works panel */}
          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">Source:</span> {periodLabel} — recent months weighted
              higher, one-off categories excluded.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-2xs">
              <span>
                <span className="font-medium text-foreground">TREND</span> — spending change, last 3mo vs prior 3mo
              </span>
              <span>
                <span className="font-medium text-foreground">FREQ</span> — months with activity out of {HISTORY_MONTHS}
              </span>
              <span>
                <span className="font-medium text-foreground">AMOUNT</span> — predicted value (adjusted for trends and{' '}
                {budgetMonth} seasonality)
              </span>
            </div>
          </div>

          {dialogBody}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={suggestions.length === 0 || isSaving || historyLoading} onClick={handleApply}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {applyLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BudgetFillFromHistoryButton;
