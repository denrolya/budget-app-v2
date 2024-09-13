import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import useSWR, { preload } from 'swr';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { axiosFetcher } from '@/services/api';

type Account = { id: number; name: string; balance: number };
type Debt = { id: number; name: string; amount: number };
type Category = { id: number; name: string };
type ExchangeRate = { from: string; to: string; rate: number };

interface FinanceData {
  accounts: Account[];
  debts: Debt[];
  categories: Category[];
  exchangeRates: ExchangeRate[];
}

interface FinanceDataContextType {
  data: FinanceData | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds
const ENDPOINTS = {
  accounts: '/api/v2/account',
  debts: '/api/v2/debt',
  categories: '/api/v2/category',
  exchangeRates: '/api/v2/exchange-rates',
};

export const prefetchFinanceData = () => {
  Object.values(ENDPOINTS).forEach(endpoint => {
    preload(endpoint, axiosFetcher);
  });
};

export const FinanceDataProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgress] = useState(0);

  const onErrorRetry = (error, key, config, revalidate, { retryCount }) => {
    if (error.response?.status === 404) return;
    if (retryCount >= MAX_RETRIES) {
      logger.error(`Max retries reached for ${key}. Stopping retries.`, 'FinanceDataProvider');
      return;
    };
    setTimeout(() => revalidate({ retryCount }), RETRY_INTERVAL);
  };

  const swrOptions = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    onErrorRetry,
  };

  const { data: accounts, error: accountsError, mutate: mutateAccounts } = useSWR<Account[]>(ENDPOINTS.accounts, axiosFetcher, swrOptions);
  const { data: debts, error: debtsError, mutate: mutateDebts } = useSWR<Debt[]>(ENDPOINTS.debts, axiosFetcher, swrOptions);
  const { data: categories, error: categoriesError, mutate: mutateCategories } = useSWR<Category[]>(ENDPOINTS.categories, axiosFetcher, swrOptions);
  const { data: exchangeRates, error: exchangeRatesError, mutate: mutateExchangeRates } = useSWR<ExchangeRate[]>(ENDPOINTS.exchangeRates, axiosFetcher, swrOptions);

  const isLoading = !accounts || !debts || !categories || !exchangeRates;
  const error = accountsError || debtsError || categoriesError || exchangeRatesError;

  const financeData: FinanceData | null = isLoading ? null : { accounts, debts, categories, exchangeRates };

  useEffect(() => {
    prefetchFinanceData();
  }, []);

  useEffect(() => {
    const loadedItems = [accounts, debts, categories, exchangeRates].filter(Boolean).length;
    const totalItems = Object.keys(ENDPOINTS).length;
    const newProgress = (loadedItems / totalItems) * 100;
    setProgress(newProgress);
  }, [accounts, debts, categories, exchangeRates]);

  const retry = () => {
    mutateAccounts();
    mutateDebts();
    mutateCategories();
    mutateExchangeRates();
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm dark:bg-background/90">
        <div className="w-11/12 max-w-md space-y-4 rounded-lg bg-background p-6 shadow-lg dark:bg-background">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm font-medium text-foreground">
            Loading... {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <FinanceDataContext.Provider value={{ data: financeData, isLoading, error, retry }}>
      {children}
    </FinanceDataContext.Provider>
  );
};

export const useFinanceData = () => {
  const context = useContext(FinanceDataContext);
  if (context === undefined) {
    throw new Error('useFinanceData must be used within a FinanceDataProvider');
  }
  return context;
};
