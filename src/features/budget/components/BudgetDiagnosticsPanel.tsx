import { TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';

import { useList as useCategoryList } from '@/features/categories';
import type { Category } from '@/features/categories';
import { cn } from '@/lib/utils';

import type { CategoryTrendItem } from '../api/types';

// ── Config ─────────────────────────────────────────────────────────────────────

const MIN_CHANGE_PCT = 15;
const MAX_ITEMS = 8;

/** Safety net: remove items whose category is an ancestor of another item in the list. */
const deduplicateAncestors = (items: CategoryTrendItem[], categoryMap: Map<number, Category>): CategoryTrendItem[] => {
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

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  trends?: CategoryTrendItem[];
}

const BudgetDiagnosticsPanel: React.FC<Props> = ({ trends }) => {
  const { data: catData } = useCategoryList();
  const categoryMap = catData?.map;

  const notable = useMemo(() => {
    if (!trends?.length) return [];
    const filtered = trends
      .filter((t) => t.direction !== 'stable' && Math.abs(t.changePercent) >= MIN_CHANGE_PCT)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    const deduped = categoryMap ? deduplicateAncestors(filtered, categoryMap) : filtered;
    return deduped.slice(0, MAX_ITEMS);
  }, [trends, categoryMap]);

  const risingCount = useMemo(() => notable.filter((t) => t.direction === 'up').length, [notable]);
  const fallingCount = useMemo(() => notable.filter((t) => t.direction === 'down').length, [notable]);

  if (notable.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-card p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Spending trends</span>
        <span className="text-2xs text-muted-foreground/40">monthly average vs prior period</span>
        {risingCount > 0 && (
          <span className="text-2xs text-warning font-medium tabular-nums">{risingCount} rising</span>
        )}
        {fallingCount > 0 && (
          <span className="text-2xs text-success font-medium tabular-nums">{fallingCount} falling</span>
        )}
      </div>

      {/* Trend rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
        {notable.map((item) => {
          const category = categoryMap?.get(item.categoryId);
          const fullPath = category?.getFullPath() ?? [`#${item.categoryId}`];
          const isUp = item.direction === 'up';
          const Icon = isUp ? TrendingUp : TrendingDown;
          const changeColor = isUp ? 'text-warning' : 'text-success';
          const changePct = Math.round(Math.abs(item.changePercent));

          return (
            <div className="flex items-center gap-2 py-0.5 min-w-0" key={item.categoryId}>
              <Icon className={cn('h-3 w-3 shrink-0', changeColor)} />
              <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">
                {fullPath.length > 1 && (
                  <span className="text-muted-foreground/40">{fullPath.slice(0, -1).join(' › ')} › </span>
                )}
                {fullPath[fullPath.length - 1]}
              </span>
              <span className="text-2xs tabular-nums text-muted-foreground/60 shrink-0 font-mono">
                €{Math.round(item.olderAverage)}/mo
              </span>
              <span className="text-2xs text-muted-foreground/40 shrink-0">→</span>
              <span className="text-2xs tabular-nums text-muted-foreground shrink-0 font-mono">
                €{Math.round(item.recentAverage)}/mo
              </span>
              <span
                className={cn('text-xs tabular-nums font-semibold shrink-0 font-mono w-14 text-right', changeColor)}
              >
                {isUp ? '+' : '−'}
                {changePct}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-muted-foreground/40 mt-1.5 leading-tight">
        Each category includes its sub-categories · sub-categories listed separately
      </p>
    </div>
  );
};

export default BudgetDiagnosticsPanel;
