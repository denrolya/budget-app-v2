import { Check, ChevronDown } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { MOMENT_DATE_VIEW_FORMAT_2 } from '@/constants/datetime';
import { getExchangeRate } from '@/lib/getExchangeRates';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';
import { useGlobalDailyStats } from '@/features/accounts/api';

// ─── Year picker ───────────────────────────────────────────────────────────────

interface YearPickerProps {
  year: number;
  onChange: (year: number) => void;
}

const YearPicker: React.FC<YearPickerProps> = ({ year, onChange }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const thisYear = moment().year();
  const presets = [thisYear, thisYear - 1, thisYear - 2, thisYear - 3];

  const commit = (y: number) => {
    onChange(y);
    setOpen(false);
    setInput('');
  };

  const handleCustom = () => {
    const n = parseInt(input, 10);
    if (n >= 2000 && n <= thisYear + 1) commit(n);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs h-8 px-3 gap-1 tabular-nums">
          {year}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-28 p-1">
        <div className="flex flex-col gap-0.5">
          {presets.map((y) => (
            <button
              className={cn(
                'text-sm px-2 py-1 text-left rounded hover:bg-muted transition-colors tabular-nums',
                y === year && 'bg-muted font-medium',
              )}
              key={y}
              onClick={() => commit(y)}
            >
              {y}
            </button>
          ))}
          <div className="border-t mt-1 pt-1 flex gap-1">
            <Input
              placeholder="Year"
              type="number"
              value={input}
              className="h-7 text-xs"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustom();
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCustom}>
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

type ViewMode = 'count' | 'income' | 'expense';

export interface TransactionHeatmapChartProps {
  /** Account IDs to show data for. Empty array = all accounts. */
  accountIds: number[];
  /** Currency code for formatting amounts in the tooltip. */
  currency?: string;
  /** Increment to clear the current drag selection (used when an external source changes the date range). */
  resetTrigger?: number;
  onRangeSelect?: (after: moment.Moment, before: moment.Moment) => void;
  onRangeClear?: () => void;
  /** When false, drag-to-select is disabled (e.g. on the budget page). Defaults to true. */
  selectable?: boolean;
  /** When false, hides the view-mode toggle and year selector — renders only the grid + legend. Defaults to true. */
  showControls?: boolean;
  /** Which view mode to start with (and lock to when showControls=false). Defaults to 'count'. */
  defaultViewMode?: ViewMode;
  /** Which year to show. Defaults to current year. */
  year?: number;
  /** Override the API query date range (e.g. budget period). Grid still shows the full year; cells outside the range will have no data. */
  rangeAfter?: moment.Moment;
  rangeBefore?: moment.Moment;
  /** When true, only counts transactions whose category.isAffectingProfit = true. Defaults to true. */
  affectingProfit?: boolean;
}

interface DayCell {
  date: string;
  value: number;
  weekIdx: number;
  dayOfWeek: number; // 0=Mon … 6=Sun
}

interface TooltipState {
  date: string;
  value: number;
  x: number;
  y: number;
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LEFT_PAD = 32;
const RIGHT_PAD = 4;
const TOP_PAD = 20;
const CELL_SIZE = 13;
const CELL_GAP = 3;

// Alpha steps for the 5-level color scale
const ALPHA_STEPS = [0.15, 0.3, 0.5, 0.7, 1];

// CSS variable references matching MoneyValue colors:
//   income  → --success (same green as positive MoneyValue)
//   expense → --destructive (same red as negative MoneyValue)
//   count   → --primary
const CSS_VAR: Record<ViewMode, string> = {
  count: '--primary',
  income: '--success',
  expense: '--destructive',
};

function heatColor(value: number, max: number, cssVar: string): string {
  if (!value || value <= 0) return 'hsl(var(--muted))';
  const ratio = Math.min(value / max, 1);
  const idx = Math.min(Math.floor(ratio * ALPHA_STEPS.length), ALPHA_STEPS.length - 1);
  return `hsl(var(${cssVar}) / ${ALPHA_STEPS[idx]})`;
}

function buildGrid(year: number, valueMap: Record<string, number>): DayCell[] {
  const cells: DayCell[] = [];
  const start = new Date(`${year}-01-01T00:00:00`);
  const end = new Date(`${year}-12-31T00:00:00`);
  const dow = start.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const firstMonday = new Date(start);
  firstMonday.setDate(firstMonday.getDate() + mondayOffset);

  let weekIdx = 0;
  const cursor = new Date(firstMonday);
  while (cursor <= end) {
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split('T')[0];
      if (cursor >= start && cursor <= end) {
        cells.push({ date: dateStr, value: valueMap[dateStr] ?? 0, weekIdx, dayOfWeek: d });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weekIdx++;
  }
  return cells;
}

function getMonthLabels(cells: DayCell[]) {
  const labels: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  for (const cell of cells) {
    if (cell.dayOfWeek !== 0) continue;
    const month = new Date(`${cell.date}T00:00:00`).getMonth();
    if (month !== lastMonth) {
      labels.push({ label: MONTH_NAMES[month], weekIdx: cell.weekIdx });
      lastMonth = month;
    }
  }
  return labels;
}

const TransactionHeatmapChart: React.FC<TransactionHeatmapChartProps> = ({
  accountIds,
  currency = 'EUR',
  resetTrigger,
  onRangeSelect,
  onRangeClear,
  selectable = true,
  showControls = true,
  defaultViewMode = 'count',
  year: yearProp,
  rangeAfter,
  rangeBefore,
  affectingProfit = true,
}) => {
  const thisYear = moment().year();
  const [yearState, setYearState] = useState(yearProp ?? thisYear);
  const year = yearProp ?? yearState;
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Clear selection when parent signals an external range change (e.g. listing navigation)
  const isFirstResetRef = useRef(true);
  useEffect(() => {
    if (isFirstResetRef.current) {
      isFirstResetRef.current = false;
      return;
    }
    setSelectedRange(null);
    setDragStart(null);
    setDragEnd(null);
  }, [resetTrigger]);

  const after = useMemo(() => moment({ year, month: 0, day: 1 }).startOf('day'), [year]);
  const before = useMemo(
    () => (year === thisYear ? moment().endOf('day') : moment({ year, month: 11, day: 31 }).endOf('day')),
    [year, thisYear],
  );

  // Use explicit range if provided (e.g. budget period), otherwise full year
  const queryAfter = rangeAfter ?? after;
  const queryBefore = rangeBefore ?? before;

  const { data, isLoading } = useGlobalDailyStats(accountIds, queryAfter, queryBefore, affectingProfit);
  const { data: ratesData } = useExchangeRatesQuery();
  const rates = ratesData?.fixer ?? null;

  const valueMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of data?.data ?? []) {
      if (viewMode === 'count') {
        map[item.day] = item.count;
      } else {
        let total = 0;
        for (const [nativeCurrency, cv] of Object.entries(item.convertedValues)) {
          const rate = nativeCurrency === currency ? 1 : getExchangeRate(nativeCurrency, currency, rates);
          if (rate !== null) total += (viewMode === 'income' ? cv.income : cv.expense) * rate;
        }
        map[item.day] = total;
      }
    }
    return map;
  }, [data, viewMode, currency, rates]);

  const cells = useMemo(() => buildGrid(year, valueMap), [year, valueMap]);
  const monthLabels = useMemo(() => getMonthLabels(cells), [cells]);
  const totalWeeks = useMemo(() => (cells.length > 0 ? Math.max(...cells.map((c) => c.weekIdx)) + 1 : 53), [cells]);
  const maxValue = useMemo(() => Math.max(...cells.map((c) => c.value), 1), [cells]);

  const step = CELL_SIZE + CELL_GAP;
  const svgWidth = LEFT_PAD + totalWeeks * step + RIGHT_PAD;
  const svgHeight = TOP_PAD + 7 * step + 4;
  const cssVar = CSS_VAR[viewMode];

  const isInRange = useCallback(
    (date: string): boolean => {
      if (!selectable) return false;
      const s = isDragging ? dragStart : selectedRange?.start;
      const e = isDragging ? dragEnd : selectedRange?.end;
      if (!s || !e) return false;
      const [lo, hi] = s <= e ? [s, e] : [e, s];
      return date >= lo && date <= hi;
    },
    [selectable, isDragging, dragStart, dragEnd, selectedRange],
  );

  const commitDrag = useCallback(() => {
    if (!selectable) return;
    if (isDragging && dragStart && dragEnd) {
      const [s, e] = dragStart <= dragEnd ? [dragStart, dragEnd] : [dragEnd, dragStart];
      setSelectedRange({ start: s, end: e });
      onRangeSelect?.(moment(s, 'YYYY-MM-DD').startOf('day'), moment(e, 'YYYY-MM-DD').endOf('day'));
    }
    setIsDragging(false);
  }, [selectable, isDragging, dragStart, dragEnd, onRangeSelect]);

  const handleClear = useCallback(() => {
    setSelectedRange(null);
    setDragStart(null);
    setDragEnd(null);
    onRangeClear?.();
  }, [onRangeClear]);

  const formatValue = (value: number) => {
    if (viewMode === 'count') return `${value} transaction${value !== 1 ? 's' : ''}`;
    const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
    return `${sym}${Math.round(value).toLocaleString('en-US')}`;
  };

  return (
    <div className="px-4 py-2">
      {/* Controls row: view toggle always visible; year picker only when showControls=true */}
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <ToggleGroup size="sm" type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
          <ToggleGroupItem value="count" className="text-xs px-2">
            Count
          </ToggleGroupItem>
          <ToggleGroupItem value="income" className="text-xs px-2">
            Income
          </ToggleGroupItem>
          <ToggleGroupItem value="expense" className="text-xs px-2">
            Expense
          </ToggleGroupItem>
        </ToggleGroup>

        {showControls && (
          <YearPicker
            year={year}
            onChange={(y) => {
              setYearState(y);
              handleClear();
            }}
          />
        )}
      </div>

      {/* Selection hint — only shown when selectable */}
      {selectable && (
        <div className="flex items-center justify-between mb-1 min-h-[16px]">
          <p className="text-xs text-muted-foreground">
            {isDragging
              ? 'Release to select range'
              : selectedRange
                ? `${moment(selectedRange.start).format('D MMM')} – ${moment(selectedRange.end).format('D MMM YYYY')}`
                : 'Drag to filter the transaction list'}
          </p>
          {selectedRange && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors"
              onClick={handleClear}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="h-24 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      )}

      {!isLoading && (
        <div
          className="w-full overflow-x-auto"
          onMouseLeave={
            selectable
              ? () => {
                  if (isDragging) commitDrag();
                  setTooltip(null);
                }
              : () => setTooltip(null)
          }
          onMouseUp={selectable ? commitDrag : undefined}
        >
          <svg
            height={svgHeight}
            style={{ minWidth: 300, display: 'block' }}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={svgWidth}
            className="select-none"
          >
            {monthLabels.map((m) => (
              <text
                fontFamily="inherit"
                fontSize={10}
                style={{ fill: 'hsl(var(--muted-foreground))' }}
                x={LEFT_PAD + m.weekIdx * step}
                y={12}
                key={`month-${m.weekIdx}`}
              >
                {m.label}
              </text>
            ))}

            {DAY_LABELS.map((label, i) =>
              label ? (
                <text
                  fontFamily="inherit"
                  fontSize={10}
                  style={{ fill: 'hsl(var(--muted-foreground))' }}
                  x={0}
                  y={TOP_PAD + i * step + CELL_SIZE - 2}
                  key={`dow-${i}`}
                >
                  {label}
                </text>
              ) : null,
            )}

            {cells.map((cell) => {
              const x = LEFT_PAD + cell.weekIdx * step;
              const y = TOP_PAD + cell.dayOfWeek * step;
              const inRange = isInRange(cell.date);
              const dimmed = selectable && !!selectedRange && !isDragging && !inRange;
              return (
                <rect
                  height={CELL_SIZE}
                  opacity={dimmed ? 0.3 : 1}
                  rx={2}
                  stroke={inRange ? 'hsl(var(--foreground))' : 'transparent'}
                  strokeWidth={inRange ? 1.5 : 0}
                  style={{ fill: heatColor(cell.value, maxValue, cssVar) }}
                  width={CELL_SIZE}
                  x={x}
                  y={y}
                  className={
                    selectable ? 'cursor-crosshair transition-opacity duration-75' : 'transition-opacity duration-75'
                  }
                  key={cell.date}
                  onMouseDown={
                    selectable
                      ? () => {
                          setIsDragging(true);
                          setDragStart(cell.date);
                          setDragEnd(cell.date);
                          setSelectedRange(null);
                        }
                      : undefined
                  }
                  onMouseEnter={(e) => {
                    if (selectable && isDragging) setDragEnd(cell.date);
                    if (cell.value > 0) setTooltip({ date: cell.date, value: cell.value, x: e.clientX, y: e.clientY });
                    else setTooltip(null);
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onMouseMove={(e) => {
                    if (cell.value > 0) setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
                  }}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* Floating tooltip rendered via fixed positioning */}
      {tooltip && (
        <div
          style={{ left: tooltip.x + 14, top: tooltip.y - 56 }}
          className="fixed z-50 pointer-events-none rounded-md border bg-background px-3 py-2 shadow-md text-sm"
        >
          <p className="text-muted-foreground text-xs mb-0.5">
            {moment(tooltip.date, 'YYYY-MM-DD').format(MOMENT_DATE_VIEW_FORMAT_2)}
          </p>
          <p className="font-semibold">{formatValue(tooltip.value)}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHeatmapChart;
