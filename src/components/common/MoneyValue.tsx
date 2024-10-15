import cn from 'classnames';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
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
  badge?: boolean;
  revertColors?: boolean;
  useColors?: boolean;
}

const getFractionDigits = (currencyCode?: CURRENCY_CODE, maximumFractionDigits: number = 2): number => {
  if (!isNaN(maximumFractionDigits)) return maximumFractionDigits;

  switch (currencyCode) {
    case CURRENCY_CODE.EUR:
    case CURRENCY_CODE.USD:
      return 2;
    case CURRENCY_CODE.HUF:
      return 0;
    case CURRENCY_CODE.BTC:
      return 8;
    case CURRENCY_CODE.UAH:
      return 1;
    default:
      return 2;
  }
};

const formatMoney = (value: number, currencyCode?: CURRENCY_CODE, maximumFractionDigits?: number): string => {
  const fractionDigits = getFractionDigits(currencyCode, maximumFractionDigits);
  return Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
};

const getBadgeVariant = (value: number, useColors: boolean, revertColors: boolean): 'default' | 'destructive' | 'success' | 'outline' => {
  if (!useColors) return 'outline';
  if (value > 0) return revertColors ? 'destructive' : 'success';
  if (value < 0) return revertColors ? 'success' : 'destructive';
  return 'outline';
};

export const MoneyValue: React.FC<MoneyValueProps> = React.memo(({
                                                                   id,
                                                                   currency,
                                                                   amount,
                                                                   values = {},
                                                                   showSymbol = true,
                                                                   showSign = false,
                                                                   maximumFractionDigits,
                                                                   className,
                                                                   badge = false,
                                                                   revertColors = false,
                                                                   useColors = true,
                                                                 }) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const baseValue = values[baseCurrency.code];

  const numericAmount = useMemo(() => typeof amount === 'string' ? parseFloat(amount) : amount, [amount]);

  const shouldShowConvertedValue = useMemo(() =>
      baseValue !== undefined &&
      currency !== undefined &&
      baseCurrency.code !== currency &&
      Math.abs(numericAmount - baseValue) > 0.01,
    [baseValue, currency, baseCurrency.code, numericAmount]);

  const colorClass = useMemo(() => {
    if (!useColors) return '';
    switch (true) {
      case (numericAmount > 0 && revertColors) || (numericAmount < 0 && !revertColors):
        return 'text-destructive';
      case (numericAmount > 0 && !revertColors) || (numericAmount < 0 && revertColors):
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  }, [numericAmount, useColors, revertColors]);
  const badgeVariant = useMemo(() => getBadgeVariant(numericAmount, useColors, revertColors), [numericAmount, useColors, revertColors]);

  const renderMoneyElement = (value: number, currencySymbol: string, currencyCode?: CURRENCY_CODE) => (
    <>
      {showSign && value !== 0 && <span>{value < 0 ? '- ' : '+ '}</span>}
      {showSymbol && <span className="mr-1">{currencySymbol}</span>}
      <span>{formatMoney(value, currencyCode, maximumFractionDigits)}</span>
    </>
  );

  const content = (
    <span id={id} className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', className)}>
      {shouldShowConvertedValue ? (
        <>
          {renderMoneyElement(baseValue, baseCurrency.symbol, baseCurrency.code)}
          <span className="mx-1">|</span>
          {renderMoneyElement(numericAmount, symbol, currency)}
        </>
      ) : (
        renderMoneyElement(numericAmount, symbol, currency || baseCurrency.code)
      )}
    </span>
  );

  return badge ? (
    <Badge className={cn(className)} variant={badgeVariant}>
      {content}
    </Badge>
  ) : (
    <span className={cn(colorClass, className)}>
      {content}
    </span>
  );
});

MoneyValue.displayName = 'MoneyValue';

export default MoneyValue;
