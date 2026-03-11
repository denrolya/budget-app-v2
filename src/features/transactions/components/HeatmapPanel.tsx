import moment from 'moment';
import React, { useState, useMemo, useCallback } from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { getExchangeRate } from '@/lib/getExchangeRates';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';
import { useGlobalDailyStats, type HeatmapFilters } from '@/features/accounts';
import type { DailyStatsDatum } from '@/features/accounts/api/service';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import TransactionHeatmapChart, { type TransactionHeatmapChartProps, YearPicker } from './TransactionHeatmapChart';

export type { HeatmapFilters };

interface HeatmapPanelProps extends Omit<
  TransactionHeatmapChartProps,
  'data' | 'isLoading' | 'year' | 'rangeAfter' | 'rangeBefore'
> {
  filters?: HeatmapFilters;
  year?: number;
  rangeAfter?: moment.Moment;
  rangeBefore?: moment.Moment;
  /** Currency used for amount stats. Defaults to 'EUR'. */
  currency?: string;
  /** When false, the stats strip is hidden. Defaults to true. */
  showStats?: boolean;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'count' | 'income' | 'expense';

// ─── localStorage persistence ─────────────────────────────────────────────────

const HEATMAP_VIEW_MODE_KEY = 'heatmap-view-mode';

const getStoredViewMode = (): ViewMode => {
  try {
    const v = localStorage.getItem(HEATMAP_VIEW_MODE_KEY);
    if (v === 'count' || v === 'income' || v === 'expense') return v;
  } catch {
    // ignore
  }
  return 'count';
};

// ─── Stats computation ────────────────────────────────────────────────────────

interface StatsResult {
  totalCount: number;
  totalAmount: number;
  activeDays: number;
  peakDate: string;
  peakValue: number;
  avgPerActiveDay: number;
  avgAmountPerActiveDay: number;
}

const computeStats = (
  rows: DailyStatsDatum[],
  viewMode: ViewMode,
  currency: string,
  rates: Record<string, number> | null,
): StatsResult | null => {
  if (!rows.length) return null;
  const activeDays = rows.filter((r) => r.count > 0);
  if (!activeDays.length) return null;

  const totalCount = rows.reduce((s, r) => s + r.count, 0);

  const getAmountValue = (row: DailyStatsDatum): number => {
    let total = 0;
    for (const [nat, cv] of Object.entries(row.convertedValues)) {
      const rate = nat === currency ? 1 : getExchangeRate(nat, currency, rates);
      if (rate !== null) total += (viewMode === 'income' ? cv.income : cv.expense) * rate;
    }
    return total;
  };

  const getValue = (row: DailyStatsDatum) => (viewMode === 'count' ? row.count : getAmountValue(row));

  let peakDay = activeDays[0];
  let peakValue = 0;
  let totalAmount = 0;

  for (const row of activeDays) {
    const v = getValue(row);
    if (viewMode !== 'count') totalAmount += v;
    if (v > peakValue) {
      peakValue = v;
      peakDay = row;
    }
  }

  return {
    totalCount,
    totalAmount,
    activeDays: activeDays.length,
    peakDate: peakDay.day,
    peakValue,
    avgPerActiveDay: totalCount / activeDays.length,
    avgAmountPerActiveDay: activeDays.length > 0 ? totalAmount / activeDays.length : 0,
  };
};

// ─── Inline stats strip ───────────────────────────────────────────────────────

const fmtAmt = (v: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.round(v).toLocaleString('en-US')}`;
};

const Bullet = () => (
  <span aria-hidden className="text-muted-foreground/30 select-none font-light">
    ·
  </span>
);

interface InlineStatsProps {
  stats: StatsResult;
  viewMode: ViewMode;
  currency: string;
}

const InlineStats: React.FC<InlineStatsProps> = ({ stats, viewMode, currency }) => {
  const isCount = viewMode === 'count';

  const total = isCount ? `${stats.totalCount.toLocaleString('en-US')} txns` : fmtAmt(stats.totalAmount, currency);

  const avg = isCount
    ? `${stats.avgPerActiveDay.toFixed(1)} / day`
    : `${fmtAmt(stats.avgAmountPerActiveDay, currency)} / day`;

  const peakSub = isCount
    ? `${stats.peakValue} txn${stats.peakValue !== 1 ? 's' : ''}`
    : fmtAmt(stats.peakValue, currency);

  return (
    <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground flex-wrap">
      <Bullet />
      <span className="font-semibold tabular-nums text-foreground">{total}</span>
      <Bullet />
      <span>
        <span className="font-semibold tabular-nums text-foreground">{stats.activeDays}</span> active days
      </span>
      <span className="hidden sm:contents">
        <Bullet />
        <span>
          avg <span className="font-semibold tabular-nums text-foreground">{avg}</span>
        </span>
      </span>
      <Bullet />
      <span>
        peak{' '}
        <span className="font-semibold tabular-nums text-foreground">{moment(stats.peakDate).format('D MMM')}</span>
        <span className="opacity-50"> ({peakSub})</span>
      </span>
    </div>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

/** Smart wrapper around TransactionHeatmapChart with its own compact header. */
const HeatmapPanel: React.FC<HeatmapPanelProps> = ({
  filters = {},
  year: yearProp,
  rangeAfter,
  rangeBefore,
  onYearChange,
  onViewModeChange: onViewModeChangeProp,
  currency = 'EUR',
  showStats = true,
  showControls,
  showViewMode,
  defaultViewMode: defaultViewModeProp,
  viewMode: viewModeProp,
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
  const { data: ratesData } = useExchangeRatesQuery();
  const rates = ratesData?.fixer ?? null;

  // Resolve initial view mode: explicit prop > localStorage > 'count'
  const initialViewMode: ViewMode = defaultViewModeProp ?? getStoredViewMode();
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  // When a controlled viewMode is passed, honour it; otherwise use internal state
  const effectiveViewMode: ViewMode = viewModeProp ?? viewMode;

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      if (!defaultViewModeProp) {
        try {
          localStorage.setItem(HEATMAP_VIEW_MODE_KEY, mode);
        } catch {
          // ignore
        }
      }
      onViewModeChangeProp?.(mode);
    },
    [onViewModeChangeProp, defaultViewModeProp],
  );

  const handleYearChange = useCallback(
    (y: number) => {
      setYear(y);
      onYearChange?.(y);
    },
    [onYearChange],
  );

  const rows = data?.data ?? [];
  const stats = useMemo(
    () => computeStats(rows, effectiveViewMode, currency, rates),
    [rows, effectiveViewMode, currency, rates],
  );

  // Header visibility logic — mirrors the chart's own showControls semantics
  const effectiveShowControls = showControls !== false;
  const showToggle = effectiveShowControls && showViewMode !== false;
  // Year picker only appears when HeatmapPanel owns the year (no external yearProp)
  const showYearPicker = effectiveShowControls && yearProp === undefined;
  const showStatsStrip = showStats && !!stats && !isLoading;
  const hasHeader = showYearPicker || showToggle || showStatsStrip;

  return (
    <div className="w-full">
      {/* ── Compact header: year · toggle · inline stats ── */}
      {hasHeader && (
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 px-4 pt-2 pb-1 min-h-9">
          {showYearPicker && <YearPicker year={effectiveYear} onChange={handleYearChange} />}

          {showToggle && (
            <ToggleGroup
              size="sm"
              type="single"
              value={effectiveViewMode}
              onValueChange={(v) => {
                if (v) handleViewModeChange(v as ViewMode);
              }}
            >
              <ToggleGroupItem value="count" className="text-xs px-2.5 h-7">
                Count
              </ToggleGroupItem>
              <ToggleGroupItem value="income" className="text-xs px-2.5 h-7">
                Income
              </ToggleGroupItem>
              <ToggleGroupItem value="expense" className="text-xs px-2.5 h-7">
                Expense
              </ToggleGroupItem>
            </ToggleGroup>
          )}

          {showStatsStrip && <InlineStats currency={currency} stats={stats} viewMode={effectiveViewMode} />}
        </div>
      )}

      {/* ── Chart: internal controls fully suppressed, view mode controlled ── */}
      <TransactionHeatmapChart
        {...chartProps}
        compact
        currency={currency}
        data={data}
        defaultViewMode={initialViewMode}
        isLoading={isLoading}
        showControls={false}
        showViewMode={false}
        viewMode={effectiveViewMode}
        year={effectiveYear}
        onViewModeChange={handleViewModeChange}
        onYearChange={handleYearChange}
      />
    </div>
  );
};

export default HeatmapPanel;
