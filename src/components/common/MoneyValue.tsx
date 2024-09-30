import cn from 'classnames';
import React from 'react';

import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';
import { Badge } from '@/components/ui/badge';

interface MoneyValueProps {
  id?: string;
  currency?: CURRENCY_CODE;
  amount: number | string;
  values?: Record<string, number>;
  showSymbol?: boolean;
  showSign?: boolean;
  maximumFractionDigits?: number;
  className?: string;
  badge?: boolean;
  revertColors?: boolean;
  useColors?: boolean;
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
                                                        badge = false,
                                                        revertColors = false,
                                                        useColors = true,
                                                      }) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const baseValue = values[baseCurrency.code];

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatMoney = (value: number) => Math.abs(value).toLocaleString(undefined, { maximumFractionDigits });

  const renderMoneyElement = (value: number, symbol: string) => (
    <>
      {showSign && (
        <span>{value < 0 ? '- ' : '+ '}</span>
      )}
      {showSymbol && <span className="mr-1">{symbol}</span>}
      <span>{formatMoney(value)}</span>
    </>
  );

  const shouldShowConvertedValue = baseValue !== undefined &&
    currency !== undefined &&
    baseCurrency.code !== currency &&
    Math.abs(numericAmount - baseValue) > 0.01; // Using a small threshold to account for floating-point imprecision

  const getColorClass = (value: number) => {
    if (!useColors) return '';
    if (value > 0) return revertColors ? 'text-destructive' : 'text-success';
    if (value < 0) return revertColors ? 'text-success' : 'text-destructive';
    return 'text-muted-foreground';
  };

  const getBadgeVariant = (value: number): 'default' | 'destructive' | 'success' | 'outline' => {
    if (!useColors) return 'outline';
    if (value > 0) return revertColors ? 'destructive' : 'success';
    if (value < 0) return revertColors ? 'success' : 'destructive';
    return 'outline';
  };

  const colorClass = getColorClass(numericAmount);
  const badgeVariant = getBadgeVariant(numericAmount);

  const content = (
    <span
      id={id}
      className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', className)}
    >
      {shouldShowConvertedValue ? (
        <>
          {renderMoneyElement(baseValue, baseCurrency.symbol)}
          <span className="mx-1">|</span>
          {renderMoneyElement(numericAmount, symbol)}
        </>
      ) : (
        renderMoneyElement(numericAmount, symbol)
      )}
    </span>
  );

  return badge ? (
    <Badge
      className={cn(className)}
      variant={badgeVariant}
    >
      {content}
    </Badge>
  ) : (
    <span className={cn(colorClass, className)}>
      {content}
    </span>
  );
};

MoneyValue.displayName = 'MoneyValue';

export default MoneyValue;
