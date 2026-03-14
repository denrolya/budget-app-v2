import { ResponsiveBar } from '@nivo/bar';
import React, { useMemo } from 'react';

import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import type { BudgetDTO, BudgetAnalyticsItem, BudgetLineDTO } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  budget: BudgetDTO;
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

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

type BarDatum = { category: string; Planned: number; Actual: number };

const BudgetCategoryBarChart: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();

  const chartData = useMemo(() => {
    if (!catData) return [];

    const analyticsMap = new Map<number, BudgetAnalyticsItem>();
    analytics.forEach((item) => analyticsMap.set(item.categoryId, item));

    const linesMap = new Map<number, BudgetLineDTO>();
    (budget.lines ?? []).forEach((line) => linesMap.set(line.categoryId, line));

    const expenseRoots = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);

    const rows = expenseRoots
      .map((cat) => {
        const ids = getAllIds(cat);

        let actual = 0;
        for (const id of ids) {
          const item = analyticsMap.get(id);
          if (!item) continue;
          const cv = item.convertedValues[displayCurrency];
          if (cv) actual += cv.expense ?? 0;
        }

        // Envelope model: own line = total cap; no own line = sum descendants.
        let planned: number | null = null;
        const ownLine = linesMap.get(cat.id);
        if (ownLine) {
          const rate = getExchangeRate(ownLine.plannedCurrency, displayCurrency, rates);
          if (rate !== null) planned = ownLine.plannedAmount * rate;
        } else {
          let total = 0;
          let hasAny = false;
          for (const id of ids.slice(1)) {
            const line = linesMap.get(id);
            if (!line) continue;
            const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
            if (rate !== null) {
              total += line.plannedAmount * rate;
              hasAny = true;
            }
          }
          if (hasAny) planned = total;
        }

        const safeActual = Number.isFinite(actual) ? actual : 0;
        if ((planned === null || planned === 0) && safeActual === 0) return null;

        return {
          category: cat.name,
          Planned: Math.round(planned ?? 0),
          Actual: Math.round(safeActual),
        };
      })
      .filter(Boolean) as BarDatum[];

    // Sort: overspent (actual > planned) first, then by actual desc
    rows.sort((a, b) => {
      const aOver = a.Actual - a.Planned;
      const bOver = b.Actual - b.Planned;
      if (aOver > 0 && bOver <= 0) return -1;
      if (bOver > 0 && aOver <= 0) return 1;
      return b.Actual - a.Actual;
    });

    return rows;
  }, [catData, analytics, budget, displayCurrency, rates]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data to display</div>
    );
  }

  const sym = CURRENCIES[displayCurrency as CURRENCY_CODE]?.symbol ?? displayCurrency;

  return (
    <div style={{ height: Math.max(120, chartData.length * 40) }}>
      <ResponsiveBar
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        borderRadius={2}
        data={chartData}
        groupMode="grouped"
        indexBy="category"
        keys={['Planned', 'Actual']}
        labelSkipWidth={36}
        labelTextColor="hsl(var(--background))"
        layout="horizontal"
        margin={{ top: 8, right: 64, bottom: 28, left: 110 }}
        padding={0.28}
        theme={nivoTheme}
        axisBottom={{
          tickSize: 0,
          tickPadding: 4,
          format: (v) => {
            const abs = Math.abs(v as number);
            return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(0)}k` : `${sym}${abs}`;
          },
        }}
        colors={(bar) => {
          if (bar.id === 'Planned') return 'hsl(var(--muted-foreground) / 0.35)';
          const d = bar.data as BarDatum;
          return d.Actual > d.Planned && d.Planned > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
        }}
        label={(d) => {
          const abs = Math.abs(d.value as number);
          return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` : `${sym}${abs}`;
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 64,
            translateY: 0,
            itemsSpacing: 4,
            itemWidth: 58,
            itemHeight: 18,
            itemTextColor: 'hsl(var(--muted-foreground))',
            symbolSize: 8,
            symbolShape: 'circle',
          },
        ]}
        tooltip={({ indexValue, data: d }) => {
          const row = d as BarDatum;
          const pct = row.Planned > 0 ? Math.round((row.Actual / row.Planned) * 100) : null;
          const over = row.Actual > row.Planned && row.Planned > 0;
          return (
            <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm min-w-[160px]">
              <p className="text-muted-foreground text-xs mb-1.5">{indexValue}</p>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-xs">Planned</span>
                  <span className="tabular-nums text-xs font-medium">{fmtAmt(row.Planned, displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-xs">Actual</span>
                  <span className={`tabular-nums text-xs font-semibold ${over ? 'text-destructive' : 'text-primary'}`}>
                    {fmtAmt(row.Actual, displayCurrency)}
                  </span>
                </div>
                {pct !== null && (
                  <div className="flex items-center justify-between gap-4 border-t pt-0.5 mt-0.5">
                    <span className="text-muted-foreground text-xs">Used</span>
                    <span className={`tabular-nums text-xs font-semibold ${over ? 'text-destructive' : ''}`}>
                      {pct}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default BudgetCategoryBarChart;
