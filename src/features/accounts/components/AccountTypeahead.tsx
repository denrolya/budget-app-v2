import cn from 'classnames';
import { forwardRef, ReactNode, useCallback, useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import { useAccountsWithDefaultOrder } from '@/hooks/financeData';

import AccountPill from '../components/Pill';
import Account from '../models/Account';

type AccountTypeaheadProps =
  Omit<TypeaheadV2Props<Account, string>, 'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement'>
  & {
  className?: string;
};

const AccountTypeahead = forwardRef<HTMLInputElement, AccountTypeaheadProps>(
  ({ multiple = false, value, onChange, className, ...props }, ref) => {
    const accounts = useAccountsWithDefaultOrder();

    const searchIndex = useMemo(() => {
      const map = new Map<string, string>();
      for (const a of accounts) {
        map.set(String(a.id), `${a.displayName} ${a.currency} ${a.type}`.toLowerCase());
      }
      return map;
    }, [accounts]);

    const renderElement = useCallback((account: Account): ReactNode => {
      const isArchived = !!account.archivedAt;

      return (
        <div className="flex items-center gap-3 min-w-0 justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <AccountPill
                showMarker
                showName
                account={account}
                size="sm"
                tooltip={false}
                variant="inline"
                className="min-w-0"
              />

              {isArchived && (
                <span aria-label="Archived" className="shrink-0 text-2xs text-muted-foreground">
                  Archived
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <MoneyValue
              showSign
              amount={account.balance}
              currency={account.currency}
              className={cn(
                'tabular-nums font-medium whitespace-nowrap text-xs',
                account.balance < 0 && 'text-destructive',
                account.balance === 0 && 'text-muted-foreground',
              )}
            />
          </div>
        </div>
      );
    }, []);

    const filterFn: TypeaheadV2Props<Account, string>['filterFn'] = useCallback(
      (account: Account, input: string) => {
        const q = input.trim().toLowerCase();
        if (!q) return true;

        const idx = searchIndex.get(String(account.id));
        if (idx) return idx.includes(q);

        return (
          account.displayName.toLowerCase().includes(q) ||
          account.currency.toLowerCase().includes(q) ||
          account.type.toLowerCase().includes(q)
        );
      },
      [searchIndex],
    );

    return (
      <TypeaheadV2<Account, string>
        hideCheckmarkColumn
        filterFn={filterFn}
        groupBy="type"
        labelField="displayName"
        multiple={multiple}
        options={accounts}
        placeholder={multiple ? 'Select accounts…' : 'Select account…'}
        renderElement={(el) => renderElement(el)}
        value={value}
        valueField="id"
        className={className}
        onChange={onChange}
        ref={ref}
        {...props}
      />
    );
  },
);

AccountTypeahead.displayName = 'AccountTypeahead';
export default AccountTypeahead;
