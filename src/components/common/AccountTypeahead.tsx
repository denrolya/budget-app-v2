import cn from 'classnames';
import { forwardRef } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
import Account from '@/models/Account';
import TypeaheadV2 from '@/components/ui/typeaheadV2';
import { useAccountsWithDefaultOrder } from '@/contexts/FinanceData';

interface AccountTypeaheadProps {
  multiple?: boolean;
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  className?: string;
}

const AccountTypeahead = forwardRef<HTMLInputElement, AccountTypeaheadProps>(({
                                                                    multiple = false,
                                                                    value,
                                                                    onChange,
                                                                    className,
                                                                  }, ref) => {
  const accounts = useAccountsWithDefaultOrder();

  const renderElement = (el: Account) => (
    <>
      <div className={cn('flex items-center justify-center rounded-full mr-2', el.archivedAt ? 'bg-gray-300' : el.color)}>
        <AccountAvatar account={el} size="sm" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{el.name}</p>
        <p className="text-xs text-muted-foreground">
          {el.type.charAt(0).toUpperCase() + el.type.slice(1)} • {el.currency}
        </p>
      </div>
      <div className="text-right">
        <MoneyValue amount={el.balance} currency={el.currency} />
        {el.archivedAt && (
          <p className="text-xs text-muted-foreground">Archived</p>
        )}
      </div>
    </>
  );

  return (
    <TypeaheadV2
      valueField="id"
      labelField="name"
      placeholder={multiple ? 'Select accounts...' : 'Select account...'}
      multiple={multiple}
      options={accounts}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
      ref={ref}
    />
  );
});

export default AccountTypeahead;
