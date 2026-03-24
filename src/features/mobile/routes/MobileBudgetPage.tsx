import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { useBaseCurrency } from '@/features/auth';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { useBudget, useBudgetAnalytics, useBudgetInsights, useListBudgets } from '@/features/budget/api';
import type { BudgetAnalyticsItem, BudgetDTO } from '@/features/budget/api/types';
import type { DisplayCurrency } from '@/features/budget/components/BudgetDisplayCurrency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';
import { computeHealthScore, formatBudgetAmount } from '@/features/budget/utils';
import useBudgetTotals from '@/features/budget/hooks/useBudgetTotals';

import MobileBudgetInsights from '../components/MobileBudgetInsights';

// ─── Helpers ────────────────────────────────────────────────────────────────────

const getAllIds = (cat: Category): number[] => {
  const ids: number[] = [cat.id];
  for (const child of cat.children) ids.push(...getAllIds(child));
  return ids;
};

const MiniBar: React.FC<{ value: number; max?: number; colorClass: string }> = ({ value, max = 100, colorClass }) => (
  <div className="h-1 bg-muted rounded-full overflow-hidden">
    <div
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      className={cn('h-full rounded-full transition-all', colorClass)}
    />
  </div>
);

// ─── Category tree with budget status ────────────────────────────────────────

type TabType = 'expense' | 'income';

interface TreeNode {
  id: number;
  name: string;
  planned: number | null;
  actual: number;
  pct: number | null;
  status: 'over' | 'warning' | 'ok' | 'under' | 'none';
  children: TreeNode[];
}

const STATUS_COLORS: Record<TreeNode['status'], { text: string; bar: string }> = {
  over: { text: 'text-destructive', bar: 'bg-destructive' },
  warning: { text: 'text-warning', bar: 'bg-warning' },
  ok: { text: 'text-success', bar: 'bg-success' },
  under: { text: 'text-success', bar: 'bg-success' },
  none: { text: 'text-muted-foreground', bar: 'bg-muted-foreground/40' },
};

const useCategoryTree = (
  budget: BudgetDTO | undefined,
  analytics: BudgetAnalyticsItem[],
  displayCurrency: DisplayCurrency,
  rates: ConvertedValues | null,
  tab: TabType,
): TreeNode[] => {
  const { data: catData } = useCategoryList();

  return useMemo(() => {
    if (!budget || !catData) return [];

    const isExpenseTab = tab === 'expense';
    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));
    const analyticsMap = new Map(analytics.map((a) => [a.categoryId, a]));

    const getActual = (cat: Category): number => {
      let total = 0;
      for (const id of getAllIds(cat)) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        const cv = item.convertedValues[displayCurrency];
        if (cv) total += isExpenseTab ? cv.expense : cv.income;
      }
      return total;
    };

    const buildNode = (cat: Category): TreeNode | null => {
      if (!cat.isAffectingProfit) return null;

      const actual = getActual(cat);
      const line = linesMap.get(cat.id);

      let planned: number | null = null;
      if (line) {
        const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
        if (rate !== null) planned = line.plannedAmount * rate;
      }

      const childNodes = cat.children.map(buildNode).filter((n): n is TreeNode => n !== null);

      const hasBudgetOrSpending = planned !== null || actual > 0 || childNodes.length > 0;
      if (!hasBudgetOrSpending) return null;

      const pct = planned !== null && planned > 0 ? (actual / planned) * 100 : null;

      let status: TreeNode['status'] = 'none';
      if (pct !== null) {
        if (isExpenseTab) {
          if (pct > 100) status = 'over';
          else if (pct > 80) status = 'warning';
          else if (pct < 50 && actual > 0) status = 'under';
          else status = 'ok';
        } else {
          if (pct >= 100) status = 'ok';
          else if (pct >= 80) status = 'warning';
          else status = 'under';
        }
      }

      return { id: cat.id, name: cat.name, planned, actual, pct, status, children: childNodes };
    };

    const targetType = isExpenseTab ? CategoryType.Expense : CategoryType.Income;
    const roots = catData.tree.filter((c) => c.isAffectingProfit && c.type === targetType);
    return roots.map(buildNode).filter((n): n is TreeNode => n !== null);
  }, [budget, analytics, displayCurrency, rates, catData, tab]);
};

