import React from 'react';

import { CURRENCY_CODE } from '@/constants/currency';
import Transfer from '@/models/Transfer';

interface TransferRateProps extends React.ComponentPropsWithoutRef<'span'> {
  transfer: Transfer;
}

const TransferRateComponent: React.FC<TransferRateProps> = ({ transfer, ...props }) => {
  const fromCurrency = transfer.fromExpense.account.currency;
  const toCurrency = transfer.toIncome.account.currency;
  const displayRate = transfer.displayRate;

  let rateDisplay = `1 ${fromCurrency} = ${Number(displayRate.toFixed(4))} ${toCurrency}`;

  if (
    fromCurrency === CURRENCY_CODE.UAH &&
    [CURRENCY_CODE.USD, CURRENCY_CODE.EUR, CURRENCY_CODE.BTC].includes(toCurrency)
  ) {
    rateDisplay = `1 ${toCurrency} = ${Number(displayRate.toFixed(4))} UAH`;
  } else if (fromCurrency === CURRENCY_CODE.UAH && toCurrency === CURRENCY_CODE.HUF) {
    rateDisplay = `1000 HUF = ${Number(displayRate.toFixed(2))} UAH`;
  } else if (
    fromCurrency === CURRENCY_CODE.HUF &&
    [CURRENCY_CODE.EUR, CURRENCY_CODE.USD, CURRENCY_CODE.BTC].includes(toCurrency)
  ) {
    rateDisplay = `1 ${toCurrency} = ${Number(displayRate.toFixed(4))} HUF`;
  }

  return <span {...props}>{rateDisplay}</span>;
};

export default TransferRateComponent;
