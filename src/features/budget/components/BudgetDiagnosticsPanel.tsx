import { TrendingDown, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';

import { useList as useCategoryList } from '@/features/categories';
import { cn } from '@/lib/utils';

import type { CategoryTrendItem } from '../api/types';

// ── Config ─────────────────────────────────────────────────────────────────────

const MIN_CHANGE_PCT = 15;
const MAX_ITEMS = 8;

const flattenTrends = (items: CategoryTrendItem[]): CategoryTrendItem[] =>
  items.flatMap((item) => [item, ...flattenTrends(item.children ?? [])]);

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  trends?: CategoryTrendItem[];
}

const BudgetDiagnosticsPanel: React.FC<Props> = ({ trends }) => {
  const { data: catData } = useCategoryList();
  const categoryMap = useMemo(() => new Map((catData?.list ?? []).map((c) => [c.id, c.name])), [catData]);

  const notable = useMemo(() => {
    if (!trends?.length) return [];
    return flattenTrends(trends)
      .filter((t) => t.direction !== 'stable' && Math.abs(t.changePercent) >= MIN_CHANGE_PCT)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, MAX_ITEMS);
  }, [trends]);

  if (notable.length === 0) return null;

  const rising = notable.filter((t) => t.direction === 'up');
  const falling = notable.filter((t) => t.direction === 'down');

  return (
    <div className="rounded-lg border border-border/50 bg-card p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Spending trends</span>
        <span className="text-2xs text-muted-foreground/40">vs prior period</span>
        {rising.length > 0 && (
          <span className="text-2xs text-warning font-medium tabular-nums">{rising.length} rising</span>
        )}
        {falling.length > 0 && (
          <span className="text-2xs text-success font-medium tabular-nums">{falling.length} falling</span>
        )}
      </div>

      {/* Trend rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
        {notable.map((item) => {
          const name = categoryMap.get(item.categoryId) ?? `#${item.categoryId}`;
          const isUp = item.direction === 'up';
          const Icon = isUp ? TrendingUp : TrendingDown;
          const changeColor = isUp ? 'text-warning' : 'text-success';
          const changePct = Math.round(Math.abs(item.changePercent));

          return (
            <div className="flex items-center gap-2 py-0.5 min-w-0" key={item.categoryId}>
              <Icon className={cn('h-3 w-3 shrink-0', changeColor)} />
              <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">{name}</span>
              <span className={cn('text-xs tabular-nums font-semibold shrink-0 font-mono w-10 text-right', changeColor)}>
                {isUp ? '+' : '−'}{changePct}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-muted-foreground/40 mt-1.5 leading-tight">
        Monthly avg change vs prior period · each category reflects its own direct transactions only, sub-categories listed separately
      </p>
    </div>
  );
};

export default BudgetDiagnosticsPanel;
