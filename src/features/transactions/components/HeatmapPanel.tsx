import moment from 'moment';
import React, { useState, useMemo, useCallback } from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';
import { useGlobalDailyStats, type HeatmapFilters } from '@/features/accounts';
import type { DailyStatsDatum } from '@/features/accounts/api/service';

import TransactionHeatmapChart, { type TransactionHeatmapChartProps } from './TransactionHeatmapChart';

export type { HeatmapFilters };

interface HeatmapPanelProps extends Omit<
  TransactionHeatmapChartProps,
  'data' | 'isLoading' | 'year' | 'rangeAfter' | 'rangeBefore'
> {
  filters?: HeatmapFilters;
  year?: number;
  rangeAfter?: moment.Moment;
  rangeBefore?: moment.Moment;
  /** Currency used for amount stats in the sidebar. Defaults to 'EUR'. */
  currency?: string;
  /** When false, the stats sidebar is hidden. Defaults to true. */
  showStats?: boolean;
}

// ─── Stats sidebar ────────────────────────────────────────────────────────────

type ViewMode = 'count' | 'income' | 'expense';

const computeStats = (
  rows: DailyStatsDatum[],
  viewMode: ViewMode,
  currency: string,
  rates: Record<string, number> | null,
) => {
  if (!rows.length) return null;

  const activeDays = rows.filter((r) => r.count > 0);
  if (!activeDays.length) return null;

  const totalCount = rows.reduce((s, r) => s + r.count, 0);

  const getValue = (row: DailyStatsDatum): number => {
    if (viewMode === 'count') return row.count;
    let total = 0;
    for (const [nat, cv] of Object.entries(row.convertedValues)) {
      const rate = nat === currency ? 1 : getExchangeRate(nat, currency, rates);
      if (rate !== null) total += (viewMode === 'income' ? cv.income : cv.expense) * rate;
    }
    return total;
  };

  let peakDay = activeDays[0];
  let peakValue = 0;
  for (const row of activeDays) {
    const v = getValue(row);
    if (v > peakValue) {
      peakValue = v;
      peakDay = row;
    }
  }

  return {
    totalCount,
    activeDays: activeDays.length,
    peakDate: peakDay.day,
    peakValue,
    avgPerActiveDay: totalCount / activeDays.length,
  };
};

const fmtAmount = (v: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.round(v).toLocaleString('en-US')}`;
};

interface StatsSidebarProps {
  rows: DailyStatsDatum[];
  viewMode: ViewMode;
  currency: string;
}

const StatsSidebar: React.FC<StatsSidebarProps> = ({ rows, viewMode, currency }) => {
  const { data: ratesData } = useExchangeRatesQuery();
  const rates = ratesData?.fixer ?? null;
  const stats = useMemo(() => computeStats(rows, viewMode, currency, rates), [rows, viewMode, currency, rates]);

  if (!stats) return null;

  const peakLabel =
    viewMode === 'count'
      ? `${stats.peakValue} txn${stats.peakValue !== 1 ? 's' : ''}`
      : fmtAmount(stats.peakValue, currency);

  const statRows = [
    { label: 'Total', value: viewMode === 'count' ? String(stats.totalCount) : null },
    { label: 'Active days', value: String(stats.activeDays) },
    { label: 'Avg / day', value: viewMode === 'count' ? stats.avgPerActiveDay.toFixed(1) : null },
    { label: 'Peak day', value: moment(stats.peakDate).format('D MMM'), sub: peakLabel },
  ].filter((r): r is { label: string; value: string; sub?: string } => r.value !== null);

  return (
    <div className="shrink-0 w-36 pt-8 pb-2 pr-4 hidden lg:flex flex-col gap-3">
      {statRows.map(({ label, value, sub }) => (
        <div key={label}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
        </div>
      ))}
    </div>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

/** Smart wrapper around TransactionHeatmapChart. Owns data fetching and year state. */
const HeatmapPanel: React.FC<HeatmapPanelProps> = ({
  filters = {},
  year: yearProp,
  rangeAfter,
  rangeBefore,
  onYearChange,
  onViewModeChange: onViewModeChangeProp,
  currency = 'EUR',
  showStats = true,
  ...chartProps
}) => {
  const thisYear = moment().year();
  const [year, setYear] = useState(yearProp ?? thisYear);
  const effectiveYear = yearProp ?? year;

  const after = useMemo(() => moment({ year: effectiveYear, month: 0, day: 1 }).startOf('day'), [effectiveYear]);
  const before = useMemo(
    () =>
      effectiveYear === thisYear
        ? moment().endOf('day')
        : moment({ year: effectiveYear, month: 11, day: 31 }).endOf('day'),
    [effectiveYear, thisYear],
  );

  const queryAfter = rangeAfter ?? after;
  const queryBefore = rangeBefore ?? before;

  const { data, isLoading } = useGlobalDailyStats(filters, queryAfter, queryBefore);

  const [viewMode, setViewMode] = useState<ViewMode>((chartProps.defaultViewMode as ViewMode | undefined) ?? 'count');

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      onViewModeChangeProp?.(mode);
    },
    [onViewModeChangeProp],
  );

  const rows = data?.data ?? [];

  return (
    <div className="flex items-start">
      <TransactionHeatmapChart
        {...chartProps}
        currency={currency}
        data={data}
        isLoading={isLoading}
        year={yearProp ?? year}
        onViewModeChange={handleViewModeChange}
        onYearChange={yearProp === undefined ? setYear : onYearChange}
      />
      {showStats && !isLoading && rows.length > 0 && (
        <StatsSidebar currency={currency} rows={rows} viewMode={viewMode} />
      )}
    </div>
  );
};

export default HeatmapPanel;
