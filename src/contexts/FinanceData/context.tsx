// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import moment from 'moment';

import Transaction from '@/models/Transaction';
import { DebtDTO } from '@/types/debt';
import MainLoadingScreen from '@/components/layout/MainLoadingScreen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Account, { AccountRawData } from '@/models/Account';
import Category, { CategoryTreeBuilder } from '@/models/Category';
import { axiosFetcher } from '@/services/api';
import Debt from '@/models/Debt';
import { RawTransactionDTO, ConvertedValues } from '@/types/transaction';
import CurrencyConverter from '@/components/features/CurrencyConverter';

export type ExchangeRatesData = {
  fixer: ConvertedValues;
  mono: ConvertedValues;
  wise: ConvertedValues;
}

export type CategoriesData = {
  tree: Category[];
  list: Category[];
}

export interface FinanceData {
  accounts: Account[];
  debts: Debt[];
  categories: CategoriesData;
  exchangeRates: ExchangeRatesData;
}

export interface FinanceDataContextType {
  data: FinanceData;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  updateAccount: (updatedAccount: Account) => void;
  refetchAccounts: () => Promise<void>;
  toggleCurrencyConverter: () => void;
}

const INITIAL_STATE: FinanceData = {
  accounts: [],
  debts: [],
  categories: { tree: [], list: [] },
  exchangeRates: { fixer: {}, mono: {}, wise: {} },
};

export const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

const ENDPOINTS = {
  accounts: '/api/v2/account',
  debts: '/api/v2/debt',
  categories: '/api/v2/category',
  fixerExchangeRates: '/api/v2/exchange-rates/fixer',
  monobankExchangeRates: '/api/v2/exchange-rates/monobank',
  wiseExchangeRates: '/api/v2/exchange-rates/wise',
} as const;

export const FinanceDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<number>(0);
  const queryClient = useQueryClient();
  const [currencyConverterOpen, setCurrencyConverterOpen] = useState<boolean>(false);
  const toggleCurrencyConverter = useCallback(() => setCurrencyConverterOpen((prev) => !prev), []);

  const queryOptions = {
    retry: MAX_RETRIES,
    retryDelay: RETRY_INTERVAL,
    staleTime: Infinity,
  };

  const exchangeRatesQuery: UseQueryResult<ExchangeRatesData, Error> = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: async () => {
      const [fixer, mono, wise] = await Promise.all([
        axiosFetcher(ENDPOINTS.fixerExchangeRates),
        axiosFetcher(ENDPOINTS.monobankExchangeRates),
        axiosFetcher(ENDPOINTS.wiseExchangeRates),
      ]);

      return {
        fixer: fixer.rates,
        mono: mono.rates,
        wise: wise.rates,
      };
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
        convertedValues: convertBalance(account.balance, account.currency, exchangeRatesQuery.data.fixer!),
      }));
    },
    enabled: !!exchangeRatesQuery.data, // Fetch accounts only when exchange rates are available
    ...queryOptions,
  });

  const categoriesQuery: UseQueryResult<CategoriesData, Error> = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const rawCategories = await axiosFetcher(ENDPOINTS.categories);

      const treeBuilder = new CategoryTreeBuilder();
      const tree = treeBuilder.normalizeData(rawCategories);

      const plainList = treeBuilder.getPlainList();

      return { tree, list: plainList };
    },
    enabled: !!exchangeRatesQuery.data,
    ...queryOptions,
  });

  const debtsQuery: UseQueryResult<Debt[], Error> = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const rawDebts: DebtDTO[] = await axiosFetcher(ENDPOINTS.debts);

      if (!accountsQuery.data || !categoriesQuery.data) {
        throw new Error('Accounts and categories not available');
      }

      const accounts = accountsQuery.data;
      const categories = categoriesQuery.data.list;

      return rawDebts.map((rawDebt: DebtDTO) => {
        const transactions = rawDebt.transactions.map((rawTransaction: RawTransactionDTO) => {
          const account = accounts.find((acc: Account) => acc.id === rawTransaction.account.id);
          const category = categories.find((cat: Category) => cat.id === rawTransaction.category.id);

          if (!account) {
            throw new Error(`Account with ID ${rawTransaction.account.id} not found`);
          }

          if (!category) {
            throw new Error(`Category with ID ${rawTransaction.category.id} not found`);
          }

          return new Transaction({
            ...rawTransaction,
            account,
            category,
            executedAt: moment(rawTransaction.executedAt),
            compensations: rawTransaction.compensations?.map((comp) =>
              new Transaction({
                id: comp.id!,
                account: comp.account!,
                amount: comp.amount!,
                convertedValues: comp.convertedValues!,
                note: comp.note!,
                executedAt: moment(comp.executedAt)!,
                category: comp.category!,
                isDraft: comp.isDraft!,
                compensations: comp.compensations,
                type: comp.type!,
              })
            )
          });
        });

        return new Debt({
          ...rawDebt,
          transactions,
        });
      });
    },
    enabled: !!accountsQuery.data && !!categoriesQuery.data,
    ...queryOptions,
  });

  const isLoading = accountsQuery.isLoading || debtsQuery.isLoading || categoriesQuery.isLoading || exchangeRatesQuery.isLoading;
  const error = accountsQuery.error || debtsQuery.error || categoriesQuery.error || exchangeRatesQuery.error;

  const financeData: FinanceData = isLoading ? INITIAL_STATE : {
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

  const refetchAccounts = useCallback(async (): Promise<void> => {
    await queryClient.refetchQueries({ queryKey: ['accounts'] });
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
    return (<MainLoadingScreen progress={progress} />);
  }

  return (
    <FinanceDataContext.Provider value={{ data: financeData, isLoading, error, retry, updateAccount, refetchAccounts, toggleCurrencyConverter }}>
      {children}
      {(!isLoading && !error && financeData.exchangeRates) && (
        <CurrencyConverter open={currencyConverterOpen} onOpenChange={setCurrencyConverterOpen} />
      )}
    </FinanceDataContext.Provider>
  );
};
