import cn from 'classnames';
import React, { ReactNode, useCallback, useMemo } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountPill from '@/components/features/accounts/Pill';
import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import { useAccountsWithDefaultOrder } from '@/contexts/FinanceData';
import Account from '@/models/Account';

type AccountTypeaheadProps = Omit<
  TypeaheadV2Props<Account, string>,
  'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement'
> & {
  className?: string;
};

const AccountTypeahead: React.FC<AccountTypeaheadProps> = ({
                                                             multiple = false,
                                                             value,
                                                             onChange,
                                                             className,
                                                             ...props
                                                           }) => {
  const accounts = useAccountsWithDefaultOrder();

  const searchIndex = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) {
      map.set(
        String(a.id),
        `${a.displayName} ${a.currency} ${a.type}`.toLowerCase(),
      );
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
              variant="inline"
              size="sm"
              className="min-w-0"
              tooltip={false}
              account={account}
            />

            {isArchived && (
              <span className="shrink-0 text-2xs text-muted-foreground" aria-label="Archived">
                Archived
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <MoneyValue
            showSign
            className={cn(
              'tabular-nums font-medium whitespace-nowrap text-xs',
              account.balance < 0 && 'text-destructive',
              account.balance === 0 && 'text-muted-foreground',
            )}
            amount={account.balance}
            currency={account.currency}
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
      valueField="id"
      labelField="displayName"
      groupBy="type"
      placeholder={multiple ? 'Select accounts…' : 'Select account…'}
      multiple={multiple}
      options={accounts}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
      filterFn={filterFn}
      {...props}
    />
  );
};

AccountTypeahead.displayName = 'AccountTypeahead';

export default AccountTypeahead;