// ─── Collapsible animated tree row ──────────────────────────────────────────

const CollapsibleChildren: React.FC<{ expanded: boolean; children: React.ReactNode }> = ({ expanded, children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(expanded ? 'auto' : 0);
  const prevExpanded = useRef(expanded);

  React.useLayoutEffect(() => {
    if (prevExpanded.current === expanded) return;
    prevExpanded.current = expanded;

    const el = contentRef.current;
    if (!el) return;

    if (expanded) {
      const scrollH = el.scrollHeight;
      setHeight(0);
      requestAnimationFrame(() => {
        setHeight(scrollH);
        const timer = setTimeout(() => {
          setHeight('auto');
          el.removeEventListener('transitionend', onEnd);
        }, 250);
        const onEnd = () => {
          clearTimeout(timer);
          setHeight('auto');
          el.removeEventListener('transitionend', onEnd);
        };
        el.addEventListener('transitionend', onEnd);
      });
    } else {
      const scrollH = el.scrollHeight;
      el.style.height = `${scrollH}px`;
      void el.offsetHeight;
      setHeight(0);
    }
  }, [expanded]);

  return (
    <div
      style={{ height: typeof height === 'number' ? `${height}px` : 'auto' }}
      className="overflow-hidden transition-[height] duration-200 ease-in-out"
      ref={contentRef}
    >
      {children}
    </div>
  );
};

const TreeRow = React.memo<{ depth: number; displayCurrency: string; node: TreeNode }>(
  ({ depth, displayCurrency, node }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = node.children.length > 0;
    const colors = STATUS_COLORS[node.status];
    const paddingLeft = 12 + depth * 16;

    const toggle = useCallback(() => setExpanded((v) => !v), []);

    const actualLabel =
      node.planned !== null ? (
        <>
          {formatBudgetAmount(node.actual, displayCurrency)}
          <span className="text-muted-foreground"> / {formatBudgetAmount(node.planned, displayCurrency)}</span>
        </>
      ) : (
        <span className="text-muted-foreground">{formatBudgetAmount(node.actual, displayCurrency)}</span>
      );

    return (
      <div>
        <button
          aria-expanded={hasChildren ? expanded : undefined}
          disabled={!hasChildren}
          style={{ paddingLeft: `${paddingLeft}px` }}
          type="button"
          className="w-full flex items-center gap-1.5 py-2 pr-3 text-left active:bg-muted/40 transition-colors disabled:cursor-default"
          onClick={hasChildren ? toggle : undefined}
        >
          {hasChildren ? (
            <ChevronDown
              className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200', {
                '-rotate-90': !expanded,
              })}
            />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span className={cn('text-xs truncate', { 'font-medium': depth === 0 })}>{node.name}</span>
              <span className={cn('text-xs tabular-nums shrink-0', colors.text)}>{actualLabel}</span>
            </div>
            {node.pct !== null && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(node.pct, 100)}%` }}
                    className={cn('h-full rounded-full transition-all', colors.bar)}
                  />
                </div>
                <span className={cn('text-2xs tabular-nums shrink-0', colors.text)}>{node.pct.toFixed(0)}%</span>
              </div>
            )}
          </div>
        </button>

        {hasChildren && (
          <CollapsibleChildren expanded={expanded}>
            {node.children.map((child) => (
              <TreeRow depth={depth + 1} displayCurrency={displayCurrency} node={child} key={child.id} />
            ))}
          </CollapsibleChildren>
        )}
      </div>
    );
  },
);

// ─── Dummy budget for hook call when no budget selected ─────────────────────

const EMPTY_BUDGET: BudgetDTO = {
  id: 0,
  name: null,
  periodType: 'monthly',
  startDate: moment().startOf('month').format('YYYY-MM-DD'),
  endDate: moment().endOf('month').format('YYYY-MM-DD'),
  lines: [],
};

// ─── Page ───────────────────────────────────────────────────────────────────────

const MobileBudgetPage: React.FC = () => {
  const baseCurrency = useBaseCurrency();
  const displayCurrency = baseCurrency as DisplayCurrency;
  const [activeTab, setActiveTab] = useState<TabType>('expense');

  const { data: allBudgets, isLoading: budgetsLoading } = useListBudgets();
  const { data: ratesData } = useExchangeRatesQuery();
  const rates = ratesData?.fixer ?? null;

  const budgetId = useMemo(() => {
    if (!allBudgets || allBudgets.length === 0) return null;
    const sorted = [...allBudgets].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const today = moment().format('YYYY-MM-DD');
    let idx = sorted.findIndex((b) => b.startDate <= today && b.endDate >= today);
    if (idx === -1) idx = sorted.length - 1;
    return sorted[idx].id;
  }, [allBudgets]);

  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const activeBudgetId = selectedBudgetId ?? budgetId;

  const nav = useMemo(() => {
    if (!allBudgets || !activeBudgetId) return { prevId: null, nextId: null };
    const sorted = [...allBudgets].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const idx = sorted.findIndex((b) => b.id === activeBudgetId);
    return {
      prevId: idx > 0 ? sorted[idx - 1].id : null,
      nextId: idx < sorted.length - 1 ? sorted[idx + 1].id : null,
    };
  }, [allBudgets, activeBudgetId]);

  const { data: budget, isLoading: budgetLoading } = useBudget(activeBudgetId);
  const { data: analyticsData } = useBudgetAnalytics(activeBudgetId);
  const { data: insightsData } = useBudgetInsights(activeBudgetId);
  const analytics = analyticsData?.data ?? [];

  // Shared hook — uses same scoring as desktop + sidebar
  const stats = useBudgetTotals(budget ?? EMPTY_BUDGET, analytics, displayCurrency, rates);
  const treeNodes = useCategoryTree(budget, analytics, displayCurrency, rates, activeTab);

  if (budgetsLoading || budgetLoading) {
    return <p className="font-mono text-xs text-muted-foreground text-center py-10">loading...</p>;
  }

  if (!budget) {
    return <p className="font-mono text-xs text-muted-foreground text-center py-10">no budgets</p>;
  }

  const periodLabel =
    budget.periodType === 'monthly'
      ? moment(budget.startDate).format('MMM YYYY')
      : budget.periodType === 'yearly'
        ? moment(budget.startDate).format('YYYY')
        : `${moment(budget.startDate).format('D MMM')} – ${moment(budget.endDate).format('D MMM')}`;

  const pctColor = stats.percentUsed > 100 ? 'text-destructive' : stats.percentUsed > 80 ? 'text-warning' : undefined;
  const pctBarColor = stats.percentUsed > 100 ? 'bg-destructive' : stats.percentUsed > 80 ? 'bg-warning' : 'bg-primary';
  const remainingColor = stats.remaining < 0 ? 'text-destructive' : 'text-success';
  const savingsColor = stats.netSavings >= 0 ? 'text-success' : 'text-destructive';

  const { grade, gradeColor, score } = computeHealthScore(
    stats.percentUsed,
    stats.daysElapsed,
    stats.daysTotal,
    stats.totalPlannedIncome,
    stats.totalActualIncome,
  );

  const gradeBarColor =
    gradeColor === 'text-destructive' ? 'bg-destructive' : gradeColor.includes('warning') ? 'bg-warning' : 'bg-success';

  const daysPct = stats.daysTotal > 0 ? (stats.daysElapsed / stats.daysTotal) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Period selector */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
          <button
            aria-label="Previous budget period"
            disabled={!nav.prevId}
            type="button"
            className="h-9 w-9 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => nav.prevId && setSelectedBudgetId(nav.prevId)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-sm font-medium">{periodLabel}</span>
          <button
            aria-label="Next budget period"
            disabled={!nav.nextId}
            type="button"
            className="h-9 w-9 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => nav.nextId && setSelectedBudgetId(nav.nextId)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Summary metrics — 2x2 grid */}
        <div className="grid grid-cols-2 divide-x divide-border border-b text-sm">
          <div className="px-3 py-2.5 space-y-1">
            <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Expenses</div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className={cn('font-semibold tabular-nums truncate', pctColor)}>
                {formatBudgetAmount(stats.totalActualExpense, displayCurrency)}
              </span>
              <span className="text-2xs text-muted-foreground shrink-0">
                / {formatBudgetAmount(stats.totalPlannedExpense, displayCurrency)}
              </span>
            </div>
            <MiniBar colorClass={pctBarColor} value={stats.percentUsed} />
            <div className={cn('text-2xs font-medium tabular-nums', remainingColor)}>
              {stats.remaining < 0
                ? `${formatBudgetAmount(Math.abs(stats.remaining), displayCurrency)} over`
                : `${formatBudgetAmount(stats.remaining, displayCurrency)} left`}
            </div>
          </div>

          <div className="px-3 py-2.5 space-y-1">
            <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Income</div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold tabular-nums text-success truncate">
                {formatBudgetAmount(stats.totalActualIncome, displayCurrency)}
              </span>
              {stats.totalPlannedIncome > 0 && (
                <span className="text-2xs text-muted-foreground shrink-0">
                  / {formatBudgetAmount(stats.totalPlannedIncome, displayCurrency)}
                </span>
              )}
            </div>
            {stats.totalPlannedIncome > 0 && (
              <MiniBar colorClass="bg-success" max={stats.totalPlannedIncome} value={stats.totalActualIncome} />
            )}
            <div className={cn('text-2xs font-medium tabular-nums', savingsColor)}>
              {stats.netSavings >= 0 ? '+' : '-'}
              {formatBudgetAmount(Math.abs(stats.netSavings), displayCurrency)} net
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-border border-b text-sm">
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <span className={cn('font-bold text-2xl tabular-nums leading-none shrink-0', gradeColor)}>{grade}</span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Health</div>
              <div className="flex items-center gap-2">
                <MiniBar colorClass={gradeBarColor} value={score} />
                <span className="text-2xs tabular-nums text-muted-foreground shrink-0">{score}</span>
              </div>
            </div>
          </div>

          <div className="px-3 py-2.5 space-y-1">
            <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Period</div>
            <div className="flex items-baseline gap-1">
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

        {/* Insights — outliers only */}
        {insightsData && (
          <MobileBudgetInsights
            budgetStartDate={budget.startDate}
            displayCurrency={displayCurrency}
            insights={insightsData}
          />
        )}

        {/* Expense / Income tab selector */}
        <div className="flex border-b border-border">
          {(['expense', 'income'] as const).map((tab) => (
            <button
              type="button"
              className={cn('flex-1 py-2 font-mono text-xs uppercase tracking-wider text-center transition-colors', {
                'text-foreground border-b-2 border-primary font-medium': activeTab === tab,
                'text-muted-foreground': activeTab !== tab,
              })}
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>

        {/* Category tree */}
        {treeNodes.length > 0 ? (
          <div className="divide-y divide-border/20">
            {treeNodes.map((node) => (
              <TreeRow depth={0} displayCurrency={displayCurrency} node={node} key={node.id} />
            ))}
          </div>
        ) : (
          <div className="px-3 py-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">no budget lines</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileBudgetPage;
