import { AlertCircle } from 'lucide-react';
import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import Category, { CategoryTreeBuilder } from '@/models/Category';
import Account, { AccountRawData } from '@/models/Account';
import { axiosFetcher } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type Debt = {
  id: number;
  name: string;
  amount: number;
};

export type ExchangeRates = Record<string, number>;

export interface FinanceData {
  accounts: Account[];
  debts: Debt[];
  categories: Category[];
  exchangeRates: ExchangeRates;
}

export interface FinanceDataContextType {
  data: FinanceData | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  updateAccount: (updatedAccount: Account) => void;
}

export const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

const ENDPOINTS = {
  accounts: '/api/v2/account',
  debts: '/api/v2/debt',
  categories: '/api/v2/category',
  exchangeRates: '/api/v2/exchange-rates',
} as const;

export const FinanceDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<number>(0);
  const queryClient = useQueryClient();

  const queryOptions = {
    retry: MAX_RETRIES,
    retryDelay: RETRY_INTERVAL,
    staleTime: Infinity,
  };

  const exchangeRatesQuery: UseQueryResult<ExchangeRates, Error> = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: async () => {
      const response = await axiosFetcher(ENDPOINTS.exchangeRates);
      return response.rates;
    },
    ...queryOptions,
  });

  const accountsQuery: UseQueryResult<Account[], Error> = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const rawAccounts: AccountRawData[] = await axiosFetcher(ENDPOINTS.accounts);

      if (!exchangeRatesQuery.data) throw new Error('Exchange rates not available');

      const convertBalance = (balance: number, currency: string, rates: ExchangeRates) => {
        const convertedValues: Record<string, number> = {};
        for (const [code, rate] of Object.entries(rates)) {
          if (currency !== code) {
            convertedValues[code] = balance * (rate / rates[currency]);
          } else {
            convertedValues[code] = balance;
          }
        }
        return convertedValues;
      };

      return rawAccounts.map((account: AccountRawData) => new Account({
        ...account,
        convertedValues: convertBalance(account.balance, account.currency, exchangeRatesQuery.data!)
      }));
    },
    enabled: !!exchangeRatesQuery.data, // Fetch accounts only when exchange rates are available
    ...queryOptions,
  });

  const debtsQuery: UseQueryResult<Debt[], Error> = useQuery({
    queryKey: ['debts'],
    queryFn: () => axiosFetcher(ENDPOINTS.debts),
    ...queryOptions,
  });

  const categoriesQuery: UseQueryResult<Category[], Error> = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const rawCategories = await axiosFetcher(ENDPOINTS.categories);

      const treeBuilder = new CategoryTreeBuilder();
      const tree = treeBuilder.normalizeData(rawCategories);

      const plainList = treeBuilder.getPlainList();

      return { tree, list: plainList };
    },
    ...queryOptions,
  });

  const isLoading = accountsQuery.isLoading || debtsQuery.isLoading || categoriesQuery.isLoading || exchangeRatesQuery.isLoading;
  const error = accountsQuery.error || debtsQuery.error || categoriesQuery.error || exchangeRatesQuery.error;

  const financeData: FinanceData | null = isLoading
    ? null
    : {
      accounts: accountsQuery.data!,
      debts: debtsQuery.data!,
      categories: categoriesQuery.data!,
      exchangeRates: exchangeRatesQuery.data!,
    };

  const retry = useCallback((): void => {
    setProgress(0);
    queryClient.invalidateQueries({ queryKey: ['accounts', 'debts', 'categories', 'exchangeRates'] });
  }, [queryClient]);

  const updateAccount = useCallback((updatedAccount: Account): void => {
    queryClient.setQueryData(['accounts'], (oldData: Account[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(account => account.id === updatedAccount.id ? updatedAccount : account);
    });
  }, [queryClient]);

  useEffect(() => {
    const loadedItems = [accountsQuery.data, debtsQuery.data, categoriesQuery.data, exchangeRatesQuery.data].filter(Boolean).length;
    const totalItems = Object.keys(ENDPOINTS).length;
    const newProgress = (loadedItems / totalItems) * 100;
    setProgress(newProgress);
  }, [accountsQuery.data, debtsQuery.data, categoriesQuery.data, exchangeRatesQuery.data]);

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
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <svg className="w-64 h-64 mx-auto" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="1"
                opacity="0.3"
              />

              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                className="transform -rotate-90 origin-center transition-all duration-500 ease-in-out"
                filter="url(#glow)"
              />

              <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-2xl font-bold fill-foreground animate-bounce-small"
              >
                {Math.round(progress)}%
              </text>
            </svg>
          </div>

          <div className="mt-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground animate-pulse">
              Revving Up Your Experience
            </h2>
            <p className="text-lg text-muted-foreground">
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
