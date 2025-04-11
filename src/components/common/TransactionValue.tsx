import React from 'react';

import ConvertedValuesTooltip from '@/components/common/ConvertedValuesTooltip';
import { Badge } from '@/components/ui/badge';
import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';
import { useBaseCurrency } from '@/contexts/auth';
import { cn } from '@/lib/utils';
import Transaction from '@/models/Transaction';
import { formatMoney as formatMoneyValue } from '@/utils/formatMoney';

interface Props extends React.ComponentPropsWithoutRef<'span'> {
  transaction: Transaction;
  maximumFractionDigits?: number;
  badge?: boolean;
  showValuesTooltip?: boolean;
}

export const TransactionValue: React.FC<Props> = ({
  transaction,
  className = '',
  maximumFractionDigits,
  badge = false,
  showValuesTooltip = true,
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
  const formatMoney = (value: number, currencyCode: CURRENCY_CODE, currencySymbol: string) => {
    const sign = (transaction.isIncome() && value >= 0) || (transaction.isExpense() && value < 0) ? '+' : '-';
    return `${sign} ${currencySymbol} ${formatMoneyValue(value, currencyCode, maximumFractionDigits)}`;
  };

  // Format the original and converted (base) values.
  const originalFormatted = formatMoney(amount, currency, symbol);
  const baseFormatted = baseValue !== undefined ? formatMoney(baseValue, baseCurrencyCode, baseCurrency.symbol) : '';

  // Determine if conversion is applicable.
  const hasConversion =
    baseValue !== undefined && currency !== baseCurrencyCode && Math.abs(amount) !== Math.abs(baseValue);

  // Elegant content: if a conversion exists, show the base conversion with the original as a subtext.
  const content = hasConversion ? (
    <>
      <span>{baseFormatted}</span>
      <span className="text-xs opacity-75 hidden md:inline ml-1">| {originalFormatted}</span>
    </>
  ) : (
    <span>{originalFormatted}</span>
  );

  // Wrap with badge if required.
  let displayedContent = badge ? (
    <Badge className="text-xs" variant={transaction.isIncome() ? 'success' : 'destructive'}>
      {content}
    </Badge>
  ) : (
    <span className={cn(transaction.isExpense() ? 'text-destructive' : 'text-success', className)}>{content}</span>
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
