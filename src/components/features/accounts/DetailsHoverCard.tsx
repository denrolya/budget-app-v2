import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountAvatar from '@/components/features/accounts/Avatar';
import Account from '@/models/Account';

interface Props {
  account: Account;
}

const DetailsHoverCard: React.FC<Props> = ({ account }) => (
  <div>
    <h3 className="font-bold mb-2">
      <AccountAvatar className="mr-2" account={account} /> {account.displayName}
    </h3>
    <p className="text-sm mb-1">
      {'Balance: '}
      <MoneyValue
        showSign
        showValuesTooltip={false}
        className="text-mono font-medium"
        maximumFractionDigits={2}
        amount={account.balance}
        currency={account.currency}
      />
    </p>
    <p className="text-sm mb-1">
      Last Transaction: <RelativeDatetimeDisplay date={account.updatedAt} />
    </p>
  </div>
);

export default DetailsHoverCard;
