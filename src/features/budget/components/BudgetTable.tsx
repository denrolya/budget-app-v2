import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useList as useCategoryList } from '@/features/categories';
import Category from '@/features/categories/models/Category';
import { CategoryType } from '@/features/categories/types';
import {
  DrawerListingTarget,
  TransactionsDrawer,
} from '@/features/statistics/components/DistributionDonut/TransactionsDrawer';
import type { ConvertedValues } from '@/features/transactions';
import { getExchangeRate } from '@/lib/getExchangeRates';

import { useUpsertBudgetLine } from '../api';
import type { BudgetAnalyticsItem, BudgetDTO, BudgetLineDTO } from '../api/types';

import BudgetCategoryRow from './BudgetCategoryRow';
import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budgetId: number;
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const sortCats = (cats: Category[]): Category[] =>
  [...cats].sort((a, b) => {
    const aHas = a.children.some((c) => c.isAffectingProfit);
    const bHas = b.children.some((c) => c.isAffectingProfit);
    if (aHas !== bHas) return aHas ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

/** Collect all descendant IDs including self */
const getAllIds = (cat: Category): number[] => {
  const ids: number[] = [cat.id];
  for (const child of cat.children) ids.push(...getAllIds(child));
  return ids;
};

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const BudgetTable: React.FC<Props> = ({ budgetId, budget, analytics, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();
  const { mutate: upsertLine, isPending: isSaving } = useUpsertBudgetLine(budgetId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<DrawerListingTarget | null>(null);

  const timeframe = useMemo(
    () => ({
      after: moment(budget.startDate),
      before: moment(budget.endDate),
    }),
    [budget.startDate, budget.endDate],
  );

  // Empty set = all categories collapsed (only roots visible by default)
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Build lookup maps
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

  // Aggregate actual for a category (self + all descendants) converting all native currencies
  const getActual = useCallback(
    (cat: Category) => {
      const ids = getAllIds(cat);
      let income = 0;
      let expense = 0;
      for (const id of ids) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        for (const [currency, cv] of Object.entries(item.convertedValues)) {
          const rate = currency === displayCurrency ? 1 : getExchangeRate(currency, displayCurrency, rates);
          if (rate !== null) {
            income += cv.income * rate;
            expense += cv.expense * rate;
          }
        }
      }
      return { income, expense };
    },
    [analyticsMap, displayCurrency, rates],
  );

  // Convert planned line amount to display currency
  const getPlanned = useCallback(
    (line: BudgetLineDTO | null): number | null => {
      if (!line) return null;
      const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
      return rate !== null ? line.plannedAmount * rate : null;
    },
    [displayCurrency, rates],
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

  // Recursively render rows for a section
  const renderCategory = (cat: Category, depth: number, isExpenseSection: boolean): React.ReactNode[] => {
    if (!cat.isAffectingProfit) return [];

    const isExpanded = expanded.has(cat.id);
    const hasChildren = cat.children.some((c) => c.isAffectingProfit);

    const rows: React.ReactNode[] = [
      <BudgetCategoryRow
        actual={getActual(cat)}
        budgetId={budgetId}
        category={cat}
        depth={depth}
        displayCurrency={displayCurrency}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isExpenseSection={isExpenseSection}
        isSaving={isSaving}
        line={linesMap.get(cat.id) ?? null}
        plannedInDisplayCurrency={getPlanned(linesMap.get(cat.id) ?? null)}
        key={cat.id}
        onCategoryClick={handleCategoryClick}
        onSave={handleSave}
        onToggle={() => toggle(cat.id)}
      />,
    ];

    if (isExpanded && hasChildren) {
      for (const child of sortCats(cat.children)) {
        rows.push(...renderCategory(child, depth + 1, isExpenseSection));
      }
    }

    return rows;
  };

  const expenseRoots = sortCats(
    catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? [],
  );
  const incomeRoots = sortCats(
    catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Income) ?? [],
  );

  // Section totals — planned sums lines matching this section's category IDs
  const sectionTotals = (roots: Category[], isExpense: boolean) => {
    const allIds = new Set(roots.flatMap(getAllIds));
    let totalPlanned = 0;
    let totalActual = 0;

    for (const [catId, line] of linesMap) {
      if (!allIds.has(catId)) continue;
      const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
      if (rate !== null) totalPlanned += line.plannedAmount * rate;
    }

    for (const cat of roots) {
      const act = getActual(cat);
      totalActual += isExpense ? act.expense : act.income;
    }

    return { totalPlanned, totalActual };
  };

  const SectionTotalsRow: React.FC<{ label: string; planned: number; actual: number; isExpense: boolean }> = ({
    label,
    planned,
    actual,
    isExpense,
  }) => {
    const remaining = isExpense ? planned - actual : actual - planned;
    const pct = planned > 0 ? (actual / planned) * 100 : 0;
    return (
      <tr className="bg-muted/40 font-semibold text-sm border-t-2">
        <td className="py-2 pl-4 pr-2 text-left">{label} Total</td>
        <td className="py-2 px-2 text-right tabular-nums">{planned > 0 ? fmtAmt(planned, displayCurrency) : '—'}</td>
        <td className="py-2 px-2 text-right tabular-nums">{actual > 0 ? fmtAmt(actual, displayCurrency) : '—'}</td>
        <td
          className={`py-2 px-4 text-right tabular-nums ${remaining < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
        >
          {planned > 0 ? (
            <>
              {fmtAmt(remaining, displayCurrency)}
              <span className="ml-1 text-xs opacity-60">{pct.toFixed(0)}%</span>
            </>
          ) : (
            '—'
          )}
        </td>
      </tr>
    );
  };

  if (!catData) return null;

  const expTotals = sectionTotals(expenseRoots, true);
  const incTotals = sectionTotals(incomeRoots, false);

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
        <div className="overflow-x-auto">
          <div className="mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses</span>
          </div>
          <table className="w-full text-sm border-collapse">
            {tableHead}
            <tbody>
              {expenseRoots.flatMap((cat) => renderCategory(cat, 0, true))}
              <SectionTotalsRow
                actual={expTotals.totalActual}
                isExpense={true}
                label="Expense"
                planned={expTotals.totalPlanned}
              />
            </tbody>
          </table>
        </div>

        {/* ── Income ──────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <div className="mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</span>
          </div>
          <table className="w-full text-sm border-collapse">
            {tableHead}
            <tbody>
              {incomeRoots.flatMap((cat) => renderCategory(cat, 0, false))}
              <SectionTotalsRow
                actual={incTotals.totalActual}
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
