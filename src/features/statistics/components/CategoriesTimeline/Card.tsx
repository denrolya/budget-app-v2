import { BarChart2, Calendar as CalendarIcon, LineChart, Plus, X } from 'lucide-react';
import moment, { type Moment } from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import DaterangePickerWithPresets from '@/components/common/DaterangePickerWithPresets';
import { CATEGORIES_TIMELINE_PRESETS } from '@/constants/datetime';
import { CHART_COLORS } from '@/constants/recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryTypeahead } from '@/features/categories';
import Chart from '@/features/statistics/components/CategoriesTimeline/Chart';
import ConfigurationMenu from '@/features/statistics/components/CategoriesTimeline/ConfigurationMenu';
import TransactionsDrawer from '@/features/statistics/components/CategoriesTimeline/TransactionsDrawer';
import { useExpenseCategories, useIncomeCategories } from '@/hooks/financeData';
import { useTimelineStatistics } from '@/hooks/statistics/useTimelineStatisticsRequest';
import { type UseTimeframeControl, useTimeframeControl } from '@/hooks/useTimeframeControl';
import { formatRange } from '@/lib/datetime/formatShortDate';
import { cn } from '@/lib/utils';
import { type ISO8601Period, type Timeframe } from '@/types/global';

const PERIOD_OPTIONS: { value: ISO8601Period; short: string; label: string }[] = [
  { value: 'P1D', short: 'D', label: 'Daily' },
  { value: 'P1W', short: 'W', label: 'Weekly' },
  { value: 'P1M', short: 'M', label: 'Monthly' },
  { value: 'P3M', short: '3M', label: 'Quarterly' },
  { value: 'P1Y', short: 'Y', label: 'Yearly' },
];

// Default category IDs — replace with user preference once that feature exists
const DEFAULT_CATEGORY_IDS = [1, 6, 73, 147];

type TransactionsTimeframe = { after: Moment; before: Moment } | null;

interface ChartEvent {
  activeLabel?: string;
  activePayload?: unknown[];
}

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  controlledTimeframe?: UseTimeframeControl;
}

