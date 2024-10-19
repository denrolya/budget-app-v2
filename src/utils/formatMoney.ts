import { CURRENCY_CODE } from '@/constants/currency';

export const formatMoney = (value: number, currencyCode?: CURRENCY_CODE, decimals?: number): string => {
  const fractionDigits = getFractionDigits(currencyCode, decimals);
  return Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
};

export const getFractionDigits = (currencyCode?: CURRENCY_CODE, decimals?: number): number => {
  if (decimals !== undefined && !isNaN(decimals)) return decimals;

  switch (currencyCode) {
    case CURRENCY_CODE.HUF:
      return 0;
    case CURRENCY_CODE.BTC:
      return 8;
    case CURRENCY_CODE.UAH:
    case CURRENCY_CODE.EUR:
    case CURRENCY_CODE.USD:
    default:
      return 2;
  }
};
