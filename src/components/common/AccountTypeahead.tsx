import cn from 'classnames';
import { forwardRef } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import { useAccountsWithDefaultOrder } from '@/contexts/FinanceData';
import Account from '@/models/Account';

interface AccountTypeaheadProps extends Omit<TypeaheadV2Props<Account>, 'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement'> {
  className?: string;
}

const AccountTypeahead = forwardRef<HTMLInputElement, AccountTypeaheadProps>(({
                                                                                multiple = false,
                                                                                value,
                                                                                onChange,
                                                                                className,
                                                                                ...props
                                                                              }, ref) => {
  const accounts = useAccountsWithDefaultOrder();

  const renderElement = (el: Account) => (
    <>
      <div className={cn('flex items-center justify-center rounded-full mr-2', el.archivedAt ? 'text-muted' : el.color)}>
        <AccountAvatar account={el} size="sm" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{el.nameWithCurrency}</p>
        <p className="text-xs text-muted-foreground">
          {el.type.charAt(0).toUpperCase() + el.type.slice(1)} • {el.currency}
        </p>
      </div>
      <div className="text-right">
        <MoneyValue showSign className={cn('font-medium', 'text-xs', 'text-mono', {
          'text-destructive': el.balance < 0,
          'text-success': el.balance > 0,
          'text-muted-foreground': el.balance === 0,
        })} amount={el.balance} currency={el.currency} />
        {el.archivedAt && (
          <p className="text-xs text-muted-foreground">Archived</p>
        )}
      </div>
    </>
  );

  return (
    <TypeaheadV2<Account>
      valueField="id"
      labelField="nameWithCurrency"
      groupBy="type"
      placeholder={multiple ? 'Select accounts...' : 'Select account...'}
      multiple={multiple}
      options={accounts}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
      ref={ref}
      {...props}
    ></TypeaheadV2>
  );
});

AccountTypeahead.displayName = 'AccountTypeahead';

export default AccountTypeahead;
