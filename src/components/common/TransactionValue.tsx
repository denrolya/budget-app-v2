import React from 'react';

import ConvertedValuesTooltip from '@/components/common/ConvertedValuesTooltip';
import { Badge } from '@/components/ui/badge';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { cn } from '@/lib/utils';
import Transaction from '@/features/transactions/models/Transaction';
import { formatMoney as formatMoneyValue } from '@/lib/formatMoney';

interface Props extends React.ComponentPropsWithoutRef<'span'> {
  transaction: Transaction;
  maximumFractionDigits?: number;
  badge?: boolean;
  showValuesTooltip?: boolean;
  revert?: boolean;
  showSign?: boolean;
}

export const TransactionValue: React.FC<Props> = ({
  transaction,
  className = '',
  maximumFractionDigits,
  badge = false,
  showValuesTooltip = true,
  revert = false,
  showSign = false,
}) => {
  const baseCurrencyCode = useBaseCurrency();
  const baseCurrency = CURRENCIES[baseCurrencyCode];
  const {
    amount,
    account: { currency },
    convertedValues,
  } = transaction;
  const symbol = currency ? CURRENCIES[currency]?.symbol : baseCurrency.symbol;
  const baseValue = convertedValues?.[baseCurrency.code];

  // Helper to format money values using the transaction's sign logic.
  const formatMoney = (
    value: number,
    currencyCode: CURRENCY_CODE,
    currencySymbol: string,
  ) => {
    const shouldShowPlus = transaction.isIncome() && value >= 0;
    const shouldShowMinus = transaction.isExpense() && value < 0;
    const sign = showSign ? (shouldShowPlus ? '+' : shouldShowMinus ? '-' : '') : '';
    return `${sign ? sign + ' ' : ''}${currencySymbol} ${formatMoneyValue(
      value,
      currencyCode,
      maximumFractionDigits,
    )}`;
  };

  // Format the original and converted (base) values.
  const originalFormatted = formatMoney(amount, currency, symbol);
  const baseFormatted = baseValue !== undefined ? formatMoney(baseValue, baseCurrencyCode, baseCurrency.symbol) : '';

  // Determine if conversion is applicable.
  const hasConversion =
    baseValue !== undefined && currency !== baseCurrencyCode && Math.abs(amount) !== Math.abs(baseValue);

  let content;

  if (hasConversion) {
    if (revert) {
      content = (
        <>
          <span>{originalFormatted}</span>
          <span className="text-[95%] opacity-75 hidden md:inline ml-0.5">| {baseFormatted}</span>
        </>
      );
    } else {
      content = (
        <>
          <span>{baseFormatted}</span>
          <span className="text-[95%] opacity-75 hidden md:inline ml-0.5">| {originalFormatted}</span>
        </>
      );
    }
  } else {
    content = <span>{originalFormatted}</span>;
  }

  // Wrap with badge if required.
  let displayedContent = badge ? (
    <Badge className="text-xs tracking-tight" variant={transaction.isIncome() ? 'success' : 'destructive'}>
      {content}
    </Badge>
  ) : (
    <span
      className={cn(
        'inline-block font-numeric',
        {
          'text-destructive': transaction.isExpense(),
          'text-success': transaction.isIncome(),
        },
        className,
      )}
    >
      {content}
    </span>
  );

  if (showValuesTooltip && convertedValues && Object.keys(convertedValues).length > 0) {
    displayedContent = (
      <ConvertedValuesTooltip convertedValues={convertedValues} originalCurrency={currency}>
        {displayedContent}
      </ConvertedValuesTooltip>
    );
  }

  return displayedContent;
};

export default TransactionValue;
