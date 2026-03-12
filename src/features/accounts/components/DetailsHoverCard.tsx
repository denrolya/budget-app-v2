import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountPill from '@/features/accounts/components/Pill';
import type Account from '@/features/accounts/models/Account';

interface Props {
  account: Account;
}

const DetailsHoverCard: React.FC<Props> = ({ account }) => (
  <div className="flex-col space-y-1">
    <h3 className="font-bold">
      <AccountPill account={account} size="sm" tooltip={false} variant="inline" />
    </h3>
    <p className="text-xs">
      {'Balance: '}
      <MoneyValue
        revert
        amount={account.balance}
        currency={account.currency}
        showSign={false}
        showValuesTooltip={false}
        values={account.convertedValues}
        className="font-semibold"
      />
    </p>
    <p className="text-2xs">
      Last Transaction: <RelativeDatetimeDisplay date={account.updatedAt} className="inline" />
    </p>
  </div>
);

export default DetailsHoverCard;
