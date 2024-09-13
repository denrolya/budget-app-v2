import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo, useCallback } from 'react';
import useSWR, { preload, SWRResponse, SWRConfiguration } from 'swr';
import { AlertCircle } from 'lucide-react';
import orderBy from 'lodash/orderBy';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { axiosFetcher } from '@/services/api';

type Account = {
  id: number;
  name: string;
  balance: number;
  currency: string;
  type: string;
  archivedAt: string | null;
};

type AccountWithConvertedValues = Account & {
  convertedValues: Record<string, number>;
};

type Debt = {
  id: number;
  name: string;
  amount: number;
};

type Category = {
  id: number;
  name: string;
};

type ExchangeRates = Record<string, number>;

interface FinanceData {
  accounts: Account[];
  debts: Debt[];
  categories: Category[];
  exchangeRates: ExchangeRates;
}

interface FinanceDataContextType {
  data: FinanceData | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  updateAccount: (updatedAccount: Account) => void;
}

const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

const ENDPOINTS = {
  accounts: '/api/v2/account',
  debts: '/api/v2/debt',
  categories: '/api/v2/category',
  exchangeRates: '/api/v2/exchange-rates',
} as const;

export const prefetchFinanceData = (): void => {
  Object.values(ENDPOINTS).forEach(endpoint => {
    preload(endpoint, axiosFetcher);
  });
};

export const generateConvertedValues = (
  rates: ExchangeRates,
  originalCurrency: string,
  value: number
): Record<string, number> => Object.fromEntries(
  Object.entries(rates).map(([currency, rate]) => [currency, convert(rates, value, originalCurrency, currency)]),
);

const convert = (
  rates: ExchangeRates,
  value: number,
  from: string,
  to: string
): number => {
  if (from === to) return value;
  const fromRate = rates[from];
  const toRate = rates[to];
  return (value / fromRate) * toRate;
};

export const FinanceDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    prefetchFinanceData();
  }, []);

  const onErrorRetry: SWRConfiguration['onErrorRetry'] = (error, key, config, revalidate, { retryCount }) => {
    if (error.response?.status === 404) return;
    if (retryCount >= MAX_RETRIES) {
      logger.error(`Max retries reached for ${key}. Stopping retries.`);
      return;
    }
    setTimeout(() => revalidate({ retryCount }), RETRY_INTERVAL);
  };

  const swrOptions: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    onErrorRetry,
  };

  const { data: accounts, error: accountsError, mutate: mutateAccounts }: SWRResponse<Account[], Error> = useSWR<Account[], Error>(ENDPOINTS.accounts, axiosFetcher, swrOptions);
  const { data: debts, error: debtsError, mutate: mutateDebts }: SWRResponse<Debt[], Error> = useSWR<Debt[], Error>(ENDPOINTS.debts, axiosFetcher, swrOptions);
  const { data: categories, error: categoriesError, mutate: mutateCategories }: SWRResponse<Category[], Error> = useSWR<Category[], Error>(ENDPOINTS.categories, axiosFetcher, swrOptions);
  const { data: exchangeRates, error: exchangeRatesError, mutate: mutateExchangeRates }: SWRResponse<ExchangeRates, Error> = useSWR<ExchangeRates, Error>(ENDPOINTS.exchangeRates, async url => {
    const response = await axiosFetcher(url);
    return response?.rates;
  }, swrOptions);

  const isLoading = !accounts || !debts || !categories || !exchangeRates;
  const error = accountsError || debtsError || categoriesError || exchangeRatesError;

  const financeData: FinanceData | null = isLoading
    ? null
    : { accounts, debts, categories, exchangeRates };

  const retry = useCallback((): void => {
    setProgress(0);
    mutateAccounts();
    mutateDebts();
    mutateCategories();
    mutateExchangeRates();
  }, [mutateAccounts, mutateDebts, mutateCategories, mutateExchangeRates]);

  const updateAccount = useCallback((updatedAccount: Account): void => {
    mutateAccounts((currentAccounts) => {
      if (!currentAccounts) return currentAccounts;
      const updatedAccounts = currentAccounts.map(account =>
        account.id === updatedAccount.id ? updatedAccount : account
      );
      return updatedAccounts;
    }, false);
  }, [mutateAccounts]);

  useEffect(() => {
    const loadedItems = [accounts, debts, categories, exchangeRates].filter(Boolean).length;
    const totalItems = Object.keys(ENDPOINTS).length;
    const newProgress = (loadedItems / totalItems) * 100;
    setProgress(newProgress);
  }, [accounts, debts, categories, exchangeRates]);

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading financial data</AlertTitle>
        <AlertDescription>
          We've encountered an issue while fetching your financial data.
          <Button onClick={retry} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Progress value={progress} className="w-full" />
        <p className="text-center mt-2">Loading financial data... {Math.round(progress)}%</p>
      </div>
    );
  }

  return (
    <FinanceDataContext.Provider value={{ data: financeData, isLoading, error, retry, updateAccount }}>
      {children}
    </FinanceDataContext.Provider>
  );
};

export const useFinanceData = (): FinanceDataContextType => {
  const context = useContext(FinanceDataContext);
  if (context === undefined) {
    throw new Error('useFinanceData must be used within a FinanceDataProvider');
  }
  return context;
};

export const useAccounts = (): { accounts: AccountWithConvertedValues[] | null; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useFinanceData();

  const accountsWithConvertedValues = useMemo(() => {
    if (!data?.accounts || !data?.exchangeRates) return null;
    return data.accounts.map(account => ({
      ...account,
      convertedValues: generateConvertedValues(data.exchangeRates, account.currency, account.balance)
    }));
  }, [data?.accounts, data?.exchangeRates]);

  return { accounts: accountsWithConvertedValues, isLoading, error };
};

export const useActiveAccounts = (): AccountWithConvertedValues[] | undefined => {
  const { accounts } = useAccounts();
  return accounts?.filter(({ archivedAt }) => !archivedAt);
};

export const useArchivedAccounts = (): AccountWithConvertedValues[] | undefined => {
  const { accounts } = useAccounts();
  return accounts?.filter(({ archivedAt }) => !!archivedAt);
};

export const useActiveAccountsWithDefaultOrder = (): AccountWithConvertedValues[] | undefined => {
  const activeAccounts = useActiveAccounts();
  return orderBy(activeAccounts, ['currency', 'type', 'name']);
};

export const useAccountsWithDefaultOrder = (): AccountWithConvertedValues[] | undefined => {
  const { accounts } = useAccounts();
  return orderBy(
    accounts,
    ['archivedAt', 'currency', 'type', 'name'],
    ['desc', 'asc', 'asc', 'asc'],
  );
};

export const useDebts = (): { debts: Debt[] | null; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useFinanceData();
  return { debts: data?.debts ?? null, isLoading, error };
};

export const useCategories = (): { categories: Category[] | null; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useFinanceData();
  return { categories: data?.categories ?? null, isLoading, error };
};

export const useExchangeRates = (): { exchangeRates: ExchangeRates | null; isLoading: boolean; error: Error | null } => {
  const { data, isLoading, error } = useFinanceData();
  return { exchangeRates: data?.exchangeRates ?? null, isLoading, error };
};
