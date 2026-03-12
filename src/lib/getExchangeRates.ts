import { CURRENCY_CODE } from '@/constants/currency';
import { type ConvertedValues } from '@/features/transactions';

export const getExchangeRate = (from: string, to: string, rates: ConvertedValues | null): number | null => {
  if (!rates) return null;
  if (from === to) return 1;

  if (from === CURRENCY_CODE.EUR) {
    return rates[to] ?? null;
  }

  if (to === CURRENCY_CODE.EUR) {
    return rates[from] ? 1 / rates[from] : null;
  }

  if (rates[from] && rates[to]) {
    return rates[to] / rates[from];
  }

  return null;
};
