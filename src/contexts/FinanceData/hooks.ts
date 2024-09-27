import orderBy from 'lodash/orderBy';
import { useContext } from 'react';

import Account from '@/models/Account';
import Category from '@/models/Category';
import {
  Debt,
  ExchangeRates,
  ExchangeRatesData,
  FinanceDataContext,
  FinanceDataContextType,
} from '@/contexts/FinanceData/context';

export const useFinanceData = (): FinanceDataContextType => {
  const context = useContext(FinanceDataContext);
  if (context === undefined) {
    throw new Error('useFinanceData must be used within a FinanceDataProvider');
  }
  return context;
};

export const useAccounts = (): Account[] | null => {
  const { data } = useFinanceData();

  return data?.accounts ?? null;
};

export const useActiveAccounts = (): Account[] | undefined => {
  const data = useAccounts();
  return data?.filter(({ archivedAt }) => !archivedAt);
};

export const useArchivedAccounts = (): Account[] | undefined => {
  const data = useAccounts();
  return data?.filter(({ archivedAt }) => !!archivedAt);
};

export const useActiveAccountsWithDefaultOrder = (): Account[] | undefined => {
  const activeAccounts = useActiveAccounts();
  return orderBy(activeAccounts, ['currency', 'type', 'name']);
};

export const useAccountsWithDefaultOrder = (): Account[] | undefined => {
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

export const useExchangeRates = (): ExchangeRatesData | null => {
  const { data } = useFinanceData();
  return data?.exchangeRates ?? null;
};

export const useMonobankExchangeRates = (): ExchangeRates | null => {
  const { data } = useFinanceData();
  return data?.exchangeRates?.mono ?? null;
};

export const useFixerExchangeRates = (): ExchangeRates | null => {
  const { data } = useFinanceData();
  return data?.exchangeRates?.fixer ?? null;
};
