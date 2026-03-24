import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { TransactionsDrawer, type DrawerListingTarget } from '@/features/statistics';
import type { ConvertedValues } from '@/features/transactions';
import { getExchangeRate } from '@/lib/getExchangeRates';

import { useDeleteBudgetLine, useUpsertBudgetLine, useUpdateBudgetLineNote } from '../api';
import type {
  BudgetAnalyticsItem,
  BudgetDTO,
  BudgetLineDTO,
  CategoryDailyStatsItem,
  CategoryTrendItem,
  SeasonalItem,
} from '../api/types';
import { getAllDescendantIds, formatBudgetAmount } from '../utils';

import BudgetCategoryRow from './BudgetCategoryRow';
import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budgetId: number;
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
  dailyStats?: CategoryDailyStatsItem[];
  trends?: CategoryTrendItem[];
  seasonal?: SeasonalItem[];
}

// ── Section totals row ─────────────────────────────────────────────────────────

interface SectionTotalsRowProps {
  label: string;
  planned: number;
  actual: number;
  isExpense: boolean;
  displayCurrency: DisplayCurrency;
}

const SectionTotalsRow: React.FC<SectionTotalsRowProps> = ({ label, planned, actual, isExpense, displayCurrency }) => {
  const remaining = isExpense ? planned - actual : actual - planned;
  const pct = planned > 0 ? (actual / planned) * 100 : 0;

  let remainingColor: string;
  if (isExpense) {
    remainingColor = remaining < 0 ? 'text-destructive' : 'text-success';
  } else if (pct < 80) {
    remainingColor = 'text-destructive';
  } else if (pct < 100) {
    remainingColor = 'text-warning';
  } else {
    remainingColor = 'text-success';
  }

  return (
    <tr className="bg-muted/40 font-semibold text-sm border-t-2">
      <td className="py-2 pl-4 pr-2 text-left">{label} Total</td>
      <td className="py-2 px-2 text-right tabular-nums">
        {planned > 0 ? formatBudgetAmount(planned, displayCurrency) : '—'}
      </td>
      <td className="py-2 px-2 text-right tabular-nums">
        {actual > 0 ? formatBudgetAmount(actual, displayCurrency) : '—'}
      </td>
      <td className={cn('py-2 px-4 text-right tabular-nums', remainingColor)}>
        {planned > 0 ? (
          <>
            {formatBudgetAmount(remaining, displayCurrency)}
            <span className="ml-1 text-xs opacity-60">{pct.toFixed(0)}%</span>
          </>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
};

// ── Category tree rows ─────────────────────────────────────────────────────────

interface CategoryTreeRowsProps {
  category: Category;
  depth: number;
  isExpenseSection: boolean;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  getActual: (cat: Category) => { income: number; expense: number };
  getPlanned: (cat: Category) => number | null;
  linesMap: Map<number, BudgetLineDTO>;
  dailyStatsMap: Map<number, CategoryDailyStatsItem>;
  trendsMap: Map<number, CategoryTrendItem>;
  seasonalMap: Map<number, SeasonalItem>;
  onCategoryClick: (id: number, name: string) => void;
  onDelete: (lineId: number) => void;
  onNoteUpdate: (lineId: number, note: string | null) => void;
  onSave: (categoryId: number, lineId: number | null, amount: number, currency: string) => void;
  isSaving: boolean;
  displayCurrency: DisplayCurrency;
  budgetId: number;
}

const CategoryTreeRows: React.FC<CategoryTreeRowsProps> = ({
  category,
  depth,
  isExpenseSection,
  expanded,
  onToggle,
  getActual,
  getPlanned,
  linesMap,
  dailyStatsMap,
  trendsMap,
  seasonalMap,
  onCategoryClick,
  onDelete,
  onNoteUpdate,
  onSave,
  isSaving,
  displayCurrency,
  budgetId,
}) => {
  if (!category.isAffectingProfit) return null;

  const isExpanded = expanded.has(category.id);
  const hasChildren = category.children.some((c) => c.isAffectingProfit);

  const sharedProps = {
    expanded,
    onToggle,
    getActual,
    getPlanned,
    linesMap,
    dailyStatsMap,
    trendsMap,
    seasonalMap,
    onCategoryClick,
    onDelete,
    onNoteUpdate,
    onSave,
    isSaving,
    displayCurrency,
    budgetId,
  };

  return (
    <>
      <BudgetCategoryRow
        actual={getActual(category)}
        budgetId={budgetId}
        category={category}
        depth={depth}
        displayCurrency={displayCurrency}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isExpenseSection={isExpenseSection}
        isSaving={isSaving}
        line={linesMap.get(category.id) ?? null}
        plannedInDisplayCurrency={getPlanned(category)}
        seasonal={seasonalMap.get(category.id)}
        sparklineData={dailyStatsMap.get(category.id)?.days}
        trend={trendsMap.get(category.id)}
        onCategoryClick={onCategoryClick}
        onDelete={onDelete}
        onNoteUpdate={onNoteUpdate}
        onSave={onSave}
        onToggle={() => onToggle(category.id)}
      />
      {isExpanded &&
        hasChildren &&
        category.children
          .filter((child) => child.isAffectingProfit)
          .map((child) => (
            <CategoryTreeRows
              key={child.id}
              {...sharedProps}
              category={child}
              depth={depth + 1}
              isExpenseSection={isExpenseSection}
            />
          ))}
    </>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const BudgetTable: React.FC<Props> = ({
  budgetId,
  budget,
  analytics,
  displayCurrency,
  rates,
  dailyStats,
  trends,
  seasonal,
}) => {
  const { data: catData } = useCategoryList();
  const { mutate: upsertLine, isPending: isSaving } = useUpsertBudgetLine(budgetId);
  const { mutate: deleteLine } = useDeleteBudgetLine(budgetId);
  const { mutate: updateNote } = useUpdateBudgetLineNote(budgetId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<DrawerListingTarget | null>(null);

  const timeframe = useMemo(
    () => ({
      after: moment(budget.startDate, BACKEND_DATE_FORMAT),
      before: moment(budget.endDate, BACKEND_DATE_FORMAT),
    }),
    [budget.startDate, budget.endDate],
  );

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const analyticsMap = useMemo(() => {
    const map = new Map<number, BudgetAnalyticsItem>();
    analytics.forEach((item) => map.set(item.categoryId, item));
    return map;
  }, [analytics]);

  const linesMap = useMemo(() => {
    const map = new Map<number, BudgetLineDTO>();
    (budget.lines ?? []).forEach((line) => map.set(line.categoryId, line));
    return map;
  }, [budget.lines]);

  const dailyStatsMap = useMemo(() => {
    const map = new Map<number, CategoryDailyStatsItem>();
    (dailyStats ?? []).forEach((item) => map.set(item.categoryId, item));
    return map;
  }, [dailyStats]);

  const trendsMap = useMemo(() => {
    const map = new Map<number, CategoryTrendItem>();
    (trends ?? []).forEach((item) => map.set(item.categoryId, item));
    return map;
  }, [trends]);

  const seasonalMap = useMemo(() => {
    const map = new Map<number, SeasonalItem>();
    (seasonal ?? []).forEach((item) => {
      map.set(item.categoryId, item);
      for (const child of item.children ?? []) {
        map.set(child.categoryId, child);
      }
    });
    return map;
  }, [seasonal]);

  const getActual = useCallback(
    (cat: Category) => {
      const ids = getAllDescendantIds(cat);
      let income = 0;
      let expense = 0;
      for (const id of ids) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        const cv = item.convertedValues[displayCurrency];
        if (cv) {
          income += cv.income ?? 0;
          expense += cv.expense ?? 0;
        }
      }
      return { income, expense };
    },
    [analyticsMap, displayCurrency],
  );

  const getPlanned = useCallback(
    (cat: Category): number | null => {
      const ownLine = linesMap.get(cat.id);
      if (ownLine) {
        const rate = getExchangeRate(ownLine.plannedCurrency, displayCurrency, rates);
        return rate !== null ? ownLine.plannedAmount * rate : null;
      }
      const descendantIds = getAllDescendantIds(cat).slice(1);
      let total = 0;
      let hasAny = false;
      for (const id of descendantIds) {
        const line = linesMap.get(id);
        if (!line) continue;
        const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
        if (rate !== null) {
          total += line.plannedAmount * rate;
          hasAny = true;
        }
      }
      return hasAny ? total : null;
    },
    [linesMap, displayCurrency, rates],
  );

  const handleCategoryClick = useCallback((categoryId: number, categoryName: string) => {
    setDrawerTarget({
      title: `Transactions in ${categoryName}`,
      initialFilters: { categories: [categoryId], withNestedCategories: true },
    });
    setDrawerOpen(true);
  }, []);

  const handleSave = useCallback(
    (categoryId: number, lineId: number | null, amount: number, currency: string) => {
      upsertLine(
        { lineId, payload: { categoryId, plannedAmount: amount, plannedCurrency: currency } },
        {
          onSuccess: () => toast.success('Budget line saved'),
          onError: () => toast.error('Failed to save budget line'),
        },
      );
    },
    [upsertLine],
  );

  const handleDelete = useCallback(
    (lineId: number) => {
      deleteLine(lineId, {
        onSuccess: () => toast.success('Budget line removed'),
        onError: () => toast.error('Failed to remove budget line'),
      });
    },
    [deleteLine],
  );

  const handleNoteUpdate = useCallback(
    (lineId: number, note: string | null) => {
      updateNote(
        { lineId, note },
        {
          onSuccess: () => toast.success(note ? 'Note saved' : 'Note removed'),
          onError: () => toast.error('Failed to save note'),
        },
      );
    },
    [updateNote],
  );

  if (!catData) return null;

  const expenseRoots = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);
  const incomeRoots = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income);

  const computeSectionTotals = (roots: Category[], isExpense: boolean) => {
    let totalPlanned = 0;
    let totalActual = 0;
    for (const root of roots) {
      const planned = getPlanned(root);
      if (planned !== null) totalPlanned += planned;
      const actual = getActual(root);
      totalActual += isExpense ? actual.expense : actual.income;
    }
    return { totalPlanned, totalActual };
  };

  const expTotals = computeSectionTotals(expenseRoots, true);
  const incTotals = computeSectionTotals(incomeRoots, false);

  const sharedRowProps = {
    expanded,
    onToggle: toggle,
    getActual,
    getPlanned,
    linesMap,
    dailyStatsMap,
    trendsMap,
    seasonalMap,
    onCategoryClick: handleCategoryClick,
    onDelete: handleDelete,
    onNoteUpdate: handleNoteUpdate,
    onSave: handleSave,
    isSaving,
    displayCurrency,
    budgetId,
  };

  const tableHead = (
    <thead>
      <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
        <th className="py-2 pl-4 pr-2 text-left font-medium w-full">Category</th>
        <th className="py-2 px-2 text-right font-medium whitespace-nowrap">Planned ({displayCurrency})</th>
        <th className="py-2 px-2 text-right font-medium whitespace-nowrap">Actual ({displayCurrency})</th>
        <th className="py-2 px-4 text-right font-medium whitespace-nowrap">Remaining</th>
      </tr>
    </thead>
  );

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ── Expenses ────────────────────────────────────────────────── */}
        <div className="relative z-0 overflow-x-auto">
          <div className="mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses</span>
          </div>
          <table className="w-full text-sm border-collapse">
            {tableHead}
            <tbody>
              {expenseRoots.map((cat) => (
                <CategoryTreeRows key={cat.id} {...sharedRowProps} category={cat} depth={0} isExpenseSection={true} />
              ))}
              <SectionTotalsRow
                actual={expTotals.totalActual}
                displayCurrency={displayCurrency}
                isExpense={true}
                label="Expense"
                planned={expTotals.totalPlanned}
              />
            </tbody>
          </table>
        </div>

        {/* ── Income ──────────────────────────────────────────────────── */}
        <div className="relative z-0 overflow-x-auto">
          <div className="mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</span>
          </div>
          <table className="w-full text-sm border-collapse">
            {tableHead}
            <tbody>
              {incomeRoots.map((cat) => (
                <CategoryTreeRows key={cat.id} {...sharedRowProps} category={cat} depth={0} isExpenseSection={false} />
              ))}
              <SectionTotalsRow
                actual={incTotals.totalActual}
                displayCurrency={displayCurrency}
                isExpense={false}
                label="Income"
                planned={incTotals.totalPlanned}
              />
            </tbody>
          </table>
        </div>
      </div>
      <TransactionsDrawer open={drawerOpen} target={drawerTarget} timeframe={timeframe} onOpenChange={setDrawerOpen} />
    </>
  );
};

export default BudgetTable;
