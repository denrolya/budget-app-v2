import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import AccountPill from '@/components/features/accounts/Pill';
import Account from '@/models/Account';

interface Props {
  account: Account;
}

const DetailsHoverCard: React.FC<Props> = ({ account }) => (
  <div>
    <h3 className="font-bold mb-2">
      <AccountPill size="sm" account={account} />
    </h3>
    <p className="text-sm mb-1">
      {'Balance: '}
      <MoneyValue
        showSign
        showValuesTooltip={false}
        className="font-semibold"
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
