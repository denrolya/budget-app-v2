import { AlertTriangle, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import moment from 'moment';
import React, { useMemo } from 'react';

import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { getExchangeRate } from '@/lib/getExchangeRates';
import { cn } from '@/lib/utils';
import type { ConvertedValues } from '@/features/transactions';

import type { BudgetAnalyticsItem, BudgetDTO, CategoryTrendItem, OutlierItem } from '../api/types';
import { getAllDescendantIds, formatBudgetAmount } from '../utils';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OvItem {
  name: string;
  actual: number;
  planned: number;
  over: number;
}
interface UbItem {
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

const flattenTrends = (items: CategoryTrendItem[]): CategoryTrendItem[] =>
  items.flatMap((item) => [item, ...flattenTrends(item.children ?? [])]);

// ── Sub-sections ──────────────────────────────────────────────────────────────

const SectionHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider mb-1.5', className)}>
    {children}
  </div>
);

const OverspentSection: React.FC<{ items: OvItem[]; displayCurrency: string }> = ({ items, displayCurrency }) => (
  <div>
    <SectionHead className="text-destructive">
      <AlertTriangle className="h-3 w-3" />
      Overspent ({items.length})
    </SectionHead>
    <div className="space-y-1">
      {items.map((item) => {
        const fillPct = item.planned > 0 ? Math.min((item.actual / item.planned) * 100, 100) : 100;
        return (
          <div className="flex items-center gap-2 min-w-0" key={item.name}>
            <span className="text-xs text-muted-foreground truncate min-w-0 w-28 shrink-0">{item.name}</span>
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden shrink-0">
              <div style={{ width: `${fillPct}%` }} className="h-full bg-destructive rounded-full" />
            </div>
            <span className="text-2xs tabular-nums text-muted-foreground/70 shrink-0">
              {formatBudgetAmount(item.actual, displayCurrency)}
              <span className="text-muted-foreground/40 mx-0.5">/</span>
              {formatBudgetAmount(item.planned, displayCurrency)}
            </span>
            <span className="text-xs tabular-nums font-semibold font-mono text-destructive shrink-0 ml-auto">
              +{formatBudgetAmount(item.over, displayCurrency)}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const UnbudgetedSection: React.FC<{ items: UbItem[]; displayCurrency: string }> = ({ items, displayCurrency }) => (
  <div>
    <SectionHead className="text-warning">
      <TrendingDown className="h-3 w-3" />
      No budget line ({items.length}) · spending without a plan
    </SectionHead>
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          className="inline-flex items-center gap-1 rounded border border-warning/20 bg-background px-1.5 py-0.5 text-2xs"
          key={item.name}
        >
          <span className="text-muted-foreground">{item.name}</span>
          <span className="text-warning font-medium tabular-nums">
            {formatBudgetAmount(item.actual, displayCurrency)}
          </span>
        </span>
      ))}
    </div>
  </div>
);

const OutliersSection: React.FC<{ items: OutlierItem[]; catMap: Map<number, string>; displayCurrency: string }> = ({
  items,
  catMap,
  displayCurrency,
}) => (
  <div>
    <SectionHead className="text-warning">
      <Zap className="h-3 w-3" />
      Unusual transactions ({items.length}) · amount significantly above this category's typical transaction
    </SectionHead>
    <div className="space-y-0.5">
      {items.slice(0, MAX_OUTLIERS).map((outlier) => (
        <div className="flex items-center gap-2 py-0.5 min-w-0" key={outlier.transactionId}>
          <span className="text-2xs text-muted-foreground/60 shrink-0 w-16 truncate">
            {catMap.get(outlier.categoryId) ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">
            {outlier.note ?? moment(outlier.executedAt).format('MMM D')}
          </span>
          <span className="tabular-nums text-xs font-medium shrink-0">
            {formatBudgetAmount(outlier.convertedAmount, displayCurrency)}
          </span>
          <span className="tabular-nums text-2xs text-warning shrink-0">{outlier.deviation}×</span>
          <span className="tabular-nums text-2xs text-muted-foreground/40 shrink-0">
            typical ({formatBudgetAmount(outlier.median, displayCurrency)})
          </span>
          <span className="text-2xs text-muted-foreground/40 shrink-0">
            {moment(outlier.executedAt).format('MMM D')}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const TrendsSection: React.FC<{ items: NonStableTrend[]; catMap: Map<number, string>; displayCurrency: string }> = ({
  items,
  catMap,
  displayCurrency,
}) => (
  <div>
    <SectionHead className="text-muted-foreground">Spending trends · monthly average vs prior period</SectionHead>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
      {items.map((item) => {
        const isUp = item.direction === 'up';
        const Icon = isUp ? TrendingUp : TrendingDown;
        const color = isUp ? 'text-warning' : 'text-success';
        const changePct = Math.round(Math.abs(item.changePercent));
        const name = catMap.get(item.categoryId) ?? `#${item.categoryId}`;
        return (
          <div className="flex items-center gap-1.5 py-0.5 min-w-0" key={item.categoryId}>
            <Icon className={cn('h-3 w-3 shrink-0', color)} />
            <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">{name}</span>
            <span className="text-2xs tabular-nums text-muted-foreground/50 shrink-0">
              {formatBudgetAmount(item.olderAverage, displayCurrency)}/mo
            </span>
            <span className="text-2xs text-muted-foreground/30 shrink-0">→</span>
            <span className="text-2xs tabular-nums text-muted-foreground/70 shrink-0">
              {formatBudgetAmount(item.recentAverage, displayCurrency)}/mo
            </span>
            <span className={cn('text-xs tabular-nums font-semibold font-mono shrink-0 w-12 text-right', color)}>
              {isUp ? '+' : '−'}
              {changePct}%
            </span>
          </div>
        );
      })}
    </div>
    <p className="text-2xs text-muted-foreground/30 mt-1 leading-tight">
      Each category reflects its own direct transactions only · sub-categories listed separately
    </p>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const BudgetSignalsPanel: React.FC<Props> = ({ budget, analytics, displayCurrency, rates, outliers, trends }) => {
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

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
          ovList.push({ name: cat.name, actual, planned, over: actual - planned });
        }
      }
      for (const child of cat.children) checkOverspent(child);
    };

    const checkUnbudgeted = (cat: Category, depth: number) => {
      if (!cat.isAffectingProfit || depth > 1) return;
      const actual = getActual(cat);
      if (!linesMap.has(cat.id) && actual > 0) ubList.push({ name: cat.name, actual });
      for (const child of cat.children) checkUnbudgeted(child, depth + 1);
    };

    expenseCats.forEach((cat) => {
      checkOverspent(cat);
      checkUnbudgeted(cat, 0);
    });
    ovList.sort((a, b) => b.over - a.over);
    ubList.sort((a, b) => b.actual - a.actual);

    return { overspent: ovList, unbudgeted: ubList };
  }, [budget, analytics, displayCurrency, rates, catData]);

  const notableTrends = useMemo(() => {
    if (!trends?.length) return [] as NonStableTrend[];
    return flattenTrends(trends)
      .filter((t): t is NonStableTrend => t.direction !== 'stable' && Math.abs(t.changePercent) >= MIN_TREND_PCT)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, MAX_TRENDS);
  }, [trends]);

  const unusualTxns = outliers ?? [];

  const hasCritical = overspent.length > 0;
  const hasWarning = unbudgeted.length > 0 || unusualTxns.length > 0;
  const hasTrends = notableTrends.length > 0;

  if (!hasCritical && !hasWarning && !hasTrends) return null;

  const cardBorder = hasCritical ? 'border-destructive/25' : hasWarning ? 'border-warning/25' : 'border-border/50';
  const cardBg = hasCritical ? 'bg-destructive/[0.03]' : hasWarning ? 'bg-warning/[0.03]' : 'bg-card';

  const sections: { key: string; node: React.ReactElement }[] = [
    hasCritical
      ? { key: 'overspent', node: <OverspentSection displayCurrency={displayCurrency} items={overspent} /> }
      : null,
    unbudgeted.length > 0
      ? { key: 'unbudgeted', node: <UnbudgetedSection displayCurrency={displayCurrency} items={unbudgeted} /> }
      : null,
    unusualTxns.length > 0
      ? {
          key: 'outliers',
          node: <OutliersSection catMap={categoryMap} displayCurrency={displayCurrency} items={unusualTxns} />,
        }
      : null,
    hasTrends
      ? {
          key: 'trends',
          node: <TrendsSection catMap={categoryMap} displayCurrency={displayCurrency} items={notableTrends} />,
        }
      : null,
  ].filter((s): s is { key: string; node: React.ReactElement } => s !== null);

  return (
    <div className={cn('rounded-lg border p-3', cardBorder, cardBg)}>
      {sections.map(({ key, node }, index) => (
        <React.Fragment key={key}>
          {index > 0 && <div className="border-t border-border/30 my-3" />}
          {node}
        </React.Fragment>
      ))}
    </div>
  );
};

export default BudgetSignalsPanel;
