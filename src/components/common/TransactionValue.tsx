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

  const content = (
    <span className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', className)}>
      {/* Always show base currency value */}
      {value !== undefined && (
        <span className="mr-1">
          {valueString}
        </span>
      )}

      {/* Conditionally show transaction amount on small screens or when width allows */}
      {amountString && (
        <span className="text-xs opacity-75 hidden md:inline">
          | {amountString}
        </span>
      )}
    </span>
  );

  // Conditionally render Badge or simple text based on the `badge` prop
  return badge ? (
    <Badge
      className="text-xs font-mono"
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
