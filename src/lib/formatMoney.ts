import { CURRENCIES, CURRENCY_CODE } from '@/constants/currency';

export const formatMoney = (value: number, currencyCode?: CURRENCY_CODE, decimals?: number): string => {
  const fractionDigits = getFractionDigits(currencyCode, decimals);
  return Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
};

/** Returns `"€ 1,234.56"` — symbol prepended to the formatted absolute value. */
export const formatMoneyWithSymbol = (value: number, currencyCode: CURRENCY_CODE, decimals?: number): string => {
  const symbol = CURRENCIES[currencyCode]?.symbol ?? currencyCode;
  return `${symbol} ${formatMoney(value, currencyCode, decimals)}`;
};

export const getFractionDigits = (currencyCode?: CURRENCY_CODE, decimals?: number): number => {
  if (decimals !== undefined && !isNaN(decimals)) return decimals;

  switch (currencyCode) {
    case CURRENCY_CODE.BTC:
      return 8;
    case CURRENCY_CODE.HUF:
    case CURRENCY_CODE.UAH:
    case CURRENCY_CODE.EUR:
    case CURRENCY_CODE.USD:
    default:
      return 2;
  }
};
