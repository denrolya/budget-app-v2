import React from 'react';
import cn from 'classnames';

import { useAuth } from '@/contexts/auth';
import { CURRENCIES } from '@/constants/currency';
import { Transaction } from '@/models/transaction';

interface TransactionValueProps {
  transaction: Transaction;
  className?: string;
  maximumFractionDigits?: number;
}

export const TransactionValue: React.FC<TransactionValueProps> = ({
                                                                    transaction,
                                                                    className,
                                                                    maximumFractionDigits = 2,
                                                                  }) => {
  const { user } = useAuth();
  const baseCurrency = CURRENCIES[user?.baseCurrency];
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
    <span className={cn('inline-block whitespace-nowrap font-numeric', className)}>
      {amountString}
      {value !== undefined && (baseCurrency.code !== currency || amount !== value) && (
        <span className="ml-1 text-xs font-light">
          | {valueString}
        </span>
      )}
    </span>
  );
};
