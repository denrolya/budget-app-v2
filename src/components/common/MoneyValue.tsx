import cn from 'classnames';
import React from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';

interface MoneyValueProps {
  id?: string;
  currency?: CURRENCY_CODE;
  amount: number | string;
  values?: Record<string, number>;
  showSymbol?: boolean;
  showSign?: boolean;
  maximumFractionDigits?: number;
  className?: string;
  bold?: boolean;
}

export const MoneyValue: React.FC<MoneyValueProps> = ({
                                                        id,
                                                        currency,
                                                        amount,
                                                        values = {},
                                                        showSymbol = true,
                                                        showSign = false,
                                                        maximumFractionDigits = 2,
                                                        className,
                                                        bold = false,
                                                      }) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const value = values[baseCurrency.code];

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatMoney = (value: number) => Math.abs(value).toLocaleString(undefined, { maximumFractionDigits });

  const renderMoneyElement = (value: number, symbol: string) => (
    <>
      {showSign && (
        <span>{value < 0 && '-'}</span>
      )}
      {showSymbol && <span className="mr-1">{symbol}</span>}
      <span>{formatMoney(value)}</span>
    </>
  );

  const shouldShowConvertedValue = value !== undefined &&
    currency !== undefined &&
    baseCurrency.code !== currency &&
    numericAmount !== value;

  return (
    <span
      id={id}
      className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', {
        'font-bold': bold,
      }, className)}
    >
      {renderMoneyElement(numericAmount, symbol)}
      {shouldShowConvertedValue && (
        <>
          <span className="mx-1">|</span>
          {renderMoneyElement(value, baseCurrency.symbol)}
        </>
      )}
    </span>
  );
};

MoneyValue.displayName = 'MoneyValue';

export default MoneyValue;
