import { ResponsiveLine } from '@nivo/line';
import moment from 'moment';
import React, { useMemo } from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { useList as useCategoryList } from '@/features/categories';
import { CategoryType } from '@/features/categories/types';
import Category from '@/features/categories/models/Category';
import { useGlobalDailyStats } from '@/features/accounts/api';

import type { BudgetDTO, BudgetAnalyticsItem } from '../api/types';
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

const BudgetPaceChart: React.FC<Props> = ({ budget, analytics: _analytics, displayCurrency, rates }) => {
  const after = useMemo(() => moment(budget.startDate), [budget.startDate]);
  const before = useMemo(() => moment(budget.endDate), [budget.endDate]);

  const { data: dailyStatsData, isLoading } = useGlobalDailyStats([], after, before);
  const { data: catData } = useCategoryList();

  const { paceData, actualData, totalPlanned } = useMemo(() => {
    // Only count expense lines for budget pace
    const expenseIds = new Set(
      (catData?.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense) ?? []).flatMap(getAllIds),
    );

    let totalPlanned = 0;
    for (const line of budget.lines ?? []) {
      if (!expenseIds.has(line.categoryId)) continue;
      const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
      if (rate !== null) totalPlanned += line.plannedAmount * rate;
    }

    // Build day-by-day cumulative actual spending — convert all native currencies
    const dailyMap = new Map<string, number>();
    for (const d of dailyStatsData?.data ?? []) {
      let dayExpense = 0;
      for (const [currency, cv] of Object.entries(d.convertedValues)) {
        const rate = currency === displayCurrency ? 1 : getExchangeRate(currency, displayCurrency, rates);
        if (rate !== null) dayExpense += cv.expense * rate;
      }
      if (dayExpense > 0) dailyMap.set(d.day, dayExpense);
    }

    const startMoment = moment(budget.startDate);
    const endMoment = moment.min(moment(budget.endDate), moment());
    const totalDays = moment(budget.endDate).diff(moment(budget.startDate), 'days');

    const pacePoints: { x: string; y: number }[] = [];
    const actualPoints: { x: string; y: number }[] = [];
    let cumActual = 0;

    let dayIdx = 0;
    const cursor = startMoment.clone();
    while (cursor.isSameOrBefore(endMoment, 'day')) {
      const dayStr = cursor.format(BACKEND_DATE_FORMAT);
      const budgetPace = totalDays > 0 ? (dayIdx / totalDays) * totalPlanned : 0;

      pacePoints.push({ x: dayStr, y: Math.round(budgetPace) });

      cumActual += dailyMap.get(dayStr) ?? 0;
      actualPoints.push({ x: dayStr, y: Math.round(cumActual) });

      cursor.add(1, 'day');
      dayIdx++;
    }

    return { paceData: pacePoints, actualData: actualPoints, totalPlanned };
  }, [budget, dailyStatsData, displayCurrency, rates, catData]);

  if (isLoading) {
    return <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (totalPlanned === 0 && actualData.every((d) => d.y === 0)) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        No data to display
      </div>
    );
  }

  const sym = CURRENCIES[displayCurrency as CURRENCY_CODE]?.symbol ?? displayCurrency;
  const fmtY = (v: number) => {
    const abs = Math.abs(v);
    return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(0)}k` : `${sym}${abs}`;
  };

  const periodDays = moment(budget.endDate).diff(moment(budget.startDate), 'days');
  const xTickValues =
    periodDays <= 60 ? 'every 1 week'
    : periodDays <= 120 ? 'every 2 weeks'
    : periodDays <= 366 ? 'every 1 month'
    : 'every 3 months';

  const xTickFormat =
    periodDays <= 120 ? '%b %d'
    : '%b %Y';

  return (
    <div style={{ height: 220 }}>
      <ResponsiveLine
        data={[
          {
            id: 'Budget limit',
            data: paceData,
            color: 'hsl(var(--muted-foreground))',
          },
          {
            id: 'Cumulative spend',
            data: actualData,
            color: 'hsl(var(--destructive))',
          },
        ]}
        margin={{ top: 12, right: 104, bottom: 40, left: 64 }}
        xScale={{ type: 'time', format: '%Y-%m-%d', useUTC: false, precision: 'day' }}
        xFormat="time:%b %d"
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        enableCrosshair={false}
        axisBottom={{
          format: xTickFormat,
          tickValues: xTickValues,
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          format: fmtY,
          tickValues: 5,
        }}
        colors={(d) => (d as any).color}
        lineWidth={2}
        pointSize={0}
        enableArea={false}
        theme={nivoTheme}
        enableSlices="x"
        sliceTooltip={({ slice }) => (
          <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm">
            <p className="text-muted-foreground text-xs mb-1">
              {slice.points[0]?.data.xFormatted}
            </p>
            {slice.points.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-muted-foreground">{p.serieId}:</span>
                <span className="font-semibold tabular-nums">
                  {sym}{Number(p.data.y).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 104,
            translateY: 0,
            itemsSpacing: 6,
            itemWidth: 96,
            itemHeight: 18,
            itemTextColor: 'hsl(var(--muted-foreground))',
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
      />
    </div>
  );
};

export default BudgetPaceChart;
