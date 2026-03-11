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
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import { useHistoryAverages, useUpsertBudgetLine } from '../api';
import type { BudgetDTO } from '../api/types';
import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const HISTORY_MONTHS = 6;

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const catLabel = (cat: Category) => (cat.icon ? `${cat.icon} ${cat.name}` : cat.name);

type SuggestionItem = { cat: Category; suggested: number };
type GroupedSuggestion = { root: Category; items: SuggestionItem[] };

const findRoot = (cat: Category): Category => {
  let c = cat;
  while (c.parent) c = c.parent;
  return c;
};

const BudgetFillFromHistoryButton: React.FC<Props> = ({ budget, displayCurrency, rates }) => {
  const [open, setOpen] = useState(false);

  const { data: historyData, isLoading: historyLoading } = useHistoryAverages(
    open ? budget.id : null,
    HISTORY_MONTHS,
  );
  const { mutateAsync: upsertLine, isPending: isSaving } = useUpsertBudgetLine(budget.id);
  const { data: catData } = useCategoryList();

  const categoryMap = useMemo(
    () => new Map((catData?.list ?? []).map((c) => [c.id, c])),
    [catData],
  );

  const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));

  // Compute suggestions: average monthly expense per category, only for categories with no existing line
  const suggestions = useMemo(() => {
    if (!historyData) return [];

    const budgetDays = moment(budget.endDate).diff(moment(budget.startDate), 'days') + 1;
    const scaleFactor = budgetDays / 30;

    return historyData.data
      .filter((item) => !linesMap.has(item.categoryId))
      .map((item) => {
        let totalExpense = 0;
        for (const [cur, cv] of Object.entries(item.convertedValues)) {
          const rate = cur === displayCurrency ? 1 : getExchangeRate(cur, displayCurrency, rates);
          if (rate !== null) totalExpense += cv.expense * rate;
        }
        const monthly = totalExpense / HISTORY_MONTHS;
        const scaled = monthly * scaleFactor;
        return { categoryId: item.categoryId, suggested: scaled };
      })
      .filter((s) => s.suggested > 1);
  }, [historyData, linesMap, displayCurrency, rates, budget]);

  // Group suggestions by root category, split by expense/income
  const { expenseGroups, incomeGroups } = useMemo(() => {
    const expMap = new Map<number, GroupedSuggestion>();
    const incMap = new Map<number, GroupedSuggestion>();

    for (const s of suggestions) {
      const cat = categoryMap.get(s.categoryId);
      if (!cat) continue;

      const root = findRoot(cat);
      const isExpense = (root.type as string) === (CategoryType.Expense as string);
      const map = isExpense ? expMap : incMap;

      if (!map.has(root.id)) map.set(root.id, { root, items: [] });
      map.get(root.id)!.items.push({ cat, suggested: s.suggested });
    }

    const sortGroups = (m: Map<number, GroupedSuggestion>): GroupedSuggestion[] =>
      [...m.values()]
        .map((g) => ({ ...g, items: [...g.items].sort((a, b) => a.cat.name.localeCompare(b.cat.name)) }))
        .sort((a, b) => a.root.name.localeCompare(b.root.name));

    return { expenseGroups: sortGroups(expMap), incomeGroups: sortGroups(incMap) };
  }, [suggestions, categoryMap]);

  const handleApply = async () => {
    let count = 0;
    for (const s of suggestions) {
      try {
        await upsertLine({
          lineId: null,
          payload: {
            categoryId: s.categoryId,
            plannedAmount: Math.round(s.suggested),
            plannedCurrency: displayCurrency,
          },
        });
        count++;
      } catch {
        // skip failures
      }
    }
    setOpen(false);
    toast.success(`Added ${count} budget lines from history`);
  };

  const renderGroups = (groups: GroupedSuggestion[]) => {
    if (groups.length === 0)
      return <p className="text-muted-foreground text-center py-4 text-xs">No suggestions</p>;

    return groups.map(({ root, items }) => (
      <div key={root.id} className="mb-3 last:mb-0">
        {/* Root group header — only if items are children; if item IS root, skip header */}
        {!(items.length === 1 && items[0].cat.id === root.id) && (
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1 border-b mb-0.5">
            {catLabel(root)}
          </div>
        )}
        {items.map(({ cat, suggested }) => {
          const isRoot = cat.id === root.id;
          return (
            <div
              key={cat.id}
              className="flex justify-between items-center py-0.5"
              style={{ paddingLeft: isRoot ? 0 : '0.75rem' }}
            >
              <span className="text-sm truncate text-foreground">{catLabel(cat)}</span>
              <span className="font-medium tabular-nums shrink-0 ml-2 text-sm">{fmtAmt(suggested, displayCurrency)}</span>
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label="Fill from history" size="icon" variant="outline" onClick={() => setOpen(true)}>
            <History className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fill from last {HISTORY_MONTHS} months</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fill from history</DialogTitle>
            <DialogDescription>
              Suggested amounts based on average monthly spending over the last {HISTORY_MONTHS} months. Only categories
              without an existing budget line are shown.
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
            <div className="grid grid-cols-2 gap-0 divide-x max-h-96 overflow-hidden">
              {/* Expenses */}
              <div className="pr-4 overflow-y-auto">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Expenses
                </div>
                {renderGroups(expenseGroups)}
              </div>

              {/* Income */}
              <div className="pl-4 overflow-y-auto">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Income
                </div>
                {renderGroups(incomeGroups)}
              </div>
            </div>
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
