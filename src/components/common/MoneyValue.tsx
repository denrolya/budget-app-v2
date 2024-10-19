import cn from 'classnames';
import React, { memo, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';
import { formatMoney } from '@/utils/formatMoney';

interface MoneyValueProps extends React.ComponentPropsWithoutRef<'span'> {
  currency?: CURRENCY_CODE;
  amount: number;
  values?: Record<string, number>;
  showSymbol?: boolean;
  showSign?: boolean;
  maximumFractionDigits?: number;
  badge?: boolean;
  revertColors?: boolean;
  useColors?: boolean;
}

const getBadgeVariant = (value: number, useColors: boolean, revertColors: boolean): 'default' | 'destructive' | 'success' | 'outline' => {
  if (!useColors) return 'outline';
  if (value > 0) return revertColors ? 'destructive' : 'success';
  if (value < 0) return revertColors ? 'success' : 'destructive';
  return 'outline';
};

export const MoneyValue: React.FC<MoneyValueProps> = ({
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
      {showSign && amount !== 0 && <span>{amount < 0 ? '- ' : '+ '}</span>}
      {showSymbol && <span className="mr-1">{currencySymbol}</span>}
      <span>{formatMoney(value, currencyCode, maximumFractionDigits)}</span>
    </>
  );

  const content = (
    <span id={id} className={cn('inline-block whitespace-nowrap font-numeric tabular-nums slashed-zero', className)}>
      {shouldShowConvertedValue ? (
        <>
          {renderMoneyElement(baseValue, baseCurrency.symbol, baseCurrency.code)}
          <span className="text-xs opacity-75 hidden md:inline ml-1">
            {' | '}{renderMoneyElement(numericAmount, symbol, currency)}
          </span>
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
};

MoneyValue.displayName = 'MoneyValue';

export default memo(MoneyValue);
