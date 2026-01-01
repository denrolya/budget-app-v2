import cn from 'classnames';
import React, { ReactNode, useCallback } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import { useAccountsWithDefaultOrder } from '@/contexts/FinanceData';
import Account from '@/models/Account';
import AccountPill from '@/components/features/accounts/Pill';

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

  const renderElement = useCallback((account: Account): ReactNode => {
    const isArchived = !!account.archivedAt;

    return (
      <div className="flex w-full items-center gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <AccountPill
              account={account}
              size="sm"
              tooltip={false}
              showMarker
              showName
              className="max-w-full"
            />
            {isArchived && (
              <span className="text-2xs text-muted-foreground shrink-0">Archived</span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <MoneyValue
            showSign
            className={cn('text-xs tabular-nums font-medium', {
              'text-destructive': account.balance < 0,
              'text-muted-foreground': account.balance === 0,
            })}
            amount={account.balance}
            currency={account.currency}
          />
        </div>
      </div>
    );
  }, []);

  const filterFn: TypeaheadV2Props<Account, string>['filterFn'] = useCallback((account, input) => {
    const q = input.trim().toLowerCase();
    if (!q) return true;

    return (
      account.displayName.toLowerCase().includes(q) ||
      account.currency.toLowerCase().includes(q) ||
      account.type.toLowerCase().includes(q)
    );
  }, []);

  return (
    <TypeaheadV2<Account, string>
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
