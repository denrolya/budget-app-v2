import { ResponsiveBar } from '@nivo/bar';
import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';
import { CHART_COLORS } from '@/constants/recharts';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';

import type { BudgetAnalyticsItem, BudgetDTO } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  analytics: BudgetAnalyticsItem[];
  budget: BudgetDTO;
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

/**
 * Category chart palette: uses the 10 shared chart CSS vars (theme-aware),
 * extended to 15 slots by cycling back through the first 5.
 */
const CATEGORY_PALETTE = [...CHART_COLORS, ...CHART_COLORS.slice(0, 5)];

const hashStr = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
};

// Assign colors: hash picks preferred slot, linear probe on collision. No duplicates.
const assignCategoryColors = (names: string[]): Map<string, string> => {
  const len = CATEGORY_PALETTE.length;
  const used = new Set<number>();
  const result = new Map<string, string>();

  for (const name of names) {
    let idx = hashStr(name) % len;
    while (used.has(idx)) idx = (idx + 1) % len;
    used.add(idx);
    result.set(name, CATEGORY_PALETTE[idx]);
  }
  return result;
};

const nivoTheme = {
  background: 'transparent',
  text: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 },
  grid: { line: { stroke: 'hsl(var(--border))', strokeWidth: 1 } },
  axis: {
    ticks: {
      line: { stroke: 'transparent' },
      text: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 },
    },
    domain: { line: { stroke: 'transparent' } },
  },
};

const getAllIds = (cat: Category): number[] => {
  const ids: number[] = [cat.id];
  for (const child of cat.children) ids.push(...getAllIds(child));
  return ids;
};

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

interface BarDatum {
  [key: string]: string | number;
  category: string;
  Planned: number;
  Actual: number;
  color: string;
}

const BudgetDistributionChart: React.FC<Props> = ({ analytics, budget, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();

  const { chartData, totalActual } = useMemo(() => {
    if (!catData) return { chartData: [], totalActual: 0 };

    const analyticsMap = new Map<number, BudgetAnalyticsItem>();
    analytics.forEach((item) => analyticsMap.set(item.categoryId, item));

    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));
    const expenseRoots = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);

    // First pass: compute values
    const rawRows: { name: string; actual: number; planned: number }[] = [];

    for (const cat of expenseRoots) {
      const ids = getAllIds(cat);
      let actual = 0;
      for (const id of ids) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        const cv = item.convertedValues[displayCurrency];
        if (cv) actual += cv.expense;
      }

      // Envelope model for planned
      let planned = 0;
      const ownLine = linesMap.get(cat.id);
      if (ownLine) {
        const rate = getExchangeRate(ownLine.plannedCurrency, displayCurrency, rates);
        if (rate !== null) planned = ownLine.plannedAmount * rate;
      } else {
        for (const id of ids.slice(1)) {
          const line = linesMap.get(id);
          if (!line) continue;
          const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
          if (rate !== null) planned += line.plannedAmount * rate;
        }
      }

      if (actual <= 0 && planned <= 0) continue;
      rawRows.push({ name: cat.name, actual: Math.round(actual), planned: Math.round(planned) });
    }

    // Second pass: assign collision-free colors
    const colorMap = assignCategoryColors(rawRows.map((r) => r.name));
    const rows: BarDatum[] = rawRows.map((r) => ({
      category: r.name,
      Actual: r.actual,
      Planned: r.planned,
      color: colorMap.get(r.name) ?? CATEGORY_PALETTE[0],
    }));

    // Reverse for Nivo horizontal bar (renders bottom-to-top)
    rows.reverse();

    const totalActual = rows.reduce((s, r) => s + r.Actual, 0);

    return { chartData: rows, totalActual };
  }, [catData, analytics, budget, displayCurrency, rates]);

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No spending data</div>;
  }

  const sym = CURRENCIES[displayCurrency as CURRENCY_CODE]?.symbol ?? displayCurrency;
  const fmtY = (v: number) => {
    const abs = Math.abs(v);
    return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(0)}k` : `${sym}${abs}`;
  };

  // Distribution bar uses original order (not reversed)
  const distData = [...chartData].reverse();

  return (
    <div aria-label="Budget distribution" role="img">
      {/* Stacked distribution bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
        {distData
          .filter((d) => d.Actual > 0)
          .map((item) => (
            <div
              title={`${item.category}: ${fmtAmt(item.Actual, displayCurrency)} (${totalActual > 0 ? Math.round((item.Actual / totalActual) * 100) : 0}%)`}
              style={{
                width: `${totalActual > 0 ? (item.Actual / totalActual) * 100 : 0}%`,
                backgroundColor: item.color,
              }}
              key={item.category}
            />
          ))}
      </div>

      {/* Nivo grouped bar chart */}
      <div style={{ height: Math.max(140, chartData.length * 40) }}>
        <ResponsiveBar
          borderColor="hsl(var(--muted-foreground) / 0.2)"
          borderRadius={2}
          borderWidth={1}
          data={chartData}
          groupMode="grouped"
          indexBy="category"
          keys={['Planned', 'Actual']}
          labelSkipWidth={48}
          labelTextColor="hsl(var(--foreground))"
          layout="horizontal"
          margin={{ top: 0, right: 56, bottom: 24, left: 128 }}
          padding={0.28}
          theme={nivoTheme}
          axisBottom={{
            tickSize: 0,
            tickPadding: 4,
            format: fmtY,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 4,
            renderTick: (tick) => {
              const datum = chartData.find((d) => d.category === tick.value);
              return (
                <g transform={`translate(${tick.x},${tick.y})`}>
                  <circle cx={-120} cy={0} fill={datum?.color ?? 'currentColor'} r={3.5} />
                  <text
                    dominantBaseline="central"
                    fill="hsl(var(--muted-foreground))"
                    fontSize={11}
                    textAnchor="start"
                    x={-112}
                  >
                    {String(tick.value)}
                  </text>
                </g>
              );
            },
          }}
          colors={(bar) => {
            if (bar.id === 'Planned') return 'hsl(var(--muted-foreground) / 0.12)';
            return 'hsl(var(--chart-1))';
          }}
          label={(d) => {
            const abs = Math.abs(d.value as number);
            return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` : `${sym}${abs}`;
          }}
          tooltip={({ indexValue, data: d }) => {
            const datum = d as BarDatum;
            const remaining = datum.Planned > 0 ? datum.Planned - datum.Actual : null;
            const isOver = remaining !== null && remaining < 0;
            return (
              <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm min-w-[160px]">
                <p className="font-medium text-xs mb-1">{indexValue}</p>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-xs">Planned</span>
                    <span className="tabular-nums text-xs">{fmtAmt(datum.Planned, displayCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-xs">Actual</span>
                    <span className="tabular-nums text-xs font-semibold">{fmtAmt(datum.Actual, displayCurrency)}</span>
                  </div>
                  {remaining !== null && (
                    <div className="flex items-center justify-between gap-4 border-t pt-0.5 mt-0.5">
                      <span className="text-muted-foreground text-xs">Remaining</span>
                      <span
                        className={cn(
                          'tabular-nums text-xs font-semibold',
                          isOver ? 'text-destructive' : 'text-success',
                        )}
                      >
                        {isOver ? '+' : ''}
                        {fmtAmt(remaining, displayCurrency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default BudgetDistributionChart;
