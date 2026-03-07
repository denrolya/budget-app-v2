import { ChevronRight, Check, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import Category from '@/features/categories/models/Category';

import type { BudgetLineDTO } from '../api/types';
import type { DisplayCurrency } from './BudgetDisplayCurrency';
import { DISPLAY_CURRENCIES } from './BudgetDisplayCurrency';

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
  isSaving: boolean;
  onCategoryClick?: (categoryId: number, categoryName: string) => void;
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
  isSaving,
  onCategoryClick,
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

  const pct =
    hasPlanned && plannedInDisplayCurrency! > 0
      ? (actualValue / plannedInDisplayCurrency!) * 100
      : null;

  const startEdit = () => {
    setEditAmount(line ? String(line.plannedAmount) : '');
    setEditCurrency(line ? line.plannedCurrency : displayCurrency);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

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
    <tr
      className={cn(
        'border-b hover:bg-muted/30 transition-colors',
        depth > 0 && 'text-muted-foreground',
      )}
    >
      {/* Category name */}
      <td className={cn('py-1.5 pr-2', indentClass)}>
        <div className="flex items-center gap-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={onToggle}
              className="p-0.5 rounded hover:bg-muted"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
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
              type="button"
              className="truncate hover:underline decoration-dashed underline-offset-2 text-left"
              onClick={() => onCategoryClick(category.id, category.name)}
              title="View transactions for this category"
            >
              {category.name}
            </button>
          ) : (
            <span className="truncate">{category.name}</span>
          )}
        </div>
      </td>

      {/* Planned (editable) */}
      <td className="py-1.5 px-2 text-right">
        {editing ? (
          <div className="flex items-center gap-1 justify-end">
            <Input
              ref={inputRef}
              type="number"
              min="0"
              step="0.01"
              className="h-7 w-28 text-right text-xs"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Select value={editCurrency} onValueChange={setEditCurrency}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={commitEdit}
              disabled={isSaving}
              className="p-1 rounded hover:bg-muted"
              aria-label="Save"
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="p-1 rounded hover:bg-muted"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-full text-right tabular-nums hover:underline decoration-dashed underline-offset-2 cursor-pointer"
            title="Click to edit planned amount"
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

      {/* Actual */}
      <td className="py-1.5 px-2 text-right tabular-nums">
        {actualValue > 0
          ? fmtAmt(actualValue, displayCurrency)
          : <span className="text-muted-foreground/40">—</span>}
      </td>

      {/* Remaining + % */}
      <td className="py-1.5 px-4 text-right tabular-nums">
        {remaining !== null ? (
          <span className={remaining < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}>
            {remaining < 0 ? '-' : ''}
            {fmtAmt(remaining, displayCurrency)}
            {pct !== null && (
              <span
                className={cn(
                  'ml-1 text-xs',
                  isExpenseSection
                    ? pct > 100 ? 'text-destructive' : pct > 80 ? 'text-yellow-600 dark:text-yellow-400' : 'opacity-60'
                    : pct > 100 ? 'text-green-600 dark:text-green-400' : 'opacity-60',
                )}
              >
                {pct.toFixed(0)}%
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
    </tr>
  );
};

export default BudgetCategoryRow;
