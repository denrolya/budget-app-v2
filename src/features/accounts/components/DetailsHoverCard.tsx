import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountPill from '@/features/accounts/components/Pill';
import Account from '@/models/Account';

interface Props {
  account: Account;
}

const DetailsHoverCard: React.FC<Props> = ({ account }) => (
  <div className="flex-col space-y-1">
    <h3 className="font-bold">
      <AccountPill size="sm" variant="inline" tooltip={false} account={account} />
    </h3>
    <p className="text-xs">
      {'Balance: '}
      <MoneyValue
        revert
        className="font-semibold"
        showSign={false}
        showValuesTooltip={false}
        amount={account.balance}
        currency={account.currency}
        values={account.convertedValues}
      />
    </p>
    <p className="text-2xs">
      Last Transaction: <RelativeDatetimeDisplay className="inline" date={account.updatedAt} />
    </p>
  </div>
);

export default DetailsHoverCard;
