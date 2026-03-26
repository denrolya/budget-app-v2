import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { TransactionsDrawer, type DrawerListingTarget } from '@/features/statistics';
import type { ConvertedValues } from '@/features/transactions';
import { getExchangeRate } from '@/lib/getExchangeRates';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { BudgetAnalyticsItem, BudgetDTO, CategoryTrendItem, OutlierItem } from '../api/types';
import { formatBudgetAmount, getAllDescendantIds } from '../utils';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OvItem {
  categoryId: number;
  name: string;
  actual: number;
  planned: number;
  over: number;
}
interface UbItem {
  categoryId: number;
  name: string;
  actual: number;
}
type NonStableTrend = CategoryTrendItem & { direction: 'up' | 'down' };

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
  outliers?: OutlierItem[];
  trends?: CategoryTrendItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MIN_TREND_PCT = 15;
const MAX_TRENDS = 6;
const MAX_OUTLIERS = 5;

/** Remove items whose category is an ancestor of another item in the list. */
const removeRedundantAncestors = <T extends { categoryId: number }>(
  items: T[],
  categoryMap: Map<number, Category>,
): T[] => {
  const itemIds = new Set(items.map((t) => t.categoryId));
  const redundantIds = new Set<number>();

  for (const item of items) {
    let parent = categoryMap.get(item.categoryId)?.parent ?? null;
    while (parent) {
      if (itemIds.has(parent.id)) redundantIds.add(parent.id);
      parent = parent.parent;
    }
  }

  return items.filter((t) => !redundantIds.has(t.categoryId));
};

// ── Row layout: [tag] [item · item · item...] ─────────────────────────────────

interface SignalItem {
  key: string;
  node: React.ReactNode;
}

interface GroupRowProps {
  tag: string;
  tagClass: string;
  tagTooltip: string;
  lineClass: string;
  items: SignalItem[];
}

