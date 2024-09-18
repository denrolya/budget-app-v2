import orderBy from 'lodash/orderBy';
import { useContext, useMemo } from 'react';

import {
  Account, Category, Debt, ExchangeRates,
  FinanceDataContext,
  FinanceDataContextType,
} from '@/contexts/FinanceData/context';

type AccountWithConvertedValues = Account & {
  convertedValues: Record<string, number>;
};

const convert = (
  rates: ExchangeRates,
  value: number,
  from: string,
  to: string,
): number => {
  if (from === to) return value;
  const fromRate = rates[from];
  const toRate = rates[to];
  return (value / fromRate) * toRate;
};

const generateConvertedValues = (
  rates: ExchangeRates,
  originalCurrency: string,
  value: number,
): Record<string, number> => Object.fromEntries(
  Object.entries(rates).map(([currency]) => [currency, convert(rates, value, originalCurrency, currency)]),
);

export const useFinanceData = (): FinanceDataContextType => {
  const context = useContext(FinanceDataContext);
  if (context === undefined) {
    throw new Error('useFinanceData must be used within a FinanceDataProvider');
  }
  return context;
};

export const useAccounts = (): AccountWithConvertedValues[] | null => {
  const { data } = useFinanceData();

  return useMemo(() => {
    if (!data?.accounts || !data?.exchangeRates) return null;
    return data.accounts.map(account => ({
      ...account,
      convertedValues: generateConvertedValues(data.exchangeRates, account.currency, account.balance),
    }));
  }, [data?.accounts, data?.exchangeRates]);
};

export const useActiveAccounts = (): AccountWithConvertedValues[] | undefined => {
  const data = useAccounts();
  return data?.filter(({ archivedAt }) => !archivedAt);
};

export const useArchivedAccounts = (): AccountWithConvertedValues[] | undefined => {
  const data = useAccounts();
  return data?.filter(({ archivedAt }) => !!archivedAt);
};

export const useActiveAccountsWithDefaultOrder = (): AccountWithConvertedValues[] | undefined => {
  const activeAccounts = useActiveAccounts();
  return orderBy(activeAccounts, ['currency', 'type', 'name']);
};

export const useAccountsWithDefaultOrder = (): AccountWithConvertedValues[] | undefined => {
  const data = useAccounts();
  return orderBy(
    data,
    ['archivedAt', 'currency', 'type', 'name'],
    ['desc', 'asc', 'asc', 'asc'],
  );
};

export const useDebts = (): Debt[] | null => {
  const { data } = useFinanceData();
  return data?.debts ?? null;
};

export const useCategories = (): Category[] | null => {
  const { data } = useFinanceData();
  return data?.categories ?? null;
};

export const useExchangeRates = (): ExchangeRates | null => {
  const { data } = useFinanceData();
  return data?.exchangeRates ?? null;
};
