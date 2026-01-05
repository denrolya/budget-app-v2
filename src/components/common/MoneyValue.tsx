import React, { memo, useMemo } from 'react';

import ConvertedValuesTooltip from '@/components/common/ConvertedValuesTooltip';
import { Badge } from '@/components/ui/badge';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/formatMoney';

interface MoneyValueProps extends React.ComponentPropsWithoutRef<'span'> {
  currency?: CURRENCY_CODE;
  amount: number;
  values?: Record<string, number>;
  showSymbol?: boolean;
  showSign?: boolean;
  showValuesTooltip?: boolean;
  maximumFractionDigits?: number;
  badge?: boolean;
  revertColors?: boolean;
  useColors?: boolean;
  revert?: boolean;
}

const getBadgeVariant = (
  value: number,
  useColors: boolean,
  revertColors: boolean,
): 'default' | 'destructive' | 'success' | 'outline' => {
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
  showValuesTooltip = true,
  maximumFractionDigits,
  className,
  badge = false,
  revertColors = false,
  useColors = true,
  revert = false,
}) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const baseValue = values[baseCurrency.code];

  const shouldShowConvertedValue = useMemo(
    () =>
      baseValue !== undefined &&
      currency !== undefined &&
      baseCurrency.code !== currency &&
      Math.abs(amount - baseValue) > 0.01,
    [baseValue, currency, baseCurrency.code, amount],
  );

  const colorClass = useMemo(() => {
    if (!useColors) return '';
    switch (true) {
      case (amount > 0 && revertColors) || (amount < 0 && !revertColors):
        return 'text-destructive';
      case (amount > 0 && !revertColors) || (amount < 0 && revertColors):
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  }, [amount, useColors, revertColors]);
  const badgeVariant = useMemo(
    () => getBadgeVariant(amount, useColors, revertColors),
    [amount, useColors, revertColors],
  );

  const renderMoneyElement = (value: number, currencySymbol: string, currencyCode?: CURRENCY_CODE) => (
    <>
      {showSign && amount !== 0 && <span>{amount < 0 ? '- ' : '+ '}</span>}
      {showSymbol && <span className="mr-0.5">{currencySymbol}</span>}
      <span>{formatMoney(value, currencyCode, maximumFractionDigits)}</span>
    </>
  );

  let content;

  if (shouldShowConvertedValue) {
    let firstValue, secondValue;

    if (revert) {
      firstValue = renderMoneyElement(amount, symbol, currency);
      secondValue = renderMoneyElement(baseValue, baseCurrency.symbol, baseCurrency.code);
    } else {
      firstValue = renderMoneyElement(baseValue, baseCurrency.symbol, baseCurrency.code);
      secondValue = renderMoneyElement(amount, symbol, currency);
    }

    content = (
      <span
        id={id}
        className={cn(
          'inline-block font-numeric',
          className,
        )}
      >
        {firstValue}
        <span className="text-[95%] opacity-75 hidden md:inline ml-1">
          {' | '}
          {secondValue}
        </span>
      </span>
    );
  } else {
    content = (
      <span
        id={id}
        className={cn(
          'inline-block font-numeric',
          className,
        )}
      >
        {renderMoneyElement(amount, symbol, currency || baseCurrency.code)}
      </span>
    );
  }

  let displayedContent = badge ? (
    <Badge variant={badgeVariant} className={className}>
      {content}
    </Badge>
  ) : (
    <span className={cn(colorClass, className)}>{content}</span>
  );

  if (showValuesTooltip && values && Object.keys(values).length > 0) {
    displayedContent = (
      <ConvertedValuesTooltip convertedValues={values} originalCurrency={currency || baseCurrency.code}>
        {displayedContent}
      </ConvertedValuesTooltip>
    );
  }

  return displayedContent;
};

MoneyValue.displayName = 'MoneyValue';

export default memo(MoneyValue);
