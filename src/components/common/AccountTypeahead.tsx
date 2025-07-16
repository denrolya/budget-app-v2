// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import cn from 'classnames';
import { ReactNode } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
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
  valueField = 'id',
  className,
  ...props
}) => {
  const accounts = useAccountsWithDefaultOrder();

  const renderElement = (el: Account, _valueField?: keyof Account, labelField?: keyof Account): ReactNode => (
    <>
      <div
        className={cn('flex items-center justify-center rounded-full mr-2', el.archivedAt ? 'text-muted' : el.color)}
      >
        <AccountAvatar account={el} size="sm" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{labelField ? String(el[labelField]) : el.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {el.type.charAt(0).toUpperCase() + el.type.slice(1)} • {el.currency}
        </p>
      </div>
      <div className="text-right">
        <MoneyValue
          showSign
          className={cn('font-medium', 'text-xs', 'text-mono', {
            'text-destructive': el.balance < 0,
            'text-success': el.balance > 0,
            'text-muted-foreground': el.balance === 0,
          })}
          amount={el.balance}
          currency={el.currency}
        />
        {el.archivedAt && <p className="text-xs text-muted-foreground">Archived</p>}
      </div>
    </>
  );

  const filterFn: TypeaheadV2Props<Account, string>['filterFn'] = (account, input) => {
    const query = input.toLowerCase();
    return (
      account.displayName.toLowerCase().includes(query) ||
      account.currency.toLowerCase().includes(query)
    );
  };

  return (
    <TypeaheadV2<Account, string>
      valueField={valueField as keyof Account}
      labelField="displayName"
      groupBy="type"
      placeholder={multiple ? 'Select accounts...' : 'Select account...'}
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
