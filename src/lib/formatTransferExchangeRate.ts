import { CURRENCY_CODE } from '@/constants/currency';

interface CurrencyAmount {
  currency: string;
  amount: number;
}

export const formatTransferExchangeRate = (
  currencies: [string, string],
  rate: number,
): [CurrencyAmount, CurrencyAmount] => {
  const [fromCurrency, toCurrency] = currencies;

  if (fromCurrency === CURRENCY_CODE.UAH && toCurrency === CURRENCY_CODE.HUF) {
    return [
      { currency: CURRENCY_CODE.HUF, amount: 1000 },
      { currency: CURRENCY_CODE.UAH, amount: Number(rate.toFixed(2)) },
    ];
  }

  if (
    (fromCurrency === CURRENCY_CODE.UAH || fromCurrency === CURRENCY_CODE.HUF) &&
    [CURRENCY_CODE.USD, CURRENCY_CODE.EUR, CURRENCY_CODE.BTC].includes(toCurrency as CURRENCY_CODE)
  ) {
    return [
      { currency: toCurrency, amount: 1 },
      { currency: fromCurrency, amount: Number(rate.toFixed(4)) },
    ];
  }

  return [
    { currency: fromCurrency, amount: 1 },
    { currency: toCurrency, amount: Number(rate.toFixed(4)) },
  ];
};
