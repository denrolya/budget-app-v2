import React from 'react';

import { formatTransferExchangeRate } from '@/utils/formatTransferExchangeRate';
import { CURRENCIES } from '@/constants/currency';
import Transfer from '@/models/Transfer';

interface TransferRateProps extends React.ComponentPropsWithoutRef<'span'> {
  transfer: Transfer;
  useSymbol?: boolean;
}

const TransferRateComponent: React.FC<TransferRateProps> = ({ transfer, useSymbol = false, className, ...props }) => {
  const [from, to] = formatTransferExchangeRate(
    [transfer.fromExpense.account.currency, transfer.toIncome.account.currency],
    transfer.displayRate,
  );

  const getCurrencyDisplay = (currencyCode: string) =>
    (useSymbol ? CURRENCIES[currencyCode].symbol || currencyCode : currencyCode) as string;

  const rateDisplay = `${from.amount} ${getCurrencyDisplay(from.currency)} = ${to.amount} ${getCurrencyDisplay(to.currency)}`;

  return (
    <span className={className} {...props}>
      {rateDisplay}
    </span>
  );
};

export default TransferRateComponent;
