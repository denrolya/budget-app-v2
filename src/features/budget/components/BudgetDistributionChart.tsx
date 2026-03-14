import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import type { BudgetAnalyticsItem } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
}

const PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220 70% 50%)',
  'hsl(160 60% 45%)',
  'hsl(30 80% 55%)',
  'hsl(280 65% 55%)',
  'hsl(60 75% 45%)',
];

const getAllIds = (cat: Category): number[] => {
  const ids: number[] = [cat.id];
  for (const child of cat.children) ids.push(...getAllIds(child));
  return ids;
};

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const BudgetDistributionChart: React.FC<Props> = ({ analytics, displayCurrency }) => {
  const { data: catData } = useCategoryList();

  const chartData = useMemo(() => {
    if (!catData) return [];

    const analyticsMap = new Map<number, BudgetAnalyticsItem>();
    analytics.forEach((item) => analyticsMap.set(item.categoryId, item));

    const expenseRoots = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);

    return expenseRoots
      .map((cat) => {
        const ids = getAllIds(cat);
        let total = 0;
        for (const id of ids) {
          const item = analyticsMap.get(id);
          if (!item) continue;
          const cv = item.convertedValues[displayCurrency];
          if (cv) total += cv.expense;
        }
        if (total <= 0) return null;
        return { name: cat.name, value: Math.round(total) };
      })
      .filter(Boolean)
      .sort((a, b) => b!.value - a!.value) as { name: string; value: number }[];
  }, [catData, analytics, displayCurrency]);

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No spending data</div>;
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const maxValue = chartData[0]?.value ?? 1;

  return (
    <div className="space-y-2.5">
      {/* Stacked proportional bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {chartData.map((item, idx) => (
          <div
            title={`${item.name}: ${((item.value / total) * 100).toFixed(1)}%`}
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: PALETTE[idx % PALETTE.length],
            }}
            key={item.name}
          />
        ))}
      </div>

      {/* Ranked list */}
      <div className="space-y-1.5 pt-1">
        {chartData.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          const color = PALETTE[idx % PALETTE.length];
          return (
            <div className="flex items-center gap-2.5" key={item.name}>
              <span aria-hidden style={{ backgroundColor: color }} className="h-2 w-2 rounded-sm shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: color, opacity: 0.7 }}
                    className={cn('h-full rounded-full transition-all duration-500')}
                  />
                </div>
              </div>
              <span className="text-xs font-semibold tabular-nums shrink-0 w-20 text-right">
                {fmtAmt(item.value, displayCurrency)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-1 border-t text-right">
        <span className="text-xs text-muted-foreground">Total </span>
        <span className="text-xs font-semibold tabular-nums">{fmtAmt(total, displayCurrency)}</span>
      </div>
    </div>
  );
};

export default BudgetDistributionChart;
