import { ExchangeRates } from '@/contexts/FinanceData';

export const getExchangeRate = (from: string, to: string, rates: ExchangeRates | null): number | null => {
  if (!rates) return null;
  if (from === to) return 1;

  if (from === 'EUR') {
    return rates[to] ?? null;
  }

  if (to === 'EUR') {
    return rates[from] ? 1 / rates[from] : null;
  }

  if (rates[from] && rates[to]) {
    return rates[to] / rates[from];
  }

  return null;
};
