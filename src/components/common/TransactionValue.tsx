import cn from 'classnames';
import React from 'react';

import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';
import Transaction from '@/models/Transaction';
import { Badge } from '@/components/ui/badge';

interface Props {
  transaction: Transaction;
  className?: string;
  maximumFractionDigits?: number;
  badge?: boolean;
}

export const TransactionValue: React.FC<Props> = ({
                                                    transaction,
                                                    className = '',
                                                    maximumFractionDigits = 2,
                                                    badge = false
                                                  }) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];
  const { amount, account: { currency }, convertedValues } = transaction;
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const value = convertedValues?.[baseCurrency.code];

  const formatMoney = (value: number, symbol: string) => {
    const sign = ((transaction.isIncome() && value >= 0) || (transaction.isExpense() && value < 0)) ? '+' : '-';
    return `${sign} ${symbol} ${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits })}`;
  };

  const amountString = formatMoney(amount, symbol);
  const valueString = value !== undefined ? formatMoney(value, baseCurrency.symbol) : '';

  const textColorClass = transaction.isExpense() ? 'text-destructive' : 'text-success';

  const shouldShowConvertedValue = value !== undefined && currency !== baseCurrencyCode && Math.abs(amount) !== Math.abs(value);

  const content = (
    <span className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', className)}>
      {shouldShowConvertedValue ? (
        <>
          <span>{valueString}</span>
          <span className="text-xs opacity-75 hidden md:inline ml-1">
            | {amountString}
          </span>
        </>
      ) : (
        <span>{amountString}</span>
      )}
    </span>
  );

  return badge ? (
    <Badge
      className="text-xs"
      variant={transaction.isIncome() ? 'success' : 'destructive'}
    >
      {content}
    </Badge>
  ) : (
    <span className={`${textColorClass} ${className}`}>
      {content}
    </span>
  );
};

export default TransactionValue;
