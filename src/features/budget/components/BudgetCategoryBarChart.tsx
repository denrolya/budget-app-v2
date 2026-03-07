import { ResponsiveBar } from '@nivo/bar';
import React, { useMemo } from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { useList as useCategoryList } from '@/features/categories';
import Category from '@/features/categories/models/Category';
import { CategoryType } from '@/features/categories/types';

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

const BudgetCategoryBarChart: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const { data: catData } = useCategoryList();

  const chartData = useMemo(() => {
    if (!catData) return [];

    const analyticsMap = new Map<number, BudgetAnalyticsItem>();
    analytics.forEach((item) => analyticsMap.set(item.categoryId, item));

    const linesMap = new Map<number, BudgetLineDTO>();
    (budget.lines ?? []).forEach((line) => linesMap.set(line.categoryId, line));

    const expenseRoots = catData.tree.filter(
      (c) => c.isAffectingProfit && c.type === CategoryType.Expense,
    );

    return expenseRoots
      .map((cat) => {
        const ids = getAllIds(cat);

        let actual = 0;
        for (const id of ids) {
          const item = analyticsMap.get(id);
          if (!item) continue;
          for (const [currency, cv] of Object.entries(item.convertedValues)) {
            const rate = currency === displayCurrency ? 1 : getExchangeRate(currency, displayCurrency, rates);
            if (rate !== null) actual += cv.expense * rate;
          }
        }

        let planned = 0;
        for (const id of ids) {
          const line = linesMap.get(id);
          if (!line) continue;
          const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
          if (rate !== null) planned += line.plannedAmount * rate;
        }

        if (planned === 0 && actual === 0) return null;

        return {
          category: cat.name,
          Planned: Math.round(planned),
          Actual: Math.round(actual),
        };
      })
      .filter(Boolean) as { category: string; Planned: number; Actual: number }[];
  }, [catData, analytics, budget, displayCurrency, rates]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <div style={{ height: Math.max(140, chartData.length * 36) }}>
      <ResponsiveBar
        data={chartData}
        keys={['Planned', 'Actual']}
        indexBy="category"
        layout="horizontal"
        margin={{ top: 8, right: 80, bottom: 24, left: 110 }}
        padding={0.3}
        groupMode="grouped"
        colors={['hsl(var(--muted-foreground) / 0.5)', 'hsl(var(--destructive))']}
        theme={nivoTheme}
        borderRadius={2}
        label={(d) => {
          const sym = CURRENCIES[displayCurrency as CURRENCY_CODE]?.symbol ?? displayCurrency;
          const abs = Math.abs(d.value as number);
          return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` : `${sym}${abs}`;
        }}
        labelTextColor="hsl(var(--background))"
        labelSkipWidth={40}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisBottom={{
          tickSize: 0,
          tickPadding: 4,
          format: (v) => {
            const sym = CURRENCIES[displayCurrency as CURRENCY_CODE]?.symbol ?? displayCurrency;
            const abs = Math.abs(v as number);
            return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(0)}k` : `${sym}${abs.toLocaleString('en-US')}`;
          },
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 80,
            translateY: 0,
            itemsSpacing: 4,
            itemWidth: 70,
            itemHeight: 20,
            itemTextColor: 'hsl(var(--muted-foreground))',
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
        tooltip={({ id, value, indexValue }) => (
          <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm">
            <p className="text-muted-foreground text-xs mb-1">{indexValue}</p>
            <p className="font-semibold">
              {id}: {fmtAmt(value, displayCurrency)}
            </p>
          </div>
        )}
      />
    </div>
  );
};

export default BudgetCategoryBarChart;
