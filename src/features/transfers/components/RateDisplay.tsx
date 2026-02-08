import React, { useMemo } from 'react';

import { CURRENCY_CODE, CURRENCIES } from '@/constants/currency';
import { cn } from '@/lib/utils';
import Transfer from '@/features/transfers/models/Transfer';
import { formatTransferExchangeRate } from '@/lib/formatTransferExchangeRate';

type Props = Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> & {
  transfer: Transfer;
  useSymbol?: boolean;
  showWhenSameCurrency?: boolean;
};

const RateDisplay: React.FC<Props> = ({
                                        transfer,
                                        useSymbol = false,
                                        showWhenSameCurrency = false,
                                        className,
                                        ...props
                                      }) => {
  const fromCurrency = transfer.fromExpense.account.currency as CURRENCY_CODE;
  const toCurrency = transfer.toIncome.account.currency as CURRENCY_CODE;

  const sameCurrency = fromCurrency === toCurrency;

  const { equationText, ariaLabel } = useMemo(() => {
    const getCurrencyLabel = (currencyCode: CURRENCY_CODE) =>
      useSymbol ? CURRENCIES[currencyCode]?.symbol || currencyCode : currencyCode;

    const [from, to] = formatTransferExchangeRate([fromCurrency, toCurrency], transfer.displayRate);

    const fromCode = from.currency as CURRENCY_CODE;
    const toCode = to.currency as CURRENCY_CODE;

    const equation = `${from.amount} ${getCurrencyLabel(fromCode)} = ${to.amount} ${getCurrencyLabel(toCode)}`;

    return {
      equationText: equation,
      ariaLabel: `Exchange rate: ${equation}`,
    };
  }, [fromCurrency, toCurrency, transfer.displayRate, useSymbol]);

  // Hook already ran; safe to return now.
  if (sameCurrency && !showWhenSameCurrency) return null;
  if (!equationText) return null;

  return (
    <span
      aria-label={ariaLabel}
      className={cn('tabular-nums whitespace-nowrap text-xs text-muted-foreground', className)}
      {...props}
    >
      {equationText}
    </span>
  );
};

RateDisplay.displayName = 'TransferRateDisplay';

export default RateDisplay;
