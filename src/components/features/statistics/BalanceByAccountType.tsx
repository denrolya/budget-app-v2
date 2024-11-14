import { CreditCard, Globe, HelpCircle, Wallet } from 'lucide-react';
import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { useBaseCurrency } from '@/contexts/auth';
import { useAccounts } from '@/contexts/FinanceData';
import { Type as AccountType } from '@/types/account';

interface Props {
  type: AccountType;
}

const typeIcons: Record<AccountType, React.ElementType> = {
  internet: Globe,
  cash: Wallet,
  bank: CreditCard,
  basic: HelpCircle,
};

const typeLabels: Record<AccountType, string> = {
  [AccountType.Bank]: 'Bank',
  [AccountType.Cash]: 'Cash',
  [AccountType.Internet]: 'Internet',
  [AccountType.Basic]: 'Basic',
};

export const AccountTypeBalanceCard: React.FC<Props> = ({ type }) => {
  const baseCurrency = useBaseCurrency();
  const accounts = useAccounts();

  const filteredAccounts = accounts.filter(account => account.type === type);
  const totalBalance = filteredAccounts.reduce((sum, account) => sum + account.balance, 0);

  const Icon = typeIcons[type];

  return (
    <Card className="w-[300px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 relative flex-none snap-center">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-primary truncate">{typeLabels[type]} Balance</h3>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Updated just now
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <div className="text-primary rounded-full p-1">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex flex-col flex-grow">
            <p
              className="text-2xl font-bold text-primary"
              aria-label={`Total ${typeLabels[type]} balance: ${baseCurrency} ${totalBalance}`}>
              <MoneyValue useColors={false} amount={totalBalance} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountTypeBalanceCard;
