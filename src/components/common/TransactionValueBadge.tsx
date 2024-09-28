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
}

export const TransactionValueBadge: React.FC<Props> = ({ transaction, className, maximumFractionDigits = 2 }) => {
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

  return (
    <Badge
      className="text-xs font-mono"
      variant={transaction.isIncome() ? 'success' : 'destructive'}
    >
    <span className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', className)}>
      {amountString}
      {value !== undefined && (baseCurrency.code !== currency || amount !== value) && (
        <span className="ml-1 text-xs opacity-75">
          | {valueString}
        </span>
      )}
    </span>
    </Badge>
  );
};

export default TransactionValueBadge;
