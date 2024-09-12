import React from 'react';
import cn from 'classnames';

import { useAuth } from '@/contexts/auth';
import { CURRENCIES } from '@/constants/currency';

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
        <span className="mr-1">{value < 0 ? '-' : '+'}</span>
      )}
      {showSymbol && <span className="mr-1">{symbol}</span>}
      <span>{formatMoney(value)}</span>
    </>
  );

  return (
    <span
      id={id}
      className={cn(
        'inline-block whitespace-nowrap font-numeric',
        {
          'font-bold': bold,
        },
        className,
      )}
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
