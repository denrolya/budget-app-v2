import { forwardRef, type ReactNode, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';
import MoneyValue from '@/components/common/MoneyValue';
import { useAccountsWithDefaultOrder } from '@/hooks/financeData';
import Typeahead, { type TypeaheadProps } from '@/components/ui/Typeahead';

import AccountMarker from './AccountMarker';
import AccountPill from '../components/Pill';
import type Account from '../models/Account';


type AccountTypeaheadProps = Omit<
  TypeaheadProps<Account, string>,
  'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement' | 'renderSelected'
> & {
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

    const renderSelected = useCallback((account: Account): ReactNode => (
      <div className="flex items-center gap-1.5 min-w-0">
        <AccountMarker account={account} size="sm" />
        <span className="truncate">{account.displayName}</span>
      </div>
    ), []);

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
              className={cn('tabular-nums font-medium whitespace-nowrap text-xs', {
                'text-destructive': account.balance < 0,
                'text-muted-foreground': account.balance === 0,
              })}
            />
          </div>
        </div>
      );
    }, []);

    const filterFn: TypeaheadProps<Account, string>['filterFn'] = useCallback(
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
      <Typeahead<Account, string>
        hideCheckmarkColumn
        filterFn={filterFn}
        groupBy="type"
        labelField="displayName"
        multiple={multiple}
        options={accounts}
        placeholder={multiple ? 'Select accounts…' : 'Select account…'}
        renderElement={(el) => renderElement(el)}
        renderSelected={renderSelected}
        value={value}
        valueField="id"
        className={className}
        dropdownClassName="min-w-[var(--radix-popover-trigger-width)] w-max max-w-sm"
        onChange={onChange}
        ref={ref}
        {...props}
      />
    );
  },
);

AccountTypeahead.displayName = 'AccountTypeahead';
export default AccountTypeahead;
