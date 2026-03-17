import { ResponsiveLine } from '@nivo/line';
import moment from 'moment';
import React, { useMemo } from 'react';

import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { BACKEND_DATE_FORMAT } from '@/constants/datetime';
import { getExchangeRate } from '@/lib/getExchangeRates';
import type { ConvertedValues } from '@/features/transactions';
import { useGlobalDailyStats } from '@/features/accounts';
import { type Category, CategoryType, useList as useCategoryList } from '@/features/categories';

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

  const { data: dailyStatsData, isLoading } = useGlobalDailyStats({}, after, before);
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
      const cv = d.convertedValues[displayCurrency];
      if (cv) dayExpense += cv.expense;
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

  if ((totalPlanned === 0 && actualData.every((d) => d.y === 0)) || paceData.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data to display</div>
    );
  }

  const sym = CURRENCIES[displayCurrency as CURRENCY_CODE]?.symbol ?? displayCurrency;
  const fmtY = (v: number) => {
    const abs = Math.abs(v);
    return abs >= 1000 ? `${sym}${(abs / 1000).toFixed(0)}k` : `${sym}${abs}`;
  };

  const periodDays = moment(budget.endDate).diff(moment(budget.startDate), 'days');
  const xTickValues =
    periodDays <= 60
      ? 'every 1 week'
      : periodDays <= 120
        ? 'every 2 weeks'
        : periodDays <= 366
          ? 'every 1 month'
          : 'every 3 months';

  const xTickFormat = periodDays <= 120 ? '%b %d' : '%b %Y';

  // Use success/destructive for actual spend based on how it ends
  const lastActual = actualData[actualData.length - 1]?.y ?? 0;
  const lastPace = paceData[paceData.length - 1]?.y ?? 0;
  const actualColor = lastActual > lastPace ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';

  return (
    <div style={{ height: 220 }}>
      <ResponsiveLine
        areaBaselineValue={0}
        areaOpacity={0.08}
        colors={(d) => (d as { color?: string }).color ?? 'hsl(var(--primary))'}
        enableArea={true}
        enableCrosshair={false}
        enableSlices="x"
        lineWidth={2}
        margin={{ top: 12, right: 104, bottom: 40, left: 64 }}
        pointSize={0}
        theme={nivoTheme}
        xFormat="time:%b %d"
        xScale={{ type: 'time', format: '%Y-%m-%d', useUTC: false, precision: 'day' }}
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
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
        data={[
          {
            id: 'Budget limit',
            data: paceData,
            color: 'hsl(var(--muted-foreground) / 0.6)',
          },
          {
            id: 'Cumulative spend',
            data: actualData,
            color: actualColor,
          },
        ]}
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
        sliceTooltip={({ slice }) => {
          const budgetPoint = slice.points.find((p) => p.serieId === 'Budget limit');
          const actualPoint = slice.points.find((p) => p.serieId === 'Cumulative spend');
          const budgetVal = Number(budgetPoint?.data.y ?? 0);
          const actualVal = Number(actualPoint?.data.y ?? 0);
          const over = actualVal > budgetVal && budgetVal > 0;
          return (
            <div className="rounded-md border bg-background px-3 py-2 shadow-md text-sm min-w-[170px]">
              <p className="text-muted-foreground text-xs mb-1.5">{slice.points[0]?.data.xFormatted}</p>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-xs">Budget pace</span>
                  <span className="tabular-nums text-xs font-medium">
                    {sym}
                    {budgetVal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-xs">Actual spend</span>
                  <span className={`tabular-nums text-xs font-semibold ${over ? 'text-destructive' : 'text-primary'}`}>
                    {sym}
                    {actualVal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {budgetVal > 0 && (
                  <div className="flex items-center justify-between gap-4 border-t pt-0.5 mt-0.5">
                    <span className="text-muted-foreground text-xs">Used</span>
                    <span className={`tabular-nums text-xs font-semibold ${over ? 'text-destructive' : ''}`}>
                      {Math.round((actualVal / budgetVal) * 100)}%
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

export default BudgetPaceChart;
