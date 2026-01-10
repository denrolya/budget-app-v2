import { Handshake, PiggyBank, WalletIcon } from 'lucide-react';
import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBaseCurrency } from '@/features/auth';
import { useTotalBalance, useTotalDebt } from '@/hooks/financeData';

export const TotalBalanceCard: React.FC = () => {
  const baseCurrency = useBaseCurrency();
  const totalDebt = useTotalDebt();
  const totalBalance = useTotalBalance();

  const netWorth = totalBalance + totalDebt;

  return (
    <Card className="w-[300px] h-[140px] overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 relative flex-none snap-center">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-primary truncate">Net Worth</h3>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cash vs Debt</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <div className="rounded-full p-1">
              <WalletIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex-grow flex flex-col justify-center">
            <p aria-label={`Net worth: ${baseCurrency} ${netWorth}`} className="text-2xl font-bold">
              <MoneyValue amount={netWorth} useColors={false} />
            </p>
            <div className="flex items-center justify-between text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <PiggyBank className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span aria-label={`Total balance: ${baseCurrency} ${totalBalance}`}>
                      <MoneyValue amount={totalBalance} useColors={false} className="font-medium text-xs" />
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total balance</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <Handshake className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span aria-label={`Total debt: ${baseCurrency} ${totalDebt}`}>
                      <MoneyValue amount={totalDebt} useColors={false} className="font-medium text-xs" />
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total debt</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalBalanceCard;
