import React from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import AccountAvatar from '@/components/features/accounts/Avatar';
import { Card, CardContent } from '@/components/ui/card';
import Account from '@/models/Account';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';

interface Props {
  account: Account;
}

const DetailsHoverCard: React.FC<Props> = ({ account }) => (
  <Card className="bg-popover text-popover-foreground">
    <CardContent className="p-4">
      <h3 className="font-bold mb-2"><AccountAvatar className="mr-2" account={account} /> {account.nameWithCurrency}
      </h3>
      <p className="text-sm mb-1">
        {'Balance: '}
        <MoneyValue
          showSign
          className="text-mono"
          maximumFractionDigits={2}
          amount={account.balance}
          currency={account.currency} />
      </p>
      <p className="text-sm mb-1">Last Transaction: <RelativeDatetimeDisplay date={account.updatedAt} /></p>
    </CardContent>
  </Card>
);


export default DetailsHoverCard;
