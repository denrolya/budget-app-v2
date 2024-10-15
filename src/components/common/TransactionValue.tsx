import cn from 'classnames';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';
import Transaction from '@/models/Transaction';
import { formatMoney as formatMoneyValue } from '@/utils/formatMoney';

interface Props extends React.ComponentPropsWithoutRef<'span'> {
  transaction: Transaction;
  maximumFractionDigits?: number;
  badge?: boolean;
}

export const TransactionValue: React.FC<Props> = ({
                                                    transaction,
                                                    className = '',
                                                    maximumFractionDigits,
                                                    badge = false,
                                                  }) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];
  const { amount, account: { currency }, convertedValues } = transaction;
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const value = convertedValues?.[baseCurrency.code];

  const formatMoney = (value: number, currency: CURRENCY_CODE, symbol: string) => {
    const sign = ((transaction.isIncome() && value >= 0) || (transaction.isExpense() && value < 0)) ? '+' : '-';
    return `${sign} ${symbol} ${formatMoneyValue(value, currency, maximumFractionDigits)}`;
  };

  const amountString = formatMoney(amount, currency, symbol);
  const valueString = value !== undefined ? formatMoney(value, baseCurrencyCode, baseCurrency.symbol) : '';

  const textColorClass = transaction.isExpense() ? 'text-destructive' : 'text-success';

  const shouldShowConvertedValue = value !== undefined && currency !== baseCurrencyCode && Math.abs(amount) !== Math.abs(value);

  const content = (
    <span className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', className)}>
      {!shouldShowConvertedValue && <span>{amountString}</span>}
      {shouldShowConvertedValue && (
        <>
          <span>{valueString}</span>
          <span className="text-xs opacity-75 hidden md:inline ml-1">
            | {amountString}
          </span>
        </>
      )}
    </span>
  );

  if (badge) {
    return (
      <Badge className="text-xs" variant={transaction.isIncome() ? 'success' : 'destructive'}>
        {content}
      </Badge>
    );
  }

  return (
    <span className={`${textColorClass} ${className}`}>
      {content}
    </span>
  );
};

export default TransactionValue;
