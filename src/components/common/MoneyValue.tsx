import cn from 'classnames';
import React from 'react';

import { CURRENCIES } from '@/constants/currency';
import { useAuth } from '@/contexts/auth';

interface MoneyValueProps {
  id?: string;
  currency?: string;
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
  const { user } = useAuth();
  const baseCurrency = CURRENCIES[user?.baseCurrency];
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const value = values[baseCurrency.code];

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatMoney = (value: number) => Math.abs(value).toLocaleString(undefined, { maximumFractionDigits });

  const renderMoneyElement = (value: number, symbol: string) => (
    <>
      {showSign && (
        <span className="mr-1">{value < 0 && '-'}</span>
      )}
      <span>{formatMoney(value)}</span>
      {showSymbol && <span className="ml-1">{symbol}</span>}
    </>
  );

  return (
    <span
      id={id}
      className={cn('inline-block whitespace-nowrap font-numeric', {
        'font-bold': bold,
      }, className)}
    >
      {renderMoneyElement(numericAmount, symbol)}
      {value !== undefined && (baseCurrency.code !== currency || numericAmount !== value) && (
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