export const CategoriesTimelineCard: React.FC<Props> = ({ controlledTimeframe, className }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedCategories, setSelectedCategories] = useState<number[]>(DEFAULT_CATEGORY_IDS);
  const [debouncedCategories, setDebouncedCategories] = useState<number[]>(selectedCategories);
  const [showExpenseReference, setShowExpenseReference] = useState(false);
  const [showIncomeReference, setShowIncomeReference] = useState(false);
  const [showComparisonInTooltip, setShowComparisonInTooltip] = useState(true);
  const [useSeparateAxisForTotals, setUseSeparateAxisForTotals] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTimeframeForTransactions, setSelectedTimeframeForTransactions] = useState<TransactionsTimeframe>(null);
  const [fetchTransactionsFromSubcategories, setFetchTransactionsFromSubcategories] = useState(false);

  // Category name lookup for chip display
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    [...expenseCategories, ...incomeCategories].forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [expenseCategories, incomeCategories]);

  const fallback = useTimeframeControl({
    defaultPeriod: 'P1M',
    enablePreviousTimeframe: false,
    enablePeriod: true,
    defaultTimeframe: {
      after: moment().subtract(1, 'year').startOf('year'),
      before: moment(),
    },
  });

  const {
    timeframe = fallback.timeframe,
    setTimeframe = fallback.setTimeframe,
    period: rawPeriod = fallback.period,
    setPeriod: rawSetPeriod = fallback.setPeriod,
  } = controlledTimeframe ?? {};

  const period = rawPeriod ?? fallback.period!;
  const setPeriod = rawSetPeriod ?? fallback.setPeriod!;

  const isControlled = Boolean(controlledTimeframe?.timeframe?.after);

  const { data, isLoading, error, refetch } = useTimelineStatistics(
    {
      period,
      after: timeframe.after,
      before: timeframe.before,
      categories: debouncedCategories,
      fetchIncomeReference: showIncomeReference,
      fetchExpenseReference: showExpenseReference,
    },
    [period, debouncedCategories],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedCategories(selectedCategories);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedCategories]);

  const removeCategory = useCallback((id: number) => setSelectedCategories((prev) => prev.filter((c) => c !== id)), []);

  const onChartClick = (chartEvent: ChartEvent) => {
    if (!chartEvent.activeLabel) return;

    const clickedDate = moment(chartEvent.activeLabel);
    let startDate: Moment;
    let endDate: Moment;

    switch (period) {
      case 'P1D':
        startDate = clickedDate.clone().startOf('day');
        endDate = clickedDate.clone().endOf('day');
        break;
      case 'P1W':
        startDate = clickedDate.clone().startOf('isoWeek');
        endDate = clickedDate.clone().endOf('isoWeek');
        break;
      case 'P1M':
      case 'P3M':
        startDate = clickedDate.clone().startOf('month');
        endDate = clickedDate.clone().endOf('month');
        break;
      case 'P1Y':
        startDate = clickedDate.clone().startOf('year');
        endDate = clickedDate.clone().endOf('year');
        break;
      default:
        return;
    }

    setSelectedTimeframeForTransactions({ after: startDate, before: endDate });
    setIsDrawerOpen(true);
  };

  const handleTimeframeChange = useCallback(
    (range: Timeframe) => {
      setTimeframe({
        after: range.after.clone().startOf('day'),
        before: range.before.clone().endOf('day'),
      });
    },
    [setTimeframe],
  );

  let chartContent: React.ReactNode = null;
  if (isLoading) {
    chartContent = <Skeleton className="h-full w-full" />;
  } else if (error) {
    chartContent = (
      <div className="chart-enter h-full flex flex-col items-center justify-center gap-2">
        <span className="text-2xs font-mono text-muted-foreground/60">Failed to load chart data</span>
        <button
          type="button"
          className="text-2xs font-mono text-muted-foreground hover:text-foreground border border-border/60 rounded px-2 py-0.5 transition-colors"
          onClick={refetch}
        >
          Retry
        </button>
      </div>
    );
  } else if (debouncedCategories.length === 0) {
    chartContent = (
      <div className="chart-enter h-full flex items-center justify-center">
        <span className="text-2xs font-mono text-muted-foreground/50">
          No series selected — use + to add a category
        </span>
      </div>
    );
  } else if (data && Object.keys(data).length === 0) {
    chartContent = (
      <div className="chart-enter h-full flex items-center justify-center">
        <span className="text-2xs font-mono text-muted-foreground/50">No data in the selected time range</span>
      </div>
    );
  } else if (data) {
    chartContent = (
      <Chart
        chartType={chartType}
        data={data}
        selectedPeriod={period}
        showComparisonInTooltip={showComparisonInTooltip}
        useSeparateAxisForTotals={useSeparateAxisForTotals}
        onClick={onChartClick}
      />
    );
  }

  return (
    <>
      <div className={cn('flex flex-col w-full min-h-[470px] border rounded-lg overflow-hidden bg-card', className)}>
        {/* Single dense toolbar — matches MoneyFlow style */}
        <div className="shrink-0 flex items-center gap-1 px-2 border-b h-8 bg-card">
          {/* Period segmented control */}
          <div className="flex items-center gap-0.5 bg-muted rounded p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                aria-label={opt.label}
                aria-pressed={period === opt.value}
                type="button"
                className={cn(
                  'h-5 px-1.5 text-2xs font-medium rounded-sm transition-colors',
                  period === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
              >
                {opt.short}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Chart type */}
          <div className="flex items-center gap-0 bg-muted rounded p-0.5">
            <button
              aria-label="Bar chart"
              aria-pressed={chartType === 'bar'}
              type="button"
              className={cn(
                'h-5 w-5 flex items-center justify-center rounded-sm transition-colors',
                chartType === 'bar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setChartType('bar')}
            >
              <BarChart2 className="h-3 w-3" />
            </button>
            <button
              aria-label="Line chart"
              aria-pressed={chartType === 'line'}
              type="button"
              className={cn(
                'h-5 w-5 flex items-center justify-center rounded-sm transition-colors',
                chartType === 'line'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setChartType('line')}
            >
              <LineChart className="h-3 w-3" />
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Category chips — takes remaining space, scrolls if overflow */}
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto">
            {selectedCategories.map((id, index) => {
              const name = categoryMap.get(id);
              const chipColor = CHART_COLORS[index % CHART_COLORS.length];
              return (
                <span
                  className="inline-flex items-center gap-1 h-5 px-1.5 text-2xs font-medium rounded-sm border border-border text-foreground shrink-0"
                  key={id}
                >
                  <span style={{ backgroundColor: chipColor }} className="h-1.5 w-1.5 rounded-full flex-none" />
                  <span className="max-w-[100px] truncate">{name ?? `#${id}`}</span>
                  <button
                    aria-label={`Remove ${name ?? `category ${id}`}`}
                    type="button"
                    className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => removeCategory(id)}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}

            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Add category"
                  type="button"
                  className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground border border-dashed border-border rounded-sm transition-colors shrink-0"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2">
                <CategoryTypeahead
                  multiple
                  value={selectedCategories.map(String)}
                  className="h-9 w-full"
                  onChange={(categories) => setSelectedCategories((categories as string[] | null)?.map(Number) ?? [])}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date picker (uncontrolled only) */}
          {!isControlled && (
            <>
              <div className="h-4 w-px bg-border mx-0.5" />
              <DaterangePickerWithPresets
                after={timeframe.after}
                before={timeframe.before}
                presets={CATEGORIES_TIMELINE_PRESETS}
                onChange={handleTimeframeChange}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground rounded px-1.5 py-0.5 leading-none cursor-pointer transition-colors"
                >
                  <CalendarIcon className="h-2.5 w-2.5" />
                  {formatRange(timeframe)}
                </button>
              </DaterangePickerWithPresets>
            </>
          )}

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Settings */}
          <ConfigurationMenu
            fetchTransactionsFromSubcategories={fetchTransactionsFromSubcategories}
            setFetchTransactionsFromSubcategories={setFetchTransactionsFromSubcategories}
            setShowComparisonInTooltip={setShowComparisonInTooltip}
            setShowExpenseReference={setShowExpenseReference}
            setShowIncomeReference={setShowIncomeReference}
            setUseSeparateAxisForTotals={setUseSeparateAxisForTotals}
            showComparisonInTooltip={showComparisonInTooltip}
            showExpenseReference={showExpenseReference}
            showIncomeReference={showIncomeReference}
            useSeparateAxisForTotals={useSeparateAxisForTotals}
          />
        </div>

        {/* Chart content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden" key={chartType}>
            {chartContent}
          </div>
        </div>
      </div>

      {selectedTimeframeForTransactions && (
        <TransactionsDrawer
          fetchFromSubcategories={fetchTransactionsFromSubcategories}
          isOpen={isDrawerOpen}
          selectedCategories={debouncedCategories}
          timeframe={selectedTimeframeForTransactions}
          onOpenChange={setIsDrawerOpen}
        />
      )}
    </>
  );
};

export default CategoriesTimelineCard;
