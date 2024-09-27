import orderBy from 'lodash/orderBy';
import { useContext } from 'react';

import Account from '@/models/Account';
import {
  CategoriesData,
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

export const useAccounts = (): Account[] => {
  const { data } = useFinanceData();

  return data.accounts;
};

export const useActiveAccounts = (): Account[] => {
  const data = useAccounts();
  return data.filter(({ archivedAt }) => !archivedAt);
};

export const useArchivedAccounts = (): Account[] => {
  const data = useAccounts();
  return data.filter(({ archivedAt }) => !!archivedAt);
};

export const useActiveAccountsWithDefaultOrder = (): Account[] => {
  const activeAccounts = useActiveAccounts();
  return orderBy(activeAccounts, ['currency', 'type', 'name']);
};

export const useAccountsWithDefaultOrder = (): Account[] => {
  const data = useAccounts();
  return orderBy(
    data,
    ['archivedAt', 'currency', 'type', 'name'],
    ['desc', 'asc', 'asc', 'asc'],
  );
};

export const useDebts = (): Debt[] => {
  const { data } = useFinanceData();
  return data.debts;
};

export const useCategories = (): CategoriesData => {
  const { data } = useFinanceData();
  return data.categories;
};

export const useExchangeRates = (): ExchangeRatesData => {
  const { data } = useFinanceData();
  return data.exchangeRates;
};

export const useMonobankExchangeRates = (): ExchangeRates => {
  const { data } = useFinanceData();
  return data.exchangeRates.mono;
};

export const useFixerExchangeRates = (): ExchangeRates => {
  const { data } = useFinanceData();
  return data.exchangeRates.fixer;
};
