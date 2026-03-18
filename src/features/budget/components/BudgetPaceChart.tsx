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

const BudgetPaceChart: React.FC<Props> = ({ budget, analytics, displayCurrency, rates }) => {
  const after = useMemo(() => moment(budget.startDate), [budget.startDate]);
  const before = useMemo(() => moment(budget.endDate), [budget.endDate]);

  const { data: dailyStatsData, isLoading } = useGlobalDailyStats({ affectingProfit: true }, after, before);
  const { data: catData } = useCategoryList();

  // Total actual expense from analytics (same source as distribution chart)
  const totalActualExpense = useMemo(() => {
    if (!catData) return 0;
    const analyticsMap = new Map(analytics.map((a) => [a.categoryId, a]));
    const expenseRoots = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);
    let total = 0;
    for (const cat of expenseRoots) {
      for (const id of getAllIds(cat)) {
        const item = analyticsMap.get(id);
        if (!item) continue;
        const cv = item.convertedValues[displayCurrency];
        if (cv) total += cv.expense;
      }
    }
    return total;
  }, [analytics, catData, displayCurrency]);

  const { paceData, actualData, totalPlanned } = useMemo(() => {
    if (!catData) return { paceData: [], actualData: [], totalPlanned: 0 };

    const expenseRoots = catData.tree.filter((c) => c.isAffectingProfit && c.type === CategoryType.Expense);
    const linesMap = new Map((budget.lines ?? []).map((l) => [l.categoryId, l]));

    // Envelope model for planned: if root has a line, use it (children are sub-allocations).
    // If not, sum children's lines.
    let totalPlanned = 0;
    for (const root of expenseRoots) {
      const ownLine = linesMap.get(root.id);
      if (ownLine) {
        const rate = getExchangeRate(ownLine.plannedCurrency, displayCurrency, rates);
        if (rate !== null) totalPlanned += ownLine.plannedAmount * rate;
      } else {
        for (const id of getAllIds(root).slice(1)) {
          const line = linesMap.get(id);
          if (!line) continue;
          const rate = getExchangeRate(line.plannedCurrency, displayCurrency, rates);
          if (rate !== null) totalPlanned += line.plannedAmount * rate;
        }
      }
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

  // Summary stats — use totalActualExpense from analytics for consistency with distribution chart
  const spent = Math.round(totalActualExpense);
  const daysElapsed = actualData.length;
  const totalDaysInPeriod = moment(budget.endDate).diff(moment(budget.startDate), 'days') + 1;
  const daysLeft = Math.max(0, totalDaysInPeriod - daysElapsed);
  const dailyAvg = daysElapsed > 0 ? spent / daysElapsed : 0;
  const projected = Math.round(dailyAvg * totalDaysInPeriod);
  const usedPct = totalPlanned > 0 ? Math.round((spent / totalPlanned) * 100) : 0;
  const isOverBudget = totalPlanned > 0 && projected > totalPlanned;

  return (
    <div>
      <div style={{ height: 180 }}>
        <ResponsiveLine
          areaBaselineValue={0}
          areaOpacity={0.08}
          colors={(d) => (d as { color?: string }).color ?? 'hsl(var(--primary))'}
          enableArea={true}
          enableCrosshair={false}
          enableSlices="x"
          legends={[]}
          lineWidth={2}
          margin={{ top: 8, right: 12, bottom: 24, left: 48 }}
          pointSize={0}
          theme={nivoTheme}
          xFormat="time:%b %d"
          xScale={{ type: 'time', format: '%Y-%m-%d', useUTC: false, precision: 'day' }}
          yScale={{ type: 'linear', min: 0, max: 'auto' }}
          axisBottom={{
            format: xTickFormat,
            tickValues: xTickValues,
            tickSize: 0,
            tickPadding: 6,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
            format: fmtY,
            tickValues: 4,
          }}
          data={[
            {
              id: 'Budget limit',
              data: paceData,
              color: 'hsl(var(--muted-foreground) / 0.4)',
            },
            {
              id: 'Actual spend',
              data: actualData,
              color: actualColor,
            },
          ]}
          sliceTooltip={({ slice }) => {
            const budgetPoint = slice.points.find((p) => p.serieId === 'Budget limit');
            const actualPoint = slice.points.find((p) => p.serieId === 'Actual spend');
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
                    <span
                      className={`tabular-nums text-xs font-semibold ${over ? 'text-destructive' : 'text-primary'}`}
                    >
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

      {/* Summary stats */}
      <div className="flex flex-wrap items-center pt-1.5 border-t text-xs tabular-nums text-muted-foreground leading-tight divide-x divide-border [&>span]:px-2 first:[&>span]:pl-0">
        <span>
          <span className="font-medium text-foreground">
            {sym}
            {spent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          {totalPlanned > 0 && (
            <>
              {' '}
              / {sym}
              {totalPlanned.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({usedPct}%)
            </>
          )}
        </span>
        <span>
          {sym}
          {Math.round(dailyAvg).toLocaleString('en-US')}/d
        </span>
        <span>{daysLeft}d left</span>
        {totalPlanned > 0 && (
          <span className={isOverBudget ? 'text-destructive font-medium' : 'font-medium text-foreground'}>
            Proj {sym}
            {projected.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        )}
      </div>
    </div>
  );
};

export default BudgetPaceChart;
