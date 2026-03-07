import { cn } from '@/lib/utils';
import { forwardRef, ReactNode, useCallback, useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import Debt from '@/features/debts/models/Debt';
import { useDebts } from '@/hooks/financeData';

type DebtTypeaheadProps =
  Omit<TypeaheadV2Props<Debt, string>, 'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement'>
  & {
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
          [
            d.debtor,
            d.debtorWithCurrency,
            d.currency,
            d.note ?? '',
            d.isClosed() ? 'closed' : '',
          ]
            .join(' ')
            .toLowerCase(),
        );
      }

      return map;
    }, [debts]);

    const filterFn: TypeaheadV2Props<Debt, string>['filterFn'] = useCallback(
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

    const renderElement: TypeaheadV2Props<Debt, string>['renderElement'] = useCallback(
      (el): ReactNode => (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{el.debtorWithCurrency}</p>
          </div>

          <div className="shrink-0 text-right">
            <MoneyValue
              showSign
              amount={el.balance}
              currency={el.currency}
              className={cn('font-medium text-xs tabular-nums whitespace-nowrap', {
                'text-destructive': el.balance < 0,
                'text-success': el.balance > 0,
                'text-muted-foreground': el.balance === 0,
              })}
            />
            {el.isClosed() ? <p className="text-2xs text-muted-foreground">Closed</p> : null}
          </div>
        </>
      ),
      [],
    );

    return (
      <TypeaheadV2<Debt, string>
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