const GroupRow: React.FC<GroupRowProps> = ({ items, lineClass, tag, tagClass, tagTooltip }) => (
  <div className="flex items-baseline gap-2.5 px-3 py-1 min-w-0">
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn('font-mono text-3xs shrink-0 w-5 text-right tabular-nums leading-none cursor-help', tagClass)}
        >
          {tag}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">{tagTooltip}</TooltipContent>
    </Tooltip>
    <div className={cn('text-xs font-mono tabular-nums min-w-0 leading-snug', lineClass)}>
      {items.map(({ key, node }, i) => (
        <React.Fragment key={key}>
          {i > 0 && <span className="px-1.5 text-muted-foreground/50">·</span>}
          {node}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// ── Category label with path tooltip and optional click ───────────────────────

const CategoryLabel: React.FC<{ path: string[]; onClick?: () => void }> = ({ onClick, path }) => {
  const leaf = path[path.length - 1];
  const spanClass = cn(onClick ? 'cursor-pointer hover:underline' : path.length > 1 ? 'cursor-help' : undefined);

  if (path.length <= 1) {
    return (
      <span className={spanClass} onClick={onClick}>
        {leaf}
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={spanClass} onClick={onClick}>
          {leaf}
        </span>
      </TooltipTrigger>
      <TooltipContent>{path.join(' › ')}</TooltipContent>
    </Tooltip>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

const BudgetSignalsPanel: React.FC<Props> = ({ budget, analytics, displayCurrency, rates, outliers, trends }) => {
  const { data: catData } = useCategoryList();
  const categoryPathMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.getFullPath()])), [catData]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<DrawerListingTarget | null>(null);

  const budgetTimeframe = useMemo(
    () => ({ after: moment(budget.startDate), before: moment(budget.endDate) }),
    [budget.startDate, budget.endDate],
  );

  const openCategory = (categoryId: number, name: string) => {
    setDrawerTarget({
      title: `Transactions in ${name}`,
      initialFilters: { categories: [categoryId], withNestedCategories: true },
    });
    setDrawerOpen(true);
  };

  const { overspent, unbudgeted } = useMemo(() => {
    if (!catData) return { overspent: [] as OvItem[], unbudgeted: [] as UbItem[] };

    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));
    const analyticsMap = new Map(analytics.map((a) => [a.categoryId, a]));

    const getActual = (cat: Category): number => {
      let total = 0;
      for (const id of getAllDescendantIds(cat)) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        const cv = item.convertedValues[displayCurrency];
        if (cv) total += cv.expense;
      }
      return total;
    };

    const ovList: OvItem[] = [];
    const ubList: UbItem[] = [];
    const expenseCats = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);

    const checkOverspent = (cat: Category) => {
      if (!cat.isAffectingProfit) return;
      const actual = getActual(cat);
      const line = linesMap.get(cat.id);
      if (line) {
        const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
        const planned = rate !== null ? line.plannedAmount * rate : null;
        if (planned !== null && actual > planned && actual > 0) {
          ovList.push({ categoryId: cat.id, name: cat.name, actual, planned, over: actual - planned });
        }
      }
      for (const child of cat.children) checkOverspent(child);
    };

    const checkUnbudgeted = (cat: Category, depth: number) => {
      if (!cat.isAffectingProfit || depth > 1) return;
      const actual = getActual(cat);
      if (!linesMap.has(cat.id) && actual > 0) ubList.push({ categoryId: cat.id, name: cat.name, actual });
      for (const child of cat.children) checkUnbudgeted(child, depth + 1);
    };

    expenseCats.forEach((cat) => {
      checkOverspent(cat);
      checkUnbudgeted(cat, 0);
    });
    ovList.sort((a, b) => b.over - a.over);
    ubList.sort((a, b) => b.actual - a.actual);

    const catMap = catData.map;
    return {
      overspent: removeRedundantAncestors(ovList, catMap),
      unbudgeted: removeRedundantAncestors(ubList, catMap),
    };
  }, [budget, analytics, displayCurrency, rates, catData]);

  const activeCategoryIds = useMemo(() => {
    if (!catData) return new Set<number>();
    const analyticsMap = new Map(analytics.map((a) => [a.categoryId, a]));
    const active = new Set<number>();

    const walk = (cat: Category) => {
      let total = 0;
      for (const descendantId of getAllDescendantIds(cat)) {
        const cv = analyticsMap.get(descendantId)?.convertedValues[displayCurrency];
        if (cv) total += cv.expense;
      }
      if (total > 0) active.add(cat.id);
      for (const child of cat.children) walk(child);
    };

    catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense).forEach(walk);
    return active;
  }, [catData, analytics, displayCurrency]);

  const notableTrends = useMemo(() => {
    if (!trends?.length || !catData) return [] as NonStableTrend[];
    const filtered = trends
      .filter(
        (t): t is NonStableTrend =>
          t.direction !== 'stable' && Math.abs(t.changePercent) >= MIN_TREND_PCT && activeCategoryIds.has(t.categoryId),
      )
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    return removeRedundantAncestors(filtered, catData.map).slice(0, MAX_TRENDS);
  }, [trends, activeCategoryIds, catData]);

  const unusualTxns = outliers ?? [];

  const hasCritical = overspent.length > 0;
  const hasWarning = unbudgeted.length > 0 || unusualTxns.length > 0;
  const hasTrends = notableTrends.length > 0;

  if (!hasCritical && !hasWarning && !hasTrends) return null;

  let cardBorder = 'border-border/50';
  if (hasCritical) cardBorder = 'border-destructive/30';
  else if (hasWarning) cardBorder = 'border-warning/30';

  // ── Build item lists ──────────────────────────────────────────────────────

  const ovItems: SignalItem[] = overspent.map((item) => {
    const path = categoryPathMap.get(item.categoryId) ?? [item.name];
    return {
      key: `ov-${item.categoryId}`,
      node: (
        <span>
          <CategoryLabel path={path} onClick={() => openCategory(item.categoryId, path[path.length - 1])} />
          <span className="text-destructive font-semibold"> +{formatBudgetAmount(item.over, displayCurrency)}</span>
        </span>
      ),
    };
  });

  const nbItems: SignalItem[] = unbudgeted.map((item) => {
    const path = categoryPathMap.get(item.categoryId) ?? [item.name];
    return {
      key: `nb-${item.categoryId}`,
      node: (
        <span>
          <CategoryLabel path={path} onClick={() => openCategory(item.categoryId, path[path.length - 1])} />
          <span className="text-warning"> {formatBudgetAmount(item.actual, displayCurrency)}</span>
        </span>
      ),
    };
  });

  const hiItems: SignalItem[] = unusualTxns.slice(0, MAX_OUTLIERS).map((outlier) => {
    const path = categoryPathMap.get(outlier.categoryId) ?? ['—'];
    const date = moment(outlier.executedAt).format('MMM\u00a0D');
    const deviationTooltip = `${outlier.deviation}× median (avg ${formatBudgetAmount(outlier.median, displayCurrency)})`;
    const dateNode = outlier.note ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground cursor-help"> {date}</span>
        </TooltipTrigger>
        <TooltipContent>{outlier.note}</TooltipContent>
      </Tooltip>
    ) : (
      <span className="text-muted-foreground"> {date}</span>
    );
    return {
      key: `hi-${outlier.transactionId}`,
      node: (
        <span>
          <CategoryLabel path={path} onClick={() => openCategory(outlier.categoryId, path[path.length - 1])} />
          <span className="text-warning font-semibold">
            {' '}
            {formatBudgetAmount(outlier.convertedAmount, displayCurrency)}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-warning/60 cursor-help"> {outlier.deviation}×</span>
            </TooltipTrigger>
            <TooltipContent>{deviationTooltip}</TooltipContent>
          </Tooltip>
          {dateNode}
        </span>
      ),
    };
  });

  const upItems: SignalItem[] = notableTrends
    .filter((t) => t.direction === 'up')
    .map((item) => {
      const path = categoryPathMap.get(item.categoryId) ?? [`#${item.categoryId}`];
      const pct = Math.round(Math.abs(item.changePercent));
      return {
        key: `up-${item.categoryId}`,
        node: (
          <span>
            <CategoryLabel path={path} onClick={() => openCategory(item.categoryId, path[path.length - 1])} />
            <span className="text-warning font-semibold"> +{pct}%</span>
          </span>
        ),
      };
    });

  const downItems: SignalItem[] = notableTrends
    .filter((t) => t.direction === 'down')
    .map((item) => {
      const path = categoryPathMap.get(item.categoryId) ?? [`#${item.categoryId}`];
      const pct = Math.round(Math.abs(item.changePercent));
      return {
        key: `dn-${item.categoryId}`,
        node: (
          <span>
            <CategoryLabel path={path} onClick={() => openCategory(item.categoryId, path[path.length - 1])} />
            <span className="text-success font-semibold">
              {' '}
              {'\u2212'}
              {pct}%
            </span>
          </span>
        ),
      };
    });

  return (
    <>
      <div className={cn('rounded border overflow-hidden', cardBorder)}>
        <div className="divide-y divide-border/10 py-0.5">
          {ovItems.length > 0 && (
            <GroupRow
              items={ovItems}
              lineClass="text-foreground"
              tag="OV"
              tagClass="text-destructive/60"
              tagTooltip="Over budget"
            />
          )}
          {nbItems.length > 0 && (
            <GroupRow
              items={nbItems}
              lineClass="text-foreground"
              tag="NB"
              tagClass="text-warning/60"
              tagTooltip="No budget planned"
            />
          )}
          {hiItems.length > 0 && (
            <GroupRow
              items={hiItems}
              lineClass="text-foreground"
              tag="HI"
              tagClass="text-warning/60"
              tagTooltip="Unusual transaction"
            />
          )}
          {upItems.length > 0 && (
            <GroupRow
              items={upItems}
              lineClass="text-foreground"
              tag="↑"
              tagClass="text-warning/60"
              tagTooltip="Rising spend trend"
            />
          )}
          {downItems.length > 0 && (
            <GroupRow
              items={downItems}
              lineClass="text-foreground"
              tag="↓"
              tagClass="text-success/60"
              tagTooltip="Falling spend trend"
            />
          )}
        </div>
      </div>

      <TransactionsDrawer
        open={drawerOpen}
        target={drawerTarget}
        timeframe={budgetTimeframe}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
};

export default BudgetSignalsPanel;
