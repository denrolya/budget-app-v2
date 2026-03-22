import { ChevronRight, Check, X, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { cn } from '@/lib/utils';
import { CURRENCIES, type CURRENCY_CODE } from '@/constants/currency';
import { type Category } from '@/features/categories';

import type { BudgetLineDTO, CategoryDayStats, CategoryTrendItem, SeasonalItem } from '../api/types';

import type { DisplayCurrency } from './BudgetDisplayCurrency';
import { DISPLAY_CURRENCIES } from './BudgetDisplayCurrency';
import BudgetNotePopover from './BudgetNotePopover';
import BudgetSparkline from './BudgetSparkline';

interface Props {
  category: Category;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  line: BudgetLineDTO | null;
  plannedInDisplayCurrency: number | null;
  actual: { income: number; expense: number };
  displayCurrency: DisplayCurrency;
  isExpenseSection: boolean;
  budgetId: number;
  onSave: (categoryId: number, lineId: number | null, amount: number, currency: string) => void;
  onNoteUpdate: (lineId: number, note: string | null) => void;
  isSaving: boolean;
  onCategoryClick?: (categoryId: number, categoryName: string) => void;
  onDelete?: (lineId: number) => void;
  seasonal?: SeasonalItem;
  sparklineData?: CategoryDayStats[];
  trend?: CategoryTrendItem;
}

const fmtAmt = (n: number, currency: string) => {
  const sym = CURRENCIES[currency as CURRENCY_CODE]?.symbol ?? currency;
  return `${sym}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const BudgetCategoryRow: React.FC<Props> = ({
  category,
  depth,
  hasChildren,
  isExpanded,
  onToggle,
  line,
  plannedInDisplayCurrency,
  actual,
  displayCurrency,
  isExpenseSection,
  onSave,
  onNoteUpdate,
  isSaving,
  onCategoryClick,
  onDelete,
  seasonal,
  sparklineData,
  trend,
}) => {
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<string>(displayCurrency);
  const inputRef = useRef<HTMLInputElement>(null);

  const actualValue = isExpenseSection ? actual.expense : actual.income;
  const hasPlanned = plannedInDisplayCurrency !== null;

  const remaining = hasPlanned
    ? isExpenseSection
      ? plannedInDisplayCurrency! - actualValue
      : actualValue - plannedInDisplayCurrency!
    : null;

  const pct = hasPlanned && plannedInDisplayCurrency! > 0 ? (actualValue / plannedInDisplayCurrency!) * 100 : null;

  const remainingColorClass = (() => {
    if (isExpenseSection) {
      if (remaining !== null && remaining < 0) return 'text-destructive';
      if (pct !== null && pct > 80) return 'text-warning';
      return 'text-success';
    }
    // Income: red only if significantly under target
    if (pct !== null && pct < 80) return 'text-destructive';
    if (pct !== null && pct < 100) return 'text-warning';
    return 'text-success';
  })();

  const startEdit = () => {
    setEditAmount(line ? String(line.plannedAmount) : '');
    setEditCurrency(line ? line.plannedCurrency : displayCurrency);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => setEditing(false);

  const commitEdit = () => {
    const amount = parseFloat(editAmount);
    if (!isNaN(amount) && amount > 0) {
      onSave(category.id, line?.id ?? null, amount, editCurrency);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const indentClass = depth === 0 ? 'pl-4' : depth === 1 ? 'pl-8' : 'pl-12';

  return (
    <tr className={cn('group border-b hover:bg-muted/30 transition-colors', depth > 0 && 'text-muted-foreground')}>
      {/* Category name */}
      <td className={cn('py-1.5 pr-2', indentClass)}>
        <div className="flex items-center gap-1">
          {hasChildren ? (
            <button
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              type="button"
              className="p-0.5 rounded hover:bg-muted"
              onClick={onToggle}
            >
              <ChevronRight
                className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
              />
            </button>
          ) : (
            <span className="w-4 h-4 inline-block shrink-0" />
          )}
          {onCategoryClick ? (
            <button
              title="View transactions for this category"
              type="button"
              className="truncate hover:underline decoration-dashed underline-offset-2 text-left"
              onClick={() => onCategoryClick(category.id, category.name)}
            >
              {category.name}
            </button>
          ) : (
            <span className="truncate">{category.name}</span>
          )}
          {line && <BudgetNotePopover line={line} onNoteUpdate={onNoteUpdate} />}
          {line?.note && (
            <span title={line.note} className="text-xs text-muted-foreground italic truncate max-w-[80px]">
              {line.note}
            </span>
          )}
        </div>
      </td>

      {/* Planned (editable) */}
      <td className="py-1.5 px-2 text-right">
        {editing ? (
          <div className="flex items-center gap-1 justify-end">
            <Input
              min="0"
              step="0.01"
              type="number"
              value={editAmount}
              className="h-7 w-28 text-right text-xs"
              onChange={(e) => setEditAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
            <Select value={editCurrency} onValueChange={setEditCurrency}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_CURRENCIES.map((c) => (
                  <SelectItem value={c} className="text-xs" key={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              aria-label="Save"
              disabled={isSaving}
              type="button"
              className="p-1 rounded hover:bg-muted"
              onClick={commitEdit}
            >
              <Check className="h-3.5 w-3.5 text-success" />
            </button>
            <button aria-label="Cancel" type="button" className="p-1 rounded hover:bg-muted" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {line && onDelete && (
              <button
                aria-label="Remove planned amount"
                type="button"
                className="p-1 rounded hover:bg-muted"
                onClick={() => {
                  onDelete(line.id);
                  cancelEdit();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            )}
          </div>
        ) : (
          <button
            title="Click to edit planned amount"
            type="button"
            className="w-full text-right tabular-nums hover:underline decoration-dashed underline-offset-2 cursor-pointer"
            onClick={startEdit}
          >
            {hasPlanned ? (
              <span>
                {fmtAmt(plannedInDisplayCurrency!, displayCurrency)}
                {line && line.plannedCurrency !== displayCurrency && (
                  <span className="text-xs text-muted-foreground ml-1">({line.plannedCurrency})</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground/50 text-xs italic">add</span>
            )}
          </button>
        )}
      </td>

      {/* Actual + sparkline + trend */}
      <td className="py-1.5 px-2 text-right tabular-nums">
        {actualValue > 0 ? (
          <ResponsiveTooltip
            desktopComponent="hovercard"
            contentClassName="p-3 w-auto max-w-[240px]"
            content={
              <div className="text-xs tabular-nums">
                {trend && trend.direction !== 'stable' && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-2xs uppercase tracking-wider font-medium">
                      Trend — last 3mo vs prior
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Prior</span>
                      <span>{fmtAmt(trend.olderAverage, displayCurrency)}/mo</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Recent</span>
                      <span>{fmtAmt(trend.recentAverage, displayCurrency)}/mo</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Change</span>
                      <span
                        className={cn(
                          'font-semibold',
                          isExpenseSection
                            ? trend.direction === 'up'
                              ? 'text-destructive'
                              : 'text-success'
                            : trend.direction === 'up'
                              ? 'text-success'
                              : 'text-destructive',
                        )}
                      >
                        {trend.direction === 'up' ? '+' : ''}
                        {trend.changePercent}%
                      </span>
                    </div>
                  </div>
                )}
                {seasonal && (
                  <div className={cn('space-y-1', trend && trend.direction !== 'stable' && 'mt-2 pt-2 border-t')}>
                    <p className="text-muted-foreground text-2xs uppercase tracking-wider font-medium">
                      Seasonal — {seasonal.sampleYears}yr history
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">This month avg</span>
                      <span>{fmtAmt(seasonal.currentMonthHistoricalAverage, displayCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Overall avg</span>
                      <span>{fmtAmt(seasonal.overallMonthlyAverage, displayCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Factor</span>
                      <span
                        className={cn('font-semibold', seasonal.seasonalFactor > 1.0 ? 'text-warning' : 'text-success')}
                      >
                        {seasonal.seasonalFactor}x
                      </span>
                    </div>
                  </div>
                )}
                {!trend && !seasonal && <p className="text-muted-foreground">No trend or seasonal data</p>}
              </div>
            }
          >
            <div className="flex flex-col items-end gap-0.5 cursor-help">
              <span>{fmtAmt(actualValue, displayCurrency)}</span>
              <div className="flex items-center gap-1.5">
                {sparklineData && sparklineData.length >= 2 && (
                  <BudgetSparkline currency={displayCurrency} data={sparklineData} />
                )}
                {trend && trend.direction !== 'stable' && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-2xs font-medium',
                      isExpenseSection
                        ? trend.direction === 'up'
                          ? 'text-destructive'
                          : 'text-success'
                        : trend.direction === 'up'
                          ? 'text-success'
                          : 'text-destructive',
                    )}
                  >
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {Math.abs(trend.changePercent)}%
                  </span>
                )}
                {seasonal && (
                  <span
                    className={cn(
                      'text-2xs font-medium',
                      seasonal.seasonalFactor > 1.0 ? 'text-warning/70' : 'text-success/70',
                    )}
                  >
                    {seasonal.seasonalFactor}x
                  </span>
                )}
              </div>
            </div>
          </ResponsiveTooltip>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>

      {/* Remaining + % + progress bar */}
      <td className="py-1.5 px-4 text-right tabular-nums">
        {remaining !== null ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className={cn(remainingColorClass, 'whitespace-nowrap')}>
              {remaining < 0 ? '-' : ''}
              {fmtAmt(remaining, displayCurrency)}
            </span>
            {pct !== null && (
              <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  style={{ width: `${Math.min(pct, 100)}%` }}
                  className={cn(
                    'h-full rounded-full transition-all',
                    isExpenseSection
                      ? pct > 100
                        ? 'bg-destructive'
                        : pct > 80
                          ? 'bg-warning'
                          : 'bg-success'
                      : pct >= 100
                        ? 'bg-success'
                        : 'bg-muted-foreground/40',
                  )}
                />
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
    </tr>
  );
};

export default BudgetCategoryRow;
