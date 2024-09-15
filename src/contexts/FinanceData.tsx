import orderBy from 'lodash/orderBy';
import { AlertCircle } from 'lucide-react';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useSWR, { preload, SWRConfiguration, SWRResponse } from 'swr';

import { axiosFetcher } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  value: number,
): Record<string, number> => Object.fromEntries(
  Object.entries(rates).map(([currency, rate]) => [currency, convert(rates, value, originalCurrency, currency)]),
);

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

  const {
    data: accounts,
    error: accountsError,
    mutate: mutateAccounts,
  }: SWRResponse<Account[], Error> = useSWR<Account[], Error>(ENDPOINTS.accounts, axiosFetcher, swrOptions);
  const {
    data: debts,
    error: debtsError,
    mutate: mutateDebts,
  }: SWRResponse<Debt[], Error> = useSWR<Debt[], Error>(ENDPOINTS.debts, axiosFetcher, swrOptions);
  const {
    data: categories,
    error: categoriesError,
    mutate: mutateCategories,
  }: SWRResponse<Category[], Error> = useSWR<Category[], Error>(ENDPOINTS.categories, axiosFetcher, swrOptions);
  const {
    data: exchangeRates,
    error: exchangeRatesError,
    mutate: mutateExchangeRates,
  }: SWRResponse<ExchangeRates, Error> = useSWR<ExchangeRates, Error>(ENDPOINTS.exchangeRates, async url => {
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
        account.id === updatedAccount.id ? updatedAccount : account,
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
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <svg className="w-64 h-64 mx-auto" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B6B" />
                  <stop offset="100%" stopColor="#4ECDC4" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Dimmer ring in the middle of the loading circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                opacity="0.5"
              />

              {/* Main progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                className="transform -rotate-90 origin-center transition-all duration-500 ease-in-out"
                filter="url(#glow)"
              />

              {/* Orbiting circle */}
              <circle
                cx="50"
                cy="5"
                r="3"
                fill="#FF6B6B"
                className="animate-orbit"
              />

              <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-2xl font-bold fill-white animate-bounce-small"
              >
                {Math.round(progress)}%
              </text>
            </svg>
          </div>

          <div className="mt-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white animate-pulse">
              Revving Up Your Experience
            </h2>
            <p className="text-lg text-gray-300">
              Fasten your seatbelt, we're almost there!
            </p>
          </div>
        </div>
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

export const useAccounts = (): AccountWithConvertedValues[] | null => {
  const { data } = useFinanceData();

  const accountsWithConvertedValues = useMemo(() => {
    if (!data?.accounts || !data?.exchangeRates) return null;
    return data.accounts.map(account => ({
      ...account,
      convertedValues: generateConvertedValues(data.exchangeRates, account.currency, account.balance),
    }));
  }, [data?.accounts, data?.exchangeRates]);

  return accountsWithConvertedValues;
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
