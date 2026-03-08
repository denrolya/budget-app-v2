import { ResponsivePie } from '@nivo/pie';
import React, { useMemo } from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { Category, CategoryType, useList as useCategoryList } from '@/features/categories';

import type { BudgetAnalyticsItem } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';

interface Props {
  analytics: BudgetAnalyticsItem[];
  displayCurrency: DisplayCurrency;
  rates: ConvertedValues | null;
}

const nivoTheme = {
  background: 'transparent',
  text: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 },
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

const BudgetDistributionChart: React.FC<Props> = ({ analytics, displayCurrency, rates }) => {
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
          for (const [currency, cv] of Object.entries(item.convertedValues)) {
            const rate = currency === displayCurrency ? 1 : getExchangeRate(currency, displayCurrency, rates);
            if (rate !== null) total += cv.expense * rate;
          }
        }
        if (total <= 0) return null;
        return {
          id: cat.name,
          label: cat.name,
          value: Math.round(total),
        };
      })
      .filter(Boolean) as { id: string; label: string; value: number }[];
  }, [catData, analytics, displayCurrency, rates]);

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No spending data</div>;
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ height: 240 }} className="relative">
      <ResponsivePie
        activeOuterRadiusOffset={6}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsStraightLength={8}
        arcLinkLabelsTextColor="hsl(var(--foreground))"
        arcLinkLabelsThickness={1}
        colors={{ scheme: 'red_grey' }}
        cornerRadius={3}
        data={chartData}
        enableArcLabels={false}
        enableArcLinkLabels={true}
        innerRadius={0.6}
        margin={{ top: 16, right: 100, bottom: 16, left: 100 }}
        padAngle={1.5}
        theme={nivoTheme}
        tooltip={({ datum }) => (
          <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm">
            <p className="text-muted-foreground text-xs mb-1">{datum.label}</p>
            <p className="font-semibold">{fmtAmt(datum.value, displayCurrency)}</p>
            <p className="text-muted-foreground text-xs">{((datum.value / total) * 100).toFixed(1)}% of total</p>
          </div>
        )}
      />
    </div>
  );
};

export default BudgetDistributionChart;
