import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBaseCurrency } from '@/features/auth';
import { Account, ACCOUNT_TYPES_ORDER } from '@/features/accounts';

interface Props {
  accounts: Account[];
}

export const BalanceProgressBar: React.FC<Props> = ({ accounts }) => {
  const baseCurrency = useBaseCurrency();

  if (!accounts || accounts.length === 0) {
    return <div className="text-red-500 dark:text-red-400 font-semibold">No accounts available</div>;
  }

  // Filter out accounts with zero or undefined converted values
  const filteredAccounts = accounts.filter((account) => (account.convertedValues?.[baseCurrency] || 0) > 0);

  if (filteredAccounts.length === 0) {
    return <div className="text-yellow-500 dark:text-yellow-400 font-semibold">No accounts with positive balances</div>;
  }

  // Calculate the total balance of filtered accounts
  const totalBalance = filteredAccounts.reduce((sum, account) => {
    const convertedValue = account.convertedValues?.[baseCurrency] || 0;
    return sum + convertedValue;
  }, 0);

  if (totalBalance <= 0) {
    return <div className="text-yellow-500 dark:text-yellow-400 font-semibold">Total balance is zero or negative</div>;
  }

  // Group accounts by type
  const groupedAccounts = ACCOUNT_TYPES_ORDER.map((type) =>
    filteredAccounts.filter((account) => account.type === type),
  ).filter((group) => group.length > 0);

  return (
    <div className="w-full">
      <div className="space-y-8">
        <div className="relative h-20 rounded-xl overflow-hidden flex bg-gray-200 dark:bg-gray-700">
          {groupedAccounts.map((group, groupIndex) => (
            <React.Fragment key={group[0].type}>
              {groupIndex > 0 && <div className="w-2 bg-gray-300 dark:bg-gray-600 z-10 mx-1"></div>}
              <div className="flex flex-grow relative">
                <div className="absolute top-0 left-2 text-sm text-primary-foreground z-20 mt-1 capitalize font-bold">
                  {group[0].type}
                </div>
                {group.map((account) => {
                  const convertedValue = account.convertedValues?.[baseCurrency] || 0;
                  const percentage = totalBalance > 0 ? (convertedValue / totalBalance) * 100 : 0;

                  // Skip rendering if the balance is zero (double check here)
                  if (percentage <= 0) return null;
                  return (
                    <Tooltip key={account.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-full relative group transition-all duration-300 ease-in-out
                                    hover:brightness-110 hover:z-10 hover:shadow-lg flex-grow
                                    hover:scale-y-105 origin-bottom"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: account.color,
                          }}
                        >
                          {percentage > 5 && (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                              {percentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="font-semibold text-lg">{account.displayName}</div>
                        <div className="text-sm text-gray-300">{account.type}</div>
                        <div className="text-md mt-2">
                          <MoneyValue
                            className="font-mono font-medium"
                            useColors={false}
                            amount={account.balance}
                            currency={account.currency}
                            values={account.convertedValues}
                          />
                        </div>
                        <div className="text-sm text-gray-300 mt-1">{percentage.toFixed(0)}% of total</div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BalanceProgressBar;
