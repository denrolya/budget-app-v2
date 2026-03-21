import React from 'react';

import { MoneyValue } from '@/components/common/MoneyValue';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import type { Transaction } from '@/features/transactions';
import type { CURRENCY_CODE } from '@/constants/currency';

interface FeeIndicatorProps {
  feeExpenses: Transaction[];
  transferAmount: number;
  senderCurrency: CURRENCY_CODE;
}

export const FeeIndicator: React.FC<FeeIndicatorProps> = ({
  feeExpenses,
  transferAmount,
  senderCurrency,
}) => {
  if (feeExpenses.length === 0) return null;

  // Convert all fees to sender currency via convertedValues
  const totalFeesConverted = feeExpenses.reduce((sum, fee) => {
    const converted = fee.convertedValues?.[senderCurrency];
    return sum + (converted ?? fee.amount);
  }, 0);

  const totalPct = transferAmount > 0 ? ((totalFeesConverted / transferAmount) * 100).toFixed(2) : '0.00';

  const tooltipContent = (
    <div className="text-xs space-y-1">
      {feeExpenses.map((fee) => (
        <div className="flex items-center gap-1.5" key={fee.id}>
          <MoneyValue amount={fee.amount} currency={fee.account.currency as CURRENCY_CODE} useColors={false} />
          <span className="text-muted-foreground">({fee.account.name})</span>
        </div>
      ))}
      <div className="border-t pt-1 text-muted-foreground">
        {totalPct}% of transfer
      </div>
    </div>
  );

  return (
    <ResponsiveTooltip openDelay={0} content={tooltipContent}>
      <div className="relative flex-shrink-0">
        <div className="w-2 h-2 bg-warning rounded-full" />
        {feeExpenses.length > 1 && (
          <span className="absolute -top-1.5 -right-2 text-[8px] font-bold text-warning leading-none">
            {feeExpenses.length}
          </span>
        )}
      </div>
    </ResponsiveTooltip>
  );
};

export default FeeIndicator;
