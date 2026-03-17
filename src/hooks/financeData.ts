import orderBy from 'lodash/orderBy';
import sumBy from 'lodash/sumBy';
import { useMemo } from 'react';

import { useBaseCurrency } from '@/features/auth';
import { type Account, useList as useAccountsQuery } from '@/features/accounts';
import { type Category, useList as useCategoriesQuery } from '@/features/categories';
import { type Debt, useList as useDebtsQuery } from '@/features/debts';
import { type ConvertedValues, Type as TransactionType } from '@/features/transactions';
import { useExchangeRatesQuery } from '@/services/api/exchangeRates.queries';

export type ExchangeRatesData = {
  fixer: ConvertedValues;
  mono: ConvertedValues;
  wise: ConvertedValues;
};

export type CategoriesData = {
  tree: Category[];
  list: Category[];
};

export const useFinanceData = () => {
  const exchangeRates = useExchangeRatesQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const debts = useDebtsQuery();

  const isLoading = exchangeRates.isLoading || accounts.isLoading || categories.isLoading || debts.isLoading;

  const error = exchangeRates.error ?? accounts.error ?? categories.error ?? debts.error ?? null;

  const refetchAll = async () => {
    await Promise.all([exchangeRates.refetch(), accounts.refetch(), categories.refetch(), debts.refetch()]);
  };

  return {
    isLoading,
    error,
    refetchAll,
    exchangeRates,
    accounts,
    categories,
    debts,
  };
};

/** -------- Selectors (read-only hooks) -------- */

export const useExchangeRates = (): ExchangeRatesData => {
  const q = useExchangeRatesQuery();
  if (!q.data) return { fixer: {}, mono: {}, wise: {} };
  return q.data;
};

export const useMonobankExchangeRates = (): ConvertedValues => useExchangeRates().mono;
export const useWiseExchangeRates = (): ConvertedValues => useExchangeRates().wise;

export const useAccounts = (): Account[] => {
  const q = useAccountsQuery();
  return q.data ?? [];
};

export const useActiveAccounts = (): Account[] => {
  const accounts = useAccounts();
  return useMemo(() => accounts.filter(({ archivedAt }) => !archivedAt), [accounts]);
};

export const useArchivedAccounts = (): Account[] => {
  const accounts = useAccounts();
  return useMemo(() => accounts.filter(({ archivedAt }) => !!archivedAt), [accounts]);
};

export const useActiveAccountsWithDefaultOrder = (): Account[] => {
  const active = useActiveAccounts();
  return useMemo(() => orderBy(active, ['currency', 'type', 'name']), [active]);
};

export const useAccountsWithDefaultOrder = (): Account[] => {
  const accounts = useAccounts();
  return useMemo(
    () => orderBy(accounts, ['archivedAt', 'currency', 'type', 'name'], ['desc', 'asc', 'asc', 'asc']),
    [accounts],
  );
};

export const useTotalBalance = (): number => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();

  return useMemo(
    () => sumBy(accounts, ({ convertedValues }) => convertedValues?.[baseCurrency] || 0),
    [accounts, baseCurrency],
  );
};

export const useCategories = (): CategoriesData => {
  const q = useCategoriesQuery();
  return q.data ?? { tree: [], list: [] };
};

export const useIncomeCategories = (): Category[] => {
  const { list } = useCategories();
  return useMemo(() => list.filter(({ type }) => (type as string) === (TransactionType.Income as string)), [list]);
};

export const useIncomeCategoriesTree = (): Category[] => {
  const { tree } = useCategories();
  return useMemo(() => tree.filter(({ type }) => (type as string) === (TransactionType.Income as string)), [tree]);
};

export const useExpenseCategories = (): Category[] => {
  const { list } = useCategories();
  return useMemo(() => list.filter(({ type }) => (type as string) === (TransactionType.Expense as string)), [list]);
};

export const useExpenseCategoriesTree = (): Category[] => {
  const { tree } = useCategories();
  return useMemo(() => tree.filter(({ type }) => (type as string) === (TransactionType.Expense as string)), [tree]);
};

/** Sort categories: folders (with children) first, then alphabetically. Recurses into children. */
export const sortCategoryTree = (cats: Category[]): Category[] =>
  [...cats]
    .sort((a, b) => {
      const aFolder = a.children.length > 0;
      const bFolder = b.children.length > 0;
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((cat) =>
      cat.children.length > 0 ? ({ ...cat, children: sortCategoryTree(cat.children) } as Category) : cat,
    );

export const useSortedExpenseCategoriesTree = (): Category[] => {
  const tree = useExpenseCategoriesTree();
  return useMemo(() => sortCategoryTree(tree), [tree]);
};

export const useSortedIncomeCategoriesTree = (): Category[] => {
  const tree = useIncomeCategoriesTree();
  return useMemo(() => sortCategoryTree(tree), [tree]);
};

export const useDebts = (): Debt[] => {
  const q = useDebtsQuery();
  return q.data ?? [];
};

export const useTotalDebt = (): number => {
  const debts = useDebts();
  const baseCurrency = useBaseCurrency();

  return useMemo(
    () => sumBy(debts, ({ convertedValues }) => convertedValues?.[baseCurrency] || 0),
    [debts, baseCurrency],
  );
};
