import { forwardRef, type ReactNode, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';
import MoneyValue from '@/components/common/MoneyValue';
import type Debt from '@/features/debts/models/Debt';
import { useDebts } from '@/hooks/financeData';
import Typeahead, { type TypeaheadProps } from '@/components/ui/Typeahead';

type DebtTypeaheadProps = Omit<
  TypeaheadProps<Debt, string>,
  'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement'
> & {
  className?: string;
};

const DebtTypeahead = forwardRef<HTMLInputElement, DebtTypeaheadProps>(
  ({ multiple = false, value, onChange, className, ...props }, ref) => {
    const debts = useDebts();

    const normalizedValue = useMemo(() => {
      if (value == null) return value;
      if (Array.isArray(value)) return value.map((v) => String(v));
      return String(value);
    }, [value]);

    const handleChange = useCallback(
      (next: string | string[] | null) => {
        if (next == null) return onChange(null);
        if (Array.isArray(next)) return onChange(next.map((v) => String(v)));
        return onChange(String(next));
      },
      [onChange],
    );

    const searchIndex = useMemo(() => {
      const map = new Map<string, string>();

      for (const d of debts) {
        map.set(
          String(d.id),
          [d.debtor, d.debtorWithCurrency, d.currency, d.note ?? '', d.isClosed() ? 'closed' : '']
            .join(' ')
            .toLowerCase(),
        );
      }

      return map;
    }, [debts]);

    const filterFn: TypeaheadProps<Debt, string>['filterFn'] = useCallback(
      (debt: Debt, input: string) => {
        const q = input.trim().toLowerCase();
        if (!q) return true;

        const idx = searchIndex.get(String(debt.id));
        if (idx) return idx.includes(q);

        return (
          debt.debtor.toLowerCase().includes(q) ||
          debt.debtorWithCurrency.toLowerCase().includes(q) ||
          (debt.note ?? '').toLowerCase().includes(q) ||
          String(debt.currency).toLowerCase().includes(q)
        );
      },
      [searchIndex],
    );

    const renderElement: TypeaheadProps<Debt, string>['renderElement'] = useCallback(
      (el): ReactNode => (
        <div className="flex items-center justify-between w-full min-w-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{el.debtor}</span>
            <span className="shrink-0 text-xs text-muted-foreground font-mono">{el.currency}</span>
            {el.isClosed() && (
              <span className="shrink-0 text-2xs text-muted-foreground border border-border rounded px-1 leading-4">
                closed
              </span>
            )}
          </div>
          <MoneyValue
            showSign
            amount={el.balance}
            currency={el.currency}
            className={cn('shrink-0 font-medium text-xs tabular-nums whitespace-nowrap', {
              'text-destructive': el.balance < 0,
              'text-success': el.balance > 0,
              'text-muted-foreground': el.balance === 0,
            })}
          />
        </div>
      ),
      [],
    );

    return (
      <Typeahead<Debt, string>
        filterFn={filterFn}
        labelField="debtorWithCurrency"
        multiple={multiple}
        options={debts}
        placeholder={multiple ? 'Select debts…' : 'Select debt…'}
        renderElement={renderElement}
        value={normalizedValue}
        valueField="id"
        className={className}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  },
);

DebtTypeahead.displayName = 'DebtTypeahead';

export default DebtTypeahead;
